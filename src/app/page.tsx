import Link from 'next/link';
import { Button } from '@/components/ui/button';

/* eslint-disable @next/next/no-img-element */

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-24">
      <div className="z-10 w-full max-w-md items-center justify-between font-mono text-sm">
        <div className="mb-8 flex justify-center">
          <img
            src="/schoolable_logo.png"
            alt="Schoolable"
            className="h-24 w-auto object-contain"
          />
        </div>

        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Schoolable Team Lead</h1>
          <p className="text-slate-600">
            Manage your team&apos;s tasks, performance, and goals efficiently.
          </p>
          <div className="pt-4">
            <Link href="/login">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700" size="lg">
                Go to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
