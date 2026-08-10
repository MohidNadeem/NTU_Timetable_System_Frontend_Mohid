import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import useDashboardPing from '../api/useDashboardPing';

export default function TimetablingTeamDashboard() {
    const { user } = useAuth();
    // pinging the role-gated backend route so we can confirm login/JWT/role pipeline works end to end
    const { message, error } = useDashboardPing('/timetabling-team/dashboard');

    return (
        <Layout>
            <div className="page">
                <h1 className="page__title">Welcome, {user.fullName}</h1>
                <p className="page__subtitle">Timetabling Team dashboard</p>

                <div className="card">
                    <h2 className="card__title">Title</h2>
                    {message && <p className="status status--ok">{message}</p>}
                    {error && <p className="status status--error">{error}</p>}
                </div>
            </div>
        </Layout>
    );
}