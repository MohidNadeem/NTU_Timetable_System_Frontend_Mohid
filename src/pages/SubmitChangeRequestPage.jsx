import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ChangeRequestForm from '../components/ChangeRequestForm';

export default function SubmitChangeRequestPage() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="page">
        <h1 className="page__title">Submit a Change Request</h1>
        <p className="page__subtitle">
          Request a change to one of your currently scheduled sessions.
        </p>

        <div className="card">
          <ChangeRequestForm onSubmitted={() => navigate('/lecturer/requests/changes/history')} />
        </div>
      </div>
    </Layout>
  );
}
