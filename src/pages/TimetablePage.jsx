import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import TimetableCalendarGrid from '../components/TimetableCalendarGrid';
import { api } from '../api/client';
import { WEEKS, findCurrentWeekIndex } from '../api/academicCalendar';

export default function TimetablePage() {
  const [weekIndex, setWeekIndex] = useState(findCurrentWeekIndex);

  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [lecturerId, setLecturerId] = useState('');
  const [roomId, setRoomId] = useState('');

  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const week = WEEKS[weekIndex];

  // loading filter dropdown options once - these don't change with the selected week
  useEffect(() => {
    Promise.all([api.get('/courses'), api.get('/teachers'), api.get('/rooms')])
      .then(([c, t, r]) => {
        setCourses(c);
        setTeachers(t);
        setRooms(r);
      })
      .catch((err) => setError(err.message));
  }, []);

  // refetching sessions whenever the selected week's block or any filter changes
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ block: String(week.block), week: String(week.weekInBlock) });
    if (courseId) params.set('courseId', courseId);
    if (lecturerId) params.set('lecturerId', lecturerId);
    if (roomId) params.set('roomId', roomId);

    api.get(`/timetable?${params.toString()}`)
      .then(setSessions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [weekIndex, courseId, lecturerId, roomId]);

  const goPrev = () => setWeekIndex((i) => Math.max(0, i - 1));
  const goNext = () => setWeekIndex((i) => Math.min(WEEKS.length - 1, i + 1));

  return (
    <Layout>
      <div className="page">
        <h1 className="page__title">Timetable</h1>
        <p className="page__subtitle">
          Mock/seeded timetable data — stands in for NTU's live feed during prototype development.
        </p>

        <div className="week-nav">
          <button className="btn btn--ghost" onClick={goPrev} disabled={weekIndex === 0} aria-label="Previous week">
            ←
          </button>

          <div className="week-nav__center">
            <span className="week-nav__range">{week.dateRange}</span>
            <select
              className="field__input week-nav__select"
              value={weekIndex}
              onChange={(e) => setWeekIndex(Number(e.target.value))}
            >
              {WEEKS.map((w, i) => (
                <option key={i} value={i}>{w.label} ({w.dateRange})</option>
              ))}
            </select>
          </div>

          <button className="btn btn--ghost" onClick={goNext} disabled={weekIndex === WEEKS.length - 1} aria-label="Next week">
            →
          </button>
        </div>

        <div className="filters-row">
          <select className="field__input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">All courses</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
          </select>

          <select className="field__input" value={lecturerId} onChange={(e) => setLecturerId(e.target.value)}>
            <option value="">All teachers</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
          </select>

          <select className="field__input" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
            <option value="">All rooms</option>
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.name} — {r.building}</option>)}
          </select>

          {(courseId || lecturerId || roomId) && (
            <button
              className="btn btn--ghost"
              onClick={() => { setCourseId(''); setLecturerId(''); setRoomId(''); }}
            >
              Clear filters
            </button>
          )}
        </div>

        {loading && <p className="status">Loading timetable…</p>}
        {error && <p className="status status--error">{error}</p>}

        {!loading && !error && (
          <div className="calendar__scroll">
            <TimetableCalendarGrid sessions={sessions} />
          </div>
        )}
      </div>
    </Layout>
  );
}
