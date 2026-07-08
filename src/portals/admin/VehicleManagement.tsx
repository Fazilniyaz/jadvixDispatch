import { useState } from 'react';
import { Camera, Check, X } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { StatusPill } from '@/components/StatusPill';
import { DataTable, type Column } from '@/components/DataTable';
import { Field, Textarea } from '@/components/Field';
import { useStore } from '@/store/useStore';
import type { VehicleTicket, VehicleTicketStatus } from '@/lib/types';

const TICKET_TONE: Record<VehicleTicketStatus, string> = {
  submitted: 'pending',
  reviewed: 'planned',
  accepted: 'delivered',
  failed: 'exception',
};
const TICKET_LABEL: Record<VehicleTicketStatus, string> = {
  submitted: 'Submitted',
  reviewed: 'Reviewed',
  accepted: 'Accepted',
  failed: 'Rejected',
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric' });
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });

export default function VehicleManagement() {
  const tickets = useStore((s) => s.vehicleTickets);
  const employees = useStore((s) => s.employees);
  const labels = useStore((s) => s.moduleLabels);
  const updateStatus = useStore((s) => s.updateVehicleTicketStatus);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});

  const driverName = (id: string) => employees.find((e) => e.id === id)?.name ?? 'Unknown';

  const handleUpdate = (id: string, status: VehicleTicketStatus) => {
    updateStatus(id, status, remarksMap[id]);
    setExpandedId(null);
  };

  const columns: Column<VehicleTicket>[] = [
    {
      key: 'id',
      header: 'ID',
      render: (t) => <span className="font-mono text-2xs text-text-2 uppercase tnum">{t.id}</span>,
    },
    {
      key: 'driver',
      header: 'Driver',
      render: (t) => <span className="text-[13px] text-text font-medium">{driverName(t.employeeId)}</span>,
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (t) => <span className="font-mono text-2xs text-text-2">{t.vehicleNo}</span>,
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (t) => <span className="text-[13px] text-text">{t.subject}</span>,
    },
    {
      key: 'date',
      header: 'Date',
      render: (t) => <span className="text-2xs text-text-2 tnum">{fmtDate(t.createdAt)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => <StatusPill status={TICKET_TONE[t.status]} label={TICKET_LABEL[t.status]} />,
    },
  ];

  const renderExpanded = (t: VehicleTicket) => {
    const open = t.status === 'submitted' || t.status === 'reviewed';
    return (
      <div className="px-3 sm:px-4 py-4 border-t border-border">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Details */}
          <div className="space-y-3">
            <div>
              <div className="text-2xs uppercase tracking-wide text-muted mb-1">Issue description</div>
              <p className="text-[13px] text-text bg-surface p-3 rounded-[3px] border border-border">
                {t.notes}
              </p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-[13px]">
              <div>
                <span className="text-muted mr-2">Submitted</span>
                <span className="text-text font-medium tnum">
                  {fmtDate(t.createdAt)} {fmtTime(t.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-muted mr-2">Contact</span>
                <span className="text-text font-medium tnum">
                  {employees.find((e) => e.id === t.employeeId)?.contactNo ?? '—'}
                </span>
              </div>
            </div>
            {t.photoAttached && (
              <div className="flex items-center gap-1.5 text-2xs text-accent font-medium">
                <Camera size={14} />
                Evidence photo provided
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3 lg:border-l lg:border-border lg:pl-5">
            <Field label="Admin remarks" htmlFor={`vt-remarks-${t.id}`}>
              <Textarea
                id={`vt-remarks-${t.id}`}
                value={remarksMap[t.id] ?? t.adminRemarks}
                onChange={(e) => setRemarksMap((prev) => ({ ...prev, [t.id]: e.target.value }))}
                placeholder="Add notes for the driver…"
                disabled={!open}
              />
            </Field>

            {open ? (
              <div className="flex flex-wrap gap-2">
                {t.status === 'submitted' && (
                  <Button variant="secondary" size="sm" onClick={() => handleUpdate(t.id, 'reviewed')}>
                    Mark as reviewed
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  style={{ backgroundColor: 'var(--delivered)', borderColor: 'var(--delivered)' }}
                  onClick={() => handleUpdate(t.id, 'accepted')}
                >
                  <Check size={14} />
                  Accept &amp; schedule repair
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleUpdate(t.id, 'failed')}>
                  <X size={14} />
                  Reject ticket
                </Button>
              </div>
            ) : (
              <div className="text-2xs text-muted">
                This ticket is {TICKET_LABEL[t.status].toLowerCase()}. Last updated {fmtDate(t.updatedAt)}{' '}
                {fmtTime(t.updatedAt)}.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title={labels.vehicles}
        description="Review and action vehicle repair tickets submitted by drivers."
      />

      <Card>
        <DataTable
          columns={columns}
          rows={tickets}
          rowKey={(t) => t.id}
          onRowClick={(t) => {
            setExpandedId((prev) => (prev === t.id ? null : t.id));
            setRemarksMap((prev) => (t.id in prev ? prev : { ...prev, [t.id]: t.adminRemarks }));
          }}
          expandedKey={expandedId}
          renderExpanded={renderExpanded}
          empty="No vehicle tickets submitted yet."
        />
      </Card>
    </div>
  );
}
