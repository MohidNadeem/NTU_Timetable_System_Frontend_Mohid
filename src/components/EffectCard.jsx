import { useNavigate } from 'react-router-dom';
import { SESSION_TYPE_LABELS, changeCategoryLabel } from '../api/constraintOptions';

function fmtTime(t) {
  return t ? t.slice(0, 5) : '—';
}

function fmtDay(d) {
  return d ? d.charAt(0) + d.slice(1).toLowerCase() : '—';
}

// Renders one EffectResultDto - used by Violations, Changes in Queue, and View Effect
export default function EffectCard({ effect }) {
  const navigate = useNavigate();

  const isChange = effect.requestType === 'CHANGE';
  const isPersonal = effect.constraintKind === 'PERSONAL';
  const category = effect.changeCategory;
  const title = isPersonal
    ? `Personal constraint — ${effect.requesterName}`
    : `${effect.primaryModuleCode} — ${effect.primaryModuleName}`;

  const subtitle = [
    effect.requesterName,
    effect.departmentCode,
    isChange && changeCategoryLabel(category),
    effect.block && `Block ${effect.block}`,
  ].filter(Boolean).join(' · ');

  const goUpdate = (item) => {
    navigate(`/timetabling-team/sessions/${item.sessionId}/update?requestId=${effect.requestId}`);
  };

  const goAddSession = (item) => {
    const params = new URLSearchParams();
    if (item.groupLabel) params.set('groupLabel', item.groupLabel);
    if (item.preferredLecturerId) params.set('lecturerId', item.preferredLecturerId);
    if (item.sessionType) params.set('sessionType', item.sessionType);
    const qs = params.toString();
    navigate(`/timetabling-team/requests/${effect.requestId}/add-session${qs ? `?${qs}` : ''}`);
  };

  const goCancelSession = (item) => {
    navigate(`/timetabling-team/sessions/${item.sessionId}/cancel?requestId=${effect.requestId}`);
  };

  const secondColLabel = (item) => {
    if (item.actionType === 'ADD_SESSION') return 'Proposed new session';
    if (category === 'CLASHES') return 'Currently clashes with';
    if (category === 'STAFF_CHANGE') return 'Requested';
    if (isPersonal) return 'Unavailable window';
    return 'Requested';
  };

  return (
    <div className="card">
      <div className="card__header-row">
        <div>
          <h2 className="card__title">{title}</h2>
          <p className="page__subtitle">{subtitle}</p>
        </div>
        {effect.satisfied && <span className="badge badge--accepted">Satisfied</span>}
      </div>

      {effect.items.length === 0 && effect.satisfied && (
        <p className="card__body status--ok">Schedule already matches this request.</p>
      )}

      {effect.items.map((item, i) => (
        <div key={i} style={{ marginTop: i > 0 ? 14 : 0 }}>
          {item.groupLabel && (
            <div className="violation-compare__group-label">
              {item.groupLabel}{item.preferredLecturerName ? ` — ${item.preferredLecturerName}` : ''}
            </div>
          )}

          <div className="violation-compare">
          {item.sessionId ? (
            <div className="violation-compare__col">
              <span className="violation-compare__label">
                Currently scheduled {item.sessionType ? `(${SESSION_TYPE_LABELS[item.sessionType] ?? item.sessionType})` : ''}
              </span>
              <span>{fmtDay(item.currentDayOfWeek)} {fmtTime(item.currentStartTime)}–{fmtTime(item.currentEndTime)}</span>
              <span className="card__body">{item.currentRoomName ?? '—'}</span>
              {item.moduleCode && <span className="card__body">{item.moduleCode} — {item.moduleName}</span>}
            </div>
          ) : (
            <div className="violation-compare__col">
              <span className="violation-compare__label">Currently scheduled</span>
              <span className="card__body">
                {item.actionType === 'MANUAL_REVIEW'
                  ? 'Multiple sessions exist and none can be told apart automatically — review manually.'
                  : 'No matching session found for this module.'}
              </span>
            </div>
          )}

          {item.actionType === 'CANCEL_SESSION' ? (
            <div className="violation-compare__col">
              <span className="violation-compare__label">
                {category === 'MERGE_SESSIONS_GROUPS' ? 'Needs cancelling (merge step 1)' : 'Needs cancelling'}
              </span>
              {item.unmatchedWeeks?.length > 0 ? (
                <span className="card__body">Still scheduled for: {item.unmatchedWeeks.map((w) => `Week ${w}`).join(', ')}</span>
              ) : (
                <span className="card__body">This session should be cancelled.</span>
              )}
            </div>
          ) : (
            <div className="violation-compare__col">
              <span className="violation-compare__label">{secondColLabel(item)}</span>
              <span>
                {fmtDay(item.requestedDayOfWeek)} {fmtTime(item.requestedStartTime)}
                {item.requestedEndTime ? `–${fmtTime(item.requestedEndTime)}` : ''}
              </span>
              <span className="card__body">{item.requestedRoomName ?? 'No specific room'}</span>
              {item.unmatchedWeeks?.length > 0 && (
                <span className="card__body">Still pending for: {item.unmatchedWeeks.map((w) => `Week ${w}`).join(', ')}</span>
              )}
            </div>
          )}

          {item.actionType === 'UPDATE_SESSION' && item.sessionId && (
            <button className="btn btn--primary" onClick={() => goUpdate(item)} style={{ alignSelf: 'center' }}>
              Update
            </button>
          )}
          {item.actionType === 'ADD_SESSION' && (
            <button className="btn btn--primary" onClick={() => goAddSession(item)} style={{ alignSelf: 'center' }}>
              Add Session
            </button>
          )}
          {item.actionType === 'CANCEL_SESSION' && item.sessionId && (
            <button className="btn btn--danger" onClick={() => goCancelSession(item)} style={{ alignSelf: 'center' }}>
              Cancel Session
            </button>
          )}
          {item.actionType === 'MANUAL_REVIEW' && (
            <span className="badge badge--rejected" style={{ alignSelf: 'center' }}>Manual review</span>
          )}
          </div>
        </div>
      ))}
    </div>
  );
}
