import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { AuthShell } from './AuthShell';
import { Field, Input } from '@/components/Field';
import { Button } from '@/components/Button';
import { useStore } from '@/store/useStore';

export default function Login() {
  const navigate = useNavigate();
  const login = useStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const res = login(email, password);
    if (!res.ok) {
      setError(
        res.blocked
          ? 'Your account is blocked. Contact your administrator.'
          : 'Invalid email or password.'
      );
      return;
    }
    setError('');
    navigate(res.role === 'admin' ? '/admin' : '/driver');
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Enter your credentials to reach your portal."
      footer={
        <>
          Need an account?{' '}
          <Link to="/signup" className="text-accent hover:text-accent-hover font-medium">
            Continue to sign up
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="username"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
          />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
          />
        </Field>

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 text-[13px] text-exception border border-exception rounded-[3px] px-3 py-2"
            style={{ backgroundColor: 'color-mix(in srgb, var(--exception) 10%, transparent)' }}
          >
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <Button type="submit" variant="primary" className="w-full">
          Sign in
        </Button>
      </form>

      <div className="mt-6 border border-border rounded-[3px] bg-surface-2 p-3">
        <p className="text-2xs font-semibold text-text-2 uppercase tracking-wide">Demo credentials</p>
        <div className="mt-2 space-y-1.5 font-mono text-2xs text-text-2">
          <div className="flex items-center justify-between gap-3">
            <span>admin@gmail.com</span>
            <span className="text-muted">admin@123</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>driver@gmail.com</span>
            <span className="text-muted">driver@123</span>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
