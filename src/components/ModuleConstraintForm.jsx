import { useEffect, useState } from 'react';
import { api } from '../api/client';
import WeekPicker from './WeekPicker';
import {
  DAYS, DURATIONS, TIME_SLOTS, LEARNING_ACTIVITIES,
  ROOM_TYPES, ROOM_LAYOUTS, ROOM_FEATURES,
} from '../api/constraintOptions';

// Revised per 14 Aug 2026 prototype evaluation feedback:
// - Primary Module is NOT scoped to "my modules"
// - Day/Time are optional now
// - full week-scope choice (3 options)
// - multiple acceptable rooms
// - one request can cover several lab/seminar groups

const initialState = {
  departmentId: '',
  primaryModuleId: '',
  linkedModuleId: '',
  additionalLinkedModules: '',
  weekMode: 'ALL_REMAINING',
  weeks: [],
  dayOfWeek: '',
  startTime: '',
  durationHours: 2,
  learningActivity: '',
  personalTutorDetail: '',
  activityDetail: '',
  titleTechnical: '',
  roomType: '',
  preferredRoomLayout: 'NONE',
  allowedRoomIds: [],
  feature: 'NONE',
  software: '',
  supportTeamStaff: '',
  lectureCapture: '',
  note: '',
};

export default function ModuleConstraintForm({ onSubmitted }) {
  const [departments, setDepartments] = useState([]);
  const [allModules, setAllModules] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [form, setForm] = useState(initialState);
  const [groups, setGroups] = useState([]); // [{ groupLabel, preferredLecturerId }]
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/courses'),
      api.get('/modules'),
      api.get('/rooms'),
      api.get('/teachers'),
    ])
      .then(([deps, all, r, t]) => {
        setDepartments(deps);
        setAllModules(all);
        setRooms(r);
        setTeachers(t);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingOptions(false));
  }, []);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const selectedPrimaryModule = allModules.find((m) => String(m.id) === String(form.primaryModuleId));
  const block = selectedPrimaryModule?.block ?? null;

  const handlePrimaryModuleChange = (e) => {
    setForm((f) => ({ ...f, primaryModuleId: e.target.value, weekMode: 'ALL_REMAINING', weeks: [] }));
  };

  const toggleRoom = (roomId) => {
    setForm((f) => ({
      ...f,
      allowedRoomIds: f.allowedRoomIds.includes(roomId)
        ? f.allowedRoomIds.filter((id) => id !== roomId)
        : [...f.allowedRoomIds, roomId],
    }));
  };

  const addGroup = () => setGroups((g) => [...g, { groupLabel: `Group ${g.length + 1}`, preferredLecturerId: '' }]);
  const removeGroup = (index) => setGroups((g) => g.filter((_, i) => i !== index));
  const updateGroup = (index, field, value) =>
    setGroups((g) => g.map((grp, i) => (i === index ? { ...grp, [field]: value } : grp)));

  const validate = () => {
    if (!form.departmentId) return 'Select a department';
    if (!form.primaryModuleId) return 'Select a primary module';
    if (form.weekMode !== 'ALL_REMAINING' && form.weeks.length === 0) return 'Select at least one week';
    if (!form.learningActivity) return 'Select a learning activity';
    if (!form.roomType) return 'Select a room type';
    if (form.lectureCapture === '') return 'Select whether lecture capture is needed';
    if (groups.some((g) => !g.groupLabel.trim())) return 'Every group needs a label';
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
      await api.post('/lecturer/requests/constraints/module', {
        departmentId: Number(form.departmentId),
        primaryModuleId: Number(form.primaryModuleId),
        linkedModuleId: form.linkedModuleId ? Number(form.linkedModuleId) : null,
        additionalLinkedModules: form.additionalLinkedModules || null,
        block,
        weekMode: form.weekMode,
        weeks: form.weekMode === 'ALL_REMAINING' ? [] : form.weeks,
        dayOfWeek: form.dayOfWeek || null,
        startTime: form.startTime || null,
        durationHours: Number(form.durationHours),
        learningActivity: form.learningActivity,
        personalTutorDetail: form.personalTutorDetail || null,
        activityDetail: form.activityDetail || null,
        titleTechnical: form.titleTechnical || null,
        roomType: form.roomType,
        preferredRoomLayout: form.preferredRoomLayout,
        allowedRoomIds: form.allowedRoomIds.map(Number),
        feature: form.feature,
        software: form.software || null,
        supportTeamStaff: form.supportTeamStaff || null,
        lectureCapture: form.lectureCapture === 'true',
        note: form.note || null,
        groups: groups.map((g) => ({
          groupLabel: g.groupLabel,
          preferredLecturerId: g.preferredLecturerId ? Number(g.preferredLecturerId) : null,
        })),
      });
      setForm(initialState);
      setGroups([]);
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
          <span className="field__label">Primary Module</span>
          <select className="field__input" value={form.primaryModuleId} onChange={handlePrimaryModuleChange} required>
            <option value="">Select…</option>
            {allModules.map((m) => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
          </select>
          <span className="field__hint">Any module - not limited to ones you currently teach.</span>
        </label>

        <label className="field">
          <span className="field__label">Linked Module (if applicable)</span>
          <select className="field__input" value={form.linkedModuleId} onChange={set('linkedModuleId')}>
            <option value="">None</option>
            {allModules.map((m) => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
          </select>
        </label>

        <label className="field">
          <span className="field__label">Additional Linked Modules</span>
          <input className="field__input" type="text" value={form.additionalLinkedModules} onChange={set('additionalLinkedModules')} />
        </label>
      </div>

      <WeekPicker
        block={block}
        weekMode={form.weekMode}
        weeks={form.weeks}
        onWeekModeChange={(v) => setForm((f) => ({ ...f, weekMode: v }))}
        onWeeksChange={(v) => setForm((f) => ({ ...f, weeks: v }))}
      />

      <div className="form-grid">
        <label className="field">
          <span className="field__label">Day (optional)</span>
          <select className="field__input" value={form.dayOfWeek} onChange={set('dayOfWeek')}>
            <option value="">No preference</option>
            {DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </label>

        <label className="field">
          <span className="field__label">Time (optional)</span>
          <select className="field__input" value={form.startTime} onChange={set('startTime')}>
            <option value="">No preference</option>
            {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>

        <label className="field">
          <span className="field__label">Duration</span>
          <select className="field__input" value={form.durationHours} onChange={set('durationHours')} required>
            {DURATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </label>

        <label className="field">
          <span className="field__label">Learning Activity</span>
          <select className="field__input" value={form.learningActivity} onChange={set('learningActivity')} required>
            <option value="">Select…</option>
            {LEARNING_ACTIVITIES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
      </div>

      <div className="form-grid">
        <label className="field">
          <span className="field__label">Dashboard Personal Tutor Detail</span>
          <input className="field__input" type="text" value={form.personalTutorDetail} onChange={set('personalTutorDetail')} placeholder="If applicable" />
        </label>

        <label className="field">
          <span className="field__label">Title/Technical</span>
          <input className="field__input" type="text" value={form.titleTechnical} onChange={set('titleTechnical')} />
        </label>
      </div>

      <label className="field">
        <span className="field__label">Activity Detail</span>
        <textarea className="field__input field__input--textarea" value={form.activityDetail} onChange={set('activityDetail')} />
      </label>

      <div className="form-grid">
        <label className="field">
          <span className="field__label">Room Type</span>
          <select className="field__input" value={form.roomType} onChange={set('roomType')} required>
            <option value="">Select…</option>
            {ROOM_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </label>

        <label className="field">
          <span className="field__label">Preferred Room Layout</span>
          <select className="field__input" value={form.preferredRoomLayout} onChange={set('preferredRoomLayout')}>
            {ROOM_LAYOUTS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </label>

        <label className="field">
          <span className="field__label">Feature</span>
          <select className="field__input" value={form.feature} onChange={set('feature')}>
            {ROOM_FEATURES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </label>
      </div>

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

      <fieldset className="field">
        <legend className="field__label">
          Groups (optional — if this covers several lab/seminar groups, e.g. each with a different teacher)
        </legend>
        {groups.map((g, i) => (
          <div key={i} className="form-grid" style={{ marginBottom: 10, alignItems: 'end' }}>
            <label className="field">
              <span className="field__label">Group label</span>
              <input
                className="field__input"
                type="text"
                value={g.groupLabel}
                onChange={(e) => updateGroup(i, 'groupLabel', e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field__label">Preferred teacher (optional)</span>
              <select
                className="field__input"
                value={g.preferredLecturerId}
                onChange={(e) => updateGroup(i, 'preferredLecturerId', e.target.value)}
              >
                <option value="">Not decided yet</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
              </select>
            </label>
            <button type="button" className="btn btn--ghost" onClick={() => removeGroup(i)}>Remove</button>
          </div>
        ))}
        <button type="button" className="btn btn--ghost" onClick={addGroup}>+ Add group</button>
      </fieldset>

      <div className="form-grid">
        <label className="field">
          <span className="field__label">Software</span>
          <input className="field__input" type="text" value={form.software} onChange={set('software')} />
        </label>

        <label className="field">
          <span className="field__label">Who is delivering this session, if not you? (optional)</span>
          <input
            className="field__input"
            type="text"
            value={form.supportTeamStaff}
            onChange={set('supportTeamStaff')}
            placeholder="e.g. another staff member is teaching this"
          />
        </label>

        <fieldset className="field">
          <legend className="field__label">Lecture Capture</legend>
          <label className="radio">
            <input type="radio" name="lectureCapture" value="true" checked={form.lectureCapture === 'true'} onChange={set('lectureCapture')} />
            Yes
          </label>
          <label className="radio">
            <input type="radio" name="lectureCapture" value="false" checked={form.lectureCapture === 'false'} onChange={set('lectureCapture')} />
            No
          </label>
        </fieldset>
      </div>

      <label className="field">
        <span className="field__label">Note</span>
        <textarea
          className="field__input field__input--textarea"
          value={form.note}
          onChange={set('note')}
          placeholder="e.g. Lecture must come before all lab sessions each week"
        />
      </label>

      {error && <p className="field__error">{error}</p>}

      <button className="btn btn--primary" type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit constraint request'}
      </button>
    </form>
  );
}
