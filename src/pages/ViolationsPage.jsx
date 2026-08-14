import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api/client';
import { SESSION_TYPE_LABELS } from '../api/constraintOptions';

function fmtTime(t) {
  return t ? t.slice(0, 5) : '—';
}

export default function ViolationsPage() {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const justUpdated = location.state?.justUpdated;

  useEffect(() => {
    api.get('/timetabling-team/violations')
      .then(setViolations)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const goUpdate = (v) => {
    navigate(`/timetabling-team/sessions/${v.matchedSessionId}/update?requestId=${v.requestId}`);
  };

  return (
    <Layout>
      <div className="page">
        <h1 className="page__title">Constraint Violations</h1>
        <p className="page__subtitle">
          Accepted module-based constraints where the current timetable doesn't match what was agreed.
        </p>

        {loading && <p className="status">Loading…</p>}
        {error && <p className="status status--error">{error}</p>}

        {justUpdated && (
          <div className="card" style={{ borderColor: 'var(--success)' }}>
            <p className="status status--ok">✓ Updated: {justUpdated}</p>
          </div>
        )}

        {!loading && !error && violations.length === 0 && (
          <div className="card">
            <p className="card__body status--ok">No violations found — every accepted constraint matches the current timetable.</p>
          </div>
        )}

        {!loading && violations.map((v) => (
          <div key={v.requestId} className="card">
            <div className="card__header-row">
              <div>
                <h2 className="card__title">{v.primaryModuleCode} — {v.primaryModuleName}</h2>
                <p className="page__subtitle">
                  Requested by {v.requesterName} · {v.departmentCode} · Block {v.block} · {v.learningActivity}
                </p>
              </div>
              {v.hasMatchedSession
                ? <button className="btn btn--primary" onClick={() => goUpdate(v)}>Update</button>
                : <span className="badge badge--rejected">No matching session</span>}
            </div>

            <div className="violation-compare">
              <div className="violation-compare__col">
                <span className="violation-compare__label">Requested</span>
                <span>{v.requestedDayOfWeek} {fmtTime(v.requestedStartTime)} ({v.requestedDurationHours}h)</span>
                <span className="card__body">{v.requestedRoomName ?? 'No specific room'}</span>
              </div>

              {v.hasMatchedSession ? (
                <div className="violation-compare__col">
                  <span className="violation-compare__label">Currently scheduled ({SESSION_TYPE_LABELS[v.matchedSessionType] ?? v.matchedSessionType})</span>
                  <span>{v.currentDayOfWeek} {fmtTime(v.currentStartTime)}–{fmtTime(v.currentEndTime)}</span>
                  <span className="card__body">{v.currentRoomName}</span>
                </div>
              ) : (
                <div className="violation-compare__col">
                  <span className="violation-compare__label">Currently scheduled</span>
                  <span className="card__body">
                    No session matching "{v.learningActivity}" exists for this module — review manually.
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
