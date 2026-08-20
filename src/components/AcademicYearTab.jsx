import { useEffect, useState } from 'react';
import { api } from '../api/client';

// extracted from the prev. standalone AcademicYearSettingsPage
// now is one of the tabs within Session Management
export default function AcademicYearTab() {
  const [currentYearLabel, setCurrentYearLabel] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/academic-year')
      .then((r) => {
        setCurrentYearLabel(r.currentYearLabel);
        setNewLabel(r.currentYearLabel);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaved(false);
    setSaving(true);
    try {
      const updated = await api.put('/timetabling-team/academic-year', { currentYearLabel: newLabel });
      setCurrentYearLabel(updated.currentYearLabel);
      setSaved(true);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="status">Loading…</p>;
  if (error) return <p className="status status--error">{error}</p>;

  return (
    <div className="card">
      <h2 className="card__title">Current: {currentYearLabel}</h2>
      <p className="card__body" style={{ marginBottom: 14 }}>
        Controls the year label shown on the change request form's Year Group dropdown
        (e.g. "2026/27 Half Year 1"). Existing change requests keep their original year label
        even after this changes.
      </p>

      <form onSubmit={handleSave} className="form">
        <label className="field">
          <span className="field__label">New academic year label</span>
          <input
            className="field__input"
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="e.g. 2027/28"
            required
          />
        </label>

        {saveError && <p className="field__error">{saveError}</p>}
        {saved && <p className="status status--ok">Saved.</p>}

        <button className="btn btn--primary" type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Update academic year'}
        </button>
      </form>
    </div>
  );
}
