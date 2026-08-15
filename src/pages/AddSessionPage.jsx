import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api/client';
import { DAYS, SESSION_TYPE_LABELS, orderRoomsBySuggestion } from '../api/constraintOptions';

const SESSION_TYPES = Object.keys(SESSION_TYPE_LABELS);

export default function AddSessionPage() {
  const { id } = useParams(); // the constraint or change request id
  const [searchParams] = useSearchParams();
  const groupLabel = searchParams.get('groupLabel');
  const lecturerIdParam = searchParams.get('lecturerId');
  const sessionTypeParam = searchParams.get('sessionType');
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [sessionType, setSessionType] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [roomId, setRoomId] = useState('');
  const [lecturerId, setLecturerId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    Promise.all([api.get(`/timetabling-team/requests/${id}`), api.get('/rooms'), api.get('/teachers')])
      .then(([req, r, t]) => {
        setRequest(req);
        setRooms(r);
        setTeachers(t);

        // prefilling from what the lecturer asked for
        setDayOfWeek(req.dayOfWeek ?? '');
        setStartTime(req.startTime?.slice(0, 5) ?? '');
        setEndTime(req.endTime?.slice(0, 5) ?? '');
        setSessionType(sessionTypeParam ?? '');

        // for a module constraint's group, the intended teacher comes from the group itself
        setLecturerId(lecturerIdParam ?? (req.constraintKind == null ? String(req.requesterId ?? '') : ''));

        const suggestedNames = req.constraintKind === 'MODULE' ? (req.allowedRoomNames ?? [])
          : req.specificRoomName ? [req.specificRoomName]
          : [];
        const { defaultId } = orderRoomsBySuggestion(r, suggestedNames);
        if (defaultId) setRoomId(defaultId);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, lecturerIdParam, sessionTypeParam]);

  const suggestedRoomNames = useMemo(() => {
    if (!request) return [];
    if (request.constraintKind === 'MODULE') return request.allowedRoomNames ?? [];
    return request.specificRoomName ? [request.specificRoomName] : [];
  }, [request]);

  const orderedRooms = useMemo(
    () => orderRoomsBySuggestion(rooms, suggestedRoomNames).ordered,
    [rooms, suggestedRoomNames]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError('');

    if (!sessionType || !dayOfWeek || !startTime || !endTime || !roomId || !lecturerId) {
      setSaveError('All fields are required to create the new session');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/timetabling-team/sessions', {
        moduleId: request.primaryModuleId,
        roomId: Number(roomId),
        lecturerId: Number(lecturerId),
        sessionType,
        dayOfWeek,
        startTime,
        endTime,
        block: request.block,
        relatedRequestId: request.id,
      });
      navigate(request.type === 'CHANGE' ? '/timetabling-team/changes-in-queue' : '/timetabling-team/violations', {
        state: { justUpdated: `New ${SESSION_TYPE_LABELS[sessionType]} added for ${request.primaryModuleCode}${groupLabel ? ` (${groupLabel})` : ''} — ${dayOfWeek} ${startTime}` },
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
        <h1 className="page__title">Add Session</h1>
        <p className="page__subtitle">
          Creating a new session for {request.primaryModuleCode} — {request.primaryModuleName}
          {groupLabel ? ` · ${groupLabel}` : ''} · Block {request.block}, requested by {request.requesterName}.
        </p>

        <div className="card">
          {request.rationale && (
            <p className="card__body" style={{ marginBottom: 14 }}>
              <strong>Rationale:</strong> {request.rationale}
            </p>
          )}

          <form onSubmit={handleSubmit} className="form">
            <div className="form-grid">
              <label className="field">
                <span className="field__label">Session type</span>
                <select className="field__input" value={sessionType} onChange={(e) => setSessionType(e.target.value)} required>
                  <option value="">Select…</option>
                  {SESSION_TYPES.map((t) => <option key={t} value={t}>{SESSION_TYPE_LABELS[t]}</option>)}
                </select>
              </label>

              <label className="field">
                <span className="field__label">Teacher</span>
                <select className="field__input" value={lecturerId} onChange={(e) => setLecturerId(e.target.value)} required>
                  <option value="">Select…</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                </select>
              </label>

              <label className="field">
                <span className="field__label">Day</span>
                <select className="field__input" value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} required>
                  <option value="">Select…</option>
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
                <select className="field__input" value={roomId} onChange={(e) => setRoomId(e.target.value)} required>
                  <option value="">Select…</option>
                  {orderedRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} — {r.building}{suggestedRoomNames.includes(r.name) ? ' ★' : ''}
                    </option>
                  ))}
                </select>
                {suggestedRoomNames.length > 0 && <span className="field__hint">★ = suggested by the request</span>}
              </label>
            </div>

            {saveError && <p className="field__error">{saveError}</p>}

            <button className="btn btn--primary" type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create session'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
