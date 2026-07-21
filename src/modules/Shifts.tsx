import { useState } from 'react';
import { Clock, Pencil, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Field, Input } from '@/components/Field';
import { useStore } from '@/store/useStore';
import { useScopedBays, useScopedShifts } from '@/lib/scope';
import { today } from '@/data/seed';
import type { Shift } from '@/lib/types';

const MAX_SHIFTS = 4;

export default function Shifts() {
  const hubId = useStore((s) => s.activeHubId);
  const labels = useStore((s) => s.moduleLabels);
  const addShift = useStore((s) => s.addShift);
  const updateShift = useStore((s) => s.updateShift);
  const deleteShift = useStore((s) => s.deleteShift);
  const shifts = useScopedShifts();
  const bays = useScopedBays(today());

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);
  const [form, setForm] = useState({ name: '', startTime: '' });
  const [clash, setClash] = useState<Shift | null>(null);
  const [confirm, setConfirm] = useState<Shift | null>(null);

  const atLimit = shifts.length >= MAX_SHIFTS;

  const save = () => {
    if (!form.name.trim() || !form.startTime || !hubId) return;
    // A shift has a start time only — two shifts may not start at the same time.
    const conflict = shifts.find((s) => s.startTime === form.startTime && s.id !== editing?.id);
    if (conflict) return setClash(conflict);
    if (editing) updateShift(editing.id, { name: form.name.trim(), startTime: form.startTime });
    else addShift({ hubId, name: form.name.trim(), startTime: form.startTime });
    setOpen(false);
    setEditing(null);
  };

  return (
    <div>
      <PageHeader
        title={labels.shifts}
        description="Up to four waves per hub. A shift is a name and a start time — no end time."
        action={
          <Button variant="primary" disabled={atLimit} onClick={() => { setEditing(null); setForm({ name: '', startTime: '' }); setOpen(true); }}>
            <Plus size={16} />New shift
          </Button>
        }
      />
      {atLimit && (
        <div className="mb-4 text-[13px] text-text-2 border border-border rounded-[3px] bg-surface-2 px-3 py-2">
          Maximum of {MAX_SHIFTS} shifts reached. Delete one to add another.
        </div>
      )}

      {shifts.length === 0 ? (
        <Card className="p-10 text-center text-[13px] text-text-2">No shifts yet at this hub.</Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shifts.map((s) => {
            const staffed = bays.filter((b) => b.shiftId === s.id && b.assignedDriverId).length;
            return (
              <Card key={s.id}>
                <CardHeader
                  title={s.name}
                  subtitle={<span className="inline-flex items-center gap-1.5"><Clock size={12} className="text-muted" /><span className="tnum">starts {s.startTime}</span></span>}
                  action={
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditing(s); setForm({ name: s.name, startTime: s.startTime }); setOpen(true); }} aria-label="Edit shift" className="text-muted hover:text-text p-1"><Pencil size={14} /></button>
                      <button onClick={() => setConfirm(s)} aria-label="Delete shift" className="text-muted hover:text-exception p-1"><Trash2 size={14} /></button>
                    </div>
                  }
                />
                <div className="p-4 flex items-end justify-between">
                  <div>
                    <div className="font-display text-2xl font-semibold text-text tnum leading-none">{s.startTime}</div>
                    <div className="text-2xs text-muted mt-1">start time</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-2xl font-semibold text-text tnum leading-none">{staffed}</div>
                    <div className="text-2xs text-muted mt-1">staffed today</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit ${editing.name}` : 'New shift'}
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={!form.name.trim() || !form.startTime}>{editing ? 'Save changes' : 'Create shift'}</Button></>}>
        <div className="space-y-4">
          <Field label="Shift name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Morning Wave" autoFocus /></Field>
          <Field label="Start time" hint="Shifts have no end time"><Input type="time" className="tnum" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></Field>
        </div>
      </Modal>

      <Modal open={!!clash} onClose={() => setClash(null)} title="Shifts having conflicts"
        footer={<Button variant="primary" onClick={() => setClash(null)}>Adjust time</Button>}>
        <p className="text-[13px] text-text-2">
          <b className="text-text">{clash?.name}</b> already starts at{' '}
          <span className="font-mono tnum">{clash?.startTime}</span>. Pick a different start time.
        </p>
      </Modal>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Delete shift"
        footer={<><Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => { if (confirm) deleteShift(confirm.id); setConfirm(null); }}>Delete</Button></>}>
        <p className="text-[13px] text-text-2">Delete <b className="text-text">{confirm?.name}</b>? Its bays will be removed too.</p>
      </Modal>
    </div>
  );
}
