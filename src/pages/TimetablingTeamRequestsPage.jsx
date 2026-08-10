import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { api } from '../api/client';

export default function TimetablingTeamRequestsPage() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // fetching every constraint request (not filtered by requester) since this is the team-wide view
    useEffect(() => {
        api.get('/timetabling-team/requests/constraints')
            .then(setRequests)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    return (
        <Layout>
            <div className="page">
                <h1 className="page__title">Constraint Requests</h1>
                <p className="page__subtitle">All constraint preferences submitted by lecturers so far.</p>

                <div className="card">
                    {loading && <p className="status">Loading…</p>}
                    {error && <p className="status status--error">{error}</p>}

                    {!loading && !error && requests.length === 0 && (
                        <p className="card__body">No constraint requests submitted yet.</p>
                    )}

                    {!loading && requests.length > 0 && (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Lecturer</th>
                                    <th>Description</th>
                                    <th>Type</th>
                                    <th>Modules</th>
                                    <th>Status</th>
                                    <th>Submitted</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((r) => (
                                    <tr key={r.id}>
                                        <td>{r.requesterName}</td>
                                        <td>{r.description}</td>
                                        <td>{r.isFirm ? 'Firm' : 'Flexible'}</td>
                                        <td>{r.moduleCodes.join(', ')}</td>
                                        <td><span className={`badge badge--${r.status.toLowerCase()}`}>{r.status}</span></td>
                                        <td>{new Date(r.createdAt).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </Layout>
    );
}