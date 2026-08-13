import { WEEK_MODES } from '../api/constraintOptions';
import { weeksForBlock } from '../api/academicCalendar';

//   ALL_REMAINING -> no follow-up, applies to every remaining week in the block
//   SINGLE        -> a single-select dropdown of weeks in the block
//   MULTIPLE      -> a checkbox grid of weeks in the block
export default function WeekPicker({ block, weekMode, weeks, onWeekModeChange, onWeeksChange }) {
  const blockWeeks = block ? weeksForBlock(block) : [];

  const toggleWeek = (weekInBlock) => {
    onWeeksChange(
      weeks.includes(weekInBlock)
        ? weeks.filter((w) => w !== weekInBlock)
        : [...weeks, weekInBlock]
    );
  };

  return (
    <div className="week-picker">
      <label className="field">
        <span className="field__label">Week</span>
        <select
          className="field__input"
          value={weekMode}
          onChange={(e) => { onWeekModeChange(e.target.value); onWeeksChange([]); }}
          disabled={!block}
        >
          {WEEK_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        {!block && <span className="field__hint">Select a primary module first to see its weeks.</span>}
      </label>

      {block && weekMode === 'SINGLE' && (
        <label className="field">
          <span className="field__label">Week(s)</span>
          <select
            className="field__input"
            value={weeks[0] ?? ''}
            onChange={(e) => onWeeksChange(e.target.value ? [Number(e.target.value)] : [])}
          >
            <option value="">Select a week…</option>
            {blockWeeks.map((w) => (
              <option key={w.weekInBlock} value={w.weekInBlock}>
                Week {w.weekInBlock} ({w.dateRange})
              </option>
            ))}
          </select>
        </label>
      )}

      {block && weekMode === 'MULTIPLE' && (
        <fieldset className="field">
          <legend className="field__label">Week(s)</legend>
          <div className="week-picker__grid">
            {blockWeeks.map((w) => (
              <label key={w.weekInBlock} className="checkbox">
                <input
                  type="checkbox"
                  checked={weeks.includes(w.weekInBlock)}
                  onChange={() => toggleWeek(w.weekInBlock)}
                />
                Week {w.weekInBlock} ({w.dateRange})
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}
