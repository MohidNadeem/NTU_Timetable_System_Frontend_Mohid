import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api/client';
import {
  STATUS_LABELS, ALL_STATUSES, STATUSES_REQUIRING_REASON, ROOM_TYPES, ROOM_LAYOUTS, ROOM_FEATURES,
} from '../api/constraintOptions';

function findLabel(options, value) {
  return options.find((o) => o.value === value)?.label ?? value;
}

export default function RequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [status, setStatus] = useState('');
  const [reasonComment, setReasonComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const load = () => {
    setLoading(true);
    api.get(`/timetabling-team/requests/constraints/${id}`)
      .then((r) => {
        setRequest(r);
        setStatus(r.status);
        setReasonComment(r.reasonComment || '');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError('');

    if (STATUSES_REQUIRING_REASON.includes(status) && !reasonComment.trim()) {
      setSaveError(`A reason is required when setting status to ${STATUS_LABELS[status]}`);
      return;
    }

    setSaving(true);
    try {
      await api.put(`/timetabling-team/requests/constraints/${id}/status`, {
        status,
        reasonComment: reasonComment || null,
      });
      navigate('/timetabling-team/requests');
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout><p className="status">Loading…</p></Layout>;
  if (error) return <Layout><p className="status status--error">{error}</p></Layout>;

  const r = request;
  const isModule = r.constraintKind === 'MODULE';

  return (
    <Layout>
      <div className="page">
        <div className="card__header-row">
          <div>
            <h1 className="page__title">Request #{r.id}</h1>
            <p className="page__subtitle">
              {isModule ? 'Module-based' : 'Personal'} constraint from {r.requesterName}
            </p>
          </div>
          <button className="btn btn--ghost" onClick={() => navigate(-1)}>← Back</button>
        </div>

        <div className="card">
          <h2 className="card__title">Details</h2>

          <dl className="detail-grid">
            <div><dt>Department</dt><dd>{r.departmentCode} — {r.departmentName}</dd></div>
            <div><dt>Campus</dt><dd>{r.campus}</dd></div>

            {isModule ? (
              <>
                <div><dt>Primary Module</dt><dd>{r.primaryModuleCode} — {r.primaryModuleName}</dd></div>
                {r.linkedModuleCode && <div><dt>Linked Module</dt><dd>{r.linkedModuleCode}</dd></div>}
                {r.additionalLinkedModules && <div><dt>Additional Linked Modules</dt><dd>{r.additionalLinkedModules}</dd></div>}
                <div><dt>Block</dt><dd>{r.block}</dd></div>
                <div><dt>Week(s)</dt><dd>
                  {r.weekMode === 'ALL_REMAINING' ? 'All weeks ahead in this block' : (r.weeks || []).sort((a, b) => a - b).map((w) => `Week ${w}`).join(', ')}
                </dd></div>
                <div><dt>Day</dt><dd>{r.dayOfWeek}</dd></div>
                <div><dt>Time</dt><dd>{r.startTime?.slice(0, 5)} ({r.durationHours}h)</dd></div>
                <div><dt>Learning Activity</dt><dd>{r.learningActivity}</dd></div>
                {r.personalTutorDetail && <div><dt>Personal Tutor Detail</dt><dd>{r.personalTutorDetail}</dd></div>}
                {r.titleTechnical && <div><dt>Title/Technical</dt><dd>{r.titleTechnical}</dd></div>}
                {r.activityDetail && <div><dt>Activity Detail</dt><dd>{r.activityDetail}</dd></div>}
                <div><dt>Room Type</dt><dd>{findLabel(ROOM_TYPES, r.roomType)}</dd></div>
                <div><dt>Preferred Room Layout</dt><dd>{findLabel(ROOM_LAYOUTS, r.preferredRoomLayout)}</dd></div>
                {r.specificRoomName && <div><dt>Specific Room</dt><dd>{r.specificRoomName}</dd></div>}
                <div><dt>Feature</dt><dd>{findLabel(ROOM_FEATURES, r.feature)}</dd></div>
                {r.software && <div><dt>Software</dt><dd>{r.software}</dd></div>}
                {r.supportTeamStaff && <div><dt>Support Team/Staff</dt><dd>{r.supportTeamStaff}</dd></div>}
                <div><dt>Lecture Capture</dt><dd>{r.lectureCapture ? 'Yes' : 'No'}</dd></div>
                {r.note && <div><dt>Note</dt><dd>{r.note}</dd></div>}
              </>
            ) : (
              <>
                <div><dt>Explain your constraint</dt><dd>{r.description}</dd></div>
                <div><dt>Reason</dt><dd>{r.reason}</dd></div>
                {r.unavailableDays?.length > 0 && <div><dt>Day(s) unavailable</dt><dd>{r.unavailableDays.join(', ')}</dd></div>}
                {(r.unavailableFromDate || r.unavailableToDate) && (
                  <div><dt>Date range</dt><dd>{r.unavailableFromDate ?? '…'} → {r.unavailableToDate ?? '…'}</dd></div>
                )}
                {(r.unavailableFromTime || r.unavailableToTime) && (
                  <div><dt>Time range</dt><dd>{r.unavailableFromTime?.slice(0, 5) ?? '…'} → {r.unavailableToTime?.slice(0, 5) ?? '…'}</dd></div>
                )}
              </>
            )}

            <div><dt>Submitted</dt><dd>{new Date(r.createdAt).toLocaleString()}</dd></div>
          </dl>
        </div>

        <div className="card">
          <h2 className="card__title">Decision</h2>

          <form onSubmit={handleSave} className="form">
            <label className="field">
              <span className="field__label">Status</span>
              <select className="field__input" value={status} onChange={(e) => setStatus(e.target.value)}>
                {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </label>

            <label className="field">
              <span className="field__label">
                Reason {STATUSES_REQUIRING_REASON.includes(status) && '(required for this status)'}
              </span>
              <textarea
                className="field__input field__input--textarea"
                value={reasonComment}
                onChange={(e) => setReasonComment(e.target.value)}
                placeholder="Visible to the lecturer once saved"
              />
            </label>

            {saveError && <p className="field__error">{saveError}</p>}

            <button className="btn btn--primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save decision'}
            </button>
          </form>
        </div>

        {isModule && r.status === 'ACCEPTED' && (
          <p className="card__body">
            Accepted module-based requests are checked automatically —{' '}
            <Link to="/timetabling-team/violations">see the Violations page</Link> if the timetable doesn't match yet.
          </p>
        )}
      </div>
    </Layout>
  );
}
