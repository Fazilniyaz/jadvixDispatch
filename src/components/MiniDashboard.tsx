import { Package, TrendingUp } from 'lucide-react';
import { StatusPill } from './StatusPill';
import { useStore } from '@/store/useStore';

// A live, in-app dashboard panel rendered on the landing hero — not an image.
// Reads the same seeded store the portals use.
export function MiniDashboard() {
  const products = useStore((s) => s.products);
  const activeWaveId = useStore((s) => s.activeWaveId);
  const waves = useStore((s) => s.waves);
  const shifts = useStore((s) => s.shifts);

  const activeWave = waves.find((w) => w.id === activeWaveId);
  const activeShift = shifts.find((s) => s.id === activeWave?.shiftId);

  const inTransit = products.filter((p) => p.status === 'transit' || p.status === 'out').length;
  const delivered = products.filter((p) => p.status === 'delivered').length;
  const exceptions = products.filter((p) => p.status === 'exception').length;

  const recent = products.slice(0, 4);

  return (
    <div className="w-full bg-surface border border-border rounded-[4px] shadow-subtle overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-text">
          <Package size={14} className="text-accent" />
          Dispatch overview
        </div>
        <span className="text-2xs text-muted">
          {activeShift?.name ?? 'Morning'} · Wave {activeWave?.number ?? '2nd'} active
        </span>
      </div>

      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        <Metric label="In transit" value={inTransit} />
        <Metric label="Delivered" value={delivered} accent />
        <Metric label="Exceptions" value={exceptions} />
      </div>

      <div className="p-3 space-y-1.5">
        {recent.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-2xs text-text-2 tnum">{p.code}</span>
              <span className="text-[13px] text-text truncate">{p.name}</span>
            </div>
            <StatusPill status={p.status} />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 px-4 py-2 border-t border-border text-2xs text-muted">
        <TrendingUp size={12} className="text-delivered" />
        On-time rate holding at 96% across both hubs
      </div>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="px-4 py-3">
      <div
        className="font-display text-2xl font-semibold tnum leading-none"
        style={{ color: accent ? 'var(--accent)' : 'var(--text)' }}
      >
        {value}
      </div>
      <div className="text-2xs text-muted mt-1">{label}</div>
    </div>
  );
}
