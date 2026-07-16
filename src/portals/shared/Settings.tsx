import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, KeyRound, LogOut, RotateCcw, User } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/Card';
import { Button } from '@/components/Button';
import { Field, Input } from '@/components/Field';
import { useCurrentEmployee, useStore, type ThemePref } from '@/store/useStore';
import { defaultModuleLabels } from '@/data/seed';
import type { ModuleKey } from '@/lib/types';

const MODULE_ORDER: ModuleKey[] = [
  'dashboard',
  'products',
  'employees',
  'shifts',
  'bays',
  'routes',
  'leave',
  'communication',
  'vehicles',
  'settings',
];

const THEME_OPTIONS: { value: ThemePref; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export default function Settings() {
  const navigate = useNavigate();
  const labels = useStore((s) => s.moduleLabels);
  const setModuleLabel = useStore((s) => s.setModuleLabel);
  const resetModuleLabels = useStore((s) => s.resetModuleLabels);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const maxBays = useStore((s) => s.maxBays);
  const setMaxBays = useStore((s) => s.setMaxBays);
  const bays = useStore((s) => s.bays);
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);
  const updateProfile = useStore((s) => s.updateProfile);
  const me = useCurrentEmployee();

  const isAdmin = user?.role === 'admin';

  // Bays can't be numbered below the highest one already in use.
  const minBays = Math.max(1, ...bays.map((b) => b.number));
  // Local text state lets the admin type freely; we clamp only on commit (blur/Enter).
  const [maxBaysInput, setMaxBaysInput] = useState(String(maxBays));
  const commitMaxBays = () => {
    const n = Math.max(minBays, Math.floor(Number(maxBaysInput)) || minBays);
    setMaxBays(n);
    setMaxBaysInput(String(n));
  };

  // Profile form
  const [name, setName] = useState(user?.name ?? '');
  const [contactNo, setContactNo] = useState(me?.contactNo ?? '');
  const [profileSaved, setProfileSaved] = useState(false);

  const profileDirty = name.trim() !== (user?.name ?? '') || contactNo !== (me?.contactNo ?? '');

  const saveProfile = () => {
    updateProfile({ name: name.trim(), ...(me ? { contactNo } : {}) });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  // Password form (dummy)
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const changePassword = () => {
    if (!current) return setPwMsg({ ok: false, text: 'Enter your current password.' });
    if (next.length < 6) return setPwMsg({ ok: false, text: 'New password must be at least 6 characters.' });
    if (next !== confirm) return setPwMsg({ ok: false, text: 'New passwords do not match.' });
    setCurrent('');
    setNext('');
    setConfirm('');
    setPwMsg({ ok: true, text: 'Password updated (demo — not persisted).' });
  };

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <PageHeader
        title={labels.settings}
        description="Manage your profile, password, appearance and account."
      />

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Profile */}
        <Card>
          <CardHeader title="Profile" subtitle="Your name and contact details." />
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <span
                className="grid h-11 w-11 place-items-center rounded-full font-display text-base font-semibold"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent) 14%, transparent)',
                  color: 'var(--accent)',
                }}
              >
                {(user?.name ?? '?').charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-text truncate">{user?.name}</div>
                <div className="text-2xs text-muted capitalize">{user?.role}</div>
              </div>
            </div>

            <Field label="Full name" htmlFor="pf-name">
              <Input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Email" htmlFor="pf-email">
                <Input id="pf-email" className="font-mono" value={user?.email ?? ''} readOnly />
              </Field>
              <Field label="Role" htmlFor="pf-role">
                <Input id="pf-role" className="capitalize" value={user?.role ?? ''} readOnly />
              </Field>
            </div>

            {me && (
              <>
                <Field label="Contact number" htmlFor="pf-contact">
                  <Input
                    id="pf-contact"
                    className="font-mono"
                    value={contactNo}
                    onChange={(e) => setContactNo(e.target.value)}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Vehicle" htmlFor="pf-vehicle">
                    <Input id="pf-vehicle" className="font-mono" value={me.vehicleNo} readOnly />
                  </Field>
                  <Field label="Shift" htmlFor="pf-shift">
                    <Input id="pf-shift" value={me.shift || 'Unassigned'} readOnly />
                  </Field>
                </div>
              </>
            )}

            <div className="flex items-center gap-3 pt-1">
              <Button variant="primary" onClick={saveProfile} disabled={!name.trim() || !profileDirty}>
                <User size={15} />
                Save profile
              </Button>
              {profileSaved && (
                <span className="inline-flex items-center gap-1 text-2xs text-delivered">
                  <Check size={13} />
                  Saved
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Change password (dummy) */}
        <Card>
          <CardHeader title="Change password" subtitle="Demo only — not stored anywhere." />
          <div className="p-4 space-y-4">
            <Field label="Current password" htmlFor="pw-current">
              <Input
                id="pw-current"
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="New password" htmlFor="pw-new">
                <Input
                  id="pw-new"
                  type="password"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </Field>
              <Field label="Confirm new password" htmlFor="pw-confirm">
                <Input
                  id="pw-confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter new password"
                />
              </Field>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Button
                variant="secondary"
                onClick={changePassword}
                disabled={!current && !next && !confirm}
              >
                <KeyRound size={15} />
                Update password
              </Button>
              {pwMsg && (
                <span
                  className="text-2xs"
                  style={{ color: pwMsg.ok ? 'var(--delivered)' : 'var(--exception)' }}
                >
                  {pwMsg.text}
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader title="Appearance" subtitle="Theme is saved to this browser." />
          <div className="p-4">
            <div className="grid grid-cols-3 gap-2">
              {THEME_OPTIONS.map((opt) => {
                const active = theme === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={
                      'h-9 text-[13px] font-medium rounded-[3px] border ' +
                      (active
                        ? 'bg-accent border-accent text-white'
                        : 'bg-surface border-border text-text-2 hover:bg-surface-2')
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader title="Account" />
          <div className="p-4 space-y-3">
            <div className="text-[13px]">
              <div className="text-muted text-2xs uppercase tracking-wide">Signed in as</div>
              <div className="text-text font-medium mt-0.5">{user?.name}</div>
              <div className="font-mono text-2xs text-text-2">{user?.email}</div>
            </div>
            <Button variant="danger" className="w-full" onClick={onLogout}>
              <LogOut size={16} />
              Log out
            </Button>
          </div>
        </Card>
      </div>

      {/* Bay configuration — admin only */}
      {isAdmin && (
        <Card className="mt-4">
          <CardHeader
            title="Bay configuration"
            subtitle="Sets how many numbered bays exist. Bay Management only allows numbers within this range."
          />
          <div className="p-4">
            <div className="grid sm:grid-cols-[12rem_1fr] items-start gap-3">
              <Field
                label="Maximum bays"
                htmlFor="max-bays"
                hint={minBays > 1 ? `At least ${minBays} (bays already in use)` : '1 or more'}
              >
                <Input
                  id="max-bays"
                  type="number"
                  min={minBays}
                  className="tnum"
                  value={maxBaysInput}
                  onChange={(e) => setMaxBaysInput(e.target.value)}
                  onBlur={commitMaxBays}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      commitMaxBays();
                    }
                  }}
                />
              </Field>
              <p className="text-2xs text-muted sm:pt-7">
                {bays.length} of {maxBays} bays currently in use. Only bay numbers 1–{maxBays} can be
                assigned.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Module labels — admin only */}
      {isAdmin && (
        <Card className="mt-4">
          <CardHeader
            title="Module labels"
            subtitle="Renaming updates the sidebar and page titles across the app instantly."
            action={
              <Button variant="secondary" size="sm" onClick={resetModuleLabels}>
                <RotateCcw size={14} />
                Reset to defaults
              </Button>
            }
          />
          <div className="p-4 grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
            {MODULE_ORDER.map((key) => (
              <div key={key} className="grid grid-cols-[9rem_1fr] items-center gap-3">
                <label htmlFor={`ml-${key}`} className="text-[13px] text-text-2 truncate">
                  <span className="text-muted">Default:</span> {defaultModuleLabels[key]}
                </label>
                <Input
                  id={`ml-${key}`}
                  value={labels[key]}
                  onChange={(e) => setModuleLabel(key, e.target.value || defaultModuleLabels[key])}
                />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
