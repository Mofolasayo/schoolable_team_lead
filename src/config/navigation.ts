import { LayoutDashboard, Users, CheckSquare, Settings, FileText, Megaphone, LucideIcon, Brain, BarChart3, ClipboardList, Target, CalendarDays } from 'lucide-react';

export interface NavigationItem {
  title: string;
  href: string;
  icon: LucideIcon;
  section: string;
}

export const dashboardNavigation: NavigationItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    section: 'main',
  },
  {
    title: 'My Team',
    href: '/dashboard/team',
    icon: Users,
    section: 'main',
  },
  {
    title: 'Tasks',
    href: '/dashboard/tasks',
    icon: CheckSquare,
    section: 'main',
  },
  {
    title: 'Weekly Reports',
    href: '/dashboard/reports',
    icon: FileText,
    section: 'main',
  },
  {
    title: 'Daily Reports',
    href: '/dashboard/daily-reports',
    icon: CalendarDays,
    section: 'main',
  },
  {
    title: 'AI Insights',
    href: '/dashboard/insights',
    icon: Brain,
    section: 'main',
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    section: 'main',
  },
  {
    title: 'Team KPIs',
    href: '/dashboard/kpis',
    icon: Target,
    section: 'main',
  },
  {
    title: 'Individual KPIs',
    href: '/dashboard/individual-kpis',
    icon: ClipboardList,
    section: 'main',
  },
  {
    title: 'Feedback Status',
    href: '/dashboard/peer-feedback-status',
    icon: Users,
    section: 'main',
  },

  {
    title: 'Announcements',
    href: '/dashboard/announcements',
    icon: Megaphone,
    section: 'main',
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    section: 'system',
  },
];
