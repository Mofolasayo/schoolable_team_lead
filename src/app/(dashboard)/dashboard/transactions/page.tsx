import type { Metadata } from 'next';
import { config } from '@/config';
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Download,
  Filter,
  Search,
} from 'lucide-react';

export const metadata: Metadata = {
  title: `${config.app.name} · Transactions`,
};

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground">
          View and manage all your transaction history
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search transactions..."
            className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <button className="flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">
          <Calendar className="h-4 w-4" />
          Date Range
        </button>
        <button className="flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">
          <Filter className="h-4 w-4" />
          Filters
        </button>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Placeholder Content */}
      <div className="rounded-2xl border bg-card p-12 text-center">
        <div className="mx-auto max-w-md space-y-4">
          <div className="flex justify-center gap-3">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
              <ArrowDownRight className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
              <ArrowUpRight className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h2 className="text-xl font-semibold">
            Full Transaction List Coming Soon
          </h2>
          <p className="text-sm text-muted-foreground">
            This page will show your complete transaction history with advanced
            filtering, search, and export capabilities.
          </p>
        </div>
      </div>
    </div>
  );
}
