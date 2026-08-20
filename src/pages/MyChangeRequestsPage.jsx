import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api/client';
import { STATUS_LABELS, ALL_STATUSES, CHANGE_CATEGORIES, changeCategoryLabel } from '../api/constraintOptions';

function summarise(r) {
  const day = r.dayOfWeek ? r.dayOfWeek.charAt(0) + r.dayOfWeek.slice(1).toLowerCase() : null;

  switch (r.changeCategory) {
    case 'CLASHES':
      return `${r.primaryModuleCode ?? ''} — ${r.currentSessionSummary ?? '—'} clashes with ${r.clashingSessionSummary ?? '—'}`;
    case 'STAFF_CHANGE':
      return `${r.primaryModuleCode ?? ''} — ${r.currentSessionSummary ?? '—'} → ${r.preferredNewLecturerName ?? 'new teacher'}`;
    case 'ADDITIONAL_SESSION':
      return `${r.primaryModuleCode ?? ''} — new session${day ? `, ${day}` : ''}`;
    case 'MERGE_SESSIONS_GROUPS':
      return `${r.primaryModuleCode ?? ''} — merging ${r.mergeSessions?.length ?? 0} sessions`;
    case 'SESSION_REMOVAL':
      return `${r.primaryModuleCode ?? ''} — remove ${r.currentSessionSummary ?? '—'}`;
    default:
      return `${r.primaryModuleCode ?? ''} — currently ${r.currentSessionSummary ?? '—'}${day ? ` → wants ${day}` : ''}`;
  }
}

export default function MyChangeRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (categoryFilter) params.set('category', categoryFilter);

    api.get(`/lecturer/requests/changes?${params.toString()}`)
      .then(setRequests)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [statusFilter, categoryFilter]);

  return (
    <Layout>
      <div className="page">
        <div className="card__header-row">
          <div>
            <h1 className="page__title">My Change Requests</h1>
            <p className="page__subtitle">Everything you've submitted so far, with its current status.</p>
          </div>
          <Link className="btn btn--primary" to="/lecturer/requests/changes">Submit a change request</Link>
        </div>

        <div className="filters-row">
          <select className="field__input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <select className="field__input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All categories</option>
            {CHANGE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div className="card">
          {loading && <p className="status">Loading…</p>}
          {error && <p className="status status--error">{error}</p>}

          {!loading && !error && requests.length === 0 && (
            <p className="card__body">No change requests match this filter.</p>
          )}

          {!loading && requests.length > 0 && (
            <table className="table">
              <thead>
                <tr>
                  <th>Summary</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Decision reason</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>{summarise(r)}</td>
                    <td>{changeCategoryLabel(r.changeCategory)}</td>
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
