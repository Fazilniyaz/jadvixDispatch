import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Field, Input } from '@/components/Field';
import { Button } from '@/components/Button';
import { useStore } from '@/store/useStore';

const DEMO = [
  { role: 'Master (Jadvix)', email: 'master@jadvix.com', password: 'master@123', hub: '' },
  { role: 'Super Admin', email: 'admin@gmail.com', password: 'admin@123', hub: '' },
  { role: 'Hub Manager', email: 'manager@gmail.com', password: 'manager@123', hub: 'CHN-01' },
  { role: 'Team Leader', email: 'lead@gmail.com', password: 'lead@123', hub: 'CHN-01' },
  { role: 'HR & Finance', email: 'finance@gmail.com', password: 'finance@123', hub: 'CHN-01' },
  { role: 'Driver', email: 'driver@gmail.com', password: 'driver@123', hub: 'CHN-01' },
];

export default function Login() {
  const navigate = useNavigate();
  const login = useStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hubCode, setHubCode] = useState('');
  const [error, setError] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const res = login(email, password, hubCode || undefined);
    if (!res.ok) {
      setError(res.blocked ? 'This account is blocked. Contact your administrator.' : 'Invalid credentials.');
      return;
    }
    setError('');
    navigate('/app/dashboard');
  };

  const useDemo = (d: (typeof DEMO)[number]) => {
    setEmail(d.email);
    setPassword(d.password);
    setHubCode(d.hub);
    setError('');
  };

  return (
    <div className="min-h-full flex flex-col bg-bg">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 grid place-items-center px-4 py-12">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-text leading-tight">Sign in</h1>
          <p className="mt-3 text-sm text-text-2 leading-relaxed">
            One system, six portals. You’ll land in the portal your role belongs to.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
            <Field label="Email" htmlFor="email">
              <Input id="email" type="email" autoComplete="username" placeholder="you@company.com"
                value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} />
            </Field>
            <Field label="Password" htmlFor="password">
              <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••"
                value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} />
            </Field>
            <Field label="Hub code" htmlFor="hub" hint="Only for hub staff and drivers">
              <Input id="hub" className="font-mono" placeholder="e.g. CHN-01"
                value={hubCode} onChange={(e) => { setHubCode(e.target.value); setError(''); }} />
            </Field>

            {error && (
              <div role="alert" className="flex items-center gap-2 text-[13px] text-exception border border-exception rounded-[3px] px-3 py-2"
                style={{ backgroundColor: 'color-mix(in srgb, var(--exception) 10%, transparent)' }}>
                <AlertCircle size={14} />{error}
              </div>
            )}

            <Button type="submit" variant="primary" className="w-full">Sign in</Button>
          </form>

          <div className="mt-6 border border-border rounded-[3px] bg-surface-2 p-3">
            <p className="text-2xs font-semibold text-text-2 uppercase tracking-wide">Demo accounts — click to fill</p>
            <div className="mt-2 space-y-1">
              {DEMO.map((d) => (
                <button key={d.email} onClick={() => useDemo(d)}
                  className="w-full flex items-center justify-between gap-3 text-left rounded-[3px] px-2 py-1.5 hover:bg-surface">
                  <span className="text-2xs font-medium text-text">{d.role}</span>
                  <span className="font-mono text-2xs text-muted truncate">{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4">
          <p className="text-2xs text-muted">© 2026 Jadvix Ltd · Jadvix HubOS</p>
        </div>
      </footer>
    </div>
  );
}
