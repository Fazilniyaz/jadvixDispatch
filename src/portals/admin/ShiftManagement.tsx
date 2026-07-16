import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/Card';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Field, Input, Select } from '@/components/Field';
import { useStore } from '@/store/useStore';
import type { Shift, ShiftProduct, ShiftStatus } from '@/lib/types';

const SHIFT_STATUSES: ShiftStatus[] = ['pending', 'active', 'completed'];
const statusLabel = (s: ShiftStatus) =>
  s === 'active' ? 'Running' : s === 'completed' ? 'Completed' : 'Pending';

export default function ShiftManagement() {
  const shifts = useStore((s) => s.shifts);
  const employees = useStore((s) => s.employees);
  const routes = useStore((s) => s.routes);
  const products = useStore((s) => s.products);
  const labels = useStore((s) => s.moduleLabels);
  const activeShiftId = useStore((s) => s.activeShiftId);
  const addShift = useStore((s) => s.addShift);
  const updateShift = useStore((s) => s.updateShift);
  const deleteShift = useStore((s) => s.deleteShift);
  const setActive = useStore((s) => s.setActive);
  const updateEmployee = useStore((s) => s.updateEmployee);
  const updateRoute = useStore((s) => s.updateRoute);

  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);
  const [form, setForm] = useState({ name: '', window: '' });
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [assignedRouteIds, setAssignedRouteIds] = useState<string[]>([]);
  const [assignedProducts, setAssignedProducts] = useState<ShiftProduct[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<Shift | null>(null);

  const activeEmployees = employees.filter((e) => e.status === 'active');

  // An employee's location comes from Location Management (route.assignedDriverId).
  // Shown here read-only so admins can see who covers where before assigning.
  const locationsFor = (empId: string) =>
    routes.filter((r) => r.assignedDriverId === empId).map((r) => r.name);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', window: '' });
    setAssignedIds([]);
    setAssignedRouteIds([]);
    setAssignedProducts([]);
    setPanelOpen(true);
  };
  const openEdit = (s: Shift) => {
    setEditing(s);
    setForm({ name: s.name, window: s.window });
    setAssignedIds(
      employees.filter((e) => e.shift === s.name && e.status === 'active').map((e) => e.id)
    );
    setAssignedRouteIds(routes.filter((r) => r.shiftId === s.id).map((r) => r.id));
    setAssignedProducts(s.products.map((p) => ({ ...p })));
    setPanelOpen(true);
  };
  // Employees and locations are independent: ticking one never auto-ticks the other.
  const toggleAssign = (id: string) =>
    setAssignedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  const toggleRoute = (id: string) =>
    setAssignedRouteIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  // Products carry a per-shift stock. Ticking one defaults its stock to the
  // product's own on-hand count; it can then be adjusted for this shift.
  const productChecked = (id: string) => assignedProducts.some((p) => p.productId === id);
  const toggleProduct = (id: string, defaultStock: number) =>
    setAssignedProducts((list) =>
      list.some((p) => p.productId === id)
        ? list.filter((p) => p.productId !== id)
        : [...list, { productId: id, stock: defaultStock }]
    );
  const setProductStock = (id: string, stock: number) =>
    setAssignedProducts((list) =>
      list.map((p) => (p.productId === id ? { ...p, stock: Math.max(0, stock) } : p))
    );

  const save = () => {
    const name = form.name.trim();
    const oldName = editing?.name;
    let shiftId = editing?.id;
    if (editing) {
      updateShift(editing.id, { name, window: form.window, products: assignedProducts });
    } else {
      addShift({ name, window: form.window, products: assignedProducts });
      // addShift appends, so the new shift is the last one — grab its id for assignments.
      const created = useStore.getState().shifts;
      shiftId = created[created.length - 1]?.id;
    }

    // Keep on-leave staff attached when a shift is renamed (active staff handled below).
    if (editing && oldName && oldName !== name) {
      employees.forEach((e) => {
        if (e.shift === oldName && e.status !== 'active') updateEmployee(e.id, { shift: name });
      });
    }

    // Apply the active-employee assignments: selected → this shift, deselected → unassigned.
    activeEmployees.forEach((e) => {
      const selected = assignedIds.includes(e.id);
      const onThisShift = e.shift === name || (!!oldName && e.shift === oldName);
      if (selected && e.shift !== name) updateEmployee(e.id, { shift: name });
      else if (!selected && onThisShift) updateEmployee(e.id, { shift: '' });
    });

    // Apply the location assignments: selected → this shift, deselected → unassigned.
    routes.forEach((r) => {
      const selected = assignedRouteIds.includes(r.id);
      if (selected && r.shiftId !== shiftId) updateRoute(r.id, { shiftId: shiftId ?? null });
      else if (!selected && editing && r.shiftId === editing.id) updateRoute(r.id, { shiftId: null });
    });

    setPanelOpen(false);
  };

  const activeShift = shifts.find((s) => s.id === activeShiftId);

  return (
    <div>
      <PageHeader
        title={labels.shifts}
        description="Plan the day in shifts and set which one is running now."
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
                {activeShift?.name ?? '—'}
                <span className="text-text-2 font-normal"> · {activeShift?.window ?? ''}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select
              aria-label="Set active shift"
              value={activeShiftId}
              onChange={(e) => setActive(e.target.value)}
              className="w-40"
            >
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        {shifts.map((shift) => {
          const isActive = shift.id === activeShiftId;
          const shiftEmployees = employees.filter((e) => e.shift === shift.name);
          const shiftRoutes = routes.filter((r) => r.shiftId === shift.id);
          const totalStock = shift.products.reduce((sum, p) => sum + p.stock, 0);
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
                <div className="grid grid-cols-3 gap-2">
                  <ShiftMetric label="Staff" value={shiftEmployees.length} />
                  <ShiftMetric label="Locations" value={shiftRoutes.length} />
                  <ShiftMetric label="Stock" value={totalStock} sub={`${shift.products.length} prod`} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-2xs uppercase tracking-wide text-muted">Status</span>
                  <Select
                    aria-label={`${shift.name} status`}
                    value={shift.status}
                    onChange={(e) =>
                      updateShift(shift.id, { status: e.target.value as ShiftStatus })
                    }
                    className="h-7 w-32 text-2xs"
                  >
                    {SHIFT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {statusLabel(s)}
                      </option>
                    ))}
                  </Select>
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

      <Modal
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editing ? `Edit shift · ${editing.name}` : 'New shift'}
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

          <Field
            label={`Assign active staff (${assignedIds.length})`}
            hint="Each employee's location comes from Location Management — change it there."
          >
            <div className="border border-border rounded-[3px] max-h-56 overflow-y-auto divide-y divide-border">
              {activeEmployees.length === 0 ? (
                <p className="px-3 py-3 text-2xs text-muted">No active employees to assign.</p>
              ) : (
                activeEmployees.map((e) => {
                  const checked = assignedIds.includes(e.id);
                  const elsewhere =
                    !checked && e.shift && e.shift !== form.name.trim() && e.shift !== editing?.name;
                  const locs = locationsFor(e.id);
                  return (
                    <label
                      key={e.id}
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-surface-2"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAssign(e.id)}
                        className="h-4 w-4 accent-accent shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] text-text truncate">
                          {e.name}
                          {locs.length > 0 ? (
                            <span className="text-muted font-normal"> — {locs.join(', ')}</span>
                          ) : (
                            <span className="text-muted font-normal"> — no location</span>
                          )}
                        </div>
                        <div className="text-2xs text-muted capitalize">
                          {e.role} · <span className="font-mono">{e.vehicleNo}</span>
                        </div>
                      </div>
                      {elsewhere && (
                        <span className="text-2xs text-muted shrink-0">on {e.shift}</span>
                      )}
                    </label>
                  );
                })
              )}
            </div>
          </Field>

          <Field
            label={`Assign locations (${assignedRouteIds.length})`}
            hint="Locations ticked here run under this shift."
          >
            <div className="border border-border rounded-[3px] max-h-56 overflow-y-auto divide-y divide-border">
              {routes.length === 0 ? (
                <p className="px-3 py-3 text-2xs text-muted">No locations to assign.</p>
              ) : (
                [...routes]
                  .sort((a, b) => a.order - b.order)
                  .map((r) => {
                    const checked = assignedRouteIds.includes(r.id);
                    const otherShift = shifts.find((s) => s.id === r.shiftId);
                    const elsewhere = !checked && otherShift && otherShift.id !== editing?.id;
                    return (
                      <label
                        key={r.id}
                        className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-surface-2"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRoute(r.id)}
                          className="h-4 w-4 accent-accent shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] text-text truncate">{r.name}</div>
                          <div className="text-2xs text-muted">{r.areaName}</div>
                        </div>
                        {elsewhere && (
                          <span className="text-2xs text-muted shrink-0">on {otherShift.name}</span>
                        )}
                      </label>
                    );
                  })
              )}
            </div>
          </Field>

          <Field
            label={`Assign products & stock (${assignedProducts.length})`}
            hint="Products ticked here run under this shift, each with its own stock."
          >
            <div className="border border-border rounded-[3px] max-h-64 overflow-y-auto divide-y divide-border">
              {products.length === 0 ? (
                <p className="px-3 py-3 text-2xs text-muted">No products to assign.</p>
              ) : (
                products.map((p) => {
                  const checked = productChecked(p.id);
                  const entry = assignedProducts.find((x) => x.productId === p.id);
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-surface-2"
                    >
                      <label className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleProduct(p.id, p.stocks)}
                          className="h-4 w-4 accent-accent shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] text-text truncate">{p.name}</div>
                          <div className="text-2xs text-muted">
                            <span className="font-mono">{p.code}</span> · {p.type}
                          </div>
                        </div>
                      </label>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Input
                          type="number"
                          min={0}
                          aria-label={`${p.name} stock for this shift`}
                          value={entry ? entry.stock : ''}
                          disabled={!checked}
                          onChange={(e) => setProductStock(p.id, Number(e.target.value) || 0)}
                          className="h-7 w-20 text-2xs tnum disabled:opacity-40"
                          placeholder={String(p.stocks)}
                        />
                        <span className="text-2xs text-muted w-8">stk</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Field>

          {!editing && (
            <p className="text-2xs text-muted">
              New shifts start as Pending. Set them Running from the shift card once live.
            </p>
          )}
        </div>
      </Modal>

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
          Delete the <span className="font-medium text-text">{confirmDelete?.name}</span> shift? This
          cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

function ShiftMetric({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="border border-border rounded-[3px] bg-surface px-2.5 py-2">
      <div className="text-base font-semibold text-text tnum leading-none">{value}</div>
      <div className="text-2xs text-muted mt-1 truncate">
        {label}
        {sub ? <span className="text-muted"> · {sub}</span> : null}
      </div>
    </div>
  );
}
