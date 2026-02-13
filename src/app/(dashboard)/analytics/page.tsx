import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { config } from '@/config';

export const metadata: Metadata = {
  title: `${config.app.name} · Analytics`,
};

export default function AnalyticsPage() {
  redirect('/dashboard/analytics');
}
