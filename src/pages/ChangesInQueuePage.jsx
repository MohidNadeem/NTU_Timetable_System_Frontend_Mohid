import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import EffectCard from '../components/EffectCard';
import { api } from '../api/client';

export default function ChangesInQueuePage() {
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();
  const justUpdated = location.state?.justUpdated;

  useEffect(() => {
    api.get('/timetabling-team/changes-in-queue')
      .then(setChanges)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="page">
        <h1 className="page__title">Changes in Queue</h1>
        <p className="page__subtitle">
          Accepted change requests that haven't been applied to the timetable yet.
        </p>

        {loading && <p className="status">Loading…</p>}
        {error && <p className="status status--error">{error}</p>}

        {justUpdated && (
          <div className="card" style={{ borderColor: 'var(--success)' }}>
            <p className="status status--ok">✓ {justUpdated}</p>
          </div>
        )}

        {!loading && !error && changes.length === 0 && (
          <div className="card">
            <p className="card__body status--ok">Nothing pending — every accepted change request has been applied.</p>
          </div>
        )}

        {!loading && changes.map((c) => <EffectCard key={c.requestId} effect={c} />)}
      </div>
    </Layout>
  );
}
