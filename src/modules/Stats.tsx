import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, CheckCircle2, Trophy, Users } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { KpiTile } from '@/components/KpiTile';
import { Card, CardHeader } from '@/components/Card';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { useScopedEmployees, useScopedProducts } from '@/lib/scope';

const tip = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 3, fontSize: 12, color: 'var(--text)' } as const;
const first = (n: string) => n.split(' ')[0];
const rate = (ok: number, err: number) => (ok + err ? Math.round((ok / (ok + err)) * 100) : 0);

export default function Stats() {
  const labels = useStore((s) => s.moduleLabels);
  const productTypes = useStore((s) => s.productTypes);
  const employees = useScopedEmployees();
  const products = useScopedProducts();

  const drivers = useMemo(() => employees.filter((e) => e.role === 'driver'), [employees]);
  const ranked = useMemo(
    () => [...drivers].sort((a, b) => b.deliveredCount - a.deliveredCount || a.errorCount - b.errorCount),
    [drivers]
  );

  const totalDelivered = drivers.reduce((s, d) => s + d.deliveredCount, 0);
  const totalErrors = drivers.reduce((s, d) => s + d.errorCount, 0);
  const active = drivers.filter((d) => d.status !== 'inactive' && d.status !== 'leave').length;

  const perDriver = ranked.map((d) => ({ name: first(d.name), delivered: d.deliveredCount, errors: d.errorCount }));
  const outcomes = [
    { name: 'Delivered', value: products.filter((p) => p.deliveryStatus === 'delivered').length, color: 'var(--delivered)' },
    { name: 'Pending', value: products.filter((p) => p.deliveryStatus === 'pending').length, color: 'var(--scheduled)' },
    { name: 'Failed', value: products.filter((p) => p.deliveryStatus === 'failed').length, color: 'var(--exception)' },
  ];
  const byType = productTypes.map((t) => ({ type: t, count: products.filter((p) => p.type === t).length }));

  return (
    <div>
      <PageHeader title={labels.stats} description="Delivery performance across this hub." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Successful" value={totalDelivered} icon={CheckCircle2} accent />
        <KpiTile label="Errors" value={totalErrors} icon={AlertTriangle} />
        <KpiTile label="Success rate" value={`${rate(totalDelivered, totalErrors)}%`} icon={Trophy} />
        <KpiTile label="Active drivers" value={active} icon={Users} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Deliveries vs errors" subtitle="Per driver" />
          <div className="p-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={perDriver} margin={{ top: 4, right: 12, bottom: 0, left: 8 }} barCategoryGap={12}>
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis type="number" allowDecimals={false} tick={{ fill: 'var(--text-2)', fontSize: 12 }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
                <YAxis type="category" dataKey="name" width={70} tick={{ fill: 'var(--text-2)', fontSize: 12 }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
                <Tooltip cursor={{ fill: 'var(--surface-2)' }} contentStyle={tip} />
                <Bar dataKey="delivered" name="Delivered" stackId="a" fill="var(--delivered)" maxBarSize={26} radius={[4, 0, 0, 4]} />
                <Bar dataKey="errors" name="Errors" stackId="a" fill="var(--exception)" maxBarSize={26} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Delivery outcomes" />
          <div className="p-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={outcomes} dataKey="value" nameKey="name" innerRadius="60%" outerRadius="90%" paddingAngle={2} stroke="var(--surface)" strokeWidth={2}>
                  {outcomes.map((o) => <Cell key={o.name} fill={o.color} />)}
                </Pie>
                <Tooltip contentStyle={tip} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="px-4 pb-4 space-y-1.5">
            {outcomes.map((o) => (
              <div key={o.name} className="flex items-center gap-2 text-[13px]">
                <span className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: o.color }} />
                <span className="text-text-2">{o.name}</span>
                <span className="ml-auto tnum text-text font-medium">{o.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="Products by type" />
        <div className="p-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byType} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="type" tick={{ fill: 'var(--text-2)', fontSize: 12 }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
              <YAxis allowDecimals={false} width={40} tick={{ fill: 'var(--text-2)', fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'var(--surface-2)' }} contentStyle={tip} />
              <Bar dataKey="count" name="Products" fill="var(--accent)" radius={[3, 3, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="mt-4">
        <CardHeader title="Leaderboard" />
        <div className="divide-y divide-border">
          {ranked.map((d, i) => (
            <div key={d.id} className="flex items-center gap-3 px-4 py-3">
              <span className={cn('grid h-7 w-7 place-items-center rounded-[3px] text-2xs font-semibold tnum shrink-0',
                i === 0 ? 'bg-accent text-white' : i < 3 ? 'border border-accent text-accent' : 'border border-border text-text-2')}>{i + 1}</span>
              <span className="text-[13px] font-medium text-text flex-1 truncate">{d.name}</span>
              <div className="flex items-center gap-4 shrink-0 text-right">
                <div><div className="text-[13px] font-semibold text-text tnum">{d.deliveredCount}</div><div className="text-2xs text-muted">done</div></div>
                <div><div className="text-[13px] font-semibold tnum" style={{ color: 'var(--exception)' }}>{d.errorCount}</div><div className="text-2xs text-muted">errors</div></div>
                <div className="hidden sm:block"><div className="text-[13px] font-semibold text-text tnum">{rate(d.deliveredCount, d.errorCount)}%</div><div className="text-2xs text-muted">rate</div></div>
              </div>
            </div>
          ))}
          {ranked.length === 0 && <p className="px-4 py-6 text-[13px] text-text-2">No drivers at this hub yet.</p>}
        </div>
      </Card>
    </div>
  );
}
