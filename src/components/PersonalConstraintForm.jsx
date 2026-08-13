import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function PersonalConstraintForm({ onSubmitted }) {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [departmentId, setDepartmentId] = useState('');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/courses')
      .then(setDepartments)
      .catch((err) => setError(err.message))
      .finally(() => setLoadingOptions(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/lecturer/requests/constraints/personal', {
        departmentId: Number(departmentId),
        description,
        reason,
      });
      setDepartmentId('');
      setDescription('');
      setReason('');
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

      {error && <p className="field__error">{error}</p>}

      <button className="btn btn--primary" type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit constraint request'}
      </button>
    </form>
  );
}
