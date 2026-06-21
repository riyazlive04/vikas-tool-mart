'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function ReviewsChart({ data }: { data: Array<{ date: string; count: number }> }) {
  if (data.length === 0) {
    return <div className="vtm-card text-center text-xs text-muted">No reviews in this range.</div>;
  }
  return (
    <div className="vtm-card">
      <div className="mb-2 vtm-label">On-site reviews / day</div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#888' }} tickFormatter={(d: string) => d.slice(5)} />
          <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: '#888' }} />
          <Tooltip
            contentStyle={{ background: '#242424', border: '1px solid #444', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#F5C400' }}
          />
          <Bar dataKey="count" fill="#F5C400" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
