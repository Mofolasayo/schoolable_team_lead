import type { Metadata } from 'next';
import Image from 'next/image';
import {
  Lock,
  Smartphone,
  Upload,
  Edit,
  Trash2,
  Plus,
  Shield,
  Mail,
  Phone,
  MapPin,
  Briefcase,
} from 'lucide-react';
import { config } from '@/config';

export const metadata: Metadata = {
  title: `${config.app.name} · Settings`,
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-normal text-gray-800">Settings</h1>
        <p className="text-xs text-muted-foreground">
          Manage your account, security, and preferences.
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Profile Details */}
          <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-sm font-normal text-gray-700">
                Profile details
              </h2>
              <p className="text-xs text-muted-foreground">
                Update your personal information
              </p>
            </div>

            {/* Profile Photo */}
            <div className="mb-5 flex items-start gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-full bg-gradient-to-br from-blue-600 to-blue-700">
                <Image
                  src="/man.jpg"
                  alt="Profile"
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
              <div className="flex-1">
                <div className="text-sm font-normal text-gray-700">
                  Profile photo
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  JPG or PNG. Max 2MB.
                </p>
                <button className="flex items-center gap-2 rounded-lg border border-border/40 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50">
                  <Upload className="h-3.5 w-3.5" />
                  Upload new photo
                </button>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs text-muted-foreground">
                    First name
                  </label>
                  <input
                    type="text"
                    defaultValue="Alex"
                    className="w-full rounded-lg border border-border/40 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-muted-foreground">
                    Last name
                  </label>
                  <input
                    type="text"
                    defaultValue="Johnson"
                    className="w-full rounded-lg border border-border/40 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    defaultValue="alex.johnson@company.com"
                    className="w-full rounded-lg border border-border/40 py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">
                  Phone number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel"
                    defaultValue="+234 803 456 7890"
                    className="w-full rounded-lg border border-border/40 py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">
                  Business name
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    defaultValue="Allpro Solutions Ltd"
                    className="w-full rounded-lg border border-border/40 py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <textarea
                    defaultValue="15 Admiralty Way, Lekki Phase 1, Lagos, Nigeria"
                    rows={2}
                    className="w-full rounded-lg border border-border/40 py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90">
                  Save changes
                </button>
                <button className="rounded-lg border border-border/40 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50">
                  Cancel
                </button>
              </div>
            </div>
          </div>

          {/* Linked Bank Accounts */}
          <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-sm font-normal text-gray-700">
                  Linked bank accounts
                </h2>
                <p className="text-xs text-muted-foreground">
                  Manage connected accounts for transfers
                </p>
              </div>
              <button className="flex items-center gap-2 rounded-lg border border-primary bg-transparent px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10">
                <Plus className="h-3.5 w-3.5" />
                Link account
              </button>
            </div>

            <div className="space-y-3">
              {/* Account 1 */}
              <div className="rounded-lg border border-border/40 p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Image
                      src="/access_bank.png"
                      alt="Access Bank logo"
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-md object-contain"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        Access Bank • Business
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        Instant
                      </div>
                    </div>
                  </div>
                  <button className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/50">
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
                <div className="mb-2 font-mono text-sm text-gray-700">
                  0123 456 789
                </div>
                <div className="flex items-center gap-2">
                  {/* <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                                        Primary payout
                                    </span> */}
                </div>
              </div>

              {/* Account 2 */}
              <div className="rounded-lg border border-border/40 p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Image
                      src="/gtbank.png"
                      alt="GTBank logo"
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-md object-contain"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        GTBank
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        NUBAN
                      </div>
                    </div>
                  </div>
                  <button className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/50">
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
                <div className="mb-2 font-mono text-sm text-gray-700">
                  0532 013 000
                </div>
                {/* <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                                        Top-ups only
                                    </span>
                                </div> */}
              </div>

              {/* Account 3 */}
              <div className="rounded-lg border border-border/40 p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Image
                      src="/zenith.png"
                      alt="Zenith Bank logo"
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-md object-contain"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        Zenith Bank USD
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        Domiciliary
                      </div>
                    </div>
                  </div>
                  <button className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/50">
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
                <div className="mb-2 font-mono text-sm text-gray-700">
                  5012 345 678
                </div>
                {/* <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                        FX transfers
                                    </span>
                                </div> */}
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-sm font-normal text-gray-700">
                Notification preferences
              </h2>
              <p className="text-xs text-muted-foreground">
                Choose what updates you receive
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  label: 'Transaction alerts',
                  description: 'Get notified for every transaction',
                  enabled: true,
                },
                {
                  label: 'Weekly summary',
                  description: 'Receive spending insights weekly',
                  enabled: true,
                },
                {
                  label: 'Marketing emails',
                  description: 'Product updates and offers',
                  enabled: false,
                },
                {
                  label: 'Security alerts',
                  description: 'Login attempts and changes',
                  enabled: true,
                },
              ].map((pref, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-normal text-gray-700">
                      {pref.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {pref.description}
                    </div>
                  </div>
                  <div
                    className={`h-5 w-9 rounded-full p-0.5 ${pref.enabled ? 'bg-primary' : 'bg-gray-300'}`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full bg-white transition-transform ${
                        pref.enabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Security Options */}
          <div className="rounded-xl border border-border/40 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-sm font-normal text-gray-700">Security</h2>
              <p className="text-xs text-muted-foreground">
                Protect your account
              </p>
            </div>

            <div className="space-y-3">
              <button className="flex w-full items-start gap-3 rounded-lg border border-border/40 p-3 text-left transition-colors hover:bg-muted/30">
                <Lock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-normal text-gray-700">
                    Change PIN
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Update your 4-digit PIN
                  </div>
                </div>
              </button>

              <button className="flex w-full items-start gap-3 rounded-lg border border-border/40 p-3 text-left transition-colors hover:bg-muted/30">
                <Shield className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-normal text-gray-700">
                    Change password
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Update login password
                  </div>
                </div>
              </button>

              <button className="flex w-full items-start gap-3 rounded-lg border border-border/40 p-3 text-left transition-colors hover:bg-muted/30">
                <Smartphone className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-normal text-gray-700">
                    Two-factor authentication
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="text-emerald-600">Enabled</span> • SMS
                    verification
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Login Devices */}
          <div className="rounded-xl border border-border/40 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-sm font-normal text-gray-700">
                Login devices
              </h2>
              <p className="text-xs text-muted-foreground">Recent activity</p>
            </div>

            <div className="space-y-3">
              {[
                {
                  device: 'MacBook Pro',
                  location: 'Lagos, Nigeria',
                  time: 'Active now',
                  current: true,
                },
                {
                  device: 'iPhone 14 Pro',
                  location: 'Lagos, Nigeria',
                  time: '2 hours ago',
                  current: false,
                },
                {
                  device: 'Chrome on Windows',
                  location: 'Abuja, Nigeria',
                  time: '3 days ago',
                  current: false,
                },
              ].map((device, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between rounded-lg border border-border/40 p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-muted/40 p-2">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-sm font-normal text-gray-700">
                        {device.device}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {device.location} • {device.time}
                      </div>
                      {device.current && (
                        <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                          Current device
                        </span>
                      )}
                    </div>
                  </div>
                  {!device.current && (
                    <button className="text-muted-foreground transition-colors hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <div className="mb-4">
              <h2 className="text-sm font-medium text-red-900">Danger zone</h2>
              <p className="text-xs text-red-700">Irreversible actions</p>
            </div>

            <button className="w-full rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100">
              Delete account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
