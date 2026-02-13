'use client';

import { useState } from 'react';
import {
  Download,
  ChevronDown,
  Receipt,
  Bus,
  Coffee,
  Globe,
  Shield,
  Plane,
  RefreshCcw,
  ArrowLeft,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type Transaction = {
  id: number | string;
  date: string;
  time: string;
  name: string;
  details: string;
  category: string;
  cardType: string;
  cardLast4: string;
  amount: number;
  status: string;
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  software: Globe,
  transport: Bus,
  dining: Coffee,
  travel: Plane,
  security: Shield,
  supplies: Receipt,
  benefits: Shield,
  payroll: RefreshCcw,
  refund: RefreshCcw,
  services: Globe,
  'transfer-in': RefreshCcw,
  'transfer-out': RefreshCcw,
};

const ITEMS_PER_PAGE = 10;

interface TransactionsListProps {
  searchQuery?: string;
  transactions?: Transaction[];
}

export function TransactionsList({
  searchQuery = '',
  transactions = [],
}: TransactionsListProps) {
  const [activeTab, setActiveTab] = useState<'All' | 'Money in' | 'Money out'>(
    'All'
  );
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate totals from full dataset
  const moneyIn = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const moneyOut = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    // Tab filter
    if (activeTab === 'Money in' && t.amount <= 0) return false;
    if (activeTab === 'Money out' && t.amount >= 0) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        t.name.toLowerCase().includes(query) ||
        t.details.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        t.amount.toString().includes(query)
      );
    }

    return true;
  });

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const periodLabel =
    transactions.length > 0
      ? `${transactions[transactions.length - 1]?.date} - ${transactions[0]?.date}`
      : '—';

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of table or keep position
  };

  return (
    <div className="rounded-xl border border-border/40 bg-white shadow-sm">
      {/* Card Header */}
      <div className="border-b border-border/40 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-normal text-gray-700">
              All transactions
            </h2>
          </div>
          <button className="flex items-center gap-2 rounded-md border border-border/40 bg-background px-3 py-2 text-xs font-normal text-muted-foreground hover:bg-muted/50 hover:text-foreground">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>

        {/* Filters Row */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {/* Type Filters */}
          <div className="flex gap-1 rounded-lg border border-border/40 bg-muted/20 p-1">
            {(['All', 'Money in', 'Money out'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  activeTab === tab
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="ml-auto flex gap-2">
            <button className="flex items-center gap-1.5 rounded-md border border-border/40 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50">
              Category
              <ChevronDown className="h-3 w-3" />
            </button>
            <button className="flex items-center gap-1.5 rounded-md border border-border/40 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50">
              Card
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Period Summary */}
        <div className="mt-4 flex items-center gap-8 rounded-lg bg-muted/30 p-3">
          <div className="text-xs text-muted-foreground">{periodLabel}</div>
          <div className="flex gap-8">
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">
                Money in
              </div>
              <div className="text-sm font-normal text-emerald-600">
                + ₦{' '}
                {moneyIn.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">
                Money out
              </div>
              <div className="text-sm font-normal text-gray-700">
                ₦{' '}
                {moneyOut.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/40 bg-muted/20">
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                Card / Method
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedTransactions.length > 0 ? (
              paginatedTransactions.map((transaction) => {
                const Icon =
                  CATEGORY_ICONS[transaction.category.toLowerCase()] ?? Receipt;
                return (
                  <tr
                    key={transaction.id}
                    className="border-b border-border/40 last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-6 py-4">
                      <div className="text-xs text-muted-foreground">
                        {transaction.date} • {transaction.time}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-md bg-muted/40 p-1.5">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="text-sm font-normal text-gray-700">
                            {transaction.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {transaction.details}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-muted-foreground">
                        {transaction.category}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-muted-foreground">
                        {transaction.cardType} •{' '}
                        {transaction.cardLast4 === 'IBAN'
                          ? 'IBAN'
                          : `•••• ${transaction.cardLast4}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div
                        className={`text-sm font-normal ${transaction.amount > 0 ? 'text-emerald-600' : 'text-gray-700'}`}
                      >
                        {transaction.amount > 0 ? '+' : ''} ₦{' '}
                        {Math.abs(transaction.amount).toLocaleString('en-NG', {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          transaction.status === 'Success'
                            ? 'bg-emerald-100 text-emerald-700'
                            : transaction.status === 'Pending'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  No transactions found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with Pagination */}
      <div className="flex items-center justify-between border-t border-border/40 px-6 py-4">
        <div className="text-xs text-muted-foreground">
          Showing{' '}
          {Math.min(
            (currentPage - 1) * ITEMS_PER_PAGE + 1,
            filteredTransactions.length
          )}{' '}
          to{' '}
          {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)}{' '}
          of {filteredTransactions.length} transactions
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border/40 text-xs font-medium text-muted-foreground hover:bg-muted/50 disabled:opacity-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium transition-colors',
                currentPage === page
                  ? 'bg-primary text-white'
                  : 'border border-border/40 text-muted-foreground hover:bg-muted/50'
              )}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() =>
              handlePageChange(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border/40 text-xs font-medium text-muted-foreground hover:bg-muted/50 disabled:opacity-50"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
