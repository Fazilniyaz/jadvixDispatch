import { Outlet } from 'react-router-dom';
import { CalendarDays, MessageSquare, PackageCheck, PlaneTakeoff, Route as RouteIcon } from 'lucide-react';
import { PortalShell, type NavItem } from '@/components/PortalShell';
import { useStore } from '@/store/useStore';

export default function DriverLayout() {
  const labels = useStore((s) => s.moduleLabels);

  const navItems: NavItem[] = [
    { to: '/driver', label: 'Today', icon: CalendarDays, end: true },
    { to: '/driver/deliveries', label: 'My Deliveries', icon: PackageCheck },
    { to: '/driver/route', label: labels.routes === 'Route Management' ? 'My Route' : `My ${labels.routes}`, icon: RouteIcon },
    { to: '/driver/communication', label: labels.communication, icon: MessageSquare },
    { to: '/driver/leave', label: labels.leave === 'Leave Requests' ? 'Leave' : labels.leave, icon: PlaneTakeoff },
  ];

  return (
    <PortalShell navItems={navItems} portalLabel="Driver">
      <Outlet />
    </PortalShell>
  );
}
