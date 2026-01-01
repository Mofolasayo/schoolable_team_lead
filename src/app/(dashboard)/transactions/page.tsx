'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { TransactionsList } from '@/components/features/transactions/TransactionsList';

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-normal text-gray-800">Transactions</h1>
          <p className="text-xs text-muted-foreground">
            Search, filter, and review all wallet activity.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-[280px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-border/40 bg-white pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Main Content */}
      <TransactionsList searchQuery={searchQuery} />
    </div>
  );
}
