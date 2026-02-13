'use client';
/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  HelpCircle,
  Menu,
  ChevronDown,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { dashboardNavigation } from '@/config/navigation';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '@/lib/avatar';
import { buildBackendUrl } from '@/lib/api/backend-url';
import { logout } from '@/app/login/actions';

type DashboardLayoutProps = {
  children: React.ReactNode;
};

type NotificationItem = {
  id: number;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  sentAt: string;
};

/**
 * Reusable dashboard shell that wires up sidebar and header navigation.
 * Downstream pages render inside the main content area.
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(
    null
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const [user, setUser] = useState<{
    id: string;
    employeeId?: string | null;
    email?: string | null;
    fullName?: string | null;
    role?: string | null;
    department?: string | null;
    gender?: string | null;
    isTeamLead?: boolean;
    avatarUrl?: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getCookieValue = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(
      new RegExp(`(?:^|;\\s*)${name}=([^;]*)`)
    );
    const value = match?.[1];
    return value ? decodeURIComponent(value) : null;
  };

  const formatNotificationTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString();
  };

  const loadNotifications = async (silent = false) => {
    const token = getCookieValue('teamlead-auth-token');
    if (!token) return;
    if (!silent) setNotificationLoading(true);
    setNotificationError(null);
    try {
      const response = await fetch(buildBackendUrl('/api/notifications'), {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data = await response.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      setNotificationError('Unable to load notifications.');
    } finally {
      if (!silent) setNotificationLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    const token = getCookieValue('teamlead-auth-token');
    if (!token) return;
    try {
      const response = await fetch(
        buildBackendUrl('/api/notifications/mark-all-read'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error('Failed to mark notifications');
      }
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true }))
      );
      setUnreadCount(0);
    } catch {
      setNotificationError('Unable to mark all as read.');
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (item.isRead) return;
    const token = getCookieValue('teamlead-auth-token');
    if (!token) return;
    try {
      const response = await fetch(
        buildBackendUrl(`/api/notifications/${item.id}/read`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error('Failed to mark notification');
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch {
      setNotificationError('Unable to mark notification as read.');
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Read user info from cookie (set by login action)
        const userInfoCookie = document.cookie
          .split('; ')
          .find((row) => row.startsWith('teamlead-user-info='));

        if (userInfoCookie) {
          const cookieValue = userInfoCookie.split('=')[1];
          if (cookieValue) {
            const userInfo = JSON.parse(decodeURIComponent(cookieValue));
            setUser({
              id: userInfo.id,
              employeeId: userInfo.employeeId || userInfo.id,
              email: userInfo.email,
              fullName: userInfo.fullName,
              role: userInfo.role,
              department: userInfo.department,
              gender: userInfo.gender,
              isTeamLead: userInfo.isTeamLead,
              avatarUrl: userInfo.avatarUrl,
            });
          }
        }
      } catch (e) {
        console.error('Error parsing user info:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    loadNotifications(true);
  }, []);

  useEffect(() => {
    if (!notificationOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationOpen]);

  useEffect(() => {
    if (notificationOpen) {
      loadNotifications(true);
    }
  }, [notificationOpen]);

  const toggleMobileNav = () => setMobileNavOpen((open) => !open);

  const avatarUrl = getAvatarUrl({
    avatar_url: user?.avatarUrl,
    gender: user?.gender,
    employee_id: user?.employeeId,
    email: user?.email,
    full_name: user?.fullName,
  });

  const renderNavLink = (
    item: (typeof dashboardNavigation)[number],
    opts?: { onNavigate?: () => void; className?: string }
  ) => {
    const { href, title, icon: Icon } = item;
    const isActive =
      href === '/dashboard'
        ? pathname === '/dashboard' || pathname === '/dashboard/'
        : pathname === href || pathname?.startsWith(`${href}/`);

    return (
      <Link
        key={href}
        href={href}
        onClick={() => {
          setMobileNavOpen(false);
          opts?.onNavigate?.();
        }}
        aria-label={title}
        aria-current={isActive ? 'page' : undefined}
        title={title}
        className={cn(
          'relative flex items-center gap-2.5 rounded-md border border-transparent px-3 py-2 text-sm font-medium transition-colors',
          opts?.className,
          isCollapsed && 'h-10 w-10 justify-center px-0',
          isActive
            ? 'bg-primary text-white shadow-sm'
            : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
        )}
      >
        {Icon ? (
          <Icon className="h-4 w-4 text-current" aria-hidden="true" />
        ) : null}
        {!isCollapsed ? <span>{title}</span> : null}
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-slate-200/60 bg-[#F7F7F8] transition-[width] duration-200 lg:flex',
          isCollapsed ? 'w-[80px]' : 'w-[240px]'
        )}
      >
        <div
          className={cn(
            'flex h-[64px] items-center justify-between border-b border-slate-200/60',
            isCollapsed ? 'px-4' : 'px-6'
          )}
        >
          <Link href="/dashboard" className="flex items-center gap-2">
            {/* Logo */}
            <img
              src="/worksight_logo.png"
              alt="WorkSight"
              className={cn('h-8 w-auto object-contain', isCollapsed && 'h-7')}
            />
            {!isCollapsed ? (
              <span className="text-lg font-semibold tracking-tight text-gray-800">
                WorkSight
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="hidden h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-white/70 hover:text-slate-900 lg:inline-flex"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6">
          <div className="mb-2 px-3">
            <nav
              className={cn(
                'mt-2 flex flex-col gap-1',
                isCollapsed && 'items-center gap-2'
              )}
            >
              {dashboardNavigation.map((item) =>
                renderNavLink(item, {
                  className: isCollapsed ? 'px-0' : undefined,
                })
              )}
            </nav>
          </div>
        </div>

        {/* Version Display */}
        <div className="border-t border-border/40 px-6 py-4">
          <p className="text-[11px] font-normal text-muted-foreground/70">
            Team Lead v1.0
          </p>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div
        className={cn(
          'flex flex-1 flex-col',
          isCollapsed ? 'lg:pl-[80px]' : 'lg:pl-[240px]'
        )}
      >
        {/* Top Header - Sticky, Height 64px, z-30 */}
        <header className="sticky top-0 z-30 flex h-[64px] items-center gap-4 border-b border-border/40 bg-white/80 px-6 backdrop-blur">
          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={toggleMobileNav}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/50 lg:hidden"
            aria-label="Toggle navigation"
            aria-expanded={mobileNavOpen}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Mobile Logo */}
          <div className="lg:hidden">
            <Link href="/dashboard" className="flex items-center">
              <img
                src="/worksight_logo.png"
                alt="WorkSight"
                className="h-8 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Search */}
          <div className="flex flex-1 items-center px-4">
            {/* Search bar could go here */}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => setNotificationOpen((open) => !open)}
                className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 ? (
                  <span className="absolute right-2 top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ) : null}
              </button>

              {notificationOpen ? (
                <div className="absolute right-0 top-full mt-2 w-[360px] overflow-hidden rounded-xl border border-border/60 bg-white shadow-lg">
                  <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Notifications
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {unreadCount} unread
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-xs font-medium text-primary hover:text-primary/80"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-[360px] overflow-y-auto">
                    {notificationLoading ? (
                      <div className="px-4 py-6 text-sm text-muted-foreground">
                        Loading notifications...
                      </div>
                    ) : null}
                    {!notificationLoading && notificationError ? (
                      <div className="px-4 py-6 text-sm text-red-500">
                        {notificationError}
                      </div>
                    ) : null}
                    {!notificationLoading &&
                    !notificationError &&
                    notifications.length === 0 ? (
                      <div className="px-4 py-6 text-sm text-muted-foreground">
                        No notifications yet.
                      </div>
                    ) : null}
                    {!notificationLoading && !notificationError
                      ? notifications.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleNotificationClick(item)}
                            className={cn(
                              'flex w-full flex-col gap-1 border-b border-border/30 px-4 py-3 text-left transition-colors',
                              item.isRead
                                ? 'bg-white'
                                : 'bg-slate-50/70 hover:bg-slate-50'
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-800">
                                {item.title}
                              </p>
                              <span className="text-[10px] text-muted-foreground">
                                {formatNotificationTime(item.sentAt)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">
                              {item.body}
                            </p>
                            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                              {item.type}
                            </span>
                          </button>
                        ))
                      : null}
                  </div>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              aria-label="Help"
            >
              <HelpCircle className="h-5 w-5" />
            </button>

            {isLoading ? (
              <div className="ml-2 flex items-center gap-3 rounded-md border border-border/40 bg-white py-1.5 pl-2 pr-3">
                <div className="h-7 w-7 animate-pulse rounded-full bg-slate-200" />
                <div className="hidden flex-col items-start gap-1 md:flex">
                  <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
                  <div className="h-2 w-16 animate-pulse rounded bg-slate-200" />
                </div>
              </div>
            ) : (
              <div className="group relative">
                <button className="ml-2 flex items-center gap-3 rounded-md border border-border/40 bg-white py-1.5 pl-2 pr-3 hover:bg-muted/50">
                  <img
                    src={avatarUrl}
                    alt={user?.fullName || 'Team Lead'}
                    className="h-7 w-7 rounded-full object-cover ring-2 ring-gray-50"
                  />
                  <div className="hidden flex-col items-start text-left md:flex">
                    <span className="text-sm font-medium text-gray-700">
                      {user?.fullName || user?.email || 'Team Lead'}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {user?.isTeamLead
                        ? 'Team Lead'
                        : user?.role || 'Team Lead'}
                    </span>
                  </div>
                  <ChevronDown className="hidden h-3 w-3 text-muted-foreground transition-transform group-hover:rotate-180 md:inline" />
                </button>

                {/* Dropdown Menu */}
                <div className="invisible absolute right-0 top-full z-50 mt-2 w-56 rounded-md border border-border/40 bg-white p-2 opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100">
                  <form action={logout}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Mobile Navigation Overlay */}
        <nav
          className={cn(
            'fixed inset-0 z-40 grid place-content-start gap-2 bg-white p-6 lg:hidden',
            mobileNavOpen ? 'block' : 'hidden'
          )}
        >
          <div className="mb-6 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <img
                src="/worksight_logo.png"
                alt="WorkSight"
                className="h-8 w-auto object-contain"
              />
              <span className="text-lg font-semibold tracking-tight text-gray-800">
                WorkSight
              </span>
            </Link>
            <button onClick={() => setMobileNavOpen(false)}>
              <Menu className="h-6 w-6" />
            </button>
          </div>
          {dashboardNavigation.map((item) => renderNavLink(item))}
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
