import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { api } from '../api/client';

const emptyForm = { code: '', name: '' };

export default function AdminCoursesPage() {
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
    api.get('/admin/courses').then(setCourses).catch((err) => setError(err.message)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setShowForm(true);
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setForm({ code: c.code, name: c.name });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/admin/courses/${editingId}`, form);
      } else {
        await api.post('/admin/courses', form);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c) => {
    setRowError('');
    try {
      await api.delete(`/admin/courses/${c.id}`);
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
          <h1 className="page__title">Courses</h1>
          <button className="btn btn--primary" onClick={startCreate}>+ Add Course</button>
        </div>

        {showForm && (
          <div className="card">
            <h2 className="card__title">{editingId ? 'Edit course' : 'New course'}</h2>
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
              <tr><th>Code</th><th>Name</th><th></th></tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td>{c.code}</td>
                  <td>{c.name}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn--ghost" onClick={() => startEdit(c)}>Edit</button>
                    <button className="btn btn--danger" onClick={() => handleDelete(c)}>Delete</button>
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
