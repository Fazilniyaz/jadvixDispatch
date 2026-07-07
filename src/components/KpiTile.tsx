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
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <span className="text-[13px] text-text-2">{label}</span>
        {Icon && <Icon size={16} className="text-muted" />}
      </div>
      <div
        className="mt-2 text-2xl font-semibold tracking-tight tnum leading-none"
        style={{ color: accent ? 'var(--accent)' : 'var(--text)' }}
      >
        {value}
      </div>
      {hint && <div className="mt-1.5 text-2xs text-muted">{hint}</div>}
    </Card>
  );
}
