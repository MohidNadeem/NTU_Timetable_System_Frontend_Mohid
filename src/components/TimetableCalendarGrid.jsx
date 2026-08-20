import { useMemo } from 'react';
import { SESSION_TYPE_LABELS } from '../api/constraintOptions';

const DAY_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
const DAY_LABELS = { MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday' };

const CAL_START_HOUR = 8;
const CAL_END_HOUR = 19; // exclusive (last row label shown is 18:00, but grid needs to be extended to 19:00)
const ROW_HEIGHT = 100; // px per hour - sized to fit wrapped multi-line title

const HOURS = Array.from({ length: CAL_END_HOUR - CAL_START_HOUR }, (_, i) => CAL_START_HOUR + i);

function toMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function topPx(timeStr) {
  return ((toMinutes(timeStr) - CAL_START_HOUR * 60) / 60) * ROW_HEIGHT;
}

function heightPx(startTime, endTime) {
  return Math.max(((toMinutes(endTime) - toMinutes(startTime)) / 60) * ROW_HEIGHT, ROW_HEIGHT * 0.4);
}

function packOverlaps(sessions) {
  const sorted = [...sessions].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const columns = []; // columns[i] = list of sessions already placed in column i, for overlap checks
  const placement = new Map(); // sessionId -> column index

  for (const s of sorted) {
    let col = columns.findIndex((colSessions) =>
      colSessions.every((other) => toMinutes(s.startTime) >= toMinutes(other.endTime) || toMinutes(s.endTime) <= toMinutes(other.startTime))
    );
    if (col === -1) {
      col = columns.length;
      columns.push([]);
    }
    columns[col].push(s);
    placement.set(s.id, col);
  }

  const totalColumns = columns.length || 1;
  return sorted.map((s) => ({ session: s, column: placement.get(s.id), totalColumns }));
}

function fmtTime(t) {
  return t ? t.slice(0, 5) : '';
}

export default function TimetableCalendarGrid({ sessions }) {
  const byDay = useMemo(() => {
    const grouped = {};
    for (const day of DAY_ORDER) {
      grouped[day] = packOverlaps(sessions.filter((s) => s.dayOfWeek === day));
    }
    return grouped;
  }, [sessions]);

  return (
    <div className="calendar">
      <div className="calendar__header">
        <div className="calendar__gutter-header" />
        {DAY_ORDER.map((day) => (
          <div key={day} className="calendar__day-header">{DAY_LABELS[day]}</div>
        ))}
      </div>

      <div className="calendar__body" style={{ height: HOURS.length * ROW_HEIGHT }}>
        <div className="calendar__gutter">
          {HOURS.map((h) => (
            <div key={h} className="calendar__hour-label" style={{ height: ROW_HEIGHT }}>
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {DAY_ORDER.map((day) => (
          <div key={day} className="calendar__day-col">
            {HOURS.map((h, i) => (
              <div key={h} className="calendar__hour-line" style={{ top: i * ROW_HEIGHT }} />
            ))}

            {byDay[day].length === 0 && (
              <p className="calendar__empty">No sessions</p>
            )}

            {byDay[day].map(({ session: s, column, totalColumns }) => (
              <div
                key={s.id}
                className={`calendar__event${s.isOverridden ? ' calendar__event--overridden' : ''}${s.isCancelled ? ' calendar__event--cancelled' : ''}`}
                style={{
                  top: topPx(s.startTime),
                  height: heightPx(s.startTime, s.endTime),
                  left: `${(column / totalColumns) * 100}%`,
                  width: `${100 / totalColumns}%`,
                }}
                title={`${s.moduleCode} — ${s.moduleName}\n${fmtTime(s.startTime)}–${fmtTime(s.endTime)}\n${s.roomName}\n${s.lecturerName}${s.isCancelled ? '\nCANCELLED' : ''}`}
              >
                <span className="calendar__event-time">
                  {fmtTime(s.startTime)}–{fmtTime(s.endTime)}
                  {s.isCancelled && <span className="calendar__event-badge calendar__event-badge--cancelled">Cancelled</span>}
                  {!s.isCancelled && s.isOverridden && <span className="calendar__event-badge">Moved</span>}
                </span>
                <span className="calendar__event-title">
                  {s.sessionLabel ? s.sessionLabel : `${s.moduleCode} — ${s.moduleName}`}
                </span>
                {s.sessionLabel && <span className="calendar__event-meta">{s.moduleCode} — {s.moduleName}</span>}
                <span className="calendar__event-meta">{SESSION_TYPE_LABELS[s.sessionType] ?? s.sessionType} · {s.roomName}</span>
                {heightPx(s.startTime, s.endTime) > ROW_HEIGHT * 0.9 && (
                  <span className="calendar__event-meta">{s.lecturerName}</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
