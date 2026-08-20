import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import WeekPicker from './WeekPicker';
import DurationTimeFields from './DurationTimeFields';
import { weeksForBlock } from '../api/academicCalendar';
import {
  DAYS, LEARNING_ACTIVITIES, ACADEMIC_PERIODS, ROOM_TYPES, CHANGE_CATEGORIES, hoursBetween,
} from '../api/constraintOptions';

// Category -> field-shape grouping. Categories with the same genuine underlying shape share one
// form rather than 11 near-identical bespoke ones - see ChangeRequestCreateDto (backend) for the
// full reasoning behind each grouping.
const SHAPE_MODIFY_SESSION = ['SESSION_TIME', 'ROOM_TYPE', 'ROOM_BOOKING', 'SESSION_DATE'];
const SHAPE_CLASHES = ['CLASHES'];
const SHAPE_ADDITIONAL_SESSION = ['ADDITIONAL_SESSION'];
const SHAPE_STAFF_CHANGE = ['STAFF_CHANGE'];
const SHAPE_SESSION_REMOVAL = ['SESSION_REMOVAL'];
const SHAPE_MERGE = ['MERGE_SESSIONS_GROUPS'];
// everything else (STUDENT_ALLOCATION, OTHER) -> "explain only" shape: just an optional session
// reference, since rationale (always shown) carries the actual explanation

const initialState = {
  departmentId: '',
  primaryModuleId: '',
  academicPeriod: '',
  changeCategory: '',
  weekMode: 'SINGLE',
  weeks: [],
  sessionId: '',
  clashingSessionId: '',
  preferredNewLecturerId: '',
  mergeSessionIds: [],
  dayOfWeek: '',
  startTime: '',
  endTime: '',
  durationHours: 2,
  deliveryType: '',
  roomType: '',
  allowedRoomIds: [],
  rationale: '',
  benefitToStudents: '',
};

export default function ChangeRequestForm({ onSubmitted }) {
  const [departments, setDepartments] = useState([]);
  const [myModules, setMyModules] = useState([]);
  const [mySessions, setMySessions] = useState([]);
  const [blockSessions, setBlockSessions] = useState([]); // every session in the module's block - for Clashes/Merge pickers, which can reference someone else's session
  const [rooms, setRooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [yearLabel, setYearLabel] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingBlockSessions, setLoadingBlockSessions] = useState(false);

  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/courses'),
      api.get('/lecturer/my-modules'),
      api.get('/lecturer/my-sessions'),
      api.get('/rooms'),
      api.get('/teachers'),
      api.get('/academic-year'),
    ])
      .then(([deps, mods, sess, r, t, year]) => {
        setDepartments(deps);
        setMyModules(mods);
        setMySessions(sess);
        setRooms(r);
        setTeachers(t);
        setYearLabel(year.currentYearLabel);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingOptions(false));
  }, []);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const selectedModule = useMemo(
    () => myModules.find((m) => String(m.id) === String(form.primaryModuleId)),
    [myModules, form.primaryModuleId]
  );
  const block = selectedModule?.block ?? null;

  const sessionsForModule = useMemo(() => {
    if (!selectedModule) return [];
    return mySessions.filter((s) => s.moduleCode === selectedModule.code);
  }, [mySessions, selectedModule]);

  // loading every session in the block (not just the lecturer's own) whenever it's needed -
  // Clashes and Merge both potentially reference someone else's session
  useEffect(() => {
    const needsBlockSessions = SHAPE_CLASHES.includes(form.changeCategory) || SHAPE_MERGE.includes(form.changeCategory);
    if (!needsBlockSessions || !block) {
      setBlockSessions([]);
      return;
    }
    setLoadingBlockSessions(true);
    api.get(`/timetable?block=${block}`)
      .then(setBlockSessions)
      .catch((err) => setError(err.message))
      .finally(() => setLoadingBlockSessions(false));
  }, [form.changeCategory, block]);

  const handleModuleChange = (e) => {
    setForm((f) => ({
      ...f, primaryModuleId: e.target.value, sessionId: '', clashingSessionId: '',
      mergeSessionIds: [], weeks: [],
    }));
  };

  const handleCategoryChange = (e) => {
    // switching category clears fields that only apply to the previous shape, so stale data
    // from an abandoned shape never gets silently submitted
    setForm((f) => ({
      ...initialState,
      departmentId: f.departmentId, primaryModuleId: f.primaryModuleId,
      academicPeriod: f.academicPeriod, changeCategory: e.target.value,
      rationale: f.rationale, benefitToStudents: f.benefitToStudents,
    }));
  };

  const toggleRoom = (roomId) => {
    setForm((f) => ({
      ...f,
      allowedRoomIds: f.allowedRoomIds.includes(roomId)
        ? f.allowedRoomIds.filter((id) => id !== roomId)
        : [...f.allowedRoomIds, roomId],
    }));
  };

  const toggleMergeSession = (sessionId) => {
    setForm((f) => ({
      ...f,
      mergeSessionIds: f.mergeSessionIds.includes(sessionId)
        ? f.mergeSessionIds.filter((id) => id !== sessionId)
        : [...f.mergeSessionIds, sessionId],
    }));
  };

  const isModify = SHAPE_MODIFY_SESSION.includes(form.changeCategory);
  const isClashes = SHAPE_CLASHES.includes(form.changeCategory);
  const isAdditional = SHAPE_ADDITIONAL_SESSION.includes(form.changeCategory);
  const isStaffChange = SHAPE_STAFF_CHANGE.includes(form.changeCategory);
  const isRemoval = SHAPE_SESSION_REMOVAL.includes(form.changeCategory);
  const isMerge = SHAPE_MERGE.includes(form.changeCategory);
  const needsOwnSession = isModify || isClashes || isStaffChange || isRemoval; // "explain only" shape leaves it optional
  const needsWeekScope = isModify || isRemoval || isAdditional;
  const needsSingleWeek = isMerge; // a merge is inherently a one-off event for one specific week
  const showsTimeFields = isModify || isAdditional || isMerge;
  const showsRoomFields = isModify || isAdditional || isMerge;

  const validate = () => {
    if (!form.departmentId) return 'Select a department';
    if (!form.primaryModuleId) return 'Select a module';
    if (!form.academicPeriod) return 'Select a year group';
    if (!form.changeCategory) return 'Select what needs changing';
    if (needsOwnSession && !form.sessionId) return 'Select the current session this request is about';
    if (isClashes && !form.clashingSessionId) return 'Select the session it clashes with';
    if (isStaffChange && !form.preferredNewLecturerId) return 'Select who you would like teaching it instead';
    if (isMerge && form.mergeSessionIds.length < 2) return 'Select at least 2 sessions to merge';
    if (needsSingleWeek && form.weeks.length !== 1) return 'Select the single week this merge applies to';
    if (isAdditional && !form.deliveryType) return 'Select a delivery type';
    if (needsWeekScope && form.weekMode !== 'ALL_REMAINING' && form.weeks.length === 0) return 'Select at least one week';
    if (form.startTime && form.endTime && hoursBetween(form.startTime, form.endTime) === null) {
      return 'End time must be after start time';
    }
    if (!form.rationale.trim()) return 'Describe what needs to happen';
    if (!form.benefitToStudents.trim()) return 'Describe the benefit to students';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await api.post('/lecturer/requests/changes', {
        departmentId: Number(form.departmentId),
        primaryModuleId: Number(form.primaryModuleId),
        academicPeriod: form.academicPeriod,
        changeCategory: form.changeCategory,
        weekMode: needsSingleWeek ? 'SINGLE' : (needsWeekScope ? form.weekMode : 'ALL_REMAINING'),
        weeks: needsSingleWeek ? form.weeks : (needsWeekScope && form.weekMode !== 'ALL_REMAINING' ? form.weeks : []),
        block,
        sessionId: form.sessionId ? Number(form.sessionId) : null,
        clashingSessionId: isClashes ? Number(form.clashingSessionId) : null,
        preferredNewLecturerId: isStaffChange ? Number(form.preferredNewLecturerId) : null,
        mergeSessionIds: isMerge ? form.mergeSessionIds.map(Number) : null,
        dayOfWeek: showsTimeFields && form.dayOfWeek ? form.dayOfWeek : null,
        startTime: showsTimeFields && form.startTime ? form.startTime : null,
        endTime: showsTimeFields && form.endTime ? form.endTime : null,
        deliveryType: isAdditional ? form.deliveryType : null,
        roomType: showsRoomFields && form.roomType ? form.roomType : null,
        allowedRoomIds: showsRoomFields ? form.allowedRoomIds.map(Number) : [],
        rationale: form.rationale,
        benefitToStudents: form.benefitToStudents,
      });
      setForm(initialState);
      onSubmitted();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingOptions) return <p className="status">Loading form…</p>;

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-grid">
        <label className="field">
          <span className="field__label">Department</span>
          <select className="field__input" value={form.departmentId} onChange={set('departmentId')} required>
            <option value="">Select…</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}
          </select>
        </label>

        <label className="field">
          <span className="field__label">Module code</span>
          <select className="field__input" value={form.primaryModuleId} onChange={handleModuleChange} required>
            <option value="">Select…</option>
            {myModules.map((m) => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
          </select>
        </label>

        <label className="field">
          <span className="field__label">Year group</span>
          <select className="field__input" value={form.academicPeriod} onChange={set('academicPeriod')} required>
            <option value="">Select…</option>
            {ACADEMIC_PERIODS.map((p) => (
              <option key={p.value} value={p.value}>{yearLabel} {p.label}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="field">
        <span className="field__label">What needs changing?</span>
        <select className="field__input" value={form.changeCategory} onChange={handleCategoryChange} required disabled={!form.primaryModuleId}>
          <option value="">{form.primaryModuleId ? 'Select…' : 'Select a module first'}</option>
          {CHANGE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}{c.requiresApproval ? ' (must be approved)' : ''}</option>
          ))}
        </select>
      </label>

      {needsOwnSession && (
        <label className="field">
          <span className="field__label">{isClashes ? 'Your session' : 'Current session'}</span>
          <select className="field__input" value={form.sessionId} onChange={set('sessionId')} required>
            <option value="">Select…</option>
            {sessionsForModule.map((s) => (
              <option key={s.id} value={s.id}>
                {s.sessionType} · {s.dayOfWeek} {s.startTime?.slice(0, 5)}-{s.endTime?.slice(0, 5)} · {s.roomName} (Block {s.block})
              </option>
            ))}
          </select>
        </label>
      )}

      {!needsOwnSession && !isAdditional && !isMerge && (
        <label className="field">
          <span className="field__label">Related session (optional)</span>
          <select className="field__input" value={form.sessionId} onChange={set('sessionId')}>
            <option value="">Not specific to one session</option>
            {sessionsForModule.map((s) => (
              <option key={s.id} value={s.id}>
                {s.sessionType} · {s.dayOfWeek} {s.startTime?.slice(0, 5)}-{s.endTime?.slice(0, 5)} · {s.roomName} (Block {s.block})
              </option>
            ))}
          </select>
        </label>
      )}

      {isClashes && (
        <label className="field">
          <span className="field__label">Clashing session</span>
          {loadingBlockSessions ? <p className="status">Loading sessions…</p> : (
            <select className="field__input" value={form.clashingSessionId} onChange={set('clashingSessionId')} required>
              <option value="">Select…</option>
              {blockSessions.filter((s) => String(s.id) !== String(form.sessionId)).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.moduleCode} · {s.sessionType} · {s.dayOfWeek} {s.startTime?.slice(0, 5)}-{s.endTime?.slice(0, 5)} · {s.roomName}
                </option>
              ))}
            </select>
          )}
        </label>
      )}

      {isStaffChange && (
        <label className="field">
          <span className="field__label">Preferred new teacher</span>
          <select className="field__input" value={form.preferredNewLecturerId} onChange={set('preferredNewLecturerId')} required>
            <option value="">Select…</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
          </select>
        </label>
      )}

      {isMerge && (
        <fieldset className="field">
          <legend className="field__label">Sessions to merge (select at least 2)</legend>
          {loadingBlockSessions ? <p className="status">Loading sessions…</p> : (
            <div className="week-picker__grid">
              {blockSessions.map((s) => (
                <label key={s.id} className="checkbox">
                  <input
                    type="checkbox"
                    checked={form.mergeSessionIds.includes(String(s.id))}
                    onChange={() => toggleMergeSession(String(s.id))}
                  />
                  {s.moduleCode} · {s.sessionType} · {s.dayOfWeek} {s.startTime?.slice(0, 5)}-{s.endTime?.slice(0, 5)} · {s.roomName}
                </label>
              ))}
            </div>
          )}
        </fieldset>
      )}

      {needsSingleWeek && block && (
        <label className="field">
          <span className="field__label">Which week is this merge for?</span>
          <select
            className="field__input"
            value={form.weeks[0] ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, weeks: e.target.value ? [Number(e.target.value)] : [] }))}
            required
          >
            <option value="">Select…</option>
            {weeksForBlock(block).map((w) => (
              <option key={w.weekInBlock} value={w.weekInBlock}>{w.label} ({w.dateRange})</option>
            ))}
          </select>
          <span className="field__hint">A merge applies to a single week only - not a permanent change to the module.</span>
        </label>
      )}

      {needsWeekScope && block && (
        <>
          <label className="field">
            <span className="field__label">
              {isRemoval ? 'Which sessions should be removed?'
                : isAdditional ? 'Should the new session run every week, or just specific week(s)?'
                : 'Is this for one session or all upcoming sessions?'}
            </span>
            <select
              className="field__input"
              value={form.weekMode}
              onChange={(e) => setForm((f) => ({ ...f, weekMode: e.target.value, weeks: [] }))}
            >
              <option value="SINGLE">{isAdditional ? 'Just one week' : 'One session'}</option>
              <option value="MULTIPLE">{isAdditional ? 'Specific weeks' : 'Multiple sessions'}</option>
              <option value="ALL_REMAINING">{isAdditional ? 'Every week' : 'All upcoming sessions'}</option>
            </select>
          </label>

          {form.weekMode !== 'ALL_REMAINING' && (
            <WeekPicker
              block={block}
              weekMode={form.weekMode}
              weeks={form.weeks}
              onWeekModeChange={(v) => setForm((f) => ({ ...f, weekMode: v }))}
              onWeeksChange={(v) => setForm((f) => ({ ...f, weeks: v }))}
            />
          )}
        </>
      )}

      {showsTimeFields && (
        <>
          <p className="field__hint">{isAdditional ? 'When should the new session take place?' : 'Preferred date and time (optional):'}</p>
          <div className="form-grid">
            <label className="field">
              <span className="field__label">{isAdditional ? 'Day' : 'Preferred day'}</span>
              <select className="field__input" value={form.dayOfWeek} onChange={set('dayOfWeek')} required={isAdditional}>
                <option value="">{isAdditional ? 'Select…' : 'No preference'}</option>
                {DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </label>

            <DurationTimeFields
              durationHours={form.durationHours}
              startTime={form.startTime}
              endTime={form.endTime}
              onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
              durationRequired={isAdditional}
              startTimeRequired={isAdditional}
            />
          </div>
        </>
      )}

      {isAdditional && (
        <label className="field">
          <span className="field__label">Delivery type</span>
          <select className="field__input" value={form.deliveryType} onChange={set('deliveryType')} required>
            <option value="">Select…</option>
            {LEARNING_ACTIVITIES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
      )}

      {showsRoomFields && (
        <div className="form-grid">
          <label className="field">
            <span className="field__label">Room type (optional)</span>
            <select className="field__input" value={form.roomType} onChange={set('roomType')}>
              <option value="">No preference</option>
              {ROOM_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </label>
        </div>
      )}

      {showsRoomFields && (
        <fieldset className="field">
          <legend className="field__label">Acceptable rooms (optional - select any that would work)</legend>
          <div className="week-picker__grid">
            {rooms.map((r) => (
              <label key={r.id} className="checkbox">
                <input
                  type="checkbox"
                  checked={form.allowedRoomIds.includes(String(r.id))}
                  onChange={() => toggleRoom(String(r.id))}
                />
                {r.name} — {r.building}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <label className="field">
        <span className="field__label">Please describe what needs to happen</span>
        <textarea className="field__input field__input--textarea" value={form.rationale} onChange={set('rationale')} required />
      </label>

      <label className="field">
        <span className="field__label">Please describe the benefit of this timetable change request for students</span>
        <textarea className="field__input field__input--textarea" value={form.benefitToStudents} onChange={set('benefitToStudents')} required />
      </label>

      {error && <p className="field__error">{error}</p>}

      <button className="btn btn--primary" type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit change request'}
      </button>
    </form>
  );
}
