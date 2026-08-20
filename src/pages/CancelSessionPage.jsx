import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import WeekPicker from '../components/WeekPicker';
import { api } from '../api/client';

export default function CancelSessionPage() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const relatedRequestId = searchParams.get('requestId');
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [relatedRequest, setRelatedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [scope, setScope] = useState('ALL_REMAINING');
  const [weeks, setWeeks] = useState([]);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const calls = [api.get(`/timetabling-team/sessions/${sessionId}`)];
    if (relatedRequestId) calls.push(api.get(`/timetabling-team/requests/${relatedRequestId}`));

    Promise.all(calls)
      .then(([s, req]) => {
        setSession(s);
        setRelatedRequest(req ?? null);
        // prefilling from the removal request's own scope, if it's a Session Removal request
        if (req?.changeCategory === 'SESSION_REMOVAL' || req?.changeCategory === 'MERGE_SESSIONS_GROUPS') {
          setScope(req.weekMode ?? 'ALL_REMAINING');
          setWeeks(req.weeks ?? []);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionId, relatedRequestId]);

  const handleCancel = async (e) => {
    e.preventDefault();
    setSaveError('');

    if (scope !== 'ALL_REMAINING' && weeks.length === 0) {
      setSaveError('Select at least one week');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/timetabling-team/sessions/${sessionId}/cancel`, {
        scope,
        weeks: scope === 'ALL_REMAINING' ? [] : weeks,
        relatedRequestId: relatedRequestId ? Number(relatedRequestId) : null,
        reason: reason || null,
      });
      const message = `${session.moduleCode} — ${session.moduleName} (${session.dayOfWeek} ${session.startTime?.slice(0, 5)}) cancelled${scope === 'ALL_REMAINING' ? '' : ' for the selected weeks'}`;
      const destination = relatedRequest?.changeCategory === 'MERGE_SESSIONS_GROUPS'
        ? '/timetabling-team/changes-in-queue'
        : relatedRequest?.type === 'CHANGE' ? '/timetabling-team/changes-in-queue' : '/timetabling-team/violations';
      navigate(destination, { state: { justUpdated: message } });
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Layout><p className="status">Loading…</p></Layout>;
  if (error) return <Layout><p className="status status--error">{error}</p></Layout>;

  return (
    <Layout>
      <div className="page">
        <h1 className="page__title">Cancel Session</h1>
        <p className="page__subtitle">
          {session.moduleCode} — {session.moduleName} · {session.dayOfWeek} {session.startTime?.slice(0, 5)}–{session.endTime?.slice(0, 5)} · {session.roomName} · Block {session.block}
        </p>

        <div className="card">
          <p className="card__body" style={{ marginBottom: 14 }}>
            The session is never deleted outright — it's marked cancelled and stays visible on the
            Timetable (struck through) so there's a clear record of what changed and why.
          </p>

          <form onSubmit={handleCancel} className="form">
            <WeekPicker
              block={session.block}
              weekMode={scope}
              weeks={weeks}
              onWeekModeChange={setScope}
              onWeeksChange={setWeeks}
            />

            <label className="field">
              <span className="field__label">Reason (optional)</span>
              <textarea className="field__input field__input--textarea" value={reason} onChange={(e) => setReason(e.target.value)} />
            </label>

            {saveError && <p className="field__error">{saveError}</p>}

            <button className="btn btn--danger" type="submit" disabled={submitting}>
              {submitting ? 'Cancelling...' : 'Cancel this session'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
