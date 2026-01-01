import type { Metadata } from 'next';
import { config } from '@/config';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: `${config.app.name} · Analytics`,
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Insights into your spending patterns and trends
        </p>
      </div>

      {/* Analytics Features */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2.5 dark:bg-blue-900/20">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Spending Trends</p>
              <p className="text-2xl font-bold">+12%</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2.5 dark:bg-green-900/20">
              <PieChart className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Top Category</p>
              <p className="text-lg font-bold">Bills</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2.5 dark:bg-purple-900/20">
              <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold">$3,451</p>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="rounded-2xl border bg-card p-12 text-center">
        <div className="mx-auto max-w-md space-y-4">
          <div className="mx-auto w-fit rounded-full bg-primary/10 p-4">
            <BarChart3 className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">
            Detailed Analytics Coming Soon
          </h2>
          <p className="text-sm text-muted-foreground">
            This page will include interactive charts for spending trends,
            category breakdowns, income vs expenses comparison, and personalized
            insights to help you manage your finances better.
          </p>
        </div>
      </div>
    </div>
  );
}
