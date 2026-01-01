'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Transport', value: 32, color: '#2563EB' },
  { name: 'Subscriptions', value: 27, color: '#3b82f6' },
  { name: 'Team & travel', value: 21, color: '#60a5fa' },
  { name: 'Other', value: 20, color: '#93c5fd' },
];

const TOTAL = 16470;

export function SpendingDonutChart() {
  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <text
              x="50%"
              y="42%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-2xl font-medium"
              fill="#0f172a"
            >
              ₦ {TOTAL.toLocaleString()}
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2 text-sm">
        {data.map((entry) => (
          <div
            key={entry.name}
            className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
            </div>
            <span className="font-medium text-foreground">{entry.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
