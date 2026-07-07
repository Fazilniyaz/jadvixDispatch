import { useNavigate } from 'react-router-dom';
import { LogOut, RotateCcw } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Field';
import { useStore, type ThemePref } from '@/store/useStore';
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
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <PageHeader
        title={labels.settings}
        description="Rename modules, choose a theme, and manage the signed-in account."
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
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
          <div className="p-4 space-y-2.5">
            {MODULE_ORDER.map((key) => (
              <div key={key} className="grid grid-cols-[10rem_1fr] items-center gap-3">
                <label htmlFor={`ml-${key}`} className="text-[13px] text-text-2">
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

        <div className="space-y-4">
          <Card>
            <CardHeader title="Appearance" />
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
              <p className="text-2xs text-muted mt-3">
                Theme is saved to this browser and applies to every screen.
              </p>
            </div>
          </Card>

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
      </div>
    </div>
  );
}
