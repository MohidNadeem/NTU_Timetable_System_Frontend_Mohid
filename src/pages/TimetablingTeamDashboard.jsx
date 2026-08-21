import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusDonutChart from '../components/StatusDonutChart';
import CategoryBarChart from '../components/CategoryBarChart';
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
          <Link className="quick-link quick-link--warn" to="/timetabling-team/changes-in-queue">
            <span className="quick-link__count">{dashboard.changesInQueueCount}</span>
            <span className="quick-link__label">Changes in Queue →</span>
          </Link>
          <Link className="quick-link" to="/timetabling-team/timetable">
            <span className="quick-link__label">View Timetable →</span>
          </Link>
        </div>

        <div className="dashboard-split">
          <div className="card">
            <h2 className="card__title">All constraint requests, by status</h2>

            <StatusDonutChart counts={dashboard.constraintStatusCounts} />

            <div className="stat-grid stat-grid--compact">
              {Object.entries(dashboard.constraintStatusCounts).map(([status, count]) => (
                <div key={status} className="stat-card">
                  <span className="stat-card__count">{count}</span>
                  <span className="stat-card__label">{STATUS_LABELS[status] ?? status}</span>
                </div>
              ))}
            </div>

            <p className="card__body" style={{ marginTop: 14 }}>
              {dashboard.constraintTotal} submitted across all lecturers.{' '}
              <Link to="/timetabling-team/requests">Review requests →</Link>
            </p>
          </div>

          <div className="card">
            <h2 className="card__title">All change requests, by status</h2>

            <StatusDonutChart counts={dashboard.changeStatusCounts} />

            <div className="stat-grid stat-grid--compact">
              {Object.entries(dashboard.changeStatusCounts).map(([status, count]) => (
                <div key={status} className="stat-card">
                  <span className="stat-card__count">{count}</span>
                  <span className="stat-card__label">{STATUS_LABELS[status] ?? status}</span>
                </div>
              ))}
            </div>

            {Object.keys(dashboard.changeCategoryCounts).length > 0 && (
              <>
                <h3 className="card__subtitle">By category</h3>
                <CategoryBarChart counts={dashboard.changeCategoryCounts} />
              </>
            )}

            <p className="card__body" style={{ marginTop: 14 }}>
              {dashboard.changeTotal} submitted across all lecturers.{' '}
              <Link to="/timetabling-team/change-requests">Review requests →</Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
