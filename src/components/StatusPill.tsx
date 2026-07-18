import { cn } from '@/lib/utils';

// Maps any known status keyword to a color token + label.
// Colors come from the theme variables (--scheduled, --transit, etc.).
const MAP: Record<string, { color: string; label?: string }> = {
  // product lifecycle
  scheduled: { color: 'var(--scheduled)' },
  picked: { color: 'var(--picked)' },
  transit: { color: 'var(--transit)', label: 'In transit' },
  out: { color: 'var(--out)', label: 'Out for delivery' },
  delivered: { color: 'var(--delivered)' },
  exception: { color: 'var(--exception)' },
  // delivery status
  pending: { color: 'var(--scheduled)' },
  failed: { color: 'var(--exception)' },
  // shift / route
  active: { color: 'var(--delivered)' },
  completed: { color: 'var(--scheduled)' },
  planned: { color: 'var(--out)' },
  idle: { color: 'var(--muted)' },
  // employee
  leave: { color: 'var(--muted)' },
  'full-time': { color: 'var(--out)', label: 'Full-time' },
  'contract-based': { color: 'var(--picked)', label: 'Contract' },
  inactive: { color: 'var(--exception)', label: 'Inactive' },
  // leave requests
  approved: { color: 'var(--delivered)' },
  rejected: { color: 'var(--exception)' },
  // bay
  full: { color: 'var(--transit)' },
  loading: { color: 'var(--out)' },
  shipped: { color: 'var(--out)', label: 'Shipped' },
  ready: { color: 'var(--transit)', label: 'Ready to go' },
};

interface StatusPillProps {
  status: string;
  label?: string;
  className?: string;
}

export function StatusPill({ status, label, className }: StatusPillProps) {
  const cfg = MAP[status] ?? { color: 'var(--muted)' };
  const text = label ?? cfg.label ?? status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[3px] border px-2 py-0.5 text-2xs font-medium leading-none whitespace-nowrap',
        className
      )}
      style={{
        color: cfg.color,
        borderColor: cfg.color,
        // 12% tint background derived from the token color.
        backgroundColor: `color-mix(in srgb, ${cfg.color} 12%, transparent)`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: cfg.color }}
        aria-hidden
      />
      {text}
    </span>
  );
}
