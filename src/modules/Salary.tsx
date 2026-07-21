import { useState } from 'react';
import { Download, FileText, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/Card';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusPill } from '@/components/StatusPill';
import { KpiTile } from '@/components/KpiTile';
import { Button } from '@/components/Button';
import { Select } from '@/components/Field';
import { useStore, useCurrentEmployee, currentPeriod } from '@/store/useStore';
import { money, useScopedEmployees, useScopedPayslips } from '@/lib/scope';
import { exportRows } from '@/lib/exporters';
import type { Payslip } from '@/lib/types';

const TONE: Record<Payslip['status'], string> = { draft: 'pending', issued: 'planned', paid: 'delivered' };

export default function Salary() {
  const user = useStore((s) => s.user);
  const hubId = useStore((s) => s.activeHubId);
  const labels = useStore((s) => s.moduleLabels);
  const generate = useStore((s) => s.generatePayslips);
  const updatePayslip = useStore((s) => s.updatePayslip);
  const me = useCurrentEmployee();
  const employees = useScopedEmployees();
  const payslips = useScopedPayslips();

  const isDriver = user?.role === 'driver';
  const [period, setPeriod] = useState(currentPeriod());
  const [cadence, setCadence] = useState<'monthly' | 'weekly'>('monthly');

  const rows = (isDriver ? payslips.filter((p) => p.employeeId === me?.id) : payslips).filter(
    (p) => p.period === period || isDriver
  );

  const total = rows.reduce((s, p) => s + p.net, 0);
  const empName = (id: string) => employees.find((e) => e.id === id)?.name ?? id;

  const cols: Column<Payslip>[] = [
    ...(isDriver ? [] : [{ key: 'emp', header: 'Employee', render: (p: Payslip) => <span className="font-medium text-text">{empName(p.employeeId)}</span> }]),
    { key: 'period', header: 'Period', render: (p) => <span className="text-text-2 tnum">{p.period}</span> },
    { key: 'cadence', header: 'Cadence', render: (p) => <span className="text-text-2 capitalize">{p.cadence}</span> },
    { key: 'base', header: 'Base', headerClassName: 'text-right', className: 'text-right', render: (p) => <span className="tnum text-text-2">{money(p.baseAmount)}</span> },
    { key: 'pen', header: 'Penalties', headerClassName: 'text-right', className: 'text-right', render: (p) => <span className="tnum" style={{ color: p.penalties ? 'var(--exception)' : 'var(--muted)' }}>{p.penalties ? `−${money(p.penalties)}` : '—'}</span> },
    { key: 'net', header: 'Net', headerClassName: 'text-right', className: 'text-right', render: (p) => <span className="tnum font-semibold text-text">{money(p.net)}</span> },
    { key: 'status', header: 'Status', render: (p) => <StatusPill status={TONE[p.status]} label={p.status} /> },
    ...(isDriver ? [] : [{
      key: 'actions', header: '', headerClassName: 'text-right', className: 'text-right',
      render: (p: Payslip) => (
        <div className="flex items-center justify-end gap-1.5">
          {p.status === 'draft' && <Button size="sm" variant="secondary" onClick={() => updatePayslip(p.id, { status: 'issued' })}>Issue</Button>}
          {p.status === 'issued' && <Button size="sm" variant="primary" onClick={() => updatePayslip(p.id, { status: 'paid' })}>Mark paid</Button>}
        </div>
      ),
    }]),
  ];

  return (
    <div>
      <PageHeader
        title={labels.salary}
        description={isDriver ? 'Your payslips, issued by your hub.' : 'Calculate and issue salaries for this hub, weekly or monthly.'}
        action={!isDriver ? (
          <div className="flex flex-wrap items-center gap-2">
            <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)}
              className="h-9 bg-surface border border-border rounded-[3px] px-2 text-[13px] tnum focus:border-accent focus:outline-none" />
            <Select value={cadence} onChange={(e) => setCadence(e.target.value as 'monthly' | 'weekly')} className="w-32">
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </Select>
            <Button variant="primary" onClick={() => hubId && generate(hubId, period, cadence)}>
              <Wallet size={15} />Generate
            </Button>
          </div>
        ) : undefined}
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <KpiTile label={isDriver ? 'Your net pay' : 'Total net'} value={money(total)} icon={Wallet} accent />
        <KpiTile label="Payslips" value={rows.length} icon={FileText} />
        <KpiTile label="Paid" value={rows.filter((r) => r.status === 'paid').length} icon={FileText} />
      </div>

      <Card>
        <CardHeader title={isDriver ? 'Your payslips' : `Payroll · ${period}`} />
        <DataTable columns={cols} rows={rows} rowKey={(p) => p.id} empty="No payslips for this period yet." />
        <div className="flex items-center gap-1.5 px-3 py-2 border-t border-border text-2xs text-muted">
          <Download size={13} />
          {(['csv', 'excel', 'pdf'] as const).map((f) => (
            <button key={f} onClick={() => exportRows(`payroll-${period}`, rows.map((p) => ({
              Employee: empName(p.employeeId), Period: p.period, Cadence: p.cadence,
              Base: p.baseAmount, Penalties: p.penalties, Net: p.net, Status: p.status,
            })), f)}
              className="uppercase tracking-wide border border-border rounded-[3px] px-2 py-1 text-text-2 hover:bg-surface-2">{f}</button>
          ))}
        </div>
      </Card>
    </div>
  );
}
