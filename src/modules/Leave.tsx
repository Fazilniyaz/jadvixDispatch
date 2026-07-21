import { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/Card';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Field, Input, Textarea } from '@/components/Field';
import { useStore } from '@/store/useStore';
import { useScopedEmployees, useScopedLeave } from '@/lib/scope';
import { today } from '@/data/seed';
import type { LeaveRequest } from '@/lib/types';

export default function Leave() {
  const user = useStore((s) => s.user);
  const hubId = useStore((s) => s.activeHubId);
  const labels = useStore((s) => s.moduleLabels);
  const addLeaveRequest = useStore((s) => s.addLeaveRequest);
  const decideLeave = useStore((s) => s.decideLeave);
  const employees = useScopedEmployees();
  const leave = useScopedLeave();

  const isDriver = user?.role === 'driver';
  const mine = isDriver ? leave.filter((l) => l.employeeId === user?.employeeId) : leave;
  const pending = mine.filter((l) => l.status === 'pending');
  const resolved = mine.filter((l) => l.status !== 'pending');

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ from: today(), to: today(), reason: '' });

  const empName = (id: string) => employees.find((e) => e.id === id)?.name ?? id;

  const submit = () => {
    if (!hubId || !user?.employeeId || !form.reason.trim()) return;
    addLeaveRequest({ hubId, employeeId: user.employeeId, from: form.from, to: form.to, reason: form.reason.trim() });
    setOpen(false);
    setForm({ from: today(), to: today(), reason: '' });
  };

  const base: Column<LeaveRequest>[] = [
    ...(isDriver ? [] : [{ key: 'emp', header: 'Employee', render: (r: LeaveRequest) => <span className="font-medium text-text">{empName(r.employeeId)}</span> }]),
    { key: 'from', header: 'From', render: (r) => <span className="text-text-2 tnum">{r.from}</span> },
    { key: 'to', header: 'To', render: (r) => <span className="text-text-2 tnum">{r.to}</span> },
    { key: 'reason', header: 'Reason', render: (r) => <span className="text-text-2">{r.reason}</span> },
  ];

  const pendingCols: Column<LeaveRequest>[] = [
    ...base,
    ...(isDriver
      ? [{ key: 'status', header: 'Status', render: (r: LeaveRequest) => <StatusPill status={r.status} /> }]
      : [{
          key: 'actions', header: '', headerClassName: 'text-right', className: 'text-right',
          render: (r: LeaveRequest) => (
            <div className="flex items-center justify-end gap-2">
              <Button size="sm" variant="secondary" onClick={() => decideLeave(r.id, 'approved', user?.name ?? '')}><Check size={14} />Approve</Button>
              <Button size="sm" variant="ghost" onClick={() => decideLeave(r.id, 'rejected', user?.name ?? '')}><X size={14} />Reject</Button>
            </div>
          ),
        }]),
  ];

  const resolvedCols: Column<LeaveRequest>[] = [
    ...base,
    { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
    { key: 'by', header: 'Decided by', render: (r) => <span className="text-2xs text-muted">{r.decidedBy ?? '—'}</span> },
  ];

  return (
    <div>
      <PageHeader
        title={labels.leave}
        description={isDriver ? 'Request time off and track your requests.' : 'Approve or reject leave. Approving marks the employee unavailable everywhere.'}
        action={isDriver ? <Button variant="primary" onClick={() => setOpen(true)}><Plus size={16} />Request leave</Button> : undefined}
      />

      <Card className="mb-4">
        <CardHeader title="Pending" subtitle={`${pending.length} awaiting review`} />
        <DataTable columns={pendingCols} rows={pending} rowKey={(r) => r.id} empty="Nothing pending." />
      </Card>

      <Card>
        <CardHeader title="Resolved" />
        <DataTable columns={resolvedCols} rows={resolved} rowKey={(r) => r.id} empty="No resolved requests." />
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Request leave"
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={!form.reason.trim()}>Submit request</Button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="From"><Input type="date" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} /></Field>
            <Field label="To"><Input type="date" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} /></Field>
          </div>
          <Field label="Reason"><Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Why do you need this leave?" /></Field>
        </div>
      </Modal>
    </div>
  );
}
