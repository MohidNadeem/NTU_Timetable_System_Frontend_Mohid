import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import EffectCard from '../components/EffectCard';
import { api } from '../api/client';

export default function ViolationsPage() {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();
  const justUpdated = location.state?.justUpdated;

  useEffect(() => {
    api.get('/timetabling-team/violations')
      .then(setViolations)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="page">
        <h1 className="page__title">Constraint Violations</h1>
        <p className="page__subtitle">
          Accepted constraints (module-based and personal) where the current timetable doesn't match what was agreed.
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

        {!loading && violations.map((v) => <EffectCard key={v.requestId} effect={v} />)}
      </div>
    </Layout>
  );
}
