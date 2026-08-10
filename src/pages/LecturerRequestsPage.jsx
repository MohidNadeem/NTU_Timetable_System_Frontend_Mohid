import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { api } from '../api/client';

export default function LecturerRequestsPage() {
    const [modules, setModules] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const [description, setDescription] = useState('');
    const [isFirm, setIsFirm] = useState('true');
    const [selectedModuleIds, setSelectedModuleIds] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    // loading modules + own requests together so form and table are ready in one pass
    const loadData = () => {
        setLoading(true);
        Promise.all([api.get('/modules'), api.get('/lecturer/requests/constraints')])
            .then(([moduleData, requestData]) => {
                setModules(moduleData);
                setRequests(requestData);
            })
            .catch((err) => setLoadError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(loadData, []);

    const toggleModule = (id) => {
        setSelectedModuleIds((prev) =>
            prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');

        // requiring at least one module since FR9 links a request to modules, not left dangling
        if (selectedModuleIds.length === 0) {
            setSubmitError('Select at least one module');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/lecturer/requests/constraints', {
                description,
                isFirm: isFirm === 'true',
                moduleIds: selectedModuleIds,
            });
            // resetting the form so it's ready for the next submission
            setDescription('');
            setSelectedModuleIds([]);
            setIsFirm('true');
            // reloading so the new request shows up in the table immediately
            loadData();
        } catch (err) {
            setSubmitError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Layout>
            <div className="page">
                <h1 className="page__title">Constraint Requests</h1>
                <p className="page__subtitle">
                    Submit scheduling constraint preferences ahead of the annual timetable being created.
                </p>

                <div className="card">
                    <h2 className="card__title">New constraint request</h2>
                    <form onSubmit={handleSubmit} className="form">
                        <label className="field">
                            <span className="field__label">Description</span>
                            <textarea
                                className="field__input field__input--textarea"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="e.g. Cannot teach before 10am on Mondays"
                                required
                            />
                        </label>

                        <fieldset className="field">
                            <legend className="field__label">Is this a firm requirement or a flexible preference?</legend>
                            <label className="radio">
                                <input
                                    type="radio"
                                    name="isFirm"
                                    value="true"
                                    checked={isFirm === 'true'}
                                    onChange={(e) => setIsFirm(e.target.value)}
                                />
                                Firm requirement
                            </label>
                            <label className="radio">
                                <input
                                    type="radio"
                                    name="isFirm"
                                    value="false"
                                    checked={isFirm === 'false'}
                                    onChange={(e) => setIsFirm(e.target.value)}
                                />
                                Flexible preference
                            </label>
                        </fieldset>

                        <fieldset className="field">
                            <legend className="field__label">Modules this applies to</legend>
                            {modules.map((m) => (
                                <label key={m.id} className="checkbox">
                                    <input
                                        type="checkbox"
                                        checked={selectedModuleIds.includes(m.id)}
                                        onChange={() => toggleModule(m.id)}
                                    />
                                    {m.code} — {m.name}
                                </label>
                            ))}
                            {modules.length === 0 && !loading && (
                                <p className="field__hint">No modules available.</p>
                            )}
                        </fieldset>

                        {submitError && <p className="field__error">{submitError}</p>}

                        <button className="btn btn--primary" type="submit" disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Submit request'}
                        </button>
                    </form>
                </div>

                <div className="card">
                    <h2 className="card__title">My submitted requests</h2>

                    {loading && <p className="status">Loading…</p>}
                    {loadError && <p className="status status--error">{loadError}</p>}

                    {!loading && !loadError && requests.length === 0 && (
                        <p className="card__body">No constraint requests submitted yet.</p>
                    )}

                    {!loading && requests.length > 0 && (
                        <table className="table">
                            <thead>
                                <tr>
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