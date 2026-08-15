import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api/client';
import { STATUS_LABELS, ALL_STATUSES } from '../api/constraintOptions';

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
  const [statusFilter, setStatusFilter] = useState('');
  const [kindFilter, setKindFilter] = useState('');

  useEffect(() => {
    api.get('/lecturer/requests/constraints')
      .then(setRequests)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => requests
    .filter((r) => !statusFilter || r.status === statusFilter)
    .filter((r) => !kindFilter || r.constraintKind === kindFilter),
    [requests, statusFilter, kindFilter]
  );

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

        <div className="filters-row">
          <select className="field__input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <select className="field__input" value={kindFilter} onChange={(e) => setKindFilter(e.target.value)}>
            <option value="">All kinds</option>
            <option value="MODULE">Module-based</option>
            <option value="PERSONAL">Personal</option>
          </select>
        </div>

        <div className="card">
          {loading && <p className="status">Loading…</p>}
          {error && <p className="status status--error">{error}</p>}

          {!loading && !error && filtered.length === 0 && (
            <p className="card__body">No constraint requests match this filter.</p>
          )}

          {!loading && filtered.length > 0 && (
            <table className="table">
              <thead>
                <tr>
                  <th>Kind</th>
                  <th>Summary</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Decision reason</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>{r.constraintKind === 'MODULE' ? 'Module-based' : 'Personal'}</td>
                    <td>{summarise(r)}</td>
                    <td>{r.departmentCode}</td>
                    <td><span className={`badge badge--${r.status.toLowerCase()}`}>{STATUS_LABELS[r.status]}</span></td>
                    <td>{r.reasonComment || '—'}</td>
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
