import { Fragment, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { api } from '../api/client';

export default function AdminEmailLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    api.get('/admin/email-log').then(setLogs).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><p className="status">Loading…</p></Layout>;
  if (error) return <Layout><p className="status status--error">{error}</p></Layout>;

  return (
    <Layout>
      <div className="page">
        <h1 className="page__title">Email Log</h1>
        <p className="page__subtitle">
          Every email the system has attempted to send, whether it actually went out or not.
          Click a row to see the full message.
        </p>

        {logs.length === 0 && (
          <div className="card"><p className="card__body">No emails sent yet.</p></div>
        )}

        {logs.length > 0 && (
          <div className="card">
            <table className="table table--clickable">
              <thead>
                <tr><th>To</th><th>Subject</th><th>Course</th><th>Status</th><th>When</th></tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <Fragment key={l.id}>
                    <tr onClick={() => setExpandedId(expandedId === l.id ? null : l.id)}>
                      <td>{l.recipientEmail}</td>
                      <td>{l.subject}</td>
                      <td>{l.relatedCourseCode ?? '—'}</td>
                      <td>
                        <span className={`badge badge--${l.status === 'SENT' ? 'accepted' : 'rejected'}`}>
                          {l.status}
                        </span>
                      </td>
                      <td>{new Date(l.sentAt).toLocaleString()}</td>
                    </tr>
                    {expandedId === l.id && (
                      <tr>
                        <td colSpan={5} style={{ background: 'var(--bg)' }}>
                          {l.status === 'FAILED' && l.errorMessage && (
                            <p className="field__error" style={{ marginBottom: 8 }}>
                              Not delivered: {l.errorMessage}
                            </p>
                          )}
                          <div
                            style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}
                            dangerouslySetInnerHTML={{ __html: l.body }}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
