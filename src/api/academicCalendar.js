// defining the 26/27 teaching-block structure here so week navigation stays purely date-driven
// matching the block/day/time recurring pattern stored in the DB (no per-session real dates needed)
const BLOCKS = [
  { block: 1, startDate: '2026-09-14', weeks: 10 }, // 15 Sept official start falls on a Tue
  { block: 2, startDate: '2027-01-11', weeks: 10 },
  { block: 3, startDate: '2027-04-12', weeks: 8 },
  { block: 4, startDate: '2027-06-14', weeks: 1 },
];

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d;
}

function formatRange(monday, friday) {
  const opts = { day: 'numeric', month: 'short' };
  const sameMonth = monday.getMonth() === friday.getMonth();
  const startLabel = monday.toLocaleDateString('en-GB', sameMonth ? { day: 'numeric' } : opts);
  const endLabel = friday.toLocaleDateString('en-GB', { ...opts, year: 'numeric' });
  return `${startLabel} - ${endLabel}`;
}

// building the flat, navigable list once
// only actual teaching weeks, breaks between blocks are skipped entirely
export const WEEKS = BLOCKS.flatMap(({ block, startDate, weeks }) =>
  Array.from({ length: weeks }, (_, i) => {
    const monday = addDays(startDate, i * 7);
    const friday = addDays(startDate, i * 7 + 4);
    return {
      block,
      weekInBlock: i + 1,
      monday,
      friday,
      label: `Block ${block} · Week ${i + 1}`,
      dateRange: formatRange(monday, friday),
    };
  })
);

export function findCurrentWeekIndex() {
  const today = new Date();
  const idx = WEEKS.findIndex((w) => today >= w.monday && today <= w.friday);
  if (idx !== -1) return idx;
  // defaulting to the nearest upcoming week if today falls in a break (or outside the year entirely)
  const nextIdx = WEEKS.findIndex((w) => today < w.monday);
  return nextIdx !== -1 ? nextIdx : 0;
}

// scoping the week list down to a single block 
export function weeksForBlock(block) {
  return WEEKS.filter((w) => w.block === block);
}
