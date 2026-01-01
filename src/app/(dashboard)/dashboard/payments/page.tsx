import type { Metadata } from 'next';
import { config } from '@/config';
import { ArrowDownToLine, ArrowUpFromLine, QrCode, Send } from 'lucide-react';

export const metadata: Metadata = {
  title: `${config.app.name} · Payments`,
};

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground">
          Send and receive money with ease
        </p>
      </div>

      {/* Payment Options Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <button className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center transition-all hover:border-primary hover:shadow-md">
          <div className="rounded-full bg-blue-100 p-4 transition-colors group-hover:bg-blue-500 dark:bg-blue-900/20">
            <Send className="h-6 w-6 text-blue-600 group-hover:text-white dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold">Send Money</h3>
            <p className="text-sm text-muted-foreground">
              Transfer to contacts
            </p>
          </div>
        </button>

        <button className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center transition-all hover:border-primary hover:shadow-md">
          <div className="rounded-full bg-green-100 p-4 transition-colors group-hover:bg-green-500 dark:bg-green-900/20">
            <ArrowDownToLine className="h-6 w-6 text-green-600 group-hover:text-white dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold">Request Money</h3>
            <p className="text-sm text-muted-foreground">
              Get payments from others
            </p>
          </div>
        </button>

        <button className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center transition-all hover:border-primary hover:shadow-md">
          <div className="rounded-full bg-purple-100 p-4 transition-colors group-hover:bg-purple-500 dark:bg-purple-900/20">
            <QrCode className="h-6 w-6 text-purple-600 group-hover:text-white dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold">QR Pay</h3>
            <p className="text-sm text-muted-foreground">
              Scan to pay or receive
            </p>
          </div>
        </button>

        <button className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center transition-all hover:border-primary hover:shadow-md">
          <div className="rounded-full bg-orange-100 p-4 transition-colors group-hover:bg-orange-500 dark:bg-orange-900/20">
            <ArrowUpFromLine className="h-6 w-6 text-orange-600 group-hover:text-white dark:text-orange-400" />
          </div>
          <div>
            <h3 className="font-semibold">Bank Transfer</h3>
            <p className="text-sm text-muted-foreground">
              Send to bank accounts
            </p>
          </div>
        </button>
      </div>

      {/* Placeholder Content */}
      <div className="rounded-2xl border bg-card p-12 text-center">
        <div className="mx-auto max-w-md space-y-4">
          <div className="mx-auto w-fit rounded-full bg-primary/10 p-4">
            <Send className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">
            Payment Features Coming Soon
          </h2>
          <p className="text-sm text-muted-foreground">
            This page will enable seamless money transfers, QR code payments,
            bill payments, and beneficiary management with secure PIN
            verification.
          </p>
        </div>
      </div>
    </div>
  );
}
