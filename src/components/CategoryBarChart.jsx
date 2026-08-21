import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { changeCategoryLabel } from '../api/constraintOptions';

// horizontal bar chart for change-request categories - up to 11 possible categories, which reads
// far more clearly as bars than as pie slices. Animated growth on load, same as the donut chart.
export default function CategoryBarChart({ counts, height }) {
  const data = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([category, count]) => ({ name: changeCategoryLabel(category), value: count }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div style={{ height: height ?? 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="card__body">Nothing submitted yet.</p>
      </div>
    );
  }

  const chartHeight = height ?? Math.max(data.length * 34, 90);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
        <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="value" fill="#d0006f" radius={[0, 4, 4, 0]} animationDuration={700}>
          {data.map((entry, i) => <Cell key={i} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
