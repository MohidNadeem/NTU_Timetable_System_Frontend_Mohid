import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { DAYS } from '../api/constraintOptions';

export default function PersonalConstraintForm({ onSubmitted }) {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [departmentId, setDepartmentId] = useState('');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');

  const [unavailableDays, setUnavailableDays] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/courses')
      .then(setDepartments)
      .catch((err) => setError(err.message))
      .finally(() => setLoadingOptions(false));
  }, []);

  const toggleDay = (day) => {
    setUnavailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (fromDate && toDate && toDate < fromDate) {
      setError('To date must be on or after From date');
      return;
    }
    if (fromTime && toTime && toTime <= fromTime) {
      setError('To time must be after From time');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/lecturer/requests/constraints/personal', {
        departmentId: Number(departmentId),
        description,
        reason,
        unavailableDays: unavailableDays.length > 0 ? unavailableDays : null,
        unavailableFromDate: fromDate || null,
        unavailableToDate: toDate || null,
        unavailableFromTime: fromTime || null,
        unavailableToTime: toTime || null,
      });
      setDepartmentId('');
      setDescription('');
      setReason('');
      setUnavailableDays([]);
      setFromDate('');
      setToDate('');
      setFromTime('');
      setToTime('');
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
          <span className="field__label">School</span>
          <input className="field__input" type="text" value="School of Science and Technology" disabled />
        </label>

        <label className="field">
          <span className="field__label">Department</span>
          <select className="field__input" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} required>
            <option value="">Select…</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}
          </select>
        </label>

        <label className="field">
          <span className="field__label">Campus</span>
          <input className="field__input" type="text" value="Clifton" disabled />
        </label>

        <label className="field">
          <span className="field__label">Staff Member</span>
          <input className="field__input" type="text" value={user.fullName} disabled />
        </label>
      </div>

      <label className="field">
        <span className="field__label">Explain your constraint</span>
        <textarea
          className="field__input field__input--textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. I do not want any classes to be held on Thursday"
          required
        />
      </label>

      <label className="field">
        <span className="field__label">Reason</span>
        <textarea
          className="field__input field__input--textarea"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
      </label>

      <fieldset className="field">
        <legend className="field__label">Day(s) unavailable (optional)</legend>
        {DAYS.map((d) => (
          <label key={d.value} className="checkbox">
            <input
              type="checkbox"
              checked={unavailableDays.includes(d.value)}
              onChange={() => toggleDay(d.value)}
            />
            {d.label}
          </label>
        ))}
      </fieldset>

      <div className="field-row-2">
        <label className="field">
          <span className="field__label">From date (optional)</span>
          <input className="field__input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </label>
        <label className="field">
          <span className="field__label">To date (optional)</span>
          <input className="field__input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} min={fromDate || undefined} />
        </label>
      </div>

      <div className="field-row-2">
        <label className="field">
          <span className="field__label">From time (optional)</span>
          <input className="field__input" type="time" value={fromTime} onChange={(e) => setFromTime(e.target.value)} />
        </label>
        <label className="field">
          <span className="field__label">To time (optional)</span>
          <input className="field__input" type="time" value={toTime} onChange={(e) => setToTime(e.target.value)} />
        </label>
      </div>

      {error && <p className="field__error">{error}</p>}

      <button className="btn btn--primary" type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit constraint request'}
      </button>
    </form>
  );
}
