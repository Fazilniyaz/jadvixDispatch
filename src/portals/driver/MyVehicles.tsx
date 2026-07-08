import { useState } from 'react';
import { Camera, Plus, Wrench } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { StatusPill } from '@/components/StatusPill';
import { Field, Input, Textarea } from '@/components/Field';
import { Modal } from '@/components/Modal';
import { cn } from '@/lib/utils';
import { useCurrentEmployee, useStore } from '@/store/useStore';
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

export default function MyVehicles() {
  const me = useCurrentEmployee();
  const tickets = useStore((s) => s.vehicleTickets);
  const labels = useStore((s) => s.moduleLabels);
  const addTicket = useStore((s) => s.addVehicleTicket);

  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [photoAttached, setPhotoAttached] = useState(false);

  if (!me) return null;

  const myTickets = tickets.filter((t) => t.employeeId === me.id);

  const reset = () => {
    setSubject('');
    setNotes('');
    setPhotoAttached(false);
  };

  const submit = () => {
    if (!subject.trim() || !notes.trim()) return;
    addTicket({
      employeeId: me.id,
      vehicleNo: me.vehicleNo,
      subject: subject.trim(),
      notes: notes.trim(),
      photoAttached,
    });
    setIsOpen(false);
    reset();
  };

  return (
    <div>
      <PageHeader
        title={labels.vehicles}
        description="Report vehicle issues and track the status of your repair requests."
        action={
          <Button variant="primary" onClick={() => setIsOpen(true)}>
            <Plus size={16} />
            Report issue
          </Button>
        }
      />

      <div className="space-y-3">
        {myTickets.length === 0 ? (
          <Card className="p-10 text-center text-text-2 text-[13px]">
            No vehicle issues reported. Use “Report issue” to raise a repair ticket.
          </Card>
        ) : (
          myTickets.map((t) => <TicketCard key={t.id} ticket={t} />)
        )}
      </div>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Report vehicle issue"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submit} disabled={!subject.trim() || !notes.trim()}>
              Submit ticket
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Vehicle number" htmlFor="v-no">
            <Input id="v-no" className="font-mono" value={me.vehicleNo} readOnly />
          </Field>
          <Field label="Subject" htmlFor="v-subject">
            <Input
              id="v-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Flat tire, engine noise"
            />
          </Field>
          <Field label="Description" htmlFor="v-notes">
            <Textarea
              id="v-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe the issue in detail…"
            />
          </Field>
          <button
            type="button"
            onClick={() => setPhotoAttached((v) => !v)}
            className={cn(
              'inline-flex items-center gap-1.5 h-8 px-3 text-[13px] font-medium rounded-[3px] border',
              photoAttached
                ? 'border-delivered text-delivered'
                : 'border-border text-text-2 hover:bg-surface-2'
            )}
            style={
              photoAttached
                ? { backgroundColor: 'color-mix(in srgb, var(--delivered) 12%, transparent)' }
                : undefined
            }
          >
            <Camera size={14} />
            {photoAttached ? 'Evidence attached' : 'Attach photo evidence'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function TicketCard({ ticket }: { ticket: VehicleTicket }) {
  const created = new Date(ticket.createdAt);
  const dateStr = created.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  const timeStr = created.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-2xs text-text-2 uppercase tnum">{ticket.id}</span>
            <span className="text-2xs text-muted">·</span>
            <span className="text-2xs text-text-2 tnum">
              {dateStr} {timeStr}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-text">{ticket.subject}</h3>
          <p className="text-[13px] text-text-2 mt-1">{ticket.notes}</p>

          {ticket.photoAttached && (
            <div className="flex items-center gap-1.5 mt-3 text-2xs text-muted font-medium bg-surface-2 w-fit px-2 py-1 rounded-[3px] border border-border">
              <Camera size={12} />
              Photo evidence attached
            </div>
          )}
        </div>
        <StatusPill status={TICKET_TONE[ticket.status]} label={TICKET_LABEL[ticket.status]} />
      </div>

      {ticket.adminRemarks && (
        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex items-start gap-2">
            <Wrench size={14} className="text-muted mt-0.5 shrink-0" />
            <div>
              <span className="text-2xs font-semibold text-text-2 uppercase tracking-wide">
                Admin response
              </span>
              <p className="text-[13px] text-text mt-0.5">{ticket.adminRemarks}</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
