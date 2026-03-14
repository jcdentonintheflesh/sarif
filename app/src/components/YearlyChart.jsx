import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';
import { daysByYear } from '../utils/calculations';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const days = payload[0].value;
  const pct = Math.round((days / 365) * 100);
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm">
      <div className="font-semibold text-white">{label}</div>
      <div className="text-slate-300">{days} days in US</div>
      <div className="text-slate-400">{pct}% of year</div>
    </div>
  );
};

export default function YearlyChart({ trips }) {
  const byYear = daysByYear(trips);
  const data = Object.entries(byYear)
    .filter(([y]) => y >= 2022)
    .map(([year, days]) => ({ year, days, pct: Math.round((days / 365) * 100) }));

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-white">Days in US per Year</h3>
        <span className="text-xs text-slate-500">365 = full year</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barSize={32}>
          <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 365]} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <ReferenceLine y={183} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '50%', fill: '#f59e0b', fontSize: 11, position: 'insideTopRight' }} />
          <Bar dataKey="days" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.year}
                fill={entry.days > 200 ? '#ef4444' : entry.days > 150 ? '#f59e0b' : '#10b981'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-slate-500">Red = &gt;200 days (risk zone). Yellow = 150–200. Green = &lt;150.</p>
    </div>
  );
}
