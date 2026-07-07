import { useState, type FormEvent } from 'react';
import { PlaneTakeoff } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/Card';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/Button';
import { Field, Input, Textarea } from '@/components/Field';
import { useCurrentEmployee, useStore } from '@/store/useStore';
import type { LeaveRequest } from '@/lib/types';

export default function Leave() {
  const me = useCurrentEmployee();
  const leaveRequests = useStore((s) => s.leaveRequests);
  const addLeaveRequest = useStore((s) => s.addLeaveRequest);

  const [form, setForm] = useState({ from: '', to: '', reason: '' });
  const [submitted, setSubmitted] = useState(false);

  if (!me) return null;

  const mine = leaveRequests.filter((r) => r.employeeId === me.id);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.from || !form.to || !form.reason.trim()) return;
    addLeaveRequest({ employeeId: me.id, ...form });
    setForm({ from: '', to: '', reason: '' });
    setSubmitted(true);
    window.setTimeout(() => setSubmitted(false), 3000);
  };

  const columns: Column<LeaveRequest>[] = [
    { key: 'from', header: 'From', render: (r) => <span className="text-text-2 tnum">{r.from}</span> },
    { key: 'to', header: 'To', render: (r) => <span className="text-text-2 tnum">{r.to}</span> },
    { key: 'reason', header: 'Reason', render: (r) => <span className="text-text">{r.reason}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Leave"
        description="Request time off. Requests go straight to the admin queue for review."
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader title="Request leave" />
          <form onSubmit={onSubmit} className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="From" htmlFor="l-from">
                <Input
                  id="l-from"
                  type="date"
                  value={form.from}
                  onChange={(e) => setForm({ ...form, from: e.target.value })}
                />
              </Field>
              <Field label="To" htmlFor="l-to">
                <Input
                  id="l-to"
                  type="date"
                  value={form.to}
                  onChange={(e) => setForm({ ...form, to: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Reason" htmlFor="l-reason">
              <Textarea
                id="l-reason"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Brief reason for your request"
              />
            </Field>
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={!form.from || !form.to || !form.reason.trim()}
            >
              <PlaneTakeoff size={16} />
              Submit request
            </Button>
            {submitted && (
              <p className="text-2xs text-delivered">Request submitted to the admin queue.</p>
            )}
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Your requests" subtitle={`${mine.length} total`} />
          <DataTable
            columns={columns}
            rows={mine}
            rowKey={(r) => r.id}
            empty="You have not requested any leave yet."
          />
        </Card>
      </div>
    </div>
  );
}
