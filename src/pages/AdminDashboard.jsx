import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/admin/users'), api.get('/admin/courses'), api.get('/admin/modules')])
      .then(([u, c, m]) => { setUsers(u); setCourses(c); setModules(m); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><p className="status">Loading…</p></Layout>;
  if (error) return <Layout><p className="status status--error">{error}</p></Layout>;

  const countByRole = (role) => users.filter((u) => u.role === role).length;
  const leaverAlumniCount = users.filter((u) => u.accountStatus !== 'ACTIVE').length;

  return (
    <Layout>
      <div className="page">
        <h1 className="page__title">Welcome, {user.fullName}</h1>
        <p className="page__subtitle">School of Science and Technology · Clifton Campus</p>

        <div className="quick-links">
          <Link className="quick-link" to="/admin/users">
            <span className="quick-link__count">{users.length}</span>
            <span className="quick-link__label">Total Users →</span>
          </Link>
          <Link className="quick-link" to="/admin/courses">
            <span className="quick-link__count">{courses.length}</span>
            <span className="quick-link__label">Courses →</span>
          </Link>
          <Link className="quick-link" to="/admin/modules">
            <span className="quick-link__count">{modules.length}</span>
            <span className="quick-link__label">Modules →</span>
          </Link>
          <Link className="quick-link quick-link--warn" to="/admin/users">
            <span className="quick-link__count">{leaverAlumniCount}</span>
            <span className="quick-link__label">Leavers/Alumni →</span>
          </Link>
        </div>

        <div className="card">
          <h2 className="card__title">Users by role</h2>
          <div className="stat-grid">
            <div className="stat-card">
              <span className="stat-card__count">{countByRole('ADMIN')}</span>
              <span className="stat-card__label">Admin</span>
            </div>
            <div className="stat-card">
              <span className="stat-card__count">{countByRole('LECTURER')}</span>
              <span className="stat-card__label">Lecturer</span>
            </div>
            <div className="stat-card">
              <span className="stat-card__count">{countByRole('TIMETABLING_TEAM')}</span>
              <span className="stat-card__label">Timetabling Team</span>
            </div>
            <div className="stat-card">
              <span className="stat-card__count">{countByRole('STUDENT')}</span>
              <span className="stat-card__label">Student</span>
            </div>
          </div>

          <p className="card__body" style={{ marginTop: 14 }}>
            <Link to="/admin/users">Manage users →</Link>
            {' · '}
            <Link to="/admin/email-log">View email log →</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
