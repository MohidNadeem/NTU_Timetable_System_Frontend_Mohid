import { useEffect, useState } from 'react';
import { api } from '../api/client';
import {
  DAYS, DURATIONS, TIME_SLOTS, LEARNING_ACTIVITIES,
  ROOM_TYPES, ROOM_LAYOUTS, ROOM_FEATURES,
} from '../api/constraintOptions';

// weekMode is fixed to ALL_REMAINING for constraints
// a constraint is a standing requirement for the module going forward, not a one-off week exception.
// Single / Multiple week scope will be for change requests (Increment 2)
const CONSTRAINT_WEEK_MODE = 'ALL_REMAINING';

const initialState = {
  departmentId: '',
  primaryModuleId: '',
  linkedModuleId: '',
  additionalLinkedModules: '',
  dayOfWeek: '',
  startTime: '',
  durationHours: 2,
  learningActivity: '',
  personalTutorDetail: '',
  activityDetail: '',
  titleTechnical: '',
  roomType: '',
  preferredRoomLayout: 'NONE',
  specificRoomId: '',
  feature: 'NONE',
  software: '',
  supportTeamStaff: '',
  lectureCapture: '',
  note: '',
};

export default function ModuleConstraintForm({ onSubmitted }) {
  const [departments, setDepartments] = useState([]);
  const [myModules, setMyModules] = useState([]);
  const [allModules, setAllModules] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/courses'),
      api.get('/lecturer/my-modules'),
      api.get('/modules'),
      api.get('/rooms'),
    ])
      .then(([deps, mine, all, r]) => {
        setDepartments(deps);
        setMyModules(mine);
        setAllModules(all);
        setRooms(r);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingOptions(false));
  }, []);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const selectedPrimaryModule = myModules.find((m) => String(m.id) === String(form.primaryModuleId));
  const block = selectedPrimaryModule?.block ?? null;

  const handlePrimaryModuleChange = (e) => {
    setForm((f) => ({ ...f, primaryModuleId: e.target.value }));
  };

  const validate = () => {
    if (!form.departmentId) return 'Select a department';
    if (!form.primaryModuleId) return 'Select a primary module';
    if (!form.dayOfWeek) return 'Select a day';
    if (!form.startTime) return 'Select a time';
    if (!form.learningActivity) return 'Select a learning activity';
    if (!form.roomType) return 'Select a room type';
    if (form.lectureCapture === '') return 'Select whether lecture capture is needed';
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
        weekMode: CONSTRAINT_WEEK_MODE,
        weeks: [],
        dayOfWeek: form.dayOfWeek,
        startTime: form.startTime,
        durationHours: Number(form.durationHours),
        learningActivity: form.learningActivity,
        personalTutorDetail: form.personalTutorDetail || null,
        activityDetail: form.activityDetail || null,
        titleTechnical: form.titleTechnical || null,
        roomType: form.roomType,
        preferredRoomLayout: form.preferredRoomLayout,
        specificRoomId: form.specificRoomId ? Number(form.specificRoomId) : null,
        feature: form.feature,
        software: form.software || null,
        supportTeamStaff: form.supportTeamStaff || null,
        lectureCapture: form.lectureCapture === 'true',
        note: form.note || null,
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
          <span className="field__label">Primary Module</span>
          <select className="field__input" value={form.primaryModuleId} onChange={handlePrimaryModuleChange} required>
            <option value="">Select…</option>
            {myModules.map((m) => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
          </select>
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

      {block && (
        <p className="field__hint">
          This applies to all remaining weeks in Block {block}.
        </p>
      )}


      <div className="form-grid">
        <label className="field">
          <span className="field__label">Day</span>
          <select className="field__input" value={form.dayOfWeek} onChange={set('dayOfWeek')} required>
            <option value="">Select…</option>
            {DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </label>

        <label className="field">
          <span className="field__label">Time</span>
          <select className="field__input" value={form.startTime} onChange={set('startTime')} required>
            <option value="">Select…</option>
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
          <span className="field__label">Specific Room</span>
          <select className="field__input" value={form.specificRoomId} onChange={set('specificRoomId')}>
            <option value="">None / no preference</option>
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.name} — {r.building}</option>)}
          </select>
        </label>

        <label className="field">
          <span className="field__label">Feature</span>
          <select className="field__input" value={form.feature} onChange={set('feature')}>
            {ROOM_FEATURES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </label>
      </div>

      <div className="form-grid">
        <label className="field">
          <span className="field__label">Software</span>
          <input className="field__input" type="text" value={form.software} onChange={set('software')} />
        </label>

        <label className="field">
          <span className="field__label">Support Team/Staff</span>
          <input className="field__input" type="text" value={form.supportTeamStaff} onChange={set('supportTeamStaff')} />
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
