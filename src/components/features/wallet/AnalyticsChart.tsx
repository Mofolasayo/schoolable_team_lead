'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip } from 'recharts';

const data = [
  { day: 'Mon', value: 40 },
  { day: 'Tue', value: 55 },
  { day: 'Wed', value: 75 },
  { day: 'Thu', value: 60 },
  { day: 'Fri', value: 90 },
  { day: 'Sat', value: 100 },
];

export function AnalyticsChart() {
  return (
    <div className="mt-4 h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#64748b' }}
            dy={10}
          />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '12px',
            }}
          />
          <Bar
            dataKey="value"
            fill="#2563EB"
            radius={[4, 4, 0, 0]}
            barSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
