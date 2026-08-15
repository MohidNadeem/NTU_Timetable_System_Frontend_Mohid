import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import EffectCard from '../components/EffectCard';
import { api } from '../api/client';

// a pre-decision preview so the Timetabling Team can see
// what accepting a request would actually mean for the schedule before deciding.
export default function ViewEffectPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [effect, setEffect] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/timetabling-team/requests/${id}/effect`)
      .then(setEffect)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Layout><p className="status">Loading…</p></Layout>;
  if (error) return <Layout><p className="status status--error">{error}</p></Layout>;

  return (
    <Layout>
      <div className="page">
        <div className="card__header-row">
          <div>
            <h1 className="page__title">Effect Preview</h1>
            <p className="page__subtitle">What would happen to the schedule if this request is accepted.</p>
          </div>
          <button className="btn btn--ghost" onClick={() => navigate(-1)}>← Back</button>
        </div>

        <EffectCard effect={effect} />
      </div>
    </Layout>
  );
}
