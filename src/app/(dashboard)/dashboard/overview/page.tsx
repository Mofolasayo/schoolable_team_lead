import type { Metadata } from 'next';
import { config } from '@/config';

export const metadata: Metadata = {
  title: `${config.app.name} · Overview`,
};

export default function OverviewPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Welcome to your wallet overview. Access all your financial tools from
          here.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[
          {
            title: 'Dashboard',
            description: 'View balances, cards, and recent activity',
            href: '/dashboard',
          },
          {
            title: 'Transactions',
            description: 'Complete financial history and records',
            href: '/dashboard/transactions',
          },
          {
            title: 'Cards',
            description: 'Manage your virtual and physical cards',
            href: '/dashboard/cards',
          },
          {
            title: 'Analytics',
            description: 'Spending insights and trends',
            href: '/dashboard/analytics',
          },
          {
            title: 'Payments',
            description: 'Send and receive money',
            href: '/dashboard/payments',
          },
          {
            title: 'Settings',
            description: 'Account and security configuration',
            href: '/dashboard/settings',
          },
        ].map((item) => (
          <a
            key={item.title}
            href={item.href}
            className="group rounded-xl border border-border/40 bg-white p-6 shadow-sm transition-all hover:shadow-md"
          >
            <h3 className="text-lg font-semibold group-hover:text-primary">
              {item.title}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {item.description}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
