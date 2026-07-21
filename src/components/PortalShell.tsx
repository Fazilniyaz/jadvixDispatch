import { useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Building2, LogOut, Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { useStore, usePermittedModules } from '@/store/useStore';
import { MODULE_BY_KEY } from '@/lib/modules';
import { ROLE_LABELS } from '@/lib/types';
import { cn, initials } from '@/lib/utils';

/**
 * The single shell every portal renders inside. Navigation is generated from
 * the signed-in role's permitted modules, so all six portals look identical
 * and differ only in what they contain.
 */
export function PortalShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const labels = useStore((s) => s.moduleLabels);
  const hubs = useStore((s) => s.hubs);
  const companies = useStore((s) => s.companies);
  const activeHubId = useStore((s) => s.activeHubId);
  const switchHub = useStore((s) => s.switchHub);
  const reminders = useStore((s) => s.reminders);

  const permitted = usePermittedModules();
  if (!user) return null;

  const navItems = permitted
    .map((key) => MODULE_BY_KEY[key])
    .filter(Boolean)
    .map((m) => ({ to: `/app/${m.key}`, label: labels[m.key] ?? m.label, icon: m.icon }));

  const current = [...navItems]
    .sort((a, b) => b.to.length - a.to.length)
    .find((n) => location.pathname === n.to || location.pathname.startsWith(n.to + '/'));
  const pageTitle = current?.label ?? 'Dashboard';

  const company = companies.find((c) => c.id === user.companyId);
  const myHubs = hubs.filter((h) => h.companyId === user.companyId);
  const activeHub = hubs.find((h) => h.id === activeHubId);
  const canSwitchHub = user.role === 'super-admin' && myHubs.length > 0;

  const unread = reminders.filter(
    (r) =>
      !r.read &&
      (r.forRoles.includes(user.role) || r.forEmployeeId === user.employeeId) &&
      (user.role === 'super-admin' ? true : r.hubId === user.hubId)
  ).length;

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  const renderNav = (compact: boolean) => (
    <nav className="flex flex-col gap-0.5 p-2">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={() => setDrawerOpen(false)}
          title={compact ? item.label : undefined}
          className={({ isActive }) =>
            cn(
              'flex items-center h-9 text-[13px] font-medium rounded-[3px] border-l-2',
              compact ? 'justify-center px-0' : 'gap-2.5 px-3',
              isActive
                ? 'bg-surface-2 text-text border-accent'
                : 'text-text-2 hover:text-text hover:bg-surface-2 border-transparent'
            )
          }
        >
          <item.icon size={16} />
          {!compact && <span className="truncate">{item.label}</span>}
        </NavLink>
      ))}
    </nav>
  );

  const portalLabel = ROLE_LABELS[user.role];

  return (
    <div className="h-full flex bg-bg">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        <div
          className={cn(
            'h-14 flex items-center border-b border-border',
            collapsed ? 'justify-center px-0' : 'justify-between px-4'
          )}
        >
          <Link to="/app/dashboard" aria-label="Home">
            <Logo markOnly={collapsed} showProduct={false} />
          </Link>
          {!collapsed && (
            <button
              onClick={toggleSidebar}
              aria-label="Collapse sidebar"
              className="text-muted hover:text-text p-1 rounded-[3px]"
            >
              <PanelLeftClose size={16} />
            </button>
          )}
        </div>

        {collapsed ? (
          <div className="flex justify-center py-2 border-b border-border">
            <button onClick={toggleSidebar} aria-label="Expand sidebar" className="text-muted hover:text-text p-1.5">
              <PanelLeftOpen size={16} />
            </button>
          </div>
        ) : (
          <div className="px-4 py-2 border-b border-border">
            <span className="text-2xs uppercase tracking-wide text-muted">{portalLabel}</span>
            {company && <div className="text-[13px] text-text truncate">{company.name}</div>}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">{renderNav(collapsed)}</div>
        <div className={cn('border-t border-border', collapsed ? 'p-2' : 'p-3')}>
          <UserBlock name={user.name} email={user.email} onLogout={onLogout} compact={collapsed} />
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-surface border-r border-border flex flex-col">
            <div className="h-14 flex items-center justify-between px-4 border-b border-border">
              <Logo showProduct={false} />
              <button onClick={() => setDrawerOpen(false)} aria-label="Close menu" className="text-muted hover:text-text p-1">
                <X size={18} />
              </button>
            </div>
            <div className="px-4 py-2 border-b border-border">
              <span className="text-2xs uppercase tracking-wide text-muted">{portalLabel}</span>
            </div>
            <div className="flex-1 overflow-y-auto">{renderNav(false)}</div>
            <div className="border-t border-border p-3">
              <UserBlock name={user.name} email={user.email} onLogout={onLogout} />
            </div>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 border-b border-border bg-surface">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setDrawerOpen(true)} aria-label="Open menu" className="lg:hidden text-text-2 hover:text-text p-1">
              <Menu size={20} />
            </button>
            <h1 className="font-sans text-sm font-semibold text-text truncate tracking-tight">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hub scope — switchable for Super Admin, pinned for everyone else */}
            {user.role !== 'master' && activeHub && (
              canSwitchHub ? (
                <label className="hidden sm:flex items-center gap-1.5 text-2xs text-text-2">
                  <Building2 size={13} className="text-muted" />
                  <select
                    aria-label="Active hub"
                    value={activeHubId ?? ''}
                    onChange={(e) => switchHub(e.target.value)}
                    className="h-8 bg-surface border border-border rounded-[3px] px-2 text-[13px] text-text cursor-pointer focus:border-accent focus:outline-none"
                  >
                    {myHubs.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1.5 text-2xs text-text-2 border border-border rounded-[3px] px-2 py-1">
                  <Building2 size={12} className="text-muted" />
                  {activeHub.name}
                </span>
              )
            )}
            <Link
              to="/app/reminders"
              aria-label="Reminders"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-[3px] border border-border text-text-2 hover:text-text hover:bg-surface-2"
            >
              <Bell size={15} />
              {unread > 0 && (
                <span
                  className="absolute -top-1 -right-1 grid h-4 min-w-[16px] place-items-center rounded-full px-1 text-[10px] font-semibold text-white tnum"
                  style={{ backgroundColor: 'var(--exception)' }}
                >
                  {unread}
                </span>
              )}
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

function UserBlock({
  name,
  email,
  onLogout,
  compact = false,
}: {
  name: string;
  email: string;
  onLogout: () => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <span title={name} className="grid h-8 w-8 place-items-center bg-surface-2 border border-border rounded-[3px] text-2xs font-semibold text-text-2">
          {initials(name)}
        </span>
        <button onClick={onLogout} aria-label="Log out" className="text-muted hover:text-exception p-1.5 rounded-[3px]">
          <LogOut size={16} />
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center bg-surface-2 border border-border rounded-[3px] text-2xs font-semibold text-text-2">
        {initials(name)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium text-text truncate">{name}</div>
        <div className="text-2xs text-muted truncate">{email}</div>
      </div>
      <button onClick={onLogout} aria-label="Log out" className="text-muted hover:text-exception p-1.5 rounded-[3px]">
        <LogOut size={16} />
      </button>
    </div>
  );
}
