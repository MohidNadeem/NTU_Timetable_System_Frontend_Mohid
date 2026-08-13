import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api/client';
import { STATUS_LABELS } from '../api/constraintOptions';

// building a one-line summary per request kind
function summarise(r) {
  if (r.constraintKind === 'MODULE') {
    const day = r.dayOfWeek ? r.dayOfWeek.charAt(0) + r.dayOfWeek.slice(1).toLowerCase() : '';
    const time = r.startTime ? r.startTime.slice(0, 5) : '';
    return `${r.primaryModuleCode ?? ''} — ${day} ${time}`.trim();
  }
  return r.description?.length > 80 ? `${r.description.slice(0, 80)}…` : r.description;
}

export default function MyConstraintRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/lecturer/requests/constraints')
      .then(setRequests)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="page">
        <div className="card__header-row">
          <div>
            <h1 className="page__title">My Constraint Requests</h1>
            <p className="page__subtitle">Everything you've submitted so far, with its current status.</p>
          </div>
          <Link className="btn btn--primary" to="/lecturer/requests">Submit a constraint</Link>
        </div>

        <div className="card">
          {loading && <p className="status">Loading…</p>}
          {error && <p className="status status--error">{error}</p>}

          {!loading && !error && requests.length === 0 && (
            <p className="card__body">No constraint requests submitted yet.</p>
          )}

          {!loading && requests.length > 0 && (
            <table className="table">
              <thead>
                <tr>
                  <th>Kind</th>
                  <th>Summary</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>{r.constraintKind === 'MODULE' ? 'Module-based' : 'Personal'}</td>
                    <td>{summarise(r)}</td>
                    <td>{r.departmentCode}</td>
                    <td><span className={`badge badge--${r.status.toLowerCase()}`}>{STATUS_LABELS[r.status]}</span></td>
                    <td>{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}
