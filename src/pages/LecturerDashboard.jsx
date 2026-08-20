import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api/client';
import { STATUS_LABELS, changeCategoryLabel } from '../api/constraintOptions';

export default function LecturerDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/lecturer/dashboard')
      .then(setDashboard)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><p className="status">Loading dashboard…</p></Layout>;
  if (error) return <Layout><p className="status status--error">{error}</p></Layout>;

  return (
    <Layout>
      <div className="page">
        <h1 className="page__title">Welcome, {dashboard.fullName}</h1>
        <p className="page__subtitle">{dashboard.school} · {dashboard.campus} Campus</p>

        <div className="card">
          <h2 className="card__title">My teaching modules</h2>
          {dashboard.teachingModules.length === 0 && (
            <p className="card__body">No modules currently assigned to you in the timetable.</p>
          )}
          {dashboard.teachingModules.length > 0 && (
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Module</th>
                  <th>Block</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.teachingModules.map((m) => (
                  <tr key={m.id}>
                    <td>{m.code}</td>
                    <td>{m.name}</td>
                    <td>{m.block ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card__header-row">
            <h2 className="card__title">My constraint requests</h2>
            <Link className="btn btn--primary" to="/lecturer/requests">Submit a constraint</Link>
          </div>

          <div className="stat-grid">
            {Object.entries(dashboard.requestStatusCounts).map(([status, count]) => (
              <div key={status} className="stat-card">
                <span className="stat-card__count">{count}</span>
                <span className="stat-card__label">{STATUS_LABELS[status] ?? status}</span>
              </div>
            ))}
          </div>

          <p className="card__body" style={{ marginTop: 14 }}>
            {dashboard.totalRequests} request{dashboard.totalRequests === 1 ? '' : 's'} submitted in total.
            {' '}
            <Link to="/lecturer/requests/history">View full list →</Link>
          </p>
        </div>

        <div className="card">
          <div className="card__header-row">
            <h2 className="card__title">My change requests, by category</h2>
            <Link className="btn btn--primary" to="/lecturer/requests/changes">Submit a change</Link>
          </div>

          {Object.keys(dashboard.changeCategoryCounts).length === 0 ? (
            <p className="card__body">No change requests submitted yet.</p>
          ) : (
            <div className="stat-grid">
              {Object.entries(dashboard.changeCategoryCounts).map(([category, count]) => (
                <div key={category} className="stat-card">
                  <span className="stat-card__count">{count}</span>
                  <span className="stat-card__label">{changeCategoryLabel(category)}</span>
                </div>
              ))}
            </div>
          )}

          <p className="card__body" style={{ marginTop: 14 }}>
            <Link to="/lecturer/requests/changes/history">View full list →</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
