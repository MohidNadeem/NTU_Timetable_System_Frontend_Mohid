import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import DurationTimeFields from '../components/DurationTimeFields';
import { api } from '../api/client';
import { DAYS, SESSION_TYPE_LABELS, orderRoomsBySuggestion, hoursBetween } from '../api/constraintOptions';

const SESSION_TYPES = Object.keys(SESSION_TYPE_LABELS);

// Two ways to land here:
//   /timetabling-team/requests/:id/add-session
//   /timetabling-team/sessions/add
export default function AddSessionPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const groupLabel = searchParams.get('groupLabel');
  const lecturerIdParam = searchParams.get('lecturerId');
  const sessionTypeParam = searchParams.get('sessionType');
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [modules, setModules] = useState([]);
  const [moduleId, setModuleId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [sessionType, setSessionType] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [durationHours, setDurationHours] = useState(2);
  const [roomId, setRoomId] = useState('');
  const [lecturerId, setLecturerId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const calls = [api.get('/rooms'), api.get('/teachers')];
    if (id) calls.unshift(api.get(`/timetabling-team/requests/${id}`));
    else calls.unshift(api.get('/modules'));

    Promise.all(calls)
      .then(([first, r, t]) => {
        setRooms(r);
        setTeachers(t);

        if (id) {
          const req = first;
          setRequest(req);
          // prefilling from what the lecturer asked for - all of these are optional on the
          // request, so a blank field just means the Timetabling Team needs to decide it
          setDayOfWeek(req.dayOfWeek ?? '');
          setStartTime(req.startTime?.slice(0, 5) ?? '');
          setDurationHours(req.durationHours ?? 2);
          setSessionType(sessionTypeParam ?? '');
          // for a module constraint's group, the intended teacher comes from the group itself
          // (passed via query param, since groups can each name a different person) rather than
          // the request's own requester
          setLecturerId(lecturerIdParam ?? (req.constraintKind == null ? String(req.requesterId ?? '') : ''));

          const suggestedNames = req.constraintKind === 'MODULE' ? (req.allowedRoomNames ?? [])
            : req.specificRoomName ? [req.specificRoomName]
            : [];
          const { defaultId } = orderRoomsBySuggestion(r, suggestedNames);
          if (defaultId) setRoomId(defaultId);
        } else {
          setModules(first);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, lecturerIdParam, sessionTypeParam]);

  const selectedModule = useMemo(
    () => modules.find((m) => String(m.id) === moduleId),
    [modules, moduleId]
  );

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

    const targetModuleId = id ? request.primaryModuleId : (moduleId ? Number(moduleId) : null);
    const targetBlock = id ? request.block : selectedModule?.block;

    if (!targetModuleId || !targetBlock || !sessionType || !dayOfWeek || !startTime || !endTime || !roomId || !lecturerId) {
      setSaveError('All fields are required to create the new session');
      return;
    }
    if (hoursBetween(startTime, endTime) === null) {
      setSaveError('End time must be after start time');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/timetabling-team/sessions', {
        moduleId: targetModuleId,
        roomId: Number(roomId),
        lecturerId: Number(lecturerId),
        sessionType,
        dayOfWeek,
        startTime,
        endTime,
        block: targetBlock,
        relatedRequestId: id ? Number(id) : null,
      });

      const moduleCode = id ? request.primaryModuleCode : selectedModule?.code;
      const message = `New ${SESSION_TYPE_LABELS[sessionType]} added for ${moduleCode}${groupLabel ? ` (${groupLabel})` : ''} — ${dayOfWeek} ${startTime}`;

      if (id) {
        navigate(request.type === 'CHANGE' ? '/timetabling-team/changes-in-queue' : '/timetabling-team/violations', {
          state: { justUpdated: message },
        });
      } else {
        navigate('/timetabling-team/session-management', { state: { justUpdated: message } });
      }
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
          {id
            ? <>Creating a new session for {request.primaryModuleCode} — {request.primaryModuleName}
                {groupLabel ? ` · ${groupLabel}` : ''} · Block {request.block}, requested by {request.requesterName}.</>
            : 'Creating a new session with no request behind it - pick a module to start.'}
        </p>

        <div className="card">
          {id && request.rationale && (
            <p className="card__body" style={{ marginBottom: 14 }}>
              <strong>Rationale:</strong> {request.rationale}
            </p>
          )}

          <form onSubmit={handleSubmit} className="form">
            <div className="form-grid">
              {!id && (
                <label className="field">
                  <span className="field__label">Module</span>
                  <select className="field__input" value={moduleId} onChange={(e) => setModuleId(e.target.value)} required>
                    <option value="">Select…</option>
                    {modules.map((m) => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
                  </select>
                </label>
              )}

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
