import { Check, X } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/Card';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/Button';
import { useStore } from '@/store/useStore';
import type { LeaveRequest } from '@/lib/types';

export default function LeaveRequests() {
  const leaveRequests = useStore((s) => s.leaveRequests);
  const employees = useStore((s) => s.employees);
  const labels = useStore((s) => s.moduleLabels);
  const approveLeave = useStore((s) => s.approveLeave);
  const rejectLeave = useStore((s) => s.rejectLeave);

  const empName = (id: string) => employees.find((e) => e.id === id)?.name ?? id;

  const pending = leaveRequests.filter((r) => r.status === 'pending');
  const resolved = leaveRequests.filter((r) => r.status !== 'pending');

  const pendingCols: Column<LeaveRequest>[] = [
    { key: 'emp', header: 'Employee', render: (r) => <span className="font-medium text-text">{empName(r.employeeId)}</span> },
    { key: 'from', header: 'From', render: (r) => <span className="text-text-2 tnum">{r.from}</span> },
    { key: 'to', header: 'To', render: (r) => <span className="text-text-2 tnum">{r.to}</span> },
    { key: 'reason', header: 'Reason', render: (r) => <span className="text-text-2">{r.reason}</span> },
    {
      key: 'actions',
      header: '',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={() => approveLeave(r.id)}>
            <Check size={14} />
            Approve
          </Button>
          <Button size="sm" variant="ghost" onClick={() => rejectLeave(r.id)}>
            <X size={14} />
            Reject
          </Button>
        </div>
      ),
    },
  ];

  const resolvedCols: Column<LeaveRequest>[] = [
    { key: 'emp', header: 'Employee', render: (r) => <span className="font-medium text-text">{empName(r.employeeId)}</span> },
    { key: 'from', header: 'From', render: (r) => <span className="text-text-2 tnum">{r.from}</span> },
    { key: 'to', header: 'To', render: (r) => <span className="text-text-2 tnum">{r.to}</span> },
    { key: 'reason', header: 'Reason', render: (r) => <span className="text-text-2">{r.reason}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title={labels.leave}
        description="Approve or reject leave. Approving flips the employee’s status to on leave everywhere."
      />

      <Card className="mb-4">
        <CardHeader
          title="Pending queue"
          subtitle={`${pending.length} request${pending.length === 1 ? '' : 's'} awaiting review`}
        />
        <DataTable
          columns={pendingCols}
          rows={pending}
          rowKey={(r) => r.id}
          empty="No pending requests."
        />
      </Card>

      <Card>
        <CardHeader title="Resolved" />
        <DataTable
          columns={resolvedCols}
          rows={resolved}
          rowKey={(r) => r.id}
          empty="No resolved requests yet."
        />
      </Card>
    </div>
  );
}
