import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import WeekPicker from './WeekPicker';
import DurationTimeFields from './DurationTimeFields';
import {
  DAYS, LEARNING_ACTIVITIES, ACADEMIC_PERIODS, PREFERRED_ROOM_ANSWERS, CHANGE_CATEGORIES, hoursBetween,
} from '../api/constraintOptions';

const initialState = {
  departmentId: '',
  primaryModuleId: '',
  academicPeriod: '',
  roomBookingNeeded: '',
  weekMode: 'SINGLE',
  weeks: [],
  sessionId: '',
  dayOfWeek: '',
  startTime: '',
  endTime: '',
  durationHours: 2,
  deliveryType: '',
  preferredRoomAnswer: '',
  specificRoomId: '',
  changeCategory: '',
  rationale: '',
  benefitToStudents: '',
};

export default function ChangeRequestForm({ onSubmitted }) {
  const [departments, setDepartments] = useState([]);
  const [myModules, setMyModules] = useState([]);
  const [mySessions, setMySessions] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [yearLabel, setYearLabel] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/courses'),
      api.get('/lecturer/my-modules'),
      api.get('/lecturer/my-sessions'),
      api.get('/rooms'),
      api.get('/academic-year'),
    ])
      .then(([deps, mods, sess, r, year]) => {
        setDepartments(deps);
        setMyModules(mods);
        setMySessions(sess);
        setRooms(r);
        setYearLabel(year.currentYearLabel);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingOptions(false));
  }, []);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  // scoping the session picker to the module that is selected
  const sessionsForModule = useMemo(() => {
    const selectedModule = myModules.find((m) => String(m.id) === String(form.primaryModuleId));
    if (!selectedModule) return [];
    return mySessions.filter((s) => s.moduleCode === selectedModule.code);
  }, [mySessions, myModules, form.primaryModuleId]);

  const selectedSession = mySessions.find((s) => String(s.id) === String(form.sessionId));
  const block = selectedSession?.block ?? null;

  const handleModuleChange = (e) => {
    setForm((f) => ({ ...f, primaryModuleId: e.target.value, sessionId: '', weeks: [] }));
  };

  const handleSessionChange = (e) => {
    setForm((f) => ({ ...f, sessionId: e.target.value, weeks: [] }));
  };

  const validate = () => {
    if (!form.departmentId) return 'Select a department';
    if (!form.primaryModuleId) return 'Select a module';
    if (!form.academicPeriod) return 'Select a year group';
    if (form.roomBookingNeeded === '') return 'Select whether you want a room booked';
    if (!form.sessionId) return 'Select the current session this request is about';
    if (form.weekMode !== 'ALL_REMAINING' && form.weeks.length === 0) return 'Select at least one week';
    if (!form.deliveryType) return 'Select a delivery type';
    if (!form.preferredRoomAnswer) return 'Answer whether there is a preferred room';
    if (!form.changeCategory) return 'Select what needs changing';
    if (form.startTime && form.endTime && hoursBetween(form.startTime, form.endTime) === null) {
      return 'End time must be after start time';
    }
    if (!form.rationale.trim()) return 'Describe the rationale for this request';
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
        roomBookingNeeded: form.roomBookingNeeded === 'true',
        weekMode: form.weekMode,
        weeks: form.weekMode === 'ALL_REMAINING' ? [] : form.weeks,
        block,
        sessionId: Number(form.sessionId),
        dayOfWeek: form.dayOfWeek || null,
        startTime: form.startTime || null,
        endTime: form.endTime || null,
        deliveryType: form.deliveryType,
        preferredRoomAnswer: form.preferredRoomAnswer,
        specificRoomId: form.specificRoomId ? Number(form.specificRoomId) : null,
        changeCategory: form.changeCategory,
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

        <fieldset className="field">
          <legend className="field__label">Do you want a room booked for you?</legend>
          <label className="radio">
            <input type="radio" name="roomBookingNeeded" value="true" checked={form.roomBookingNeeded === 'true'} onChange={set('roomBookingNeeded')} />
            Yes
          </label>
          <label className="radio">
            <input type="radio" name="roomBookingNeeded" value="false" checked={form.roomBookingNeeded === 'false'} onChange={set('roomBookingNeeded')} />
            No
          </label>
        </fieldset>
      </div>

      <label className="field">
        <span className="field__label">Current session (which scheduled session is this about?)</span>
        <select className="field__input" value={form.sessionId} onChange={handleSessionChange} required disabled={!form.primaryModuleId}>
          <option value="">{form.primaryModuleId ? 'Select…' : 'Select a module first'}</option>
          {sessionsForModule.map((s) => (
            <option key={s.id} value={s.id}>
              {s.sessionType} · {s.dayOfWeek} {s.startTime?.slice(0, 5)}-{s.endTime?.slice(0, 5)} · {s.roomName} (Block {s.block})
            </option>
          ))}
        </select>
      </label>

      {block && (
        <>
          <label className="field">
            <span className="field__label">Are you requesting a change for one session or all upcoming sessions?</span>
            <select
              className="field__input"
              value={form.weekMode}
              onChange={(e) => setForm((f) => ({ ...f, weekMode: e.target.value, weeks: [] }))}
            >
              <option value="SINGLE">One session</option>
              <option value="MULTIPLE">Multiple sessions</option>
              <option value="ALL_REMAINING">All upcoming sessions</option>
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

      <p className="field__hint">Preferred date and time (optional):</p>
      <div className="form-grid">
        <label className="field">
          <span className="field__label">Preferred day</span>
          <select className="field__input" value={form.dayOfWeek} onChange={set('dayOfWeek')}>
            <option value="">No preference</option>
            {DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </label>

        <DurationTimeFields
          durationHours={form.durationHours}
          startTime={form.startTime}
          endTime={form.endTime}
          onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
          durationRequired={false}
          startTimeRequired={false}
        />
      </div>

      <div className="form-grid">
        <label className="field">
          <span className="field__label">Delivery type</span>
          <select className="field__input" value={form.deliveryType} onChange={set('deliveryType')} required>
            <option value="">Select…</option>
            {LEARNING_ACTIVITIES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>

        <fieldset className="field">
          <legend className="field__label">Is there a preferred room?</legend>
          {PREFERRED_ROOM_ANSWERS.map((a) => (
            <label key={a.value} className="radio">
              <input type="radio" name="preferredRoomAnswer" value={a.value} checked={form.preferredRoomAnswer === a.value} onChange={set('preferredRoomAnswer')} />
              {a.label}
            </label>
          ))}
        </fieldset>

        {form.preferredRoomAnswer === 'YES' && (
          <label className="field">
            <span className="field__label">Specific room (optional)</span>
            <select className="field__input" value={form.specificRoomId} onChange={set('specificRoomId')}>
              <option value="">No specific preference</option>
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.name} — {r.building}</option>)}
            </select>
          </label>
        )}
      </div>

      <label className="field">
        <span className="field__label">What needs changing?</span>
        <select className="field__input" value={form.changeCategory} onChange={set('changeCategory')} required>
          <option value="">Select…</option>
          {CHANGE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}{c.requiresApproval ? ' (must be approved)' : ''}</option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field__label">Please describe the rationale for the timetable change request</span>
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
