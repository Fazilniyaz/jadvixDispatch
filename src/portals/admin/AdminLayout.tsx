import { Outlet } from 'react-router-dom';
import {
  CalendarClock,
  LayoutDashboard,
  MessageSquare,
  Package,
  PlaneTakeoff,
  Route as RouteIcon,
  Settings as SettingsIcon,
  Users,
  Warehouse,
} from 'lucide-react';
import { PortalShell, type NavItem } from '@/components/PortalShell';
import { useStore } from '@/store/useStore';

export default function AdminLayout() {
  const labels = useStore((s) => s.moduleLabels);

  const navItems: NavItem[] = [
    { to: '/admin', label: labels.dashboard, icon: LayoutDashboard, end: true },
    { to: '/admin/products', label: labels.products, icon: Package },
    { to: '/admin/employees', label: labels.employees, icon: Users },
    { to: '/admin/shifts', label: labels.shifts, icon: CalendarClock },
    { to: '/admin/bays', label: labels.bays, icon: Warehouse },
    { to: '/admin/routes', label: labels.routes, icon: RouteIcon },
    { to: '/admin/leave', label: labels.leave, icon: PlaneTakeoff },
    { to: '/admin/communication', label: labels.communication, icon: MessageSquare },
    { to: '/admin/settings', label: labels.settings, icon: SettingsIcon },
  ];

  return (
    <PortalShell navItems={navItems} portalLabel="Super Admin">
      <Outlet />
    </PortalShell>
  );
}
