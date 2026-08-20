import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function TimetablingTeamChangeRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/courses').then(setDepartments).catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (departmentFilter) params.set('departmentId', departmentFilter);
    if (categoryFilter) params.set('category', categoryFilter);

    api.get(`/timetabling-team/requests/changes?${params.toString()}`)
      .then(setRequests)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [statusFilter, departmentFilter, categoryFilter]);

  return (
    <Layout>
      <div className="page">
        <h1 className="page__title">Change Requests</h1>
        <p className="page__subtitle">All timetable change requests submitted by lecturers. Click a row to review and decide.</p>

        <div className="filters-row">
          <select className="field__input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <select className="field__input" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
            <option value="">All departments</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.code}</option>)}
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
            <table className="table table--clickable">
              <thead>
                <tr>
                  <th>Lecturer</th>
                  <th>Summary</th>
                  <th>Department</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} onClick={() => navigate(`/timetabling-team/requests/${r.id}`)}>
                    <td>{r.requesterName}</td>
                    <td>{summarise(r)}</td>
                    <td>{r.departmentCode}</td>
                    <td>{changeCategoryLabel(r.changeCategory)}</td>
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
