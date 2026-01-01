'use client';

import { useState } from 'react';
import {
  Send,
  Download,
  User,
  Building,
  ArrowRight,
  Calendar,
  RefreshCcw,
  AlertCircle,
  X,
} from 'lucide-react';

type TransactionDetails = {
  title: string;
  amount: number;
  date: string;
  status: string;
  category: string;
  paymentMethod: string;
  transactionId: string;
  recipient: string;
};

export default function PaymentsPage() {
  const [recipientType, setRecipientType] = useState<'wallet' | 'bank'>(
    'wallet'
  );
  const [amount, setAmount] = useState('');
  const [requestAmount, setRequestAmount] = useState('');
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [transactionDetails, setTransactionDetails] =
    useState<TransactionDetails | null>(null);

  const handleSend = () => {
    // Create transaction details
    const details = {
      title: recipientType === 'wallet' ? 'Money Sent' : 'Bank Transfer',
      amount: parseFloat(amount),
      date: new Date().toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'Success',
      category: 'Transfer',
      paymentMethod: 'Business Wallet',
      transactionId: `TXN_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      recipient: recipientType === 'wallet' ? 'Wallet User' : 'Bank Account',
    };
    setTransactionDetails(details);
    setShowTransactionModal(true);
    setAmount('');
  };

  const handleRequest = () => {
    const details = {
      title: 'Payment Request Sent',
      amount: parseFloat(requestAmount),
      date: new Date().toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'Pending',
      category: 'Request',
      paymentMethod: 'Request Link',
      transactionId: `REQ_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      recipient: 'Request Recipient',
    };
    setTransactionDetails(details);
    setShowRequestModal(true);
    setRequestAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-normal text-gray-800">Payments</h1>
        <p className="text-xs text-muted-foreground">
          Send and receive money, manage scheduled payments.
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Send Money Form */}
          <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-sm font-normal text-gray-700">Send money</h2>
              <p className="text-xs text-muted-foreground">
                Transfer to bank accounts or wallet users.
              </p>
            </div>

            <div className="space-y-4">
              {/* Recipient Type Toggle */}
              <div>
                <label className="mb-2 block text-xs text-muted-foreground">
                  Recipient
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRecipientType('wallet')}
                    className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                      recipientType === 'wallet'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border/40 text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <User className="mr-2 inline h-4 w-4" />
                    Wallet user
                  </button>
                  <button
                    onClick={() => setRecipientType('bank')}
                    className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                      recipientType === 'bank'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border/40 text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Building className="mr-2 inline h-4 w-4" />
                    Bank account
                  </button>
                </div>
              </div>

              {/* Recipient Input */}
              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">
                  {recipientType === 'wallet'
                    ? 'Email or phone number'
                    : 'Account number'}
                </label>
                <input
                  type="text"
                  placeholder={
                    recipientType === 'wallet'
                      ? "Enter recipient's email or phone"
                      : 'Enter account number'
                  }
                  className="w-full rounded-lg border border-border/40 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Bank Name (only for bank transfers) */}
              {recipientType === 'bank' && (
                <div>
                  <label className="mb-1.5 block text-xs text-muted-foreground">
                    Bank name
                  </label>
                  <select className="w-full rounded-lg border border-border/40 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20">
                    <option>Select bank</option>
                    <option>Access Bank</option>
                    <option>GTBank</option>
                    <option>First Bank</option>
                    <option>UBA</option>
                    <option>Zenith Bank</option>
                  </select>
                </div>
              )}

              {/* Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs text-muted-foreground">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      ₦
                    </span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full rounded-lg border border-border/40 py-2.5 pl-8 pr-3 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-muted-foreground">
                    Currency
                  </label>
                  <select className="w-full rounded-lg border border-border/40 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20">
                    <option>NGN</option>
                    <option>EUR</option>
                    <option>USD</option>
                    <option>GBP</option>
                  </select>
                </div>
              </div>

              {/* Reference */}
              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">
                  Reference (optional)
                </label>
                <input
                  type="text"
                  placeholder="What's this payment for?"
                  className="w-full rounded-lg border border-border/40 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Payment method */}
              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">
                  Pay from
                </label>
                <select className="w-full rounded-lg border border-border/40 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20">
                  <option>Business Wallet (₦ 128,540.22 available)</option>
                  <option>EUR Wallet (€ 5,420.00 available)</option>
                  <option>Deutsche Bank •••• 4567</option>
                </select>
              </div>

              {/* Fee info */}
              <div className="rounded-lg bg-blue-50 p-3 text-xs">
                <div className="mb-1 flex items-center gap-1.5 font-medium text-blue-900">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {recipientType === 'wallet'
                    ? 'Instant transfer'
                    : 'Bank transfer'}
                </div>
                <div className="text-blue-700">
                  {recipientType === 'wallet'
                    ? 'Fee: ₦ 0.00 • Arrives within seconds'
                    : 'Fee: ₦ 50.00 • Arrives in 1-2 business days'}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleSend}
                  disabled={!amount || parseFloat(amount) <= 0}
                  className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Send{' '}
                  {amount && parseFloat(amount) > 0
                    ? `₦ ${parseFloat(amount).toLocaleString()}`
                    : 'money'}
                </button>
                <button className="rounded-lg border border-border/40 px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50">
                  Schedule
                </button>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-sm font-normal text-gray-700">
                  Recent payments
                </h2>
                <p className="text-xs text-muted-foreground">
                  Last transactions
                </p>
              </div>
              <button className="text-xs font-medium text-primary hover:text-primary/80">
                View all
              </button>
            </div>

            <div className="space-y-2">
              {[
                {
                  type: 'sent',
                  recipient: 'Northwest Supplies',
                  amount: -2500000.0,
                  date: 'Today',
                  time: '09:14',
                  status: 'pending',
                },
                {
                  type: 'received',
                  recipient: 'Nova Studio',
                  amount: 125000.0,
                  date: '20 Feb',
                  time: '17:41',
                  status: 'completed',
                },
                {
                  type: 'sent',
                  recipient: 'ACME Studio',
                  amount: -85000.0,
                  date: '18 Feb',
                  time: '09:11',
                  status: 'completed',
                },
                {
                  type: 'sent',
                  recipient: 'Paystack Integration',
                  amount: -12500.0,
                  date: '17 Feb',
                  time: '14:22',
                  status: 'completed',
                },
                {
                  type: 'received',
                  recipient: 'Client Payment - Invoice #1045',
                  amount: 450000.0,
                  date: '16 Feb',
                  time: '11:05',
                  status: 'completed',
                },
                {
                  type: 'sent',
                  recipient: 'MTN Airtime',
                  amount: -5000.0,
                  date: '15 Feb',
                  time: '08:30',
                  status: 'completed',
                },
              ].map((payment, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 p-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-lg p-2 ${payment.type === 'sent' ? 'bg-red-100' : 'bg-emerald-100'}`}
                    >
                      {payment.type === 'sent' ? (
                        <Send className="h-4 w-4 text-red-600" />
                      ) : (
                        <Download className="h-4 w-4 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-normal text-gray-700">
                        {payment.recipient}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {payment.date} • {payment.time}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-sm font-medium ${payment.amount > 0 ? 'text-emerald-600' : 'text-gray-700'}`}
                    >
                      {payment.amount > 0 ? '+' : ''} ₦{' '}
                      {Math.abs(payment.amount).toLocaleString()}
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      {payment.status === 'completed' ? (
                        <span className="text-xs text-emerald-600">
                          Completed
                        </span>
                      ) : (
                        <span className="text-xs text-orange-600">Pending</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Send */}
          <div className="rounded-xl border border-border/40 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-sm font-normal text-gray-700">Quick send</h2>
              <p className="text-xs text-muted-foreground">Recent recipients</p>
            </div>

            <div className="space-y-2">
              {[
                {
                  name: 'Nova Studio',
                  amount: '125,000',
                  initials: 'NS',
                  color: 'bg-blue-500',
                },
                {
                  name: 'ACME Studio',
                  amount: '85,000',
                  initials: 'AS',
                  color: 'bg-purple-500',
                },
                {
                  name: 'Northwest Supplies',
                  amount: '2,500,000',
                  initials: 'NW',
                  color: 'bg-emerald-500',
                },
              ].map((contact, idx) => (
                <button
                  key={idx}
                  className="flex w-full items-center gap-3 rounded-lg border border-border/40 p-3 text-left transition-colors hover:bg-muted/30"
                >
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${contact.color} text-sm font-medium text-white`}
                  >
                    {contact.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-normal text-gray-700">
                      {contact.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last: ₦ {contact.amount}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>

          {/* Request Money */}
          <div className="rounded-xl border border-border/40 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-sm font-normal text-gray-700">
                Request money
              </h2>
              <p className="text-xs text-muted-foreground">
                Send a payment request
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">
                  Request from
                </label>
                <input
                  type="text"
                  placeholder="Email or phone number"
                  className="w-full rounded-lg border border-border/40 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    ₦
                  </span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                    className="w-full rounded-lg border border-border/40 py-2.5 pl-8 pr-3 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">
                  Note
                </label>
                <input
                  type="text"
                  placeholder="What's this for?"
                  className="w-full rounded-lg border border-border/40 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <button
                onClick={handleRequest}
                disabled={!requestAmount || parseFloat(requestAmount) <= 0}
                className="w-full rounded-lg border border-primary bg-transparent px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Request{' '}
                {requestAmount && parseFloat(requestAmount) > 0
                  ? `₦ ${parseFloat(requestAmount).toLocaleString()}`
                  : 'money'}
              </button>
            </div>
          </div>

          {/* Scheduled Payments */}
          <div className="rounded-xl border border-border/40 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-sm font-normal text-gray-700">
                  Scheduled payments
                </h2>
                <p className="text-xs text-muted-foreground">
                  Upcoming transfers
                </p>
              </div>
              <button className="text-xs font-medium text-primary hover:text-primary/80">
                + New
              </button>
            </div>

            <div className="space-y-2">
              {[
                {
                  name: 'Team Payroll',
                  amount: '485,000',
                  schedule: 'Monthly',
                  day: '1st',
                  next: 'Mar 1',
                },
                {
                  name: 'Office Rent',
                  amount: '250,000',
                  schedule: 'Monthly',
                  day: '5th',
                  next: 'Mar 5',
                },
                {
                  name: 'SaaS Subscriptions',
                  amount: '45,000',
                  schedule: 'Monthly',
                  day: '15th',
                  next: 'Mar 15',
                },
              ].map((scheduled, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-border/40 bg-muted/20 p-3"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-normal text-gray-700">
                        {scheduled.name}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {scheduled.schedule} • {scheduled.day}
                      </div>
                    </div>
                    <RefreshCcw className="h-4 w-4 flex-shrink-0 text-primary" />
                  </div>
                  <div className="flex items-center justify-between border-t border-border/40 pt-2 text-xs">
                    <span className="font-medium text-gray-700">
                      ₦ {scheduled.amount}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Next: {scheduled.next}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {(showTransactionModal || showRequestModal) && transactionDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-start justify-between">
              <h2 className="text-xl font-medium text-gray-800">
                Transaction Details
              </h2>
              <button
                onClick={() => {
                  setShowTransactionModal(false);
                  setShowRequestModal(false);
                }}
                className="rounded-lg p-1 hover:bg-muted/50"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <div className="mb-2 text-sm text-muted-foreground">
                  {transactionDetails.title}
                </div>
                <div className="mb-2 flex items-center justify-center gap-3">
                  <div className="text-3xl font-medium text-gray-800">
                    {transactionDetails.amount > 0 ? '+' : '-'} ₦
                    {Math.abs(transactionDetails.amount).toFixed(2)}
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      transactionDetails.status === 'Success'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {transactionDetails.status}
                  </span>
                </div>
              </div>

              <div className="space-y-3 border-t border-border/40 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-normal text-gray-700">
                    {transactionDetails.date}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-normal text-gray-700">
                    {transactionDetails.category}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-normal text-gray-700">
                    {transactionDetails.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono text-xs font-normal text-gray-700">
                    {transactionDetails.transactionId}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Recipient</span>
                  <span className="font-normal text-gray-700">
                    {transactionDetails.recipient}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowTransactionModal(false);
                  setShowRequestModal(false);
                }}
                className="mt-4 w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
