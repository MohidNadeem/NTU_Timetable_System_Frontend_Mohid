import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ModuleConstraintForm from '../components/ModuleConstraintForm';
import PersonalConstraintForm from '../components/PersonalConstraintForm';

// submission-only page now - the list of past requests lives on its own page
// (/lecturer/requests/history) rather than stacked below the form, since that
// wasn't a great flow: submit, then scroll past your own form to see the list.
export default function LecturerRequestsPage() {
  const [tab, setTab] = useState('module'); // 'module' | 'personal'
  const navigate = useNavigate();

  // sending them to the history page right after a successful submit, so they
  // immediately see the new request rather than sitting on an empty form
  const handleSubmitted = () => navigate('/lecturer/requests/history');

  return (
    <Layout>
      <div className="page">
        <h1 className="page__title">Submit a Constraint Request</h1>
        <p className="page__subtitle">
          Submit scheduling constraint preferences ahead of the annual timetable being created.
        </p>

        <div className="card">
          <div className="tabs">
            <button
              type="button"
              className={`tabs__tab${tab === 'module' ? ' is-active' : ''}`}
              onClick={() => setTab('module')}
            >
              Module-based
            </button>
            <button
              type="button"
              className={`tabs__tab${tab === 'personal' ? ' is-active' : ''}`}
              onClick={() => setTab('personal')}
            >
              Personal
            </button>
          </div>

          {tab === 'module'
            ? <ModuleConstraintForm onSubmitted={handleSubmitted} />
            : <PersonalConstraintForm onSubmitted={handleSubmitted} />}
        </div>
      </div>
    </Layout>
  );
}