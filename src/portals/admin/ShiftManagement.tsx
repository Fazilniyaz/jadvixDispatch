import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/Card';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/Button';
import { SidePanel } from '@/components/SidePanel';
import { Modal } from '@/components/Modal';
import { Field, Input, Select } from '@/components/Field';
import { useStore } from '@/store/useStore';
import type { Shift, WaveStatus } from '@/lib/types';

const WAVE_STATUSES: WaveStatus[] = ['pending', 'active', 'completed'];

export default function ShiftManagement() {
  const shifts = useStore((s) => s.shifts);
  const waves = useStore((s) => s.waves);
  const employees = useStore((s) => s.employees);
  const labels = useStore((s) => s.moduleLabels);
  const activeShiftId = useStore((s) => s.activeShiftId);
  const activeWaveId = useStore((s) => s.activeWaveId);
  const addShift = useStore((s) => s.addShift);
  const updateShift = useStore((s) => s.updateShift);
  const deleteShift = useStore((s) => s.deleteShift);
  const updateWave = useStore((s) => s.updateWave);
  const setActive = useStore((s) => s.setActive);

  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);
  const [form, setForm] = useState({ name: '', window: '' });
  const [confirmDelete, setConfirmDelete] = useState<Shift | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', window: '' });
    setPanelOpen(true);
  };
  const openEdit = (s: Shift) => {
    setEditing(s);
    setForm({ name: s.name, window: s.window });
    setPanelOpen(true);
  };
  const save = () => {
    if (editing) updateShift(editing.id, form);
    else addShift(form);
    setPanelOpen(false);
  };

  const activeShift = shifts.find((s) => s.id === activeShiftId);
  const activeWave = waves.find((w) => w.id === activeWaveId);

  return (
    <div>
      <PageHeader
        title={labels.shifts}
        description="Plan the day in shifts and waves, and set which wave is running now."
        action={
          <Button variant="primary" onClick={openCreate}>
            <Plus size={16} />
            New shift
          </Button>
        }
      />

      {/* Active indicator */}
      <Card className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-delivered" />
            <div>
              <div className="text-2xs uppercase tracking-wide text-muted">Currently running</div>
              <div className="text-sm font-semibold text-text">
                {activeShift?.name ?? '—'} · Wave {activeWave?.number ?? '—'}
                <span className="text-text-2 font-normal"> · {activeWave?.window ?? ''}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select
              aria-label="Set active shift"
              value={activeShiftId}
              onChange={(e) => {
                const first = waves.find((w) => w.shiftId === e.target.value);
                setActive(e.target.value, first?.id ?? activeWaveId);
              }}
              className="w-40"
            >
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Set active wave"
              value={activeWaveId}
              onChange={(e) => setActive(activeShiftId, e.target.value)}
              className="w-40"
            >
              {waves
                .filter((w) => w.shiftId === activeShiftId)
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    Wave {w.number}
                  </option>
                ))}
            </Select>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        {shifts.map((shift) => {
          const shiftWaves = waves.filter((w) => w.shiftId === shift.id);
          const isActive = shift.id === activeShiftId;
          const shiftEmployees = employees.filter((e) => e.shift === shift.name);
          return (
            <Card key={shift.id}>
              <CardHeader
                title={
                  <span className="flex items-center gap-2">
                    {shift.name}
                    <StatusPill status={isActive ? 'active' : 'idle'} label={isActive ? 'Active' : 'Idle'} />
                  </span>
                }
                subtitle={shift.window}
                action={
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(shift)}
                      aria-label="Edit shift"
                      className="text-muted hover:text-text p-1"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(shift)}
                      aria-label="Delete shift"
                      className="text-muted hover:text-exception p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                }
              />
              <div className="p-4 space-y-3">
                <div>
                  <div className="text-2xs uppercase tracking-wide text-muted mb-2">
                    Waves ({shiftWaves.length})
                  </div>
                  <div className="space-y-2">
                    {shiftWaves.length === 0 && (
                      <p className="text-2xs text-muted">No waves in this shift.</p>
                    )}
                    {shiftWaves.map((w) => (
                      <div key={w.id} className="flex items-center justify-between gap-2">
                        <span className="text-[13px] text-text-2">
                          Wave {w.number} · {w.window}
                        </span>
                        <Select
                          aria-label={`Wave ${w.number} status`}
                          value={w.status}
                          onChange={(e) => updateWave(w.id, { status: e.target.value as WaveStatus })}
                          className="h-7 w-28 text-2xs"
                        >
                          {WAVE_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  <div className="text-2xs uppercase tracking-wide text-muted mb-2">
                    Staff on shift ({shiftEmployees.length})
                  </div>
                  <div className="space-y-1.5">
                    {shiftEmployees.map((e) => (
                      <div key={e.id} className="flex items-center justify-between">
                        <span className="text-[13px] text-text truncate">{e.name}</span>
                        <StatusPill status={e.status === 'active' ? 'active' : 'leave'} />
                      </div>
                    ))}
                    {shiftEmployees.length === 0 && (
                      <p className="text-2xs text-muted">No staff assigned.</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <SidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editing ? 'Edit shift' : 'New shift'}
        subtitle={editing ? editing.name : 'Add a shift to the plan'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPanelOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save} disabled={!form.name.trim()}>
              {editing ? 'Save changes' : 'Create shift'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Shift name" htmlFor="s-name">
            <Input
              id="s-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Morning"
            />
          </Field>
          <Field label="Window" htmlFor="s-window">
            <Input
              id="s-window"
              value={form.window}
              onChange={(e) => setForm({ ...form, window: e.target.value })}
              placeholder="e.g. 06:00 – 14:00"
            />
          </Field>
          {!editing && (
            <p className="text-2xs text-muted">
              New shifts start with no waves. Waves can be managed once the shift exists.
            </p>
          )}
        </div>
      </SidePanel>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete shift"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirmDelete) deleteShift(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-text-2">
          Delete the <span className="font-medium text-text">{confirmDelete?.name}</span> shift and
          its waves? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
