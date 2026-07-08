import { Outlet } from 'react-router-dom';
import { BarChart3, CalendarDays, MessageSquare, PlaneTakeoff, Route as RouteIcon, Settings as SettingsIcon, Target, Wrench } from 'lucide-react';
import { PortalShell, type NavItem } from '@/components/PortalShell';
import { useStore } from '@/store/useStore';

export default function DriverLayout() {
  const labels = useStore((s) => s.moduleLabels);

  const navItems: NavItem[] = [
    { to: '/driver', label: 'Today', icon: CalendarDays, end: true },
    { to: '/driver/stats', label: 'Stats', icon: BarChart3 },
    { to: '/driver/performance', label: 'My Performance', icon: Target },
    { to: '/driver/route', label: 'My Locations', icon: RouteIcon },
    { to: '/driver/communication', label: labels.communication, icon: MessageSquare },
    { to: '/driver/vehicles', label: labels.vehicles, icon: Wrench },
    { to: '/driver/leave', label: labels.leave === 'Leave Requests' ? 'Leave' : labels.leave, icon: PlaneTakeoff },
    { to: '/driver/settings', label: labels.settings, icon: SettingsIcon },
  ];

  return (
    <PortalShell navItems={navItems} portalLabel="Driver">
      <Outlet />
    </PortalShell>
  );
}
