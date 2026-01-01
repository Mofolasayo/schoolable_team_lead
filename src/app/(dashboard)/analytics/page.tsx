import type { Metadata } from 'next';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Bus,
  CreditCard as CreditCardIcon,
  Plane,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import { config } from '@/config';
import { CashFlowChart } from '@/components/features/wallet/CashFlowChart';
import { IncomeExpensesChart } from '@/components/features/wallet/IncomeExpensesChart';
import { SpendingDonutChart } from '@/components/features/wallet/SpendingDonutChart';

export const metadata: Metadata = {
  title: `${config.app.name} · Analytics`,
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-normal text-gray-800">Analytics</h1>
        <p className="text-xs text-muted-foreground">
          Understand your spending trends and cash flow.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Net cash flow */}
        <div className="rounded-xl border border-border/40 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-start justify-between">
            <div className="text-xs text-muted-foreground">Net cash flow</div>
            <div className="rounded-lg bg-emerald-100 p-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            </div>
          </div>
          <div className="mb-1 text-2xl font-normal text-gray-800">
            ₦ 12,430
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="flex items-center text-emerald-600">
              <ArrowUpRight className="h-3 w-3" />
              10.4%
            </span>
            <span className="text-muted-foreground">vs last month</span>
          </div>
        </div>

        {/* Total income */}
        <div className="rounded-xl border border-border/40 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-start justify-between">
            <div className="text-xs text-muted-foreground">Total income</div>
            <div className="rounded-lg bg-blue-100 p-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
            </div>
          </div>
          <div className="mb-1 text-2xl font-normal text-gray-800">
            ₦ 28,900
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="flex items-center text-emerald-600">
              <ArrowUpRight className="h-3 w-3" />
              4.1%
            </span>
            <span className="text-muted-foreground">from all wallets</span>
          </div>
        </div>

        {/* Total expenses */}
        <div className="rounded-xl border border-border/40 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-start justify-between">
            <div className="text-xs text-muted-foreground">Total expenses</div>
            <div className="rounded-lg bg-red-100 p-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-red-600" />
            </div>
          </div>
          <div className="mb-1 text-2xl font-normal text-gray-800">
            ₦ 16,470
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="flex items-center text-red-600">
              <ArrowUpRight className="h-3 w-3" />
              4.76%
            </span>
            <span className="text-muted-foreground">across categories</span>
          </div>
        </div>

        {/* Average daily spend */}
        <div className="rounded-xl border border-border/40 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-start justify-between">
            <div className="text-xs text-muted-foreground">
              Avg. daily spend
            </div>
            <div className="rounded-lg bg-purple-100 p-1.5">
              <Calendar className="h-3.5 w-3.5 text-purple-600" />
            </div>
          </div>
          <div className="mb-1 text-2xl font-normal text-gray-800">₦ 548</div>
          <div className="flex items-center gap-1 text-xs">
            <span className="flex items-center text-emerald-600">
              <ArrowUpRight className="h-3 w-3" />
              2.2%
            </span>
            <span className="text-muted-foreground">last 30 days</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        {/* Left Column - Charts */}
        <div className="space-y-6">
          {/* Cash flow over time */}
          <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-sm font-normal text-gray-700">
                  Cash flow over time
                </h2>
                <p className="text-xs text-muted-foreground">
                  Monthly view of income and expenses
                </p>
              </div>
              <div className="flex gap-1">
                <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white">
                  Monthly
                </button>
                <button className="rounded-lg border border-border/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50">
                  Weekly
                </button>
              </div>
            </div>
            <CashFlowChart />
          </div>

          {/* Income vs expenses */}
          <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-sm font-normal text-gray-700">
                Income vs expenses
              </h2>
              <p className="text-xs text-muted-foreground">
                Compare inflows and outflows by month
              </p>
            </div>
            <IncomeExpensesChart />
          </div>

          {/* Top Merchants */}
          <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-sm font-normal text-gray-700">
                Top merchants
              </h2>
              <p className="text-xs text-muted-foreground">
                Your most frequent transactions this month
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  name: 'Notion Labs',
                  category: 'Software',
                  amount: 16639.6,
                  transactions: 3,
                  color: 'bg-blue-500',
                },
                {
                  name: 'Amazon Web Services',
                  category: 'Cloud Services',
                  amount: 12450.0,
                  transactions: 5,
                  color: 'bg-orange-500',
                },
                {
                  name: 'City Transport',
                  category: 'Transport',
                  amount: 8500.0,
                  transactions: 12,
                  color: 'bg-emerald-500',
                },
                {
                  name: 'Cafe Central',
                  category: 'Dining',
                  amount: 6200.0,
                  transactions: 8,
                  color: 'bg-purple-500',
                },
                {
                  name: 'Figma',
                  category: 'Software',
                  amount: 5400.0,
                  transactions: 1,
                  color: 'bg-pink-500',
                },
              ].map((merchant, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-border/40 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${merchant.color}`} />
                    <div>
                      <div className="text-sm font-normal text-gray-700">
                        {merchant.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {merchant.category} • {merchant.transactions}{' '}
                        transactions
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-normal text-gray-700">
                    ₦ {merchant.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Donut Chart & Insights */}
        <div className="space-y-6">
          {/* Spending by category */}
          <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-sm font-normal text-gray-700">
                Spending by category
              </h2>
              <p className="text-xs text-muted-foreground">
                This month&apos;s breakdown
              </p>
            </div>
            <SpendingDonutChart />
          </div>

          {/* Budget Tracker */}
          <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-sm font-normal text-gray-700">
                Budget tracker
              </h2>
              <p className="text-xs text-muted-foreground">
                Category spending vs limits
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  category: 'Software',
                  spent: 32450,
                  budget: 50000,
                  color: 'bg-blue-500',
                },
                {
                  category: 'Transport',
                  spent: 18200,
                  budget: 25000,
                  color: 'bg-emerald-500',
                },
                {
                  category: 'Dining',
                  spent: 12800,
                  budget: 15000,
                  color: 'bg-purple-500',
                },
                {
                  category: 'Travel',
                  spent: 45000,
                  budget: 100000,
                  color: 'bg-orange-500',
                },
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-normal text-gray-700">
                      {item.category}
                    </span>
                    <span className="text-muted-foreground">
                      ₦ {item.spent.toLocaleString()} / ₦{' '}
                      {item.budget.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${(item.spent / item.budget) * 100}%` }}
                    />
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {Math.round((item.spent / item.budget) * 100)}% of budget
                    used
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-sm font-normal text-gray-700">Insights</h2>
              <p className="text-xs text-muted-foreground">
                AI-powered highlights
              </p>
            </div>

            <div className="space-y-3">
              {/* Insight 1 */}
              <div className="flex gap-3 rounded-lg border border-border/40 bg-muted/20 p-3">
                <Bus className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-normal text-gray-700">
                    Transport costs increased
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    24% higher than last month. Review ride-hailing expenses.
                  </div>
                </div>
              </div>

              {/* Insight 2 */}
              <div className="flex gap-3 rounded-lg border border-border/40 bg-muted/20 p-3">
                <CreditCardIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-normal text-gray-700">
                    Subscriptions stable
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Within 5% of your 3-month average.
                  </div>
                </div>
              </div>

              {/* Insight 3 */}
              <div className="flex gap-3 rounded-lg border border-border/40 bg-muted/20 p-3">
                <Plane className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-normal text-gray-700">
                    Travel costs down
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    18% lower after fewer international trips.
                  </div>
                </div>
              </div>

              {/* Insight 4 */}
              <div className="flex gap-3 rounded-lg border border-border/40 bg-muted/20 p-3">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-normal text-gray-700">
                    On track with budget
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    61% used with 12 days remaining.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
