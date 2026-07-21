import { useState } from 'react';
import { Camera, Check, Plus, Wrench, X } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/Card';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Field, Input, Textarea } from '@/components/Field';
import { cn } from '@/lib/utils';
import { useStore, useCurrentEmployee } from '@/store/useStore';
import { useScopedCheckIns, useScopedEmployees, useScopedTickets } from '@/lib/scope';
import { today } from '@/data/seed';
import type { VehicleTicket, VehicleTicketStatus } from '@/lib/types';

const TONE: Record<VehicleTicketStatus, string> = { submitted: 'pending', reviewed: 'planned', accepted: 'delivered', failed: 'exception' };
const LABEL: Record<VehicleTicketStatus, string> = { submitted: 'Submitted', reviewed: 'Reviewed', accepted: 'Accepted', failed: 'Rejected' };
const SIDES = ['front', 'back', 'left', 'right'] as const;

export default function Vehicles() {
  const user = useStore((s) => s.user);
  const hubId = useStore((s) => s.activeHubId);
  const labels = useStore((s) => s.moduleLabels);
  const checkIn = useStore((s) => s.checkIn);
  const addTicket = useStore((s) => s.addVehicleTicket);
  const updateTicket = useStore((s) => s.updateVehicleTicket);
  const me = useCurrentEmployee();
  const employees = useScopedEmployees();
  const tickets = useScopedTickets();
  const checkIns = useScopedCheckIns();

  const isDriver = user?.role === 'driver';
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [ticketOpen, setTicketOpen] = useState(false);
  const [tForm, setTForm] = useState({ subject: '', notes: '' });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [remarks, setRemarks] = useState<Record<string, string>>({});

  const myCheckedIn = me ? checkIns.some((c) => c.employeeId === me.id && c.date === today()) : false;
  const allDone = SIDES.every((s) => photos[s]);

  const capture = (side: string, file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    // Downscale so localStorage isn't overwhelmed by full-size photos.
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 480 / Math.max(img.width, img.height));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setPhotos((p) => ({ ...p, [side]: canvas.toDataURL('image/jpeg', 0.6) }));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const submitCheckIn = () => {
    if (!hubId || !me || !allDone) return;
    checkIn(hubId, me.id, { front: photos.front, back: photos.back, left: photos.left, right: photos.right });
    setPhotos({});
  };

  const myTickets = isDriver && me ? tickets.filter((t) => t.employeeId === me.id) : tickets;
  const empName = (id: string) => employees.find((e) => e.id === id)?.name ?? 'Unknown';

  const cols: Column<VehicleTicket>[] = [
    ...(isDriver ? [] : [{ key: 'driver', header: 'Driver', render: (t: VehicleTicket) => <span className="text-[13px] font-medium text-text">{empName(t.employeeId)}</span> }]),
    { key: 'vehicle', header: 'Vehicle', render: (t) => <span className="font-mono text-2xs text-text-2">{t.vehicleNo}</span> },
    { key: 'subject', header: 'Subject', render: (t) => <span className="text-[13px] text-text">{t.subject}</span> },
    { key: 'status', header: 'Status', render: (t) => <StatusPill status={TONE[t.status]} label={LABEL[t.status]} /> },
  ];

  return (
    <div>
      <PageHeader
        title={labels.vehicles}
        description={isDriver ? 'Check in with four photos of your vehicle, and report any issues.' : 'Daily driver check-ins and repair tickets.'}
        action={isDriver ? <Button variant="primary" onClick={() => setTicketOpen(true)}><Plus size={16} />Report issue</Button> : undefined}
      />

      {/* Driver check-in */}
      {isDriver && me && (
        <Card className="mb-4">
          <CardHeader
            title="Today’s check-in"
            subtitle={myCheckedIn ? 'Completed — thank you' : 'Photograph all four sides of your vehicle'}
            action={myCheckedIn ? <StatusPill status="delivered" label="Checked in" /> : <StatusPill status="pending" label="Pending" />}
          />
          {!myCheckedIn && (
            <div className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SIDES.map((side) => (
                  <label key={side} className={cn(
                    'flex flex-col items-center justify-center gap-2 h-28 rounded-[4px] border border-dashed cursor-pointer text-2xs',
                    photos[side] ? 'border-delivered text-delivered' : 'border-border text-muted hover:bg-surface-2'
                  )}>
                    {photos[side] ? (
                      <img src={photos[side]} alt={`${side} view`} className="h-full w-full object-cover rounded-[3px]" />
                    ) : (
                      <><Camera size={18} /><span className="capitalize">{side}</span></>
                    )}
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => capture(side, e.target.files?.[0])} />
                  </label>
                ))}
              </div>
              <Button variant="primary" className="mt-3" disabled={!allDone} onClick={submitCheckIn}>
                <Check size={15} />Submit check-in
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Authority view of today's attendance */}
      {!isDriver && (
        <Card className="mb-4">
          <CardHeader title="Attendance today" subtitle={`${checkIns.filter((c) => c.date === today()).length} of ${employees.filter((e) => e.role === 'driver').length} drivers checked in`} />
          <div className="divide-y divide-border">
            {employees.filter((e) => e.role === 'driver').map((d) => {
              const ci = checkIns.find((c) => c.employeeId === d.id && c.date === today());
              return (
                <div key={d.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-[13px] text-text flex-1 truncate">{d.name}</span>
                  {ci && (
                    <div className="flex gap-1">
                      {SIDES.map((s) => (
                        <span key={s} className="h-6 w-6 rounded-[2px] border border-border overflow-hidden bg-surface-2">
                          {ci.photos[s]?.startsWith('data:') ? <img src={ci.photos[s]} alt="" className="h-full w-full object-cover" /> : null}
                        </span>
                      ))}
                    </div>
                  )}
                  <StatusPill status={ci ? 'delivered' : 'exception'} label={ci ? 'Checked in' : 'Missing'} />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="Repair tickets" />
        <DataTable
          columns={cols}
          rows={myTickets}
          rowKey={(t) => t.id}
          onRowClick={(t) => setExpanded(expanded === t.id ? null : t.id)}
          expandedKey={expanded}
          renderExpanded={(t) => (
            <div className="px-4 py-4 space-y-3">
              <p className="text-[13px] text-text bg-surface p-3 rounded-[3px] border border-border">{t.notes}</p>
              {t.adminRemarks && (
                <div className="flex items-start gap-2"><Wrench size={14} className="text-muted mt-0.5" />
                  <div><span className="text-2xs uppercase tracking-wide text-muted">Response</span>
                    <p className="text-[13px] text-text">{t.adminRemarks}</p></div>
                </div>
              )}
              {!isDriver && (t.status === 'submitted' || t.status === 'reviewed') && (
                <div className="space-y-2">
                  <Textarea placeholder="Add remarks for the driver…" value={remarks[t.id] ?? t.adminRemarks}
                    onChange={(e) => setRemarks((r) => ({ ...r, [t.id]: e.target.value }))} />
                  <div className="flex flex-wrap gap-2">
                    {t.status === 'submitted' && <Button size="sm" variant="secondary" onClick={() => updateTicket(t.id, 'reviewed', remarks[t.id])}>Mark reviewed</Button>}
                    <Button size="sm" variant="primary" onClick={() => updateTicket(t.id, 'accepted', remarks[t.id])}><Check size={14} />Accept</Button>
                    <Button size="sm" variant="danger" onClick={() => updateTicket(t.id, 'failed', remarks[t.id])}><X size={14} />Reject</Button>
                  </div>
                </div>
              )}
            </div>
          )}
          empty="No tickets yet."
        />
      </Card>

      <Modal open={ticketOpen} onClose={() => setTicketOpen(false)} title="Report vehicle issue"
        footer={<><Button variant="ghost" onClick={() => setTicketOpen(false)}>Cancel</Button>
          <Button variant="primary" disabled={!tForm.subject.trim() || !tForm.notes.trim()}
            onClick={() => {
              if (!hubId || !me) return;
              addTicket({ hubId, employeeId: me.id, vehicleNo: me.vehicleNo, subject: tForm.subject.trim(), notes: tForm.notes.trim(), photoAttached: false });
              setTForm({ subject: '', notes: '' });
              setTicketOpen(false);
            }}>Submit ticket</Button></>}>
        <div className="space-y-4">
          <Field label="Subject"><Input value={tForm.subject} onChange={(e) => setTForm({ ...tForm, subject: e.target.value })} placeholder="e.g. Flat tyre" /></Field>
          <Field label="Description"><Textarea value={tForm.notes} onChange={(e) => setTForm({ ...tForm, notes: e.target.value })} /></Field>
        </div>
      </Modal>
    </div>
  );
}
