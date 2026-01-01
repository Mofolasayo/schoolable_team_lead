import { LayoutDashboard, Users, CheckSquare, Settings, FileText, Megaphone } from 'lucide-react';

export const dashboardNavigation = [
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
    title: 'Reports',
    href: '/dashboard/reports',
    icon: FileText,
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
