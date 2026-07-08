import { useState, useMemo } from 'react';
import {
  AlertTriangle,

  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  Crown,
  Package,
  Star,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/Card';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/Button';
import { KpiTile } from '@/components/KpiTile';
import { DataTable, type Column } from '@/components/DataTable';
import { cn } from '@/lib/utils';
import { useCurrentEmployee, useStore } from '@/store/useStore';
import type { Product, ProductStatus } from '@/lib/types';

/* ── Status flow ────────────────────────────────────────────── */

const FLOW: ProductStatus[] = ['picked', 'transit', 'out', 'delivered'];
const STEP_LABEL: Record<ProductStatus, string> = {
  scheduled: 'Scheduled',
  picked: 'Picked',
  transit: 'In transit',
  out: 'Out for delivery',
  delivered: 'Delivered',
  exception: 'Exception',
};

function nextStatus(current: ProductStatus): ProductStatus | null {
  if (current === 'scheduled') return 'picked';
  const i = FLOW.indexOf(current);
  if (i === -1 || i === FLOW.length - 1) return null;
  return FLOW[i + 1];
}

/* ── Calendar helpers ───────────────────────────────────────── */

type CalendarRange = 'weekly' | 'monthly' | 'yearly';

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? 6 : day - 1; // Mon as start
  copy.setDate(copy.getDate() - diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function getWeekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function getMonthDays(anchor: Date): Date[] {
  const y = anchor.getFullYear();
  const m = anchor.getMonth();
  const days: Date[] = [];
  const d = new Date(y, m, 1);
  while (d.getMonth() === m) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function getYearMonths(anchor: Date): { label: string; month: number }[] {
  return Array.from({ length: 12 }, (_, i) => ({
    label: new Date(anchor.getFullYear(), i).toLocaleString('en', { month: 'short' }),
    month: i,
  }));
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const fmtDate = (d: Date) => d.toISOString().split('T')[0];
const fmtShort = (d: Date) => d.toLocaleDateString('en', { month: 'short', day: 'numeric' });

/* ── Component ──────────────────────────────────────────────── */

export default function MyPerformance() {
  const me = useCurrentEmployee();
  const products = useStore((s) => s.products);
  const routes = useStore((s) => s.routes);
  const employees = useStore((s) => s.employees);
  const advance = useStore((s) => s.advanceProductStatus);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pod, setPod] = useState<Record<string, boolean>>({});
  const [calRange, setCalRange] = useState<CalendarRange>('weekly');
  const [tab, setTab] = useState<'all' | 'ongoing' | 'completed'>('all');

  if (!me) return null;

  /* ── Derived data ──────────────────────────────────────── */
  const routeName = (id: string | null) => routes.find((r) => r.id === id)?.name ?? '—';
  const myProducts = products.filter((p) => p.assignedEmployeeId === me.id);
  const ongoing = myProducts.filter((p) => p.status !== 'delivered' && p.status !== 'exception');
  const completed = myProducts.filter((p) => p.status === 'delivered');

  const successCount = me.deliveredCount;
  const errorCount = me.errorCount;
  const successRate = successCount + errorCount > 0 ? Math.round((successCount / (successCount + errorCount)) * 100) : 0;

  // Ranking
  const drivers = employees.filter((e) => e.role === 'driver');
  const ranked = [...drivers].sort(
    (a, b) => b.deliveredCount - a.deliveredCount || a.errorCount - b.errorCount
  );
  const myRank = ranked.findIndex((d) => d.id === me.id) + 1;

  // Filter rows based on tab
  const filteredProducts =
    tab === 'ongoing' ? ongoing :
    tab === 'completed' ? completed :
    myProducts;

  // Create a mapping of product dates from employee history
  const historyByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const h of me.history) {
      map[h.date] = (map[h.date] || 0) + 1;
    }
    // Also count currently assigned products as today
    const today = fmtDate(new Date());
    map[today] = (map[today] || 0) + myProducts.length;
    return map;
  }, [me.history, myProducts.length]);

  /* ── Table columns ─────────────────────────────────────── */

  const columns: Column<Product>[] = [
    {
      key: 'expand',
      header: '',
      className: 'w-8',
      render: (p) => (
        <span className="text-muted">
          {expandedId === p.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      ),
    },
    {
      key: 'code',
      header: 'Order',
      render: (p) => (
        <span className="font-mono text-2xs text-text-2 tnum">{p.code}</span>
      ),
    },
    {
      key: 'name',
      header: 'Product',
      render: (p) => (
        <span className="text-[13px] text-text truncate max-w-[160px] inline-block">{p.name}</span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: () => (
        <span className="text-2xs text-text-2 tnum">{fmtShort(new Date())}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => <StatusPill status={p.status} />,
    },
    {
      key: 'eta',
      header: 'ETA',
      render: (p) => (
        <span className="text-2xs text-text-2 tnum">{p.eta || '—'}</span>
      ),
    },
  ];

  /* ── Render ────────────────────────────────────────────── */

  return (
    <div>
      <PageHeader
        title="My Performance"
        description="Track your orders, rankings, and delivery progress — all in one place."
      />

      {/* ── KPI tiles ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiTile label="Successful" value={successCount} icon={Check} accent />
        <KpiTile label="Errors" value={errorCount} icon={AlertTriangle} />
        <KpiTile label="Success rate" value={`${successRate}%`} icon={TrendingUp} />
        <KpiTile label="Rank" value={`#${myRank}`} hint={`of ${drivers.length} drivers`} icon={Crown} />
        <KpiTile label="Ongoing" value={ongoing.length} icon={Package} />
      </div>

      {/* ── Calendar view ───────────────────────────────── */}
      <Card className="mt-4">
        <CardHeader
          title="Calendar"
          subtitle="Delivery activity overview"
          action={
            <div className="inline-flex rounded-[3px] border border-border overflow-hidden">
              {(['weekly', 'monthly', 'yearly'] as CalendarRange[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setCalRange(r)}
                  className={cn(
                    'px-3 py-1.5 text-2xs font-medium capitalize transition-colors',
                    calRange === r
                      ? 'bg-accent text-white'
                      : 'text-text-2 hover:bg-surface-2'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          }
        />
        <div className="p-4">
          {calRange === 'weekly' && <WeekView historyByDate={historyByDate} />}
          {calRange === 'monthly' && <MonthView historyByDate={historyByDate} />}
          {calRange === 'yearly' && <YearView historyByDate={historyByDate} />}
        </div>
      </Card>

      {/* ── Tab bar + Order table ────────────────────────── */}
      <Card className="mt-4">
        <div className="flex items-center gap-0 border-b border-border">
          {([
            { key: 'all' as const, label: 'All Orders', count: myProducts.length },
            { key: 'ongoing' as const, label: 'Ongoing', count: ongoing.length },
            { key: 'completed' as const, label: 'Completed', count: completed.length },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'px-4 py-3 text-[13px] font-medium border-b-2 transition-colors',
                tab === t.key
                  ? 'text-accent border-accent'
                  : 'text-text-2 border-transparent hover:text-text hover:border-border'
              )}
            >
              {t.label}
              <span
                className={cn(
                  'ml-1.5 inline-flex items-center justify-center h-5 min-w-[20px] rounded-[3px] text-2xs font-semibold px-1 tnum',
                  tab === t.key
                    ? 'bg-accent text-white'
                    : 'bg-surface-2 text-text-2'
                )}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        <DataTable
          columns={columns}
          rows={filteredProducts}
          rowKey={(p) => p.id}
          onRowClick={(p) => setExpandedId((prev) => (prev === p.id ? null : p.id))}
          expandedKey={expandedId}
          renderExpanded={(p) => (
            <ExpandedRow
              product={p}
              routeName={routeName(p.routeId)}
              onAdvance={advance}
              pod={!!pod[p.id]}
              onPod={() => setPod((s) => ({ ...s, [p.id]: !s[p.id] }))}
            />
          )}
          empty="No orders found."
        />
      </Card>

      {/* ── Rankings ─────────────────────────────────────── */}
      <Card className="mt-4">
        <CardHeader title="Driver Rankings" subtitle="Fleet performance leaderboard" />
        <div className="divide-y divide-border">
          {ranked.map((d, i) => {
            const isMe = d.id === me.id;
            return (
              <div
                key={d.id}
                className={cn(
                  'flex items-center gap-3 px-4 py-3',
                  isMe && 'bg-surface-2'
                )}
              >
                <span
                  className={cn(
                    'grid h-7 w-7 place-items-center rounded-[3px] text-2xs font-semibold tnum shrink-0',
                    i === 0
                      ? 'bg-accent text-white'
                      : i < 3
                        ? 'border border-accent text-accent'
                        : 'border border-border text-text-2'
                  )}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-text truncate">{d.name}</span>
                    {isMe && (
                      <span className="text-2xs font-medium text-accent border border-accent rounded-[3px] px-1.5 py-0.5">
                        You
                      </span>
                    )}
                    {i === 0 && <Star size={13} className="text-accent shrink-0" />}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-[13px] font-semibold text-text tnum">{d.deliveredCount}</div>
                    <div className="text-2xs text-muted">done</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-semibold tnum" style={{ color: 'var(--exception)' }}>
                      {d.errorCount}
                    </div>
                    <div className="text-2xs text-muted">errors</div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-[13px] font-semibold text-text tnum">
                      {d.deliveredCount + d.errorCount > 0
                        ? Math.round((d.deliveredCount / (d.deliveredCount + d.errorCount)) * 100)
                        : 0}%
                    </div>
                    <div className="text-2xs text-muted">rate</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ── Expanded row detail ────────────────────────────────────── */

function ExpandedRow({
  product,
  routeName,
  onAdvance,
  pod,
  onPod,
}: {
  product: Product;
  routeName: string;
  onAdvance: (id: string, status: ProductStatus) => void;
  pod: boolean;
  onPod: () => void;
}) {
  const next = nextStatus(product.status);
  const currentIndex = FLOW.indexOf(product.status);

  return (
    <div className="p-4 space-y-4">
      {/* Product details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <DetailItem label="Product" value={product.name} />
        <DetailItem label="Type" value={product.type} />
        <DetailItem label="Location" value={routeName} />
        <DetailItem label="ETA" value={product.eta || '—'} />
        <DetailItem label="Arrival" value={product.arrivalInfo || '—'} />
        <DetailItem label="Code" value={product.code} mono />
        <DetailItem label="Delivery Status" value={product.deliveryStatus} />
        <DetailItem label="Order Status">
          <StatusPill status={product.status} />
        </DetailItem>
      </div>

      {/* Stepper */}
      <div className="border-t border-border pt-4">
        <div className="text-2xs font-medium text-muted uppercase tracking-wide mb-2">Order Progress</div>
        <div className="flex items-center gap-1">
          {FLOW.map((step, i) => {
            const reached = product.status !== 'exception' && currentIndex >= i;
            return (
              <div key={step} className="flex items-center gap-1 flex-1 last:flex-none">
                <div
                  className={cn(
                    'flex items-center gap-1.5 text-2xs font-medium whitespace-nowrap',
                    reached ? 'text-text' : 'text-muted'
                  )}
                >
                  <span
                    className={cn(
                      'grid h-6 w-6 place-items-center rounded-[3px] border text-2xs',
                      reached ? 'bg-accent border-accent text-white' : 'bg-surface border-border'
                    )}
                  >
                    {reached ? <Check size={12} /> : i + 1}
                  </span>
                  <span className="hidden sm:inline">{STEP_LABEL[step]}</span>
                </div>
                {i < FLOW.length - 1 && (
                  <ChevronRight size={14} className="text-border shrink-0 hidden sm:block" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
        {next && product.status !== 'exception' && (
          <Button variant="primary" size="sm" onClick={() => onAdvance(product.id, next)}>
            <Check size={14} />
            Mark {STEP_LABEL[next].toLowerCase()}
          </Button>
        )}
        {product.status === 'out' && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onAdvance(product.id, 'delivered')}
            className="bg-delivered border-delivered hover:bg-delivered hover:border-delivered"
          >
            <Check size={14} />
            Mark delivered
          </Button>
        )}
        {product.status !== 'exception' && product.status !== 'delivered' && (
          <Button variant="danger" size="sm" onClick={() => onAdvance(product.id, 'exception')}>
            <AlertTriangle size={14} />
            Mark exception
          </Button>
        )}
        <button
          onClick={onPod}
          className={cn(
            'inline-flex items-center gap-1.5 h-8 px-3 text-[13px] font-medium rounded-[3px] border',
            pod
              ? 'border-delivered text-delivered'
              : 'border-border text-text-2 hover:bg-surface-2'
          )}
          style={pod ? { backgroundColor: 'color-mix(in srgb, var(--delivered) 12%, transparent)' } : undefined}
        >
          <Camera size={14} />
          {pod ? 'Proof captured' : 'Add proof of delivery'}
        </button>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
  mono,
  children,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-2xs text-muted uppercase tracking-wide mb-0.5">{label}</div>
      {children ?? (
        <div className={cn('text-[13px] text-text font-medium', mono && 'font-mono')}>{value}</div>
      )}
    </div>
  );
}

/* ── Calendar sub-components ────────────────────────────────── */

function WeekView({ historyByDate }: { historyByDate: Record<string, number> }) {
  const today = new Date();
  const days = getWeekDays(today);

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((d, i) => {
        const key = fmtDate(d);
        const count = historyByDate[key] || 0;
        const isToday = isSameDay(d, today);
        return (
          <div
            key={key}
            className={cn(
              'flex flex-col items-center gap-1 py-3 rounded-[3px] border transition-colors',
              isToday ? 'border-accent bg-accent/5' : 'border-border',
              count > 0 && !isToday && 'bg-surface-2'
            )}
          >
            <span className="text-2xs text-muted uppercase">{DAY_NAMES[i]}</span>
            <span className={cn('text-sm font-semibold tnum', isToday ? 'text-accent' : 'text-text')}>
              {d.getDate()}
            </span>
            {count > 0 && (
              <span className="inline-flex items-center justify-center h-4 min-w-[16px] rounded-full bg-accent text-white text-[10px] font-semibold px-1 tnum">
                {count}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MonthView({ historyByDate }: { historyByDate: Record<string, number> }) {
  const today = new Date();
  const days = getMonthDays(today);
  const monthLabel = today.toLocaleString('en', { month: 'long', year: 'numeric' });

  // Pad start
  const firstDow = days[0].getDay();
  const padStart = firstDow === 0 ? 6 : firstDow - 1;

  return (
    <div>
      <div className="text-sm font-semibold text-text mb-3">{monthLabel}</div>
      <div className="grid grid-cols-7 gap-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-2xs text-muted uppercase pb-1">
            {d}
          </div>
        ))}
        {Array.from({ length: padStart }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((d) => {
          const key = fmtDate(d);
          const count = historyByDate[key] || 0;
          const isToday = isSameDay(d, today);
          return (
            <div
              key={key}
              className={cn(
                'flex flex-col items-center py-1.5 rounded-[2px] text-2xs transition-colors',
                isToday && 'bg-accent/10 ring-1 ring-accent',
                count > 0 && !isToday && 'bg-surface-2'
              )}
            >
              <span className={cn('tnum', isToday ? 'text-accent font-semibold' : 'text-text-2')}>
                {d.getDate()}
              </span>
              {count > 0 && (
                <span className="h-1.5 w-1.5 rounded-full bg-accent mt-0.5" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function YearView({ historyByDate }: { historyByDate: Record<string, number> }) {
  const today = new Date();
  const months = getYearMonths(today);

  // Count orders per month from history
  const countByMonth = months.map((m) => {
    let count = 0;
    for (const [dateStr, n] of Object.entries(historyByDate)) {
      const d = new Date(dateStr);
      if (d.getMonth() === m.month && d.getFullYear() === today.getFullYear()) {
        count += n;
      }
    }
    return { ...m, count };
  });

  const maxCount = Math.max(1, ...countByMonth.map((m) => m.count));

  return (
    <div>
      <div className="text-sm font-semibold text-text mb-3">{today.getFullYear()}</div>
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
        {countByMonth.map((m) => {
          const isCurrent = m.month === today.getMonth();
          return (
            <div
              key={m.month}
              className={cn(
                'flex flex-col items-center gap-1 py-3 rounded-[3px] border transition-colors',
                isCurrent ? 'border-accent bg-accent/5' : 'border-border'
              )}
            >
              <span className={cn('text-2xs uppercase', isCurrent ? 'text-accent font-semibold' : 'text-muted')}>
                {m.label}
              </span>
              <div className="w-full px-2 mt-1">
                <div className="h-1 w-full bg-surface-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round((m.count / maxCount) * 100)}%`,
                      backgroundColor: 'var(--accent)',
                    }}
                  />
                </div>
              </div>
              <span className="text-2xs tnum text-text-2">{m.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
