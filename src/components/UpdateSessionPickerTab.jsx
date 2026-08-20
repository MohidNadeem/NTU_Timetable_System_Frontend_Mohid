import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { SESSION_TYPE_LABELS } from '../api/constraintOptions';

function fmtTime(t) {
  return t ? t.slice(0, 5) : '—';
}

// Lets TT updating any existing session, without needing a request behind it
// e.g. one accepted change already applied, and now a second, unrelated change is needed too.
export default function UpdateSessionPickerTab() {
  const [modules, setModules] = useState([]);
  const [moduleId, setModuleId] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/modules')
      .then(setModules)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleModuleChange = (e) => {
    const id = e.target.value;
    setModuleId(id);
    setSessions([]);
    if (!id) return;

    const selected = modules.find((m) => String(m.id) === id);
    if (!selected?.block) return;

    setLoadingSessions(true);
    api.get(`/timetable?block=${selected.block}`)
      .then((all) => setSessions(all.filter((s) => s.moduleCode === selected.code)))
      .catch((err) => setError(err.message))
      .finally(() => setLoadingSessions(false));
  };

  if (loading) return <p className="status">Loading…</p>;

  return (
    <div className="card">
      <h2 className="card__title">Update Session</h2>
      <p className="card__body" style={{ marginBottom: 14 }}>
        Pick a module to see its scheduled sessions, then update any of them directly.
      </p>

      <label className="field">
        <span className="field__label">Module</span>
        <select className="field__input" value={moduleId} onChange={handleModuleChange}>
          <option value="">Select…</option>
          {modules.map((m) => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
        </select>
      </label>

      {error && <p className="status status--error" style={{ marginTop: 12 }}>{error}</p>}
      {loadingSessions && <p className="status" style={{ marginTop: 12 }}>Loading sessions…</p>}

      {!loadingSessions && moduleId && sessions.length === 0 && (
        <p className="card__body" style={{ marginTop: 12 }}>No sessions found for this module.</p>
      )}

      {!loadingSessions && sessions.length > 0 && (
        <table className="table" style={{ marginTop: 14 }}>
          <thead>
            <tr>
              <th>Type</th>
              <th>Day</th>
              <th>Time</th>
              <th>Room</th>
              <th>Teacher</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td>{SESSION_TYPE_LABELS[s.sessionType] ?? s.sessionType}</td>
                <td>{s.dayOfWeek}</td>
                <td>{fmtTime(s.startTime)}–{fmtTime(s.endTime)}</td>
                <td>{s.roomName}</td>
                <td>{s.lecturerName}</td>
                <td>
                  <button
                    className="btn btn--primary"
                    onClick={() => navigate(`/timetabling-team/sessions/${s.id}/update`)}
                  >
                    Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
