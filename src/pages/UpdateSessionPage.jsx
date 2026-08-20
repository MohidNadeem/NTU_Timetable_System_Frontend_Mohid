import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import WeekPicker from '../components/WeekPicker';
import DurationTimeFields from '../components/DurationTimeFields';
import { api } from '../api/client';
import { DAYS, orderRoomsBySuggestion, addHours, hoursBetween } from '../api/constraintOptions';

// Estimate the duration of a session based on its start and end times 
function estimateDuration(start, end) {
  return hoursBetween(start, end) ?? 2;
}

export default function UpdateSessionPage() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const relatedRequestId = searchParams.get('requestId');
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [relatedRequest, setRelatedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dayOfWeek, setDayOfWeek] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [durationHours, setDurationHours] = useState(2);
  const [roomId, setRoomId] = useState('');
  const [lecturerId, setLecturerId] = useState('');
  const [weekMode, setWeekMode] = useState('ALL_REMAINING');
  const [weeks, setWeeks] = useState([]);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const calls = [api.get(`/timetabling-team/sessions/${sessionId}`), api.get('/rooms'), api.get('/teachers')];
    if (relatedRequestId) calls.push(api.get(`/timetabling-team/requests/${relatedRequestId}`));

    Promise.all(calls)
      .then(([s, r, t, req]) => {
        setSession(s);
        setRooms(r);
        setTeachers(t);
        setRelatedRequest(req ?? null);

        if (req?.changeCategory === 'STAFF_CHANGE' && req.preferredNewLecturerId) {
          setLecturerId(String(req.preferredNewLecturerId));
        }

        // working out which room(s) to suggest first in the dropdown
        const suggestedNames = req?.constraintKind === 'MODULE' ? (req.allowedRoomNames ?? [])
          : req?.specificRoomName ? [req.specificRoomName]
          : [];
        const { defaultId } = orderRoomsBySuggestion(r, suggestedNames, s.roomName);
        const fallbackRoomId = r.find((room) => room.name === s.roomName)?.id ?? '';
        setRoomId(defaultId ?? fallbackRoomId);

        let day, start, end;
        if (req && req.type === 'CONSTRAINT' && req.constraintKind === 'MODULE') {
          // module constraint
          day = req.dayOfWeek ?? s.dayOfWeek;
          start = (req.startTime ?? s.startTime)?.slice(0, 5);
          end = addHours(start, req.durationHours ?? 2);
          setWeekMode('ALL_REMAINING');
          setWeeks([]);
        } else if (req && req.type === 'CONSTRAINT' && req.constraintKind === 'PERSONAL') {
          // personal constraint
          day = s.dayOfWeek;
          start = s.startTime?.slice(0, 5);
          end = s.endTime?.slice(0, 5);
          setWeekMode('ALL_REMAINING');
          setWeeks([]);
        } else if (req && req.type === 'CHANGE') {
          // change request
          day = req.dayOfWeek ?? s.dayOfWeek;
          start = (req.startTime ?? s.startTime)?.slice(0, 5);
          end = (req.endTime ?? s.endTime)?.slice(0, 5);
          setWeekMode(req.weekMode ?? 'ALL_REMAINING');
          setWeeks(req.weeks ?? []);
        } else {
          day = s.dayOfWeek;
          start = s.startTime?.slice(0, 5);
          end = s.endTime?.slice(0, 5);
        }

        setDayOfWeek(day);
        setStartTime(start);
        setEndTime(end);
        setDurationHours(estimateDuration(start, end));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionId, relatedRequestId]);

  const suggestedRoomNames = useMemo(() => {
    if (relatedRequest?.constraintKind === 'MODULE') return relatedRequest.allowedRoomNames ?? [];
    if (relatedRequest?.specificRoomName) return [relatedRequest.specificRoomName];
    return [];
  }, [relatedRequest]);

  const orderedRooms = useMemo(
    () => orderRoomsBySuggestion(rooms, suggestedRoomNames, session?.roomName).ordered,
    [rooms, suggestedRoomNames, session]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError('');

    if (weekMode !== 'ALL_REMAINING' && weeks.length === 0) {
      setSaveError('Select at least one week');
      return;
    }
    if (hoursBetween(startTime, endTime) === null) {
      setSaveError('End time must be after start time');
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/timetabling-team/sessions/${sessionId}`, {
        dayOfWeek,
        startTime,
        endTime,
        roomId: roomId ? Number(roomId) : null,
        lecturerId: lecturerId ? Number(lecturerId) : null,
        scope: weekMode,
        weeks: weekMode === 'ALL_REMAINING' ? [] : weeks,
        relatedRequestId: relatedRequestId ? Number(relatedRequestId) : null,
        reason: reason || null,
      });
      const newRoomName = rooms.find((r) => String(r.id) === String(roomId))?.name ?? session.roomName;
      const newTeacherName = lecturerId ? teachers.find((t) => String(t.id) === String(lecturerId))?.fullName : session.lecturerName;
      const message = `${session.moduleCode} — ${session.moduleName} moved to ${dayOfWeek} ${startTime}, ${newRoomName}${lecturerId ? `, taught by ${newTeacherName}` : ''}`;
      // going straight back to wherever this update resolves - Violations for constraints,
      // Changes in Queue for change requests - with a confirmation naming exactly what changed
      const destination = relatedRequest?.type === 'CHANGE' ? '/timetabling-team/changes-in-queue' : '/timetabling-team/violations';
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

              <DurationTimeFields
                durationHours={durationHours}
                startTime={startTime}
                endTime={endTime}
                onChange={(patch) => {
                  if ('durationHours' in patch) setDurationHours(patch.durationHours);
                  if ('startTime' in patch) setStartTime(patch.startTime);
                  if ('endTime' in patch) setEndTime(patch.endTime);
                }}
              />

              <label className="field">
                <span className="field__label">Room</span>
                <select className="field__input" value={roomId} onChange={(e) => setRoomId(e.target.value)} required>
                  {orderedRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} — {r.building}{suggestedRoomNames.includes(r.name) ? ' ★' : ''}
                    </option>
                  ))}
                </select>
                {suggestedRoomNames.length > 0 && <span className="field__hint">★ = suggested by the request</span>}
              </label>

              <label className="field">
                <span className="field__label">
                  Teacher{relatedRequest?.changeCategory === 'STAFF_CHANGE' && <span className="field__hint"> (requested change)</span>}
                </span>
                <select className="field__input" value={lecturerId} onChange={(e) => setLecturerId(e.target.value)}>
                  <option value="">Keep current ({session.lecturerName})</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                </select>
              </label>
            </div>

            {relatedRequest?.type === 'CONSTRAINT' || relatedRequest?.changeCategory === 'STAFF_CHANGE' ? (
              <p className="field__hint">
                {relatedRequest?.changeCategory === 'STAFF_CHANGE'
                  ? 'Reassigning the teacher applies to the session\'s regular weekly pattern - a per-week teacher swap isn\'t supported.'
                  : 'Resolving a constraint updates the session\'s regular weekly pattern (every remaining week in Block ' + session.block + ') — a single/multiple-week exception wouldn\'t clear the violation, since violation checks only look at the regular pattern.'}
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
