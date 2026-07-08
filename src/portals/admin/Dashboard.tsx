import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, CheckCircle2, Package, Truck } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { KpiTile } from '@/components/KpiTile';
import { Card, CardHeader } from '@/components/Card';
import { StatusPill } from '@/components/StatusPill';
import { useStore } from '@/store/useStore';
import type { ProductType } from '@/lib/types';

const TYPES: ProductType[] = ['Fragile', 'Baked', 'Packed', 'Frozen', 'Standard'];

export default function Dashboard() {
  const products = useStore((s) => s.products);
  const employees = useStore((s) => s.employees);
  const bays = useStore((s) => s.bays);
  const shifts = useStore((s) => s.shifts);
  const activeShiftId = useStore((s) => s.activeShiftId);

  const inMotion = products.filter((p) => p.status === 'transit' || p.status === 'out').length;
  const delivered = products.filter((p) => p.status === 'delivered').length;
  const exceptions = products.filter((p) => p.status === 'exception').length;

  const chartData = useMemo(
    () =>
      TYPES.map((t) => ({
        type: t,
        count: products.filter((p) => p.type === t).length,
      })),
    [products]
  );

  const activeShift = shifts.find((s) => s.id === activeShiftId);
  const activeShiftStaff = activeShift
    ? employees.filter((e) => e.shift === activeShift.name).length
    : 0;

  const drivers = employees.filter((e) => e.role === 'driver');
  const onDuty = drivers.filter((e) => e.status === 'active').length;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="A live view of today’s delivery operation across both hubs."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Products today" value={products.length} icon={Package} />
        <KpiTile label="In transit / out" value={inMotion} icon={Truck} accent />
        <KpiTile label="Delivered" value={delivered} icon={CheckCircle2} />
        <KpiTile label="Exceptions" value={exceptions} icon={AlertTriangle} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Product volume by type" subtitle="Across all shifts today" />
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
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
                <Tooltip
                  cursor={{ fill: 'var(--surface-2)' }}
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 3,
                    fontSize: 12,
                    color: 'var(--text)',
                  }}
                  labelStyle={{ color: 'var(--text)' }}
                />
                <Bar dataKey="count" fill="var(--accent)" radius={[3, 3, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Current shift" />
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-text">{activeShift?.name}</div>
                <div className="text-2xs text-muted">{activeShift?.window}</div>
              </div>
              <StatusPill status="active" />
            </div>
            <div className="border-t border-border pt-3 space-y-2">
              {shifts.map((s) => (
                <div key={s.id} className="flex items-center justify-between">
                  <span className="text-[13px] text-text-2">
                    {s.name} · {s.window}
                  </span>
                  <StatusPill status={s.status} />
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 text-2xs text-muted">
              {activeShiftStaff} staff on the current shift
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Bay stocks" subtitle="Items staged per bay" />
          <div className="p-4 space-y-3">
            {(() => {
              const maxStocks = Math.max(1, ...bays.map((b) => b.stocks));
              return bays.map((b) => (
                <div key={b.id} className="flex items-center gap-3">
                  <span className="font-mono text-2xs text-text-2 w-16 tnum">
                    {b.id.toUpperCase()}
                  </span>
                  <div className="flex-1 h-2 bg-surface-2 border border-border rounded-[2px] overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${Math.round((b.stocks / maxStocks) * 100)}%`,
                        backgroundColor: 'var(--accent)',
                      }}
                    />
                  </div>
                  <span className="text-2xs text-text-2 tnum w-16 text-right">
                    {b.stocks} stk
                  </span>
                </div>
              ));
            })()}
          </div>
        </Card>

        <Card>
          <CardHeader title="Fleet & staff" />
          <div className="p-4 space-y-3">
            <Summary label="Drivers on duty" value={`${onDuty} / ${drivers.length}`} />
            <Summary label="Vehicles active" value={`${bays.filter((b) => b.assignedDriverId).length}`} />
            <Summary
              label="On leave"
              value={`${employees.filter((e) => e.status === 'leave').length}`}
            />
            <div className="border-t border-border pt-3 space-y-2">
              {drivers.slice(0, 4).map((d) => (
                <div key={d.id} className="flex items-center justify-between">
                  <span className="text-[13px] text-text truncate">{d.name}</span>
                  <StatusPill status={d.status === 'active' ? 'active' : 'leave'} />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-text-2">{label}</span>
      <span className="text-sm font-semibold text-text tnum">{value}</span>
    </div>
  );
}
