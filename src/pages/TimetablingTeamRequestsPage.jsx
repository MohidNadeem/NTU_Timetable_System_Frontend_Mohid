import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api/client';
import { STATUS_LABELS, ALL_STATUSES } from '../api/constraintOptions';

function summarise(r) {
  if (r.constraintKind === 'MODULE') {
    const day = r.dayOfWeek ? r.dayOfWeek.charAt(0) + r.dayOfWeek.slice(1).toLowerCase() : '';
    const time = r.startTime ? r.startTime.slice(0, 5) : '';
    return `${r.primaryModuleCode ?? ''} — ${day} ${time}`.trim();
  }
  return r.description?.length > 80 ? `${r.description.slice(0, 80)}…` : r.description;
}

export default function TimetablingTeamRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [kindFilter, setKindFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const navigate = useNavigate();

  // fetching every constraint request (not filtered by requester) since this is the team-wide view
  useEffect(() => {
    api.get('/courses').then(setDepartments).catch(() => {});
  }, []);

  useEffect(() => {
    api.get('/timetabling-team/requests/constraints')
      .then(setRequests)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => requests
    .filter((r) => !statusFilter || r.status === statusFilter)
    .filter((r) => !kindFilter || r.constraintKind === kindFilter)
    .filter((r) => !departmentFilter || r.departmentCode === departmentFilter),
    [requests, statusFilter, kindFilter, departmentFilter]
  );

  return (
    <Layout>
      <div className="page">
        <h1 className="page__title">Constraint Requests</h1>
        <p className="page__subtitle">All constraint requests submitted by lecturers so far. Click a row to review and decide.</p>

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
          <select className="field__input" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
            <option value="">All departments</option>
            {departments.map((d) => <option key={d.id} value={d.code}>{d.code}</option>)}
          </select>
        </div>

        <div className="card">
          {loading && <p className="status">Loading…</p>}
          {error && <p className="status status--error">{error}</p>}

          {!loading && !error && filtered.length === 0 && (
            <p className="card__body">No constraint requests match this filter.</p>
          )}

          {!loading && filtered.length > 0 && (
            <table className="table table--clickable">
              <thead>
                <tr>
                  <th>Lecturer</th>
                  <th>Kind</th>
                  <th>Summary</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} onClick={() => navigate(`/timetabling-team/requests/${r.id}`)}>
                    <td>{r.requesterName}</td>
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
