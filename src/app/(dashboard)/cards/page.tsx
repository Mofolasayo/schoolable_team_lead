'use client';

import { useState } from 'react';
import {
  CreditCard as CreditCardIcon,
  Plus,
  Lock,
  TrendingUp,
  Globe,
  Shield,
  Eye,
  Copy,
  ChevronRight,
} from 'lucide-react';

const cards = [
  {
    id: 'aurora',
    name: 'Aurora Wallet',
    type: 'Virtual',
    last4: '4829',
    fullNumber: '4532 •••• •••• 4829',
    cardholder: 'Alex Johnson',
    expiry: '08/27',
    cvv: '234',
    gradient: 'from-blue-600 via-blue-700 to-blue-900',
    textColor: 'text-blue-200',
    status: 'Active',
    transactions: [
      {
        merchant: 'Notion Labs',
        amount: -16639.6,
        date: '21 Feb',
        time: '10:14',
      },
      {
        merchant: 'Amazon Web Services',
        amount: -8500.0,
        date: '20 Feb',
        time: '14:22',
      },
      {
        merchant: 'Cafe Central',
        amount: -1250.0,
        date: '20 Feb',
        time: '09:18',
      },
      {
        merchant: 'Domain renewal',
        amount: -3850.0,
        date: '19 Feb',
        time: '14:03',
      },
      { merchant: 'Figma Pro', amount: -5400.0, date: '18 Feb', time: '11:15' },
    ],
    dailySpent: 15420,
    dailyLimit: 50000,
    monthlySpent: 128540,
    monthlyLimit: 500000,
  },
  {
    id: 'business',
    name: 'Business Debit',
    type: 'Physical',
    last4: '2910',
    fullNumber: '5234 •••• •••• 2910',
    cardholder: 'Alex Johnson',
    expiry: '12/26',
    cvv: '891',
    gradient: 'from-emerald-600 via-emerald-700 to-emerald-900',
    textColor: 'text-emerald-200',
    status: 'Active',
    transactions: [
      {
        merchant: 'City Transport',
        amount: -2500.0,
        date: '21 Feb',
        time: '08:02',
      },
      {
        merchant: 'Office Supplies',
        amount: -12450.0,
        date: '19 Feb',
        time: '16:30',
      },
      {
        merchant: 'Restaurant Bistro',
        amount: -8900.0,
        date: '18 Feb',
        time: '19:45',
      },
      {
        merchant: 'Fuel Station',
        amount: -6200.0,
        date: '17 Feb',
        time: '07:15',
      },
      {
        merchant: 'Grocery Store',
        amount: -15300.0,
        date: '16 Feb',
        time: '18:20',
      },
    ],
    dailySpent: 8200,
    dailyLimit: 75000,
    monthlySpent: 245800,
    monthlyLimit: 750000,
  },
];

const securitySettings = [
  { id: '3d-secure', label: '3D Secure', description: 'Online verification' },
  { id: 'atm', label: 'ATM withdrawals', description: 'Cash withdrawals' },
  {
    id: 'foreign',
    label: 'Foreign transactions',
    description: 'International use',
  },
  { id: 'contactless', label: 'Contactless', description: 'Tap to pay' },
];

export default function CardsPage() {
  const [selectedCardId, setSelectedCardId] = useState(cards[0]?.id);
  const selectedCard =
    cards.find((card) => card.id === selectedCardId) ?? cards[0];

  // State for each toggle - all enabled by default
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({
    '3d-secure': true,
    atm: true,
    foreign: true,
    contactless: true,
  });

  const handleToggle = (settingId: string) => {
    setToggleStates((prev) => ({
      ...prev,
      [settingId]: !prev[settingId],
    }));
  };

  if (!selectedCard) {
    return <div>No cards available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-normal text-gray-800">Cards</h1>
          <p className="text-xs text-muted-foreground">
            Manage your physical and virtual cards.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Create card
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Cards Display - Grid Layout */}
          <div className="grid grid-cols-1 gap-4 p-1 sm:grid-cols-2">
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => setSelectedCardId(card.id)}
                className={`group relative h-52 w-full overflow-visible rounded-xl bg-gradient-to-br ${card.gradient} p-5 text-left text-white shadow-lg transition-all hover:shadow-xl ${
                  selectedCardId === card.id
                    ? 'ring-[3px] ring-primary ring-offset-2'
                    : ''
                }`}
              >
                {/* Card Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white" />
                  <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white" />
                </div>

                {/* Card Content */}
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[10px] font-medium uppercase tracking-wide opacity-70">
                        {card.type}
                      </div>
                      <div className="mt-0.5 text-sm font-medium">
                        {card.name}
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide">
                      {card.status}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="font-mono text-base tracking-wider">
                      {card.fullNumber}
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-[9px] uppercase tracking-wide opacity-70">
                          Cardholder
                        </div>
                        <div className="text-xs font-medium">
                          {card.cardholder}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] uppercase tracking-wide opacity-70">
                          Expires
                        </div>
                        <div className="text-xs font-medium">{card.expiry}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Recent Transactions - Dynamic based on selected card */}
          <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-sm font-normal text-gray-700">
                  Recent transactions
                </h2>
                <p className="text-xs text-muted-foreground">
                  Last 5 on {selectedCard.name}
                </p>
              </div>
              <button className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80">
                View all
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            <div className="space-y-2">
              {selectedCard.transactions.map((transaction, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-border/40 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-muted/40 p-2">
                      <CreditCardIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-sm font-normal text-gray-700">
                        {transaction.merchant}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {transaction.date} • {transaction.time}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-normal text-gray-700">
                    ₦ {Math.abs(transaction.amount).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Controls */}
          <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-sm font-normal text-gray-700">
                Quick controls
              </h2>
              <p className="text-xs text-muted-foreground">
                Manage settings for {selectedCard.name}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="flex flex-col items-start gap-2 rounded-lg border border-border/40 bg-muted/20 p-4 text-left transition-colors hover:bg-muted/40">
                <Lock className="h-5 w-5 text-primary" />
                <div className="text-sm font-normal text-gray-700">
                  Freeze card
                </div>
                <div className="text-xs text-muted-foreground">
                  Temporarily block all transactions
                </div>
              </button>

              <button className="flex flex-col items-start gap-2 rounded-lg border border-border/40 bg-muted/20 p-4 text-left transition-colors hover:bg-muted/40">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div className="text-sm font-normal text-gray-700">
                  Set spending limit
                </div>
                <div className="text-xs text-muted-foreground">
                  Daily or monthly caps
                </div>
              </button>

              <button className="flex flex-col items-start gap-2 rounded-lg border border-border/40 bg-muted/20 p-4 text-left transition-colors hover:bg-muted/40">
                <Globe className="h-5 w-5 text-primary" />
                <div className="text-sm font-normal text-gray-700">
                  Online payments
                </div>
                <div className="text-xs text-muted-foreground">
                  Enable/disable e-commerce
                </div>
              </button>

              <button className="flex flex-col items-start gap-2 rounded-lg border border-border/40 bg-muted/20 p-4 text-left transition-colors hover:bg-muted/40">
                <Shield className="h-5 w-5 text-primary" />
                <div className="text-sm font-normal text-gray-700">
                  Security settings
                </div>
                <div className="text-xs text-muted-foreground">
                  3D Secure, notifications
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Shows selected card details */}
        <div className="space-y-6">
          {/* Card Details - Shows selected card */}
          <div className="rounded-xl border border-border/40 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-sm font-normal text-gray-700">
                Card details
              </h2>
              <p className="text-xs text-muted-foreground">
                {selectedCard.name} ({selectedCard.type})
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <div className="mb-1.5 text-xs text-muted-foreground">
                  Card number
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5">
                  <span className="font-mono text-sm font-normal text-gray-700">
                    •••• •••• •••• {selectedCard.last4}
                  </span>
                  <button className="text-muted-foreground hover:text-foreground">
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="mb-1.5 text-xs text-muted-foreground">
                    Expiry
                  </div>
                  <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5 text-sm font-normal text-gray-700">
                    {selectedCard.expiry}
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 text-xs text-muted-foreground">
                    CVV
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5">
                    <span className="text-sm">•••</span>
                    <button className="text-muted-foreground hover:text-foreground">
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border/40 px-3 py-2.5 text-sm font-normal text-gray-700 hover:bg-muted/50">
              <Copy className="h-4 w-4" />
              Copy details
            </button>
          </div>

          {/* Spending Limits - Dynamic based on selected card */}
          <div className="rounded-xl border border-border/40 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-sm font-normal text-gray-700">
                Spending limits
              </h2>
              <p className="text-xs text-muted-foreground">
                Current usage on {selectedCard.name}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Daily</span>
                  <span className="font-normal text-gray-700">
                    ₦ {selectedCard.dailySpent.toLocaleString()} / ₦{' '}
                    {selectedCard.dailyLimit.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${(selectedCard.dailySpent / selectedCard.dailyLimit) * 100}%`,
                    }}
                  />
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  {Math.round(
                    (selectedCard.dailySpent / selectedCard.dailyLimit) * 100
                  )}
                  % used
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Monthly</span>
                  <span className="font-normal text-gray-700">
                    ₦ {selectedCard.monthlySpent.toLocaleString()} / ₦{' '}
                    {selectedCard.monthlyLimit.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: `${(selectedCard.monthlySpent / selectedCard.monthlyLimit) * 100}%`,
                    }}
                  />
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  {Math.round(
                    (selectedCard.monthlySpent / selectedCard.monthlyLimit) *
                      100
                  )}
                  % used
                </div>
              </div>

              <button className="w-full rounded-lg border border-primary bg-transparent px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10">
                Adjust limits
              </button>
            </div>
          </div>

          {/* Card Settings - Toggleable */}
          <div className="rounded-xl border border-border/40 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-sm font-normal text-gray-700">
                Security settings
              </h2>
              <p className="text-xs text-muted-foreground">
                Control card usage
              </p>
            </div>

            <div className="space-y-3">
              {securitySettings.map((setting) => (
                <button
                  key={setting.id}
                  onClick={() => handleToggle(setting.id)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div>
                    <div className="text-sm font-normal text-gray-700">
                      {setting.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {setting.description}
                    </div>
                  </div>
                  <div
                    className={`h-5 w-9 rounded-full p-0.5 transition-colors ${
                      toggleStates[setting.id] ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full bg-white transition-transform ${
                        toggleStates[setting.id]
                          ? 'translate-x-4'
                          : 'translate-x-0'
                      }`}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
