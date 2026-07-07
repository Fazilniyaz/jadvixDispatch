import { useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Wifi, X, type LucideIcon } from 'lucide-react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { useStore } from '@/store/useStore';
import { cn, initials } from '@/lib/utils';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

interface PortalShellProps {
  navItems: NavItem[];
  portalLabel: string;
}

export function PortalShell({
  navItems,
  portalLabel,
  children,
}: PortalShellProps & { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);

  const waves = useStore((s) => s.waves);
  const shifts = useStore((s) => s.shifts);
  const activeWaveId = useStore((s) => s.activeWaveId);
  const activeWave = waves.find((w) => w.id === activeWaveId);
  const activeShift = shifts.find((s) => s.id === activeWave?.shiftId);

  const current = [...navItems]
    .sort((a, b) => b.to.length - a.to.length)
    .find((n) => location.pathname === n.to || location.pathname.startsWith(n.to + '/'));
  const pageTitle = current?.label ?? portalLabel;

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  const nav = (
    <nav className="flex flex-col gap-0.5 p-2">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => setDrawerOpen(false)}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 px-3 h-9 text-[13px] font-medium rounded-[3px] border-l-2',
              isActive
                ? 'bg-surface-2 text-text border-accent'
                : 'text-text-2 hover:text-text hover:bg-surface-2 border-transparent'
            )
          }
        >
          <item.icon size={16} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="h-full flex bg-bg">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border bg-surface">
        <div className="h-14 flex items-center px-4 border-b border-border">
          <Link to="/">
            <Logo />
          </Link>
        </div>
        <div className="px-4 py-2 border-b border-border">
          <span className="text-2xs uppercase tracking-wide text-muted">{portalLabel}</span>
        </div>
        <div className="flex-1 overflow-y-auto">{nav}</div>
        <div className="border-t border-border p-3">
          <UserBlock name={user?.name ?? 'User'} email={user?.email ?? ''} onLogout={onLogout} />
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-surface border-r border-border flex flex-col">
            <div className="h-14 flex items-center justify-between px-4 border-b border-border">
              <Logo />
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="text-muted hover:text-text p-1"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-4 py-2 border-b border-border">
              <span className="text-2xs uppercase tracking-wide text-muted">{portalLabel}</span>
            </div>
            <div className="flex-1 overflow-y-auto">{nav}</div>
            <div className="border-t border-border p-3">
              <UserBlock
                name={user?.name ?? 'User'}
                email={user?.email ?? ''}
                onLogout={onLogout}
              />
            </div>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 border-b border-border bg-surface">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="lg:hidden text-text-2 hover:text-text p-1"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-sm font-semibold text-text truncate">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-2xs text-text-2 border border-border rounded-[3px] px-2 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-delivered" />
              {activeShift?.name ?? 'Morning'} · Wave {activeWave?.number ?? '—'} active
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 text-2xs text-delivered">
              <Wifi size={13} />
              Connected
            </span>
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
}: {
  name: string;
  email: string;
  onLogout: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center bg-surface-2 border border-border rounded-[3px] text-2xs font-semibold text-text-2">
        {initials(name)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium text-text truncate">{name}</div>
        <div className="text-2xs text-muted truncate">{email}</div>
      </div>
      <button
        onClick={onLogout}
        aria-label="Log out"
        title="Log out"
        className="text-muted hover:text-exception p-1.5 rounded-[3px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <LogOut size={16} />
      </button>
    </div>
  );
}
