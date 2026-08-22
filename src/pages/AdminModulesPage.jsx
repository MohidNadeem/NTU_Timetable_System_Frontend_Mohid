import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { api } from '../api/client';

const emptyForm = { code: '', name: '', courseIds: [] };

export default function AdminModulesPage() {
  const [modules, setModules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [rowError, setRowError] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/admin/modules'), api.get('/admin/courses')])
      .then(([m, c]) => { setModules(m); setCourses(c); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setShowForm(true);
  };

  const startEdit = (m) => {
    setEditingId(m.id);
    setForm({
      code: m.code,
      name: m.name,
      courseIds: courses.filter((c) => m.courseCodes.includes(c.code)).map((c) => String(c.id)),
    });
    setFormError('');
    setShowForm(true);
  };

  const toggleCourse = (courseId) => {
    setForm((f) => ({
      ...f,
      courseIds: f.courseIds.includes(courseId)
        ? f.courseIds.filter((id) => id !== courseId)
        : [...f.courseIds, courseId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const payload = { code: form.code, name: form.name, courseIds: form.courseIds.map(Number) };
      if (editingId) {
        await api.put(`/admin/modules/${editingId}`, payload);
      } else {
        await api.post('/admin/modules', payload);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m) => {
    setRowError('');
    try {
      await api.delete(`/admin/modules/${m.id}`);
      load();
    } catch (err) {
      setRowError(err.message);
    }
  };

  if (loading) return <Layout><p className="status">Loading…</p></Layout>;
  if (error) return <Layout><p className="status status--error">{error}</p></Layout>;

  return (
    <Layout>
      <div className="page">
        <div className="card__header-row">
          <h1 className="page__title">Modules</h1>
          <button className="btn btn--primary" onClick={startCreate}>+ Add Module</button>
        </div>

        {showForm && (
          <div className="card">
            <h2 className="card__title">{editingId ? 'Edit module' : 'New module'}</h2>
            <form onSubmit={handleSubmit} className="form">
              <div className="form-grid">
                <label className="field">
                  <span className="field__label">Code</span>
                  <input className="field__input" type="text" value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} required />
                </label>
                <label className="field">
                  <span className="field__label">Name</span>
                  <input className="field__input" type="text" value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
                </label>
              </div>

              <fieldset className="field">
                <legend className="field__label">Offered by which course(s)?</legend>
                <div className="week-picker__grid">
                  {courses.map((c) => (
                    <label key={c.id} className="checkbox">
                      <input
                        type="checkbox"
                        checked={form.courseIds.includes(String(c.id))}
                        onChange={() => toggleCourse(String(c.id))}
                      />
                      {c.code} — {c.name}
                    </label>
                  ))}
                </div>
              </fieldset>

              {formError && <p className="field__error">{formError}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn--primary" type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button className="btn btn--ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {rowError && <p className="field__error" style={{ marginBottom: 12 }}>{rowError}</p>}

        <div className="card">
          <table className="table">
            <thead>
              <tr><th>Code</th><th>Name</th><th>Courses</th><th></th></tr>
            </thead>
            <tbody>
              {modules.map((m) => (
                <tr key={m.id}>
                  <td>{m.code}</td>
                  <td>{m.name}</td>
                  <td>{m.courseCodes.join(', ') || '—'}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn--ghost" onClick={() => startEdit(m)}>Edit</button>
                    <button className="btn btn--danger" onClick={() => handleDelete(m)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
