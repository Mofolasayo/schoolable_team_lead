import { LayoutDashboard, Users, CheckSquare, Settings, FileText, Megaphone, LucideIcon, Brain } from 'lucide-react';

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
    title: 'AI Insights',
    href: '/dashboard/insights',
    icon: Brain,
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
