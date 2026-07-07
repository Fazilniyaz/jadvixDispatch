import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

// Shared frame for signup / login — same design system as the portals.
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-full flex flex-col bg-bg">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 grid place-items-center px-4 py-10">
        <div className="w-full max-w-sm">
          <h1 className="text-xl font-semibold tracking-tight text-text">{title}</h1>
          <p className="mt-1.5 text-[13px] text-text-2">{subtitle}</p>
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-5 text-[13px] text-text-2">{footer}</div>}
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4">
          <p className="text-2xs text-muted">
            © 2026 Jadvix Ltd · Registered in England and Wales (Company No. 16055823)
          </p>
        </div>
      </footer>
    </div>
  );
}
