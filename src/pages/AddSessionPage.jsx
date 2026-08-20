import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import DurationTimeFields from '../components/DurationTimeFields';
import WeekPicker from '../components/WeekPicker';
import { api } from '../api/client';
import { DAYS, SESSION_TYPE_LABELS, LEARNING_ACTIVITY_TO_SESSION_TYPE, orderRoomsBySuggestion, hoursBetween } from '../api/constraintOptions';

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
  const [sessionLabel, setSessionLabel] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [durationHours, setDurationHours] = useState(2);
  const [roomId, setRoomId] = useState('');
  const [lecturerId, setLecturerId] = useState('');
  const [weekMode, setWeekMode] = useState('ALL_REMAINING');
  const [weeks, setWeeks] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState('');

  const isMerge = request?.changeCategory === 'MERGE_SESSIONS_GROUPS';

  useEffect(() => {
    const calls = [api.get('/rooms'), api.get('/teachers'), api.get('/modules')];
    if (id) calls.unshift(api.get(`/timetabling-team/requests/${id}`));

    Promise.all(calls)
      .then((results) => {
        const req = id ? results[0] : null;
        const [r, t, allModules] = id ? results.slice(1) : results;
        setRooms(r);
        setTeachers(t);
        setModules(allModules);

        if (req) {
          setRequest(req);
          // prefilling from what the lecturer asked for - all of these are optional on the
          // request, so a blank field just means the Timetabling Team needs to decide it
          setDayOfWeek(req.dayOfWeek ?? '');
          setStartTime(req.startTime?.slice(0, 5) ?? '');
          // Change requests carry an explicit endTime; module constraint groups carry durationHours
          // instead - deriving from whichever is actually present rather than always defaulting to 2h
          const derivedDuration = req.startTime && req.endTime
            ? hoursBetween(req.startTime.slice(0, 5), req.endTime.slice(0, 5))
            : null;
          setDurationHours(derivedDuration ?? req.durationHours ?? 2);
          // prefilling the session type from the requested delivery type
          setSessionType(sessionTypeParam ?? LEARNING_ACTIVITY_TO_SESSION_TYPE[req.learningActivity] ?? '');
          // for a module constraint's group, the intended teacher comes from the group itself
          // (passed via query param, since groups can each name a different person) rather than
          // the request's own requester
          setLecturerId(lecturerIdParam ?? (req.constraintKind == null ? String(req.requesterId ?? '') : ''));
          // prefilling week scope from the request - shown and editable below, not hidden
          setWeekMode(req.weekMode ?? 'ALL_REMAINING');
          setWeeks(req.weeks ?? []);
          setModuleId(String(req.primaryModuleId ?? ''));

          const suggestedNames = req.constraintKind === 'MODULE' ? (req.allowedRoomNames ?? [])
            : req.specificRoomName ? [req.specificRoomName]
            : [];
          const { defaultId } = orderRoomsBySuggestion(r, suggestedNames);
          if (defaultId) setRoomId(defaultId);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, lecturerIdParam, sessionTypeParam]);

  const selectedModule = useMemo(
    () => modules.find((m) => String(m.id) === moduleId),
    [modules, moduleId]
  );

  const block = id ? request?.block : selectedModule?.block;

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

    const targetModuleId = moduleId ? Number(moduleId) : null;
    const targetBlock = block;

    if (!targetModuleId || !targetBlock || !sessionType || !dayOfWeek || !startTime || !endTime || !roomId || !lecturerId) {
      setSaveError('All fields are required to create the new session');
      return;
    }
    if (hoursBetween(startTime, endTime) === null) {
      setSaveError('End time must be after start time');
      return;
    }
    if (weekMode !== 'ALL_REMAINING' && weeks.length === 0) {
      setSaveError('Select at least one week');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/timetabling-team/sessions', {
        moduleId: targetModuleId,
        roomId: Number(roomId),
        lecturerId: Number(lecturerId),
        sessionType,
        sessionLabel: sessionLabel || null,
        dayOfWeek,
        startTime,
        endTime,
        block: targetBlock,
        relatedRequestId: id ? Number(id) : null,
        restrictToWeeks: weekMode === 'ALL_REMAINING' ? null : weeks,
      });

      const moduleCode = selectedModule?.code ?? request?.primaryModuleCode;
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
              {(!id || isMerge) && (
                <label className="field">
                  <span className="field__label">
                    Module{isMerge && <span className="field__hint"> (confirm which module this merged session belongs to)</span>}
                  </span>
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
                <span className="field__label">
                  Session name / code{isMerge ? '' : ' (optional)'}
                  {isMerge && <span className="field__hint"> — a distinguishing name for the merged session</span>}
                </span>
                <input
                  className="field__input"
                  type="text"
                  value={sessionLabel}
                  onChange={(e) => setSessionLabel(e.target.value)}
                  placeholder={isMerge ? 'e.g. Merged Group AB' : 'e.g. Guest Lecture'}
                  required={isMerge}
                />
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

            {block && (
              <>
                <label className="field">
                  <span className="field__label">Should the new session run every week, or just specific week(s)?</span>
                  <select
                    className="field__input"
                    value={weekMode}
                    onChange={(e) => setWeekMode(e.target.value)}
                  >
                    <option value="SINGLE">Just one week</option>
                    <option value="MULTIPLE">Specific weeks</option>
                    <option value="ALL_REMAINING">Every week</option>
                  </select>
                </label>

                {weekMode !== 'ALL_REMAINING' && (
                  <WeekPicker
                    block={block}
                    weekMode={weekMode}
                    weeks={weeks}
                    onWeekModeChange={setWeekMode}
                    onWeeksChange={setWeeks}
                  />
                )}
              </>
            )}

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
