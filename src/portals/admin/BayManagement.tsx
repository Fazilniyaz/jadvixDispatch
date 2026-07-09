import { useState } from 'react';
import { Pencil, Plus, Trash2, Warehouse } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatusPill } from '@/components/StatusPill';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { Field, Input, Select } from '@/components/Field';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import type { Bay } from '@/lib/types';

type FormState = {
  shiftId: string;
  assignedDriverId: string;
  vehicleNo: string;
  stocks: number;
  date: string;
};

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = (shiftId: string): FormState => ({
  shiftId,
  assignedDriverId: '',
  vehicleNo: '',
  stocks: 0,
  date: today(),
});

export default function BayManagement() {
  const bays = useStore((s) => s.bays);
  const employees = useStore((s) => s.employees);
  const products = useStore((s) => s.products);
  const shifts = useStore((s) => s.shifts);
  const labels = useStore((s) => s.moduleLabels);
  const activeShiftId = useStore((s) => s.activeShiftId);
  const addBay = useStore((s) => s.addBay);
  const updateBay = useStore((s) => s.updateBay);
  const deleteBay = useStore((s) => s.deleteBay);
  const updateEmployee = useStore((s) => s.updateEmployee);

  const drivers = employees.filter((e) => e.role === 'driver');
  const driverName = (id: string | null) => employees.find((e) => e.id === id)?.name ?? 'Unassigned';

  const [selectedId, setSelectedId] = useState<string>(activeShiftId);
  const selectedShift = shifts.find((s) => s.id === selectedId) ?? shifts[0];
  const selectedShiftId = selectedShift?.id ?? '';

  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<Bay | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(selectedShiftId));
  const [confirmDelete, setConfirmDelete] = useState<Bay | null>(null);

  const shiftBays = bays.filter((b) => b.shiftId === selectedShiftId);
  const assignedDrivers = selectedShift
    ? drivers.filter((d) => d.shift === selectedShift.name)
    : [];

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(selectedShiftId));
    setPanelOpen(true);
  };

  const openEdit = (b: Bay) => {
    setEditing(b);
    setForm({
      shiftId: b.shiftId ?? selectedShiftId,
      assignedDriverId: b.assignedDriverId ?? '',
      vehicleNo: b.vehicleNo,
      stocks: b.stocks,
      date: b.date || today(),
    });
    setPanelOpen(true);
  };

  const save = () => {
    const driver = drivers.find((d) => d.id === form.assignedDriverId);
    const patch = {
      shiftId: form.shiftId || null,
      assignedDriverId: form.assignedDriverId || null,
      vehicleNo: form.assignedDriverId ? driver?.vehicleNo ?? form.vehicleNo : form.vehicleNo,
      stocks: Number(form.stocks) || 0,
      date: form.date || today(),
    };
    if (editing) updateBay(editing.id, patch);
    else addBay(patch);
    setPanelOpen(false);
  };

  const toggleDriver = (driverId: string, checked: boolean) => {
    if (!selectedShift) return;
    updateEmployee(driverId, { shift: checked ? selectedShift.name : '' });
  };

  return (
    <div>
      <PageHeader
        title={labels.bays}
        description="Loading bays grouped by shift, their vehicles, drivers and staged stocks."
        action={
          <Button variant="primary" onClick={openCreate} disabled={!selectedShift}>
            <Plus size={16} />
            New bay
          </Button>
        }
      />

      {shifts.length === 0 ? (
        <div className="border border-border rounded-[4px] bg-surface p-8 text-center text-[13px] text-text-2">
          No shifts yet. Create a shift first, then add bays under it.
        </div>
      ) : (
        <>
          {/* Shift tabs */}
          <div className="flex items-end gap-1 border-b border-border overflow-x-auto">
            {shifts.map((s) => {
              const active = s.id === selectedShiftId;
              const count = bays.filter((b) => b.shiftId === s.id).length;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={cn(
                    '-mb-px px-4 py-2.5 text-[13px] font-medium whitespace-nowrap rounded-t-[6px] border border-b-0 transition-colors',
                    active
                      ? 'bg-surface border-border text-text'
                      : 'border-transparent text-text-2 hover:text-text hover:bg-surface-2'
                  )}
                >
                  {s.name}
                  <span className="ml-2 text-2xs text-muted tnum">· {count}</span>
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="border border-border border-t-0 rounded-b-[6px] bg-surface p-4 space-y-6">
            {/* Drivers on this shift */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text">
                  Drivers on {selectedShift?.name}
                </h3>
                <span className="text-2xs text-muted tnum">
                  {assignedDrivers.length} / {drivers.length} assigned
                </span>
              </div>
              <p className="text-2xs text-muted mb-3">
                Tick a driver to assign them to this shift; untick to make them available again.
              </p>
              {drivers.length === 0 ? (
                <p className="text-[13px] text-text-2">No drivers on record.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {drivers.map((d) => {
                    const checked = !!selectedShift && d.shift === selectedShift.name;
                    const elsewhere = !checked && d.shift && d.shift !== selectedShift?.name;
                    return (
                      <label
                        key={d.id}
                        className="flex items-center gap-3 border border-border rounded-[3px] px-3 py-2 cursor-pointer hover:bg-surface-2"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => toggleDriver(d.id, e.target.checked)}
                          className="h-4 w-4 accent-accent shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] text-text truncate">{d.name}</div>
                          <div className="text-2xs text-muted font-mono">{d.vehicleNo}</div>
                        </div>
                        {elsewhere ? (
                          <span className="text-2xs text-muted shrink-0">on {d.shift}</span>
                        ) : (
                          <StatusPill status={d.status === 'active' ? 'active' : 'leave'} />
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Bays under this shift */}
            <section className="border-t border-border pt-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text">
                  Bays <span className="text-muted font-normal tnum">({shiftBays.length})</span>
                </h3>
                <Button variant="secondary" size="sm" onClick={openCreate}>
                  <Plus size={14} />
                  Add bay
                </Button>
              </div>

              {shiftBays.length === 0 ? (
                <div className="border border-dashed border-border rounded-[4px] p-8 text-center">
                  <Warehouse size={20} className="mx-auto text-muted mb-2" />
                  <p className="text-[13px] text-text-2">No bays under this shift yet.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {shiftBays.map((b) => {
                    const assigned = !!b.assignedDriverId;
                    const productCount = products.filter((p) => p.bayId === b.id).length;
                    return (
                      <div key={b.id} className="border border-border rounded-[4px] bg-bg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-mono text-sm font-semibold text-text">
                              {b.id.toUpperCase()}
                            </div>
                            <div className="text-2xs text-muted mt-0.5">
                              {productCount} products staged
                            </div>
                          </div>
                          <StatusPill
                            status={assigned ? 'loading' : 'idle'}
                            label={assigned ? 'Assigned' : 'Idle'}
                          />
                        </div>

                        <div className="mt-4 flex items-baseline gap-1.5">
                          <span className="text-2xl font-semibold text-text tnum leading-none">
                            {b.stocks}
                          </span>
                          <span className="text-2xs text-muted">stocks</span>
                        </div>

                        <div className="mt-4 border-t border-border pt-3 space-y-1.5 text-[13px]">
                          <div className="flex items-center justify-between">
                            <span className="text-muted">Driver</span>
                            <span className="text-text truncate ml-2">
                              {driverName(b.assignedDriverId)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted">Vehicle</span>
                            <span className="font-mono text-2xs text-text-2">{b.vehicleNo}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted">Date</span>
                            <span className="text-text-2 tnum">{b.date || '—'}</span>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            onClick={() => openEdit(b)}
                          >
                            <Pencil size={14} />
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setConfirmDelete(b)}
                            aria-label="Delete bay"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </>
      )}

      {/* Create / edit bay */}
      <Modal
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editing ? `Edit bay ${editing.id.toUpperCase()}` : 'New bay'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPanelOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save} disabled={!form.shiftId}>
              {editing ? 'Save changes' : 'Create bay'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Shift" htmlFor="b-shift">
            <Select
              id="b-shift"
              value={form.shiftId}
              onChange={(e) => setForm({ ...form, shiftId: e.target.value })}
            >
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Assigned driver" htmlFor="b-driver">
            <Select
              id="b-driver"
              value={form.assignedDriverId}
              onChange={(e) => setForm({ ...form, assignedDriverId: e.target.value })}
            >
              <option value="">Unassigned</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} · {d.vehicleNo}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date" htmlFor="b-date">
            <Input
              id="b-date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Vehicle no" htmlFor="b-vehicle">
              <Input
                id="b-vehicle"
                className="font-mono"
                value={form.vehicleNo}
                onChange={(e) => setForm({ ...form, vehicleNo: e.target.value })}
                placeholder="e.g. TN-09-BX-4471"
              />
            </Field>
            <Field label="Stocks" htmlFor="b-stocks">
              <Input
                id="b-stocks"
                type="number"
                min={0}
                value={form.stocks}
                onChange={(e) => setForm({ ...form, stocks: Number(e.target.value) })}
              />
            </Field>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete bay"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirmDelete) deleteBay(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-text-2">
          Delete bay <span className="font-mono text-2xs">{confirmDelete?.id.toUpperCase()}</span>?
          Any products staged here will be unassigned from it. This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
