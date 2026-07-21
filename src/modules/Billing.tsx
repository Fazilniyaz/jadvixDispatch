import { useState } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/Card';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusPill } from '@/components/StatusPill';
import { KpiTile } from '@/components/KpiTile';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Field, Input, Select } from '@/components/Field';
import { useStore, useCurrentEmployee } from '@/store/useStore';
import { money, useScopedEmployees, useScopedPenalties } from '@/lib/scope';
import { today } from '@/data/seed';
import type { Penalty } from '@/lib/types';

const TONE: Record<Penalty['status'], string> = { pending: 'pending', applied: 'exception', waived: 'idle' };

export default function Billing() {
  const user = useStore((s) => s.user);
  const hubId = useStore((s) => s.activeHubId);
  const labels = useStore((s) => s.moduleLabels);
  const addPenalty = useStore((s) => s.addPenalty);
  const updatePenalty = useStore((s) => s.updatePenalty);
  const me = useCurrentEmployee();
  const employees = useScopedEmployees();
  const penalties = useScopedPenalties();

  const isDriver = user?.role === 'driver';
  const rows = isDriver ? penalties.filter((p) => p.employeeId === me?.id) : penalties;

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: '', reason: '', amount: 0, date: today() });

  const applied = rows.filter((p) => p.status === 'applied').reduce((s, p) => s + p.amount, 0);
  const pending = rows.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const empName = (id: string) => employees.find((e) => e.id === id)?.name ?? id;

  const cols: Column<Penalty>[] = [
    ...(isDriver ? [] : [{ key: 'emp', header: 'Employee', render: (p: Penalty) => <span className="font-medium text-text">{empName(p.employeeId)}</span> }]),
    { key: 'reason', header: 'Reason', render: (p) => <span className="text-text-2">{p.reason}</span> },
    { key: 'date', header: 'Date', render: (p) => <span className="text-text-2 tnum">{p.date}</span> },
    { key: 'amount', header: 'Amount', headerClassName: 'text-right', className: 'text-right', render: (p) => <span className="tnum font-semibold" style={{ color: 'var(--exception)' }}>{money(p.amount)}</span> },
    { key: 'status', header: 'Status', render: (p) => <StatusPill status={TONE[p.status]} label={p.status} /> },
    ...(isDriver ? [] : [{
      key: 'actions', header: '', headerClassName: 'text-right', className: 'text-right',
      render: (p: Penalty) => p.status === 'pending' ? (
        <div className="flex items-center justify-end gap-1.5">
          <Button size="sm" variant="secondary" onClick={() => updatePenalty(p.id, { status: 'applied' })}>Apply</Button>
          <Button size="sm" variant="ghost" onClick={() => updatePenalty(p.id, { status: 'waived' })}>Waive</Button>
        </div>
      ) : null,
    }]),
  ];

  return (
    <div>
      <PageHeader
        title={labels.billing}
        description={isDriver ? 'Penalties applied to your pay.' : 'Penalties raised against staff at this hub. Applied penalties flow into payroll.'}
        action={!isDriver ? <Button variant="primary" onClick={() => setOpen(true)}><Plus size={16} />Add penalty</Button> : undefined}
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <KpiTile label="Applied" value={money(applied)} icon={AlertTriangle} accent />
        <KpiTile label="Pending" value={money(pending)} icon={AlertTriangle} />
        <KpiTile label="Records" value={rows.length} icon={AlertTriangle} />
      </div>

      <Card>
        <CardHeader title="Penalties" />
        <DataTable columns={cols} rows={rows} rowKey={(p) => p.id} empty="No penalties recorded." />
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add penalty"
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" disabled={!form.employeeId || !form.reason.trim() || !form.amount}
            onClick={() => {
              if (!hubId) return;
              addPenalty({ hubId, employeeId: form.employeeId, reason: form.reason.trim(), amount: Number(form.amount), date: form.date });
              setForm({ employeeId: '', reason: '', amount: 0, date: today() });
              setOpen(false);
            }}>Add penalty</Button></>}>
        <div className="space-y-4">
          <Field label="Employee">
            <Select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
              <option value="">Choose…</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </Select>
          </Field>
          <Field label="Reason"><Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Delivery error" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount"><Input type="number" min={0} className="tnum" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></Field>
            <Field label="Date"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}
