import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from './AuthShell';
import { Field, Input } from '@/components/Field';
import { Button } from '@/components/Button';

// Dummy signup — any input is accepted; on submit we route to /login.
export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigate('/login');
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Set up access to Jadvix Dispatch. This is a demo — any details are accepted."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:text-accent-hover font-medium">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Full name" htmlFor="name">
          <Input
            id="name"
            autoComplete="name"
            placeholder="Jane Doe"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="Work email" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>
        <Button type="submit" variant="primary" className="w-full">
          Continue
        </Button>
      </form>
    </AuthShell>
  );
}
