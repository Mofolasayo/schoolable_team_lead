'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export type SpendingSlice = { name: string; value: number; color: string };

export function SpendingDonutChart({ data = [] }: { data?: SpendingSlice[] }) {
  const total = data.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="h-64 w-full">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No spending data yet.
          </div>
        ) : (
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
                ₦ {total.toLocaleString()}
              </text>
            </PieChart>
          </ResponsiveContainer>
        )}
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
