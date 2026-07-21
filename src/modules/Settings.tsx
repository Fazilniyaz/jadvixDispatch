import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, LogOut, RotateCcw, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/Card';
import { Button } from '@/components/Button';
import { Field, Input } from '@/components/Field';
import { cn } from '@/lib/utils';
import { useStore, useCurrentEmployee, type ThemePref } from '@/store/useStore';
import { useScopedBays, useScopedCheckIns, useScopedEmployees } from '@/lib/scope';
import { grantableModules } from '@/lib/modules';
import { snapshotToPng } from '@/lib/exporters';
import { today } from '@/data/seed';
import { HUB_AUTHORITY_ROLES, ROLE_LABELS, type ModuleKey, type Role } from '@/lib/types';

const THEMES: { value: ThemePref; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export default function Settings() {
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const logout = useStore((s) => s.logout);
  const labels = useStore((s) => s.moduleLabels);
  const setModuleLabel = useStore((s) => s.setModuleLabel);
  const resetModuleLabels = useStore((s) => s.resetModuleLabels);
  const resetDemo = useStore((s) => s.resetDemo);
  const permissions = useStore((s) => s.permissions);
  const hubPermissions = useStore((s) => s.hubPermissions);
  const toggleHubRoleModule = useStore((s) => s.toggleHubRoleModule);
  const activeHubId = useStore((s) => s.activeHubId);
  const hubs = useStore((s) => s.hubs);
  const me = useCurrentEmployee();
  const activeHub = hubs.find((h) => h.id === activeHubId);

  const employees = useScopedEmployees();
  const bays = useScopedBays(today());
  const checkIns = useScopedCheckIns();

  const isSuper = user?.role === 'super-admin';
  const snapRef = useRef<HTMLDivElement>(null);
  const [snapMsg, setSnapMsg] = useState('');

  const takeSnapshot = async () => {
    if (!snapRef.current) return;
    setSnapMsg('Capturing…');
    try {
      await snapshotToPng(snapRef.current, `hub-snapshot-${today()}`);
      setSnapMsg('Saved as PNG');
    } catch {
      setSnapMsg('Could not capture — try again');
    }
    setTimeout(() => setSnapMsg(''), 2500);
  };

  const onLogout = () => { logout(); navigate('/login'); };

  return (
    <div>
      <PageHeader title={labels.settings} description="Your profile, appearance, and — for Super Admins — who can see what." />

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Profile" />
          <div className="p-4 space-y-3">
            <Field label="Name"><Input value={user?.name ?? ''} readOnly /></Field>
            <Field label="Email"><Input className="font-mono" value={user?.email ?? ''} readOnly /></Field>
            <Field label="Role"><Input value={user ? ROLE_LABELS[user.role] : ''} readOnly /></Field>
            {me && <Field label="Vehicle"><Input className="font-mono" value={me.vehicleNo} readOnly /></Field>}
          </div>
        </Card>

        <Card>
          <CardHeader title="Appearance" subtitle="Saved to this browser." />
          <div className="p-4 grid grid-cols-3 gap-2">
            {THEMES.map((t) => (
              <button key={t.value} onClick={() => setTheme(t.value)}
                className={cn('h-9 text-[13px] font-medium rounded-[3px] border',
                  theme === t.value ? 'bg-accent border-accent text-white' : 'bg-surface border-border text-text-2 hover:bg-surface-2')}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="px-4 pb-4">
            <Button variant="danger" className="w-full" onClick={onLogout}><LogOut size={16} />Log out</Button>
          </div>
        </Card>
      </div>

      {/* Snapshot — captures today's bays, employees and vehicles as a PNG */}
      {user?.role !== 'master' && (
        <Card className="mt-4">
          <CardHeader
            title="Snapshot"
            subtitle="Save today’s bays, staff and vehicle check-ins as a PNG."
            action={
              <div className="flex items-center gap-2">
                {snapMsg && <span className="text-2xs text-text-2">{snapMsg}</span>}
                <Button variant="secondary" size="sm" onClick={takeSnapshot}><Camera size={14} />Download PNG</Button>
              </div>
            }
          />
          <div ref={snapRef} className="p-4 bg-surface">
            <div className="text-sm font-semibold text-text mb-3">Hub snapshot · {today()}</div>
            <div className="grid sm:grid-cols-3 gap-3">
              <SnapBox title="Bays" rows={bays.map((b) => `Bay ${b.number} · ${employees.find((e) => e.id === b.assignedDriverId)?.name ?? 'Available'}`)} />
              <SnapBox title="Employees" rows={employees.map((e) => `${e.name} · ${e.status}`)} />
              <SnapBox title="Checked in" rows={checkIns.filter((c) => c.date === today()).map((c) => employees.find((e) => e.id === c.employeeId)?.name ?? c.employeeId)} />
            </div>
          </div>
        </Card>
      )}

      {/* Super Admin — portal access matrix */}
      {isSuper && user?.companyId && (
        <Card className="mt-4">
          <CardHeader
            title="Portal access"
            subtitle={`Tick the modules each role can open at ${activeHub?.name ?? 'this hub'}. Changes apply instantly.`}
            action={
              <span className="inline-flex items-center gap-1.5 text-2xs text-muted">
                <ShieldCheck size={13} />
                {activeHub?.name ?? 'Hub'} only
              </span>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  <th className="text-left font-mono text-2xs uppercase tracking-wide text-muted px-3 py-2.5">Module</th>
                  {[...HUB_AUTHORITY_ROLES, 'driver' as Role].map((r) => (
                    <th key={r} className="font-mono text-2xs uppercase tracking-wide text-muted px-3 py-2.5">{ROLE_LABELS[r]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grantableModules('hub-manager')
                  .map((m) => m.key)
                  .concat(['salary', 'billing', 'queries', 'reminders'] as ModuleKey[])
                  .filter((k, i, a) => a.indexOf(k) === i)
                  .map((key) => (
                    <tr key={key} className="border-b border-border last:border-0">
                      <th className="text-left font-medium text-text px-3 py-2 whitespace-nowrap">{labels[key] ?? key}</th>
                      {[...HUB_AUTHORITY_ROLES, 'driver' as Role].map((r) => {
                        const allowed = grantableModules(r).some((m) => m.key === key);
                        // Per-hub grant wins; fall back to the company default.
                        const on =
                          (hubPermissions[activeHubId ?? '']?.[r] ??
                            permissions[user.companyId!]?.[r] ??
                            []).includes(key);
                        return (
                          <td key={r} className="text-center px-3 py-2">
                            <input
                              type="checkbox"
                              checked={on}
                              disabled={!allowed || !activeHubId}
                              onChange={() => activeHubId && toggleHubRoleModule(activeHubId, r, key)}
                              className="h-4 w-4 accent-accent disabled:opacity-25"
                              aria-label={`${labels[key]} for ${ROLE_LABELS[r]}`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Super Admin — rename modules */}
      {isSuper && (
        <Card className="mt-4">
          <CardHeader title="Module names" subtitle="Renaming updates the sidebar everywhere."
            action={<Button variant="secondary" size="sm" onClick={resetModuleLabels}><RotateCcw size={14} />Reset</Button>} />
          <div className="p-4 grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
            {(Object.keys(labels) as ModuleKey[]).map((k) => (
              <div key={k} className="grid grid-cols-[8rem_1fr] items-center gap-3">
                <label htmlFor={`ml-${k}`} className="text-2xs text-muted truncate">{k}</label>
                <Input id={`ml-${k}`} value={labels[k]} onChange={(e) => setModuleLabel(k, e.target.value)} />
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="mt-4">
        <CardHeader title="Demo data" subtitle="Restore the seeded demo dataset." />
        <div className="p-4">
          <Button variant="secondary" onClick={resetDemo}><RotateCcw size={15} />Reset demo data</Button>
        </div>
      </Card>
    </div>
  );
}

function SnapBox({ title, rows }: { title: string; rows: string[] }) {
  return (
    <div className="border border-border rounded-[3px] p-3 bg-bg">
      <div className="text-2xs uppercase tracking-wide text-muted mb-1.5">{title}</div>
      <div className="space-y-1">
        {rows.slice(0, 12).map((r, i) => <div key={i} className="text-2xs text-text-2 truncate">{r}</div>)}
        {rows.length === 0 && <div className="text-2xs text-muted">None</div>}
      </div>
    </div>
  );
}
