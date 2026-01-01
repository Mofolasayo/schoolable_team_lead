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
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Extended mock data
const allTransactions = [
  {
    id: 1,
    date: '21 Feb',
    time: '10:14',
    name: 'Notion Labs',
    details: 'SaaS subscription',
    category: 'Software',
    cardType: 'Virtual',
    cardLast4: '4829',
    amount: -16639.6,
    status: 'Success',
    icon: Receipt,
  },
  {
    id: 2,
    date: '21 Feb',
    time: '08:02',
    name: 'City Transport',
    details: 'Metro top-up',
    category: 'Transport',
    cardType: 'Physical',
    cardLast4: '2910',
    amount: -2500.0,
    status: 'Success',
    icon: Bus,
  },
  {
    id: 3,
    date: '20 Feb',
    time: '17:41',
    name: 'Incoming transfer',
    details: 'From Nova Studio',
    category: 'Transfer-in',
    cardType: 'Bank',
    cardLast4: 'IBAN',
    amount: 125000.0,
    status: 'Success',
    icon: RefreshCcw,
  },
  {
    id: 4,
    date: '20 Feb',
    time: '13:09',
    name: 'Team lunch',
    details: 'Bistro La Place',
    category: 'Dining',
    cardType: 'Virtual',
    cardLast4: '7741',
    amount: -8450.0,
    status: 'Pending',
    icon: Coffee,
  },
  {
    id: 5,
    date: '20 Feb',
    time: '09:18',
    name: 'Cafe Central',
    details: 'Coffee & snacks',
    category: 'Dining',
    cardType: 'Physical',
    cardLast4: '2910',
    amount: -1250.0,
    status: 'Pending',
    icon: Coffee,
  },
  {
    id: 6,
    date: '19 Feb',
    time: '14:03',
    name: 'Domain renewal',
    details: 'aurora-wallet.com',
    category: 'Services',
    cardType: 'Virtual',
    cardLast4: '4829',
    amount: -3850.0,
    status: 'Success',
    icon: Globe,
  },
  {
    id: 7,
    date: '19 Feb',
    time: '10:22',
    name: 'Refund • Notion Labs',
    details: 'Prorated credit',
    category: 'Refund',
    cardType: 'Virtual',
    cardLast4: '4829',
    amount: 5500.0,
    status: 'Success',
    icon: RefreshCcw,
  },
  {
    id: 8,
    date: '19 Feb',
    time: '09:58',
    name: 'Card verification',
    details: 'Security check',
    category: 'Security',
    cardType: 'Virtual',
    cardLast4: '4829',
    amount: -100.0,
    status: 'Failed',
    icon: Shield,
  },
  {
    id: 9,
    date: '18 Feb',
    time: '18:29',
    name: 'Flight to Berlin',
    details: 'Business travel',
    category: 'Travel',
    cardType: 'Virtual',
    cardLast4: '7741',
    amount: -45780.0,
    status: 'Success',
    icon: Plane,
  },
  {
    id: 10,
    date: '18 Feb',
    time: '09:11',
    name: 'Incoming transfer',
    details: 'ACME Studio',
    category: 'Transfer-in',
    cardType: 'Bank',
    cardLast4: 'IBAN',
    amount: 85000.0,
    status: 'Success',
    icon: RefreshCcw,
  },
  // Page 2 Data
  {
    id: 11,
    date: '17 Feb',
    time: '15:30',
    name: 'AWS Services',
    details: 'Monthly hosting',
    category: 'Software',
    cardType: 'Virtual',
    cardLast4: '4829',
    amount: -24500.0,
    status: 'Success',
    icon: Globe,
  },
  {
    id: 12,
    date: '17 Feb',
    time: '12:15',
    name: 'Uber Ride',
    details: 'Client meeting',
    category: 'Transport',
    cardType: 'Physical',
    cardLast4: '2910',
    amount: -3200.0,
    status: 'Success',
    icon: Bus,
  },
  {
    id: 13,
    date: '16 Feb',
    time: '09:45',
    name: 'Starbucks',
    details: 'Team breakfast',
    category: 'Dining',
    cardType: 'Physical',
    cardLast4: '2910',
    amount: -4500.0,
    status: 'Success',
    icon: Coffee,
  },
  {
    id: 14,
    date: '16 Feb',
    time: '14:20',
    name: 'Apple Store',
    details: 'Equipment',
    category: 'Hardware',
    cardType: 'Virtual',
    cardLast4: '7741',
    amount: -185000.0,
    status: 'Success',
    icon: Receipt,
  },
  {
    id: 15,
    date: '15 Feb',
    time: '11:00',
    name: 'Consulting Fee',
    details: 'Client payment',
    category: 'Transfer-in',
    cardType: 'Bank',
    cardLast4: 'IBAN',
    amount: 450000.0,
    status: 'Success',
    icon: RefreshCcw,
  },
  {
    id: 16,
    date: '15 Feb',
    time: '16:45',
    name: 'Slack',
    details: 'Monthly subscription',
    category: 'Software',
    cardType: 'Virtual',
    cardLast4: '4829',
    amount: -8500.0,
    status: 'Success',
    icon: Receipt,
  },
  {
    id: 17,
    date: '14 Feb',
    time: '13:30',
    name: 'Business Lunch',
    details: 'The Grill House',
    category: 'Dining',
    cardType: 'Physical',
    cardLast4: '2910',
    amount: -15400.0,
    status: 'Pending',
    icon: Coffee,
  },
  {
    id: 18,
    date: '14 Feb',
    time: '09:00',
    name: 'Google Workspace',
    details: 'Email services',
    category: 'Software',
    cardType: 'Virtual',
    cardLast4: '4829',
    amount: -12000.0,
    status: 'Success',
    icon: Globe,
  },
  {
    id: 19,
    date: '13 Feb',
    time: '10:15',
    name: 'Office Supplies',
    details: 'Staples',
    category: 'Office',
    cardType: 'Physical',
    cardLast4: '2910',
    amount: -5600.0,
    status: 'Success',
    icon: Receipt,
  },
  {
    id: 20,
    date: '13 Feb',
    time: '15:50',
    name: 'Client Refund',
    details: 'Service adjustment',
    category: 'Refund',
    cardType: 'Virtual',
    cardLast4: '4829',
    amount: -25000.0,
    status: 'Success',
    icon: RefreshCcw,
  },
  // Page 3 Data
  {
    id: 21,
    date: '12 Feb',
    time: '08:45',
    name: 'Airport Taxi',
    details: 'Travel expense',
    category: 'Transport',
    cardType: 'Physical',
    cardLast4: '2910',
    amount: -8500.0,
    status: 'Success',
    icon: Bus,
  },
  {
    id: 22,
    date: '12 Feb',
    time: '12:30',
    name: 'Hotel Booking',
    details: 'Marriott',
    category: 'Travel',
    cardType: 'Virtual',
    cardLast4: '7741',
    amount: -125000.0,
    status: 'Success',
    icon: Plane,
  },
  {
    id: 23,
    date: '11 Feb',
    time: '14:15',
    name: 'Project Bonus',
    details: 'Q1 Performance',
    category: 'Transfer-in',
    cardType: 'Bank',
    cardLast4: 'IBAN',
    amount: 50000.0,
    status: 'Success',
    icon: RefreshCcw,
  },
  {
    id: 24,
    date: '11 Feb',
    time: '10:00',
    name: 'LinkedIn Premium',
    details: 'Subscription',
    category: 'Software',
    cardType: 'Virtual',
    cardLast4: '4829',
    amount: -15000.0,
    status: 'Success',
    icon: Globe,
  },
  {
    id: 25,
    date: '10 Feb',
    time: '16:20',
    name: 'Courier Service',
    details: 'Document delivery',
    category: 'Services',
    cardType: 'Physical',
    cardLast4: '2910',
    amount: -3500.0,
    status: 'Success',
    icon: Receipt,
  },
  {
    id: 26,
    date: '10 Feb',
    time: '09:30',
    name: 'Internet Bill',
    details: 'ISP Provider',
    category: 'Utilities',
    cardType: 'Virtual',
    cardLast4: '4829',
    amount: -22000.0,
    status: 'Success',
    icon: Globe,
  },
  {
    id: 27,
    date: '09 Feb',
    time: '13:45',
    name: 'Client Lunch',
    details: 'Seafood Restaurant',
    category: 'Dining',
    cardType: 'Physical',
    cardLast4: '2910',
    amount: -28000.0,
    status: 'Success',
    icon: Coffee,
  },
  {
    id: 28,
    date: '09 Feb',
    time: '11:15',
    name: 'Software License',
    details: 'Adobe Creative Cloud',
    category: 'Software',
    cardType: 'Virtual',
    cardLast4: '4829',
    amount: -45000.0,
    status: 'Success',
    icon: Receipt,
  },
  {
    id: 29,
    date: '08 Feb',
    time: '15:00',
    name: 'Office Rent',
    details: 'February Rent',
    category: 'Utilities',
    cardType: 'Bank',
    cardLast4: 'IBAN',
    amount: -450000.0,
    status: 'Success',
    icon: Receipt,
  },
  {
    id: 30,
    date: '08 Feb',
    time: '10:00',
    name: 'Investment Return',
    details: 'Dividend',
    category: 'Transfer-in',
    cardType: 'Bank',
    cardLast4: 'IBAN',
    amount: 75000.0,
    status: 'Success',
    icon: RefreshCcw,
  },
];

const ITEMS_PER_PAGE = 10;

interface TransactionsListProps {
  searchQuery?: string;
}

export function TransactionsList({ searchQuery = '' }: TransactionsListProps) {
  const [activeTab, setActiveTab] = useState<'All' | 'Money in' | 'Money out'>(
    'All'
  );
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate totals from full dataset
  const moneyIn = allTransactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const moneyOut = allTransactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Filter transactions
  const filteredTransactions = allTransactions.filter((t) => {
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
          <div className="text-xs text-muted-foreground">21 Feb - 21 Mar</div>
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
                const Icon = transaction.icon;
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
