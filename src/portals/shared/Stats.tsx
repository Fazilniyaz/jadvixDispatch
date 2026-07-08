import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, CheckCircle2, Trophy, Users } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { KpiTile } from '@/components/KpiTile';
import { Card, CardHeader } from '@/components/Card';
import { cn } from '@/lib/utils';
import { useCurrentEmployee, useStore } from '@/store/useStore';
import type { ProductType } from '@/lib/types';

const TYPES: ProductType[] = ['Fragile', 'Baked', 'Packed', 'Frozen', 'Standard'];

const tooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 3,
  fontSize: 12,
  color: 'var(--text)',
} as const;

const firstName = (n: string) => n.split(' ')[0];
const rate = (ok: number, err: number) => (ok + err ? Math.round((ok / (ok + err)) * 100) : 0);

export default function Stats() {
  const employees = useStore((s) => s.employees);
  const products = useStore((s) => s.products);
  const me = useCurrentEmployee();
  const user = useStore((s) => s.user);

  const isAdmin = user?.role === 'admin';

  const drivers = useMemo(() => employees.filter((e) => e.role === 'driver'), [employees]);

  const ranked = useMemo(
    () =>
      [...drivers].sort(
        (a, b) => b.deliveredCount - a.deliveredCount || a.errorCount - b.errorCount
      ),
    [drivers]
  );
  const top3 = ranked.slice(0, 3);

  const totalDelivered = drivers.reduce((s, d) => s + d.deliveredCount, 0);
  const totalErrors = drivers.reduce((s, d) => s + d.errorCount, 0);
  const activeDrivers = drivers.filter((d) => d.status === 'active').length;

  const driverData = ranked.map((d) => ({
    id: d.id,
    name: firstName(d.name),
    delivered: d.deliveredCount,
    errors: d.errorCount,
  }));

  const outcomeData = useMemo(() => {
    const done = products.filter((p) => p.deliveryStatus === 'delivered').length;
    const failed = products.filter((p) => p.deliveryStatus === 'failed').length;
    const pending = products.filter((p) => p.deliveryStatus === 'pending').length;
    return [
      { name: 'Done', value: done, color: 'var(--delivered)' },
      { name: 'Pending', value: pending, color: 'var(--scheduled)' },
      { name: 'Failed', value: failed, color: 'var(--exception)' },
    ];
  }, [products]);
  const outcomeTotal = outcomeData.reduce((s, o) => s + o.value, 0);

  const typeData = useMemo(
    () => TYPES.map((t) => ({ type: t, count: products.filter((p) => p.type === t).length })),
    [products]
  );

  // Order success/failure trend data for admin graph
  const orderTrendData = useMemo(() => {
    // Simulate trend data based on driver delivery/error counts
    // Each driver's contributions are plotted as data points
    return ranked.map((d) => ({
      name: firstName(d.name),
      successful: d.deliveredCount,
      failed: d.errorCount,
      total: d.deliveredCount + d.errorCount,
    }));
  }, [ranked]);

  const myRank = me ? ranked.findIndex((d) => d.id === me.id) + 1 : 0;

  return (
    <div>
      <PageHeader
        title="Stats"
        description="Delivery performance across the fleet — top drivers, outcomes and volume."
      />

      {/* Personal standing (driver portal only) */}
      {me && myRank > 0 && (
        <Card className="mb-4 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
            <div className="flex items-center gap-3">
              <span
                className="grid h-10 w-10 place-items-center rounded-[4px] font-display text-lg font-semibold tnum"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                  color: 'var(--accent)',
                }}
              >
                #{myRank}
              </span>
              <div>
                <div className="text-sm font-semibold text-text">{me.name}</div>
                <div className="text-2xs text-muted">Your standing in the fleet</div>
              </div>
            </div>
            <div className="flex items-center gap-6 sm:ml-auto">
              <MiniStat label="Successful" value={me.deliveredCount} tone="delivered" />
              <MiniStat label="Errors" value={me.errorCount} tone="exception" />
              <MiniStat label="Success rate" value={`${rate(me.deliveredCount, me.errorCount)}%`} />
            </div>
          </div>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Successful orders" value={totalDelivered} icon={CheckCircle2} accent />
        <KpiTile label="Errors" value={totalErrors} icon={AlertTriangle} />
        <KpiTile
          label="Success rate"
          value={`${rate(totalDelivered, totalErrors)}%`}
          icon={Trophy}
        />
        <KpiTile label="Active drivers" value={activeDrivers} icon={Users} />
      </div>

      {/* Top 3 drivers */}
      <div className="mt-4">
        <h2 className="font-display text-[15px] font-semibold text-text tracking-tight mb-3">
          Top 3 drivers
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {top3.map((d, i) => {
            const isMe = me?.id === d.id;
            return (
              <Card key={d.id} className={cn('p-4', isMe && 'border-accent')}>
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'grid h-8 w-8 place-items-center rounded-[4px] font-display text-sm font-semibold tnum',
                      i === 0
                        ? 'bg-accent text-white'
                        : 'bg-surface-2 border border-border text-text-2'
                    )}
                  >
                    {i + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    {isMe && (
                      <span className="text-2xs font-medium text-accent border border-accent rounded-[3px] px-1.5 py-0.5">
                        You
                      </span>
                    )}
                    <Trophy
                      size={16}
                      className={i === 0 ? 'text-accent' : 'text-muted'}
                    />
                  </div>
                </div>
                <div className="mt-3 text-sm font-semibold text-text truncate">{d.name}</div>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <div className="font-display text-2xl font-semibold text-text tnum leading-none">
                      {d.deliveredCount}
                    </div>
                    <div className="text-2xs text-muted mt-1">successful</div>
                  </div>
                  <div className="text-right">
                    <div
                      className="font-display text-2xl font-semibold tnum leading-none"
                      style={{ color: 'var(--exception)' }}
                    >
                      {d.errorCount}
                    </div>
                    <div className="text-2xs text-muted mt-1">errors</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-2xs">
                  <span className="text-muted">Success rate</span>
                  <span className="font-medium text-text tnum">
                    {rate(d.deliveredCount, d.errorCount)}%
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Charts — ONLY shown in admin portal */}
      {isAdmin && (
        <>
          {/* Order Success/Failure Trend Graph — admin only */}
          <Card className="mt-4">
            <CardHeader
              title="Order success & failure trend"
              subtitle="Successful vs failed orders per driver — updates with every order change"
            />
            <div className="p-4">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={orderTrendData}
                    margin={{ top: 8, right: 12, bottom: 0, left: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: 'var(--text-2)', fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: 'var(--border)' }}
                    />
                    <YAxis
                      tick={{ fill: 'var(--text-2)', fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      width={40}
                    />
                    <Tooltip
                      cursor={{ stroke: 'var(--accent)', strokeDasharray: '4 4' }}
                      contentStyle={tooltipStyle}
                    />
                    <Line
                      type="monotone"
                      dataKey="successful"
                      name="Successful"
                      stroke="var(--delivered)"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: 'var(--delivered)', stroke: 'var(--surface)', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: 'var(--delivered)' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="failed"
                      name="Failed"
                      stroke="var(--exception)"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: 'var(--exception)', stroke: 'var(--surface)', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: 'var(--exception)' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <Legend
                items={[
                  { label: 'Successful', color: 'var(--delivered)' },
                  { label: 'Failed', color: 'var(--exception)' },
                ]}
              />
            </div>
          </Card>

          <div className="grid lg:grid-cols-3 gap-4 mt-4">
            <Card className="lg:col-span-2">
              <CardHeader title="Deliveries vs errors by driver" subtitle="Successful orders and errors per driver" />
              <div className="p-4">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={driverData}
                      margin={{ top: 4, right: 12, bottom: 0, left: 8 }}
                      barCategoryGap={12}
                    >
                      <CartesianGrid horizontal={false} stroke="var(--border)" />
                      <XAxis
                        type="number"
                        tick={{ fill: 'var(--text-2)', fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: 'var(--border)' }}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fill: 'var(--text-2)', fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: 'var(--border)' }}
                        width={64}
                      />
                      <Tooltip cursor={{ fill: 'var(--surface-2)' }} contentStyle={tooltipStyle} />
                      <Bar
                        dataKey="delivered"
                        name="Delivered"
                        stackId="a"
                        fill="var(--delivered)"
                        radius={[4, 0, 0, 4]}
                        maxBarSize={26}
                      />
                      <Bar
                        dataKey="errors"
                        name="Errors"
                        stackId="a"
                        fill="var(--exception)"
                        radius={[0, 4, 4, 0]}
                        maxBarSize={26}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <Legend
                  items={[
                    { label: 'Delivered', color: 'var(--delivered)' },
                    { label: 'Errors', color: 'var(--exception)' },
                  ]}
                />
              </div>
            </Card>

            <Card>
              <CardHeader title="Delivery outcomes" subtitle="Across all products" />
              <div className="p-4">
                <div className="h-56 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={outcomeData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="62%"
                        outerRadius="90%"
                        paddingAngle={2}
                        stroke="var(--surface)"
                        strokeWidth={2}
                      >
                        {outcomeData.map((o) => (
                          <Cell key={o.name} fill={o.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="font-display text-2xl font-semibold text-text tnum leading-none">
                      {outcomeTotal}
                    </span>
                    <span className="text-2xs text-muted mt-1">products</span>
                  </div>
                </div>
                <div className="mt-2 space-y-1.5">
                  {outcomeData.map((o) => (
                    <div key={o.name} className="flex items-center gap-2 text-[13px]">
                      <span
                        className="h-2.5 w-2.5 rounded-[2px] shrink-0"
                        style={{ backgroundColor: o.color }}
                        aria-hidden
                      />
                      <span className="text-text-2">{o.name}</span>
                      <span className="ml-auto tnum text-text font-medium">{o.value}</span>
                      <span className="text-2xs text-muted tnum w-9 text-right">
                        {outcomeTotal ? Math.round((o.value / outcomeTotal) * 100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Products by type */}
          <Card className="mt-4">
            <CardHeader title="Products by type" subtitle="Volume across all shifts" />
            <div className="p-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="type"
                    tick={{ fill: 'var(--text-2)', fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--border)' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: 'var(--text-2)', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip cursor={{ fill: 'var(--surface-2)' }} contentStyle={tooltipStyle} />
                  <Bar dataKey="count" name="Products" fill="var(--accent)" radius={[3, 3, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}

      {/* Driver portal: show a simplified stats summary without graphs */}
      {!isAdmin && (
        <Card className="mt-4">
          <CardHeader title="Fleet overview" subtitle="Driver performance summary" />
          <div className="divide-y divide-border">
            {ranked.map((d, i) => {
              const isMe = me?.id === d.id;
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
                        {rate(d.deliveredCount, d.errorCount)}%
                      </div>
                      <div className="text-2xs text-muted">rate</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-4 mt-3 pl-1">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-[2px]"
            style={{ backgroundColor: it.color }}
            aria-hidden
          />
          <span className="text-2xs text-text-2">{it.label}</span>
        </div>
      ))}
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: 'delivered' | 'exception';
}) {
  const color = tone === 'delivered' ? 'var(--delivered)' : tone === 'exception' ? 'var(--exception)' : 'var(--text)';
  return (
    <div>
      <div className="font-display text-xl font-semibold tnum leading-none" style={{ color }}>
        {value}
      </div>
      <div className="text-2xs text-muted mt-1">{label}</div>
    </div>
  );
}
