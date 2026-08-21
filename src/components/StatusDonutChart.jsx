import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { STATUS_LABELS } from '../api/constraintOptions';

// amber for anything mid-flight
// pink for the org's own accent colour
// red / green for the two terminal (accpt, reject) decisions
const STATUS_COLORS = {
  AWAITING_DECISION: '#f2a600',
  DRAFT_COMPLETE: '#8a8fa3',
  IN_PROGRESS: '#3d7cf2',
  ACCEPTED: '#2e9e5b',
  REJECTED: '#c0392b',
  COMPLETE: '#a6216f',
};

// Small animated donut for a status breakdown
export default function StatusDonutChart({ counts, height = 190 }) {
  const data = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({ name: STATUS_LABELS[status] ?? status, status, value: count }));

  if (data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="card__body">Nothing submitted yet.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="55%"
          outerRadius="85%"
          paddingAngle={data.length > 1 ? 2 : 0}
          animationBegin={0}
          animationDuration={700}
        >
          {data.map((entry) => (
            <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#999'} />
          ))}
        </Pie>
        <Tooltip formatter={(value, name) => [value, name]} />
        <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
      </PieChart>
    </ResponsiveContainer>
  );
}
