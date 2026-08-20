import { useEffect, useRef, useState } from 'react';
import { FLEXIBLE_DURATIONS, TIME_SLOTS, addHours, hoursBetween } from '../api/constraintOptions';

/**
 * Duration + Start Time + End Time, kept in sync both ways:
 * - normally (auto mode), End Time = Start Time + Duration
 * - if "Set end time manually" is ticked, editing End Time directly instead recomputes Duration
 *   to match (e.g. 12:00 -> 12:30 sets Duration to "30 mins"; 12:00 -> 13:30 sets it to "1.5 hours")
 * - if Start Time changes while in manual mode, End Time is treated as the fixed value and Duration recomputes around it
 */
export default function DurationTimeFields({
  durationHours, startTime, endTime, onChange,
  startTimeOptions, durationRequired = true, startTimeRequired = true,
}) {
  const [manualEnd, setManualEnd] = useState(false);
  // tracks whether the last change came from the End Time field itself
  const lastEditedEnd = useRef(false);

  useEffect(() => {
    if (manualEnd || !startTime || lastEditedEnd.current) {
      lastEditedEnd.current = false;
      return;
    }
    const computed = addHours(startTime, durationHours || 1);
    if (computed !== endTime) onChange({ endTime: computed });
  }, [startTime, durationHours, manualEnd]);

  const handleEndTimeChange = (value) => {
    lastEditedEnd.current = true;
    const patch = { endTime: value };
    const derivedDuration = hoursBetween(startTime, value);
    if (derivedDuration) patch.durationHours = derivedDuration;
    onChange(patch);
  };

  const toggleManual = (checked) => {
    setManualEnd(checked);
    if (!checked && startTime) {
      onChange({ endTime: addHours(startTime, durationHours || 1) });
    }
  };

  const invalid = startTime && endTime && hoursBetween(startTime, endTime) === null;

  return (
    <>
      <label className="field">
        <span className="field__label">Duration</span>
        <select
          className="field__input"
          value={durationHours}
          onChange={(e) => onChange({ durationHours: Number(e.target.value) })}
          required={durationRequired}
        >
          {FLEXIBLE_DURATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </label>

      <div className="field-row-2 field-row-2--span">
        <label className="field">
          <span className="field__label">Start time</span>
          {startTimeOptions ? (
            <select
              className="field__input"
              value={startTime}
              onChange={(e) => onChange({ startTime: e.target.value })}
              required={startTimeRequired}
            >
              <option value="">{startTimeRequired ? 'Select…' : 'No preference'}</option>
              {(startTimeOptions === true ? TIME_SLOTS : startTimeOptions).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          ) : (
            <input
              className="field__input"
              type="time"
              value={startTime}
              onChange={(e) => onChange({ startTime: e.target.value })}
              required={startTimeRequired}
            />
          )}
        </label>

        <label className="field">
          <span className="field__label">End time {!manualEnd && <span className="field__hint">(auto)</span>}</span>
          <input
            className="field__input"
            type="time"
            value={endTime}
            disabled={!manualEnd}
            onChange={(e) => handleEndTimeChange(e.target.value)}
          />
          <label className="checkbox" style={{ marginTop: 2 }}>
            <input type="checkbox" checked={manualEnd} onChange={(e) => toggleManual(e.target.checked)} />
            Set end time manually
          </label>
          {invalid && <span className="field__error">End time must be after start time</span>}
        </label>
      </div>
    </>
  );
}
