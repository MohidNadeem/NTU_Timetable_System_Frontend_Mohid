import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import UpdateSessionPickerTab from '../components/UpdateSessionPickerTab';
import AcademicYearTab from '../components/AcademicYearTab';

// One place for everything that doesn't need a request behind it
// updating or adding a session directly, and the academic year setting 
export default function SessionManagementPage() {
  const [tab, setTab] = useState('update'); // 'update' | 'add' | 'year'
  const location = useLocation();
  const navigate = useNavigate();
  const justUpdated = location.state?.justUpdated;

  return (
    <Layout>
      <div className="page">
        <h1 className="page__title">Session Management</h1>
        <p className="page__subtitle">
          Update or add sessions directly, without needing a lecturer's request behind it - and manage the academic year.
        </p>

        {justUpdated && (
          <div className="card" style={{ borderColor: 'var(--success)' }}>
            <p className="status status--ok">✓ {justUpdated}</p>
          </div>
        )}

        <div className="tabs">
          <button type="button" className={`tabs__tab${tab === 'update' ? ' is-active' : ''}`} onClick={() => setTab('update')}>
            Update Session
          </button>
          <button type="button" className={`tabs__tab${tab === 'add' ? ' is-active' : ''}`} onClick={() => setTab('add')}>
            Add Session
          </button>
          <button type="button" className={`tabs__tab${tab === 'year' ? ' is-active' : ''}`} onClick={() => setTab('year')}>
            Academic Year
          </button>
        </div>

        {tab === 'update' && <UpdateSessionPickerTab />}

        {tab === 'add' && (
          <div className="card">
            <h2 className="card__title">Add Session</h2>
            <p className="card__body" style={{ marginBottom: 14 }}>
              Create a brand new session that isn't tied to any lecturer's request - pick a module, then fill in the details.
            </p>
            <button className="btn btn--primary" onClick={() => navigate('/timetabling-team/sessions/add')}>
              Start
            </button>
          </div>
        )}

        {tab === 'year' && <AcademicYearTab />}
      </div>
    </Layout>
  );
}
