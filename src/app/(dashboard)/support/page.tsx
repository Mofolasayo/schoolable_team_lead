import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { config } from '@/config';

export const metadata: Metadata = {
  title: `${config.app.name} · Support`,
};

export default function SupportPage() {
  redirect('/dashboard/announcements');
}
