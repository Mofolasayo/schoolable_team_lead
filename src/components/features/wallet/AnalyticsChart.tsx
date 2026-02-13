'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip } from 'recharts';

export type AnalyticsPoint = { day: string; value: number };

export function AnalyticsChart({ data = [] }: { data?: AnalyticsPoint[] }) {
  return (
    <div className="mt-4 h-64 w-full">
      {data.length === 0 ? (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
          No analytics data yet.
        </div>
      ) : (
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
      )}
    </div>
  );
}
