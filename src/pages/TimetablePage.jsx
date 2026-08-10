import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { api } from '../api/client';

const DAY_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
const DAY_LABELS = { MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday' };

// trimming to HH:mm since backend sends full "HH:mm:ss" and seconds aren't useful here
function formatTime(t) {
    return t?.slice(0, 5) ?? '';
}

export default function TimetablePage() {
    const [sessions, setSessions] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/timetable')
            .then(setSessions)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    // grouping + sorting sessions per weekday so the grid can render Mon-Fri columns directly
    const grouped = DAY_ORDER.map((day) => ({
        day,
        label: DAY_LABELS[day],
        sessions: sessions
            .filter((s) => s.dayOfWeek === day)
            .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }));

    return (
        <Layout>
            <div className="page">
                <h1 className="page__title">Timetable</h1>
                <p className="page__subtitle">
                    Mock/seeded timetable data — for prototype development
                </p>

                {loading && <p className="status">Loading timetable…</p>}
                {error && <p className="status status--error">{error}</p>}

                {!loading && !error && (
                    <div className="timetable-grid">
                        {grouped.map(({ day, label, sessions: daySessions }) => (
                            <div key={day} className="timetable-column">
                                <h2 className="timetable-column__day">{label}</h2>
                                {daySessions.length === 0 && (
                                    <p className="timetable-column__empty">No sessions</p>
                                )}
                                {daySessions.map((s) => (
                                    <div key={s.id} className="session-card">
                                        <span className="session-card__time">
                                            {formatTime(s.startTime)}–{formatTime(s.endTime)}
                                        </span>
                                        <span className="session-card__module">{s.moduleCode}</span>
                                        <span className="session-card__name">{s.moduleName}</span>
                                        <span className="session-card__meta">{s.sessionType} · {s.roomName}</span>
                                        <span className="session-card__meta">{s.lecturerName}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}