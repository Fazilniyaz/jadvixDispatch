import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card } from './Card';

interface KpiTileProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  accent?: boolean;
}

export function KpiTile({ label, value, hint, icon: Icon, accent }: KpiTileProps) {
  return (
    <Card className="p-4 transition-colors hover:border-muted">
      <div className="flex items-center justify-between">
        <span className="font-mono text-2xs uppercase tracking-[0.14em] text-muted">{label}</span>
        {Icon && (
          <span className="grid h-6 w-6 place-items-center border border-border rounded-[3px] text-muted">
            <Icon size={13} />
          </span>
        )}
      </div>
      <div
        className="mt-3 font-display text-[2rem] font-semibold tracking-tight tnum leading-none"
        style={{ color: accent ? 'var(--accent)' : 'var(--text)' }}
      >
        {value}
      </div>
      {hint && <div className="mt-2 text-2xs text-text-2">{hint}</div>}
    </Card>
  );
}
