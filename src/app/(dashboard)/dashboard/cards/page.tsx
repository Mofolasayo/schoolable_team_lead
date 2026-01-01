import type { Metadata } from 'next';
import { config } from '@/config';
import { CreditCard, Eye, Lock, Plus } from 'lucide-react';

export const metadata: Metadata = {
  title: `${config.app.name} · Cards`,
};

export default function CardsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">My Cards</h1>
          <p className="text-muted-foreground">
            Manage your virtual and physical cards
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Request New Card
        </button>
      </div>

      {/* Card Controls Info */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 text-center">
          <Lock className="mx-auto h-8 w-8 text-primary" />
          <h3 className="mt-2 font-semibold">Freeze Card</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Instantly freeze your card if lost
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <Eye className="mx-auto h-8 w-8 text-primary" />
          <h3 className="mt-2 font-semibold">View Details</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Access full card information
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <CreditCard className="mx-auto h-8 w-8 text-primary" />
          <h3 className="mt-2 font-semibold">Set Limits</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Control spending limits
          </p>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="rounded-2xl border bg-card p-12 text-center">
        <div className="mx-auto max-w-md space-y-4">
          <div className="mx-auto w-fit rounded-full bg-primary/10 p-4">
            <CreditCard className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Advanced Card Management</h2>
          <p className="text-sm text-muted-foreground">
            This page will feature comprehensive card management tools including
            card creation, PIN management, spending limits, and detailed
            activity tracking.
          </p>
        </div>
      </div>
    </div>
  );
}
