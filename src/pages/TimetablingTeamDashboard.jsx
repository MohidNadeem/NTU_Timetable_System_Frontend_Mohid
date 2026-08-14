import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api/client';
import { STATUS_LABELS } from '../api/constraintOptions';

export default function TimetablingTeamDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/timetabling-team/dashboard')
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

        <div className="quick-links">
          <Link className="quick-link" to="/timetabling-team/requests">
            <span className="quick-link__count">{dashboard.awaitingDecisionCount}</span>
            <span className="quick-link__label">Awaiting Decision →</span>
          </Link>
          <Link className="quick-link quick-link--warn" to="/timetabling-team/violations">
            <span className="quick-link__count">{dashboard.violationCount}</span>
            <span className="quick-link__label">Constraint Violations →</span>
          </Link>
          <Link className="quick-link" to="/timetabling-team/timetable">
            <span className="quick-link__label">View Timetable →</span>
          </Link>
        </div>

        <div className="card">
          <h2 className="card__title">All constraint requests, by status</h2>

          <div className="stat-grid">
            {Object.entries(dashboard.requestStatusCounts).map(([status, count]) => (
              <div key={status} className="stat-card">
                <span className="stat-card__count">{count}</span>
                <span className="stat-card__label">{STATUS_LABELS[status] ?? status}</span>
              </div>
            ))}
          </div>

          <p className="card__body" style={{ marginTop: 14 }}>
            {dashboard.totalRequests} request{dashboard.totalRequests === 1 ? '' : 's'} submitted across all lecturers.
            {' '}
            <Link to="/timetabling-team/requests">Review requests →</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}