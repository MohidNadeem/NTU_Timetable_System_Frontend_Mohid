import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { api } from '../api/client';

const ROLES = ['ADMIN', 'LECTURER', 'TIMETABLING_TEAM', 'STUDENT'];
const STATUSES = ['ACTIVE', 'LEAVER', 'ALUMNI'];

const emptyCreateForm = { username: '', email: '', fullName: '', role: 'LECTURER', courseId: '' };

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [justCreated, setJustCreated] = useState('');

  const [editingUser, setEditingUser] = useState(null); // the user object being edited, or null
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/admin/users'), api.get('/admin/courses')])
      .then(([u, c]) => { setUsers(u); setCourses(c); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(
    () => roleFilter ? users.filter((u) => u.role === roleFilter) : users,
    [users, roleFilter]
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (createForm.role === 'STUDENT' && !createForm.courseId) {
      setCreateError('Select a course for the student');
      return;
    }
    setCreating(true);
    try {
      const created = await api.post('/admin/users', {
        ...createForm,
        courseId: createForm.role === 'STUDENT' ? Number(createForm.courseId) : null,
      });
      setCreateForm(emptyCreateForm);
      setShowCreate(false);
      setJustCreated(`${created.fullName} created — a welcome email with their username and temporary password has been sent to ${created.email}.`);
      load();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (u) => {
    setEditingUser(u);
    setEditForm({ email: u.email, fullName: u.fullName, accountStatus: u.accountStatus, courseId: u.courseId ?? '' });
    setSaveError('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaving(true);
    try {
      await api.put(`/admin/users/${editingUser.id}`, {
        ...editForm,
        courseId: editingUser.role === 'STUDENT' && editForm.courseId ? Number(editForm.courseId) : null,
      });
      setEditingUser(null);
      load();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout><p className="status">Loading…</p></Layout>;
  if (error) return <Layout><p className="status status--error">{error}</p></Layout>;

  return (
    <Layout>
      <div className="page">
        <div className="card__header-row">
          <h1 className="page__title">Users</h1>
          <button className="btn btn--primary" onClick={() => setShowCreate((s) => !s)}>
            {showCreate ? 'Cancel' : '+ Add User'}
          </button>
        </div>

        {justCreated && (
          <div className="card" style={{ borderColor: 'var(--success)' }}>
            <p className="status status--ok">✓ {justCreated}</p>
          </div>
        )}

        {showCreate && (
          <div className="card">
            <h2 className="card__title">New user</h2>
            <form onSubmit={handleCreate} className="form">
              <div className="form-grid">
                <label className="field">
                  <span className="field__label">Username</span>
                  <input className="field__input" type="text" value={createForm.username}
                    onChange={(e) => setCreateForm((f) => ({ ...f, username: e.target.value }))} required />
                </label>
                <label className="field">
                  <span className="field__label">Email</span>
                  <input className="field__input" type="email" value={createForm.email}
                    onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} required />
                </label>
                <label className="field">
                  <span className="field__label">Full name</span>
                  <input className="field__input" type="text" value={createForm.fullName}
                    onChange={(e) => setCreateForm((f) => ({ ...f, fullName: e.target.value }))} required />
                </label>
                <label className="field">
                  <span className="field__label">Role</span>
                  <select className="field__input" value={createForm.role}
                    onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value, courseId: '' }))}>
                    {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                  </select>
                </label>
                {createForm.role === 'STUDENT' && (
                  <label className="field">
                    <span className="field__label">Course</span>
                    <select className="field__input" value={createForm.courseId}
                      onChange={(e) => setCreateForm((f) => ({ ...f, courseId: e.target.value }))} required>
                      <option value="">Select…</option>
                      {courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                    </select>
                  </label>
                )}
              </div>

              <p className="field__hint">
                A random temporary password will be generated and emailed to them, along with their username.
              </p>

              {createError && <p className="field__error">{createError}</p>}

              <button className="btn btn--primary" type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create user'}
              </button>
            </form>
          </div>
        )}

        {editingUser && (
          <div className="card">
            <h2 className="card__title">Edit {editingUser.fullName} ({editingUser.username})</h2>
            <form onSubmit={handleSaveEdit} className="form">
              <div className="form-grid">
                <label className="field">
                  <span className="field__label">Email</span>
                  <input className="field__input" type="email" value={editForm.email}
                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} required />
                </label>
                <label className="field">
                  <span className="field__label">Full name</span>
                  <input className="field__input" type="text" value={editForm.fullName}
                    onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))} required />
                </label>
                <label className="field">
                  <span className="field__label">Account status</span>
                  <select className="field__input" value={editForm.accountStatus}
                    onChange={(e) => setEditForm((f) => ({ ...f, accountStatus: e.target.value }))}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {editForm.accountStatus !== 'ACTIVE' && (
                    <span className="field__hint">This will block them from logging in.</span>
                  )}
                </label>
                {editingUser.role === 'STUDENT' && (
                  <label className="field">
                    <span className="field__label">Course</span>
                    <select className="field__input" value={editForm.courseId}
                      onChange={(e) => setEditForm((f) => ({ ...f, courseId: e.target.value }))}>
                      <option value="">None</option>
                      {courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                    </select>
                  </label>
                )}
              </div>

              {saveError && <p className="field__error">{saveError}</p>}

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn--primary" type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
                <button className="btn btn--ghost" type="button" onClick={() => setEditingUser(null)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="filters-row">
          <select className="field__input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All roles</option>
            {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
          </select>
        </div>

        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Course</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>{u.fullName}</td>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>{u.role.replace('_', ' ')}</td>
                  <td>{u.courseCode ?? '—'}</td>
                  <td>
                    <span className={`badge badge--${u.accountStatus === 'ACTIVE' ? 'accepted' : 'rejected'}`}>
                      {u.accountStatus}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn--ghost" onClick={() => startEdit(u)}>Edit</button>
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
