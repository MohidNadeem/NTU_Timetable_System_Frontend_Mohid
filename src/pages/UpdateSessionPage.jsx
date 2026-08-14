import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import WeekPicker from '../components/WeekPicker';
import { api } from '../api/client';
import { DAYS } from '../api/constraintOptions';

function addHours(timeStr, hours) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + hours * 60;
  const hh = String(Math.floor((total / 60) % 24)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

export default function UpdateSessionPage() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const relatedRequestId = searchParams.get('requestId');
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dayOfWeek, setDayOfWeek] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [roomId, setRoomId] = useState('');
  const [weekMode, setWeekMode] = useState('ALL_REMAINING');
  const [weeks, setWeeks] = useState([]);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const calls = [api.get(`/timetabling-team/sessions/${sessionId}`), api.get('/rooms')];
    if (relatedRequestId) calls.push(api.get(`/timetabling-team/requests/constraints/${relatedRequestId}`));

    Promise.all(calls)
      .then(([s, r, req]) => {
        setSession(s);
        setRooms(r);

        if (req) {
          // prefilling from the constraint request that flagged this violation
          // including the room, which was previously left as "keep current" by default
          setDayOfWeek(req.dayOfWeek ?? s.dayOfWeek);
          setStartTime((req.startTime ?? s.startTime)?.slice(0, 5));
          setEndTime(addHours((req.startTime ?? s.startTime)?.slice(0, 5), req.durationHours ?? 2));
          setRoomId(req.specificRoomId ?? '');
          // ALL_REMAINING here regardless of the original constraint's weekMode
          setWeekMode('ALL_REMAINING');
          setWeeks([]);
        } else {
          setDayOfWeek(s.dayOfWeek);
          setStartTime(s.startTime?.slice(0, 5));
          setEndTime(s.endTime?.slice(0, 5));
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionId, relatedRequestId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError('');

    if (weekMode !== 'ALL_REMAINING' && weeks.length === 0) {
      setSaveError('Select at least one week');
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/timetabling-team/sessions/${sessionId}`, {
        dayOfWeek,
        startTime,
        endTime,
        roomId: roomId ? Number(roomId) : null,
        scope: weekMode,
        weeks: weekMode === 'ALL_REMAINING' ? [] : weeks,
        relatedRequestId: relatedRequestId ? Number(relatedRequestId) : null,
        reason: reason || null,
      });
      const newRoomName = roomId ? rooms.find((r) => String(r.id) === String(roomId))?.name : session.roomName;
      navigate('/timetabling-team/violations', {
        state: { justUpdated: `${session.moduleCode} — ${session.moduleName} moved to ${dayOfWeek} ${startTime}, ${newRoomName}` },
      });
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
        <h1 className="page__title">Update Session</h1>
        <p className="page__subtitle">
          {session.moduleCode} — {session.moduleName} · currently {session.dayOfWeek} {session.startTime?.slice(0, 5)}–{session.endTime?.slice(0, 5)} · {session.roomName} · Block {session.block}
        </p>

        <div className="card">
          <form onSubmit={handleSubmit} className="form">
            <div className="form-grid">
              <label className="field">
                <span className="field__label">Day</span>
                <select className="field__input" value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} required>
                  {DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </label>

              <label className="field">
                <span className="field__label">Start time</span>
                <input className="field__input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              </label>

              <label className="field">
                <span className="field__label">End time</span>
                <input className="field__input" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
              </label>

              <label className="field">
                <span className="field__label">Room</span>
                <select className="field__input" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
                  <option value="">Keep current room ({session.roomName})</option>
                  {rooms.map((r) => <option key={r.id} value={r.id}>{r.name} — {r.building}</option>)}
                </select>
              </label>
            </div>

            {relatedRequestId ? (
              <p className="field__hint">
                Resolving a violation updates the session's regular weekly pattern (every remaining
                week in Block {session.block}) — a single/multiple-week exception wouldn't clear the
                violation, since violation checks only look at the regular pattern.
              </p>
            ) : (
              <WeekPicker
                block={session.block}
                weekMode={weekMode}
                weeks={weeks}
                onWeekModeChange={setWeekMode}
                onWeeksChange={setWeeks}
              />
            )}

            <label className="field">
              <span className="field__label">Reason (optional)</span>
              <textarea className="field__input field__input--textarea" value={reason} onChange={(e) => setReason(e.target.value)} />
            </label>

            {saveError && <p className="field__error">{saveError}</p>}

            <button className="btn btn--primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save update'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
