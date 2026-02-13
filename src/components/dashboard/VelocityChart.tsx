'use client';

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useEffect, useState } from 'react';
import { getKpiProgress } from '@/lib/api/team-lead';

interface ChartData {
  name: string;
  total: number;
}

export function VelocityChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get progress for the last 6 weeks
        const currentWeek = Math.ceil(
          (new Date().getTime() -
            new Date(new Date().getFullYear(), 0, 1).getTime()) /
            (7 * 24 * 60 * 60 * 1000)
        );
        const year = new Date().getFullYear();

        const weeklyData: ChartData[] = [];

        for (let i = 5; i >= 0; i--) {
          const weekNumber = currentWeek - i;
          if (weekNumber > 0) {
            try {
              const result = await getKpiProgress(weekNumber, year);
              const totalProgress =
                result.progress?.reduce(
                  (sum, p) => sum + (p.progressPercentage || 0),
                  0
                ) || 0;
              const avgProgress = result.progress?.length
                ? Math.round(totalProgress / result.progress.length)
                : 0;
              weeklyData.push({
                name: `Week ${weekNumber}`,
                total: avgProgress,
              });
            } catch {
              weeklyData.push({
                name: `Week ${weekNumber}`,
                total: 0,
              });
            }
          }
        }

        setData(weeklyData);
      } catch (err) {
        console.error('Error fetching velocity data:', err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[350px] items-center justify-center">
        <div className="animate-pulse text-sm text-muted-foreground">
          Loading chart...
        </div>
      </div>
    );
  }

  const hasData = data.some((d) => d.total > 0);

  return (
    <div className="relative">
      {!hasData && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              No KPI progress data yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Submit weekly progress to see velocity
            </p>
          </div>
        </div>
      )}
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data}>
          <XAxis
            dataKey="name"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
            domain={[0, 100]}
          />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            contentStyle={{
              borderRadius: '8px',
              border: 'none',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            formatter={(value) => [`${value}%`, 'Progress']}
          />
          <Bar
            dataKey="total"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
