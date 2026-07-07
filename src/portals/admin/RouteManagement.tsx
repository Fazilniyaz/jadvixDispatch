import { useMemo, useState } from 'react';
import { ChevronDown, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/Button';
import { SidePanel } from '@/components/SidePanel';
import { Modal } from '@/components/Modal';
import { Field, Input, Select } from '@/components/Field';
import { RouteChain } from '@/components/RouteChain';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import type { Route, RouteStatus, RouteStop } from '@/lib/types';

const STATUSES: RouteStatus[] = ['planned', 'active', 'completed'];

interface FormState {
  name: string;
  assignedDriverId: string;
  status: RouteStatus;
  order: number;
  stops: RouteStop[];
}

const emptyForm = (order: number): FormState => ({
  name: '',
  assignedDriverId: '',
  status: 'planned',
  order,
  stops: [{ areaName: '', coordinates: '', eta: '' }],
});

export default function RouteManagement() {
  const routes = useStore((s) => s.routes);
  const employees = useStore((s) => s.employees);
  const labels = useStore((s) => s.moduleLabels);
  const addRoute = useStore((s) => s.addRoute);
  const updateRoute = useStore((s) => s.updateRoute);
  const deleteRoute = useStore((s) => s.deleteRoute);

  const drivers = employees.filter((e) => e.role === 'driver');
  const driverName = (id: string | null) => employees.find((e) => e.id === id)?.name ?? 'Unassigned';

  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(routes[0]?.id ?? null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<Route | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(1));
  const [confirmDelete, setConfirmDelete] = useState<Route | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...routes].sort((a, b) => a.order - b.order);
    if (!q) return sorted;
    return sorted.filter((r) => {
      const driver = driverName(r.assignedDriverId).toLowerCase();
      const areas = r.stops.map((s) => s.areaName).join(' ').toLowerCase();
      return `${r.name} ${driver} ${areas}`.toLowerCase().includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routes, search, employees]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(routes.length + 1));
    setPanelOpen(true);
  };
  const openEdit = (r: Route) => {
    setEditing(r);
    setForm({
      name: r.name,
      assignedDriverId: r.assignedDriverId ?? '',
      status: r.status,
      order: r.order,
      stops: r.stops.length ? r.stops.map((s) => ({ ...s })) : [{ areaName: '', coordinates: '', eta: '' }],
    });
    setPanelOpen(true);
  };
  const save = () => {
    const clean = {
      name: form.name.trim(),
      assignedDriverId: form.assignedDriverId || null,
      status: form.status,
      order: Number(form.order) || 1,
      stops: form.stops.filter((s) => s.areaName.trim()),
    };
    if (editing) updateRoute(editing.id, clean);
    else addRoute(clean);
    setPanelOpen(false);
  };

  const setStop = (i: number, patch: Partial<RouteStop>) =>
    setForm((f) => ({ ...f, stops: f.stops.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) }));
  const addStop = () =>
    setForm((f) => ({ ...f, stops: [...f.stops, { areaName: '', coordinates: '', eta: '' }] }));
  const removeStop = (i: number) =>
    setForm((f) => ({ ...f, stops: f.stops.filter((_, idx) => idx !== i) }));

  return (
    <div>
      <PageHeader
        title={labels.routes}
        description="Ordered, text-based routes by area and coordinate. Search a route to find its driver."
        action={
          <Button variant="primary" onClick={openCreate}>
            <Plus size={16} />
            New route
          </Button>
        }
      />

      <Card className="mb-4">
        <div className="p-3">
          <div className="relative max-w-md">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              placeholder="Search by route, area or driver"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {filtered.map((r) => {
          const open = expanded === r.id;
          return (
            <Card key={r.id}>
              <div className="flex items-center gap-3 p-4">
                <span className="font-mono text-2xs text-muted tnum w-6">
                  {String(r.order).padStart(2, '0')}
                </span>
                <button
                  onClick={() => setExpanded(open ? null : r.id)}
                  className="flex items-center gap-2 min-w-0 flex-1 text-left"
                  aria-expanded={open}
                >
                  <ChevronDown
                    size={16}
                    className={cn('text-muted transition-transform', open && 'rotate-180')}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-text truncate">{r.name}</div>
                    <div className="text-2xs text-muted">
                      {r.stops.length} stops · {driverName(r.assignedDriverId)}
                    </div>
                  </div>
                </button>
                <StatusPill status={r.status} />
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(r)}
                    aria-label="Edit route"
                    className="text-muted hover:text-text p-1"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(r)}
                    aria-label="Delete route"
                    className="text-muted hover:text-exception p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {open && (
                <div className="px-4 pb-4 border-t border-border pt-4">
                  <RouteChain stops={r.stops} />
                </div>
              )}
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card className="p-10 text-center text-[13px] text-text-2">No routes match your search.</Card>
        )}
      </div>

      <SidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editing ? 'Edit route' : 'New route'}
        subtitle={editing ? editing.name : 'Define an ordered set of stops'}
        width="max-w-lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPanelOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save} disabled={!form.name.trim()}>
              {editing ? 'Save changes' : 'Create route'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Route name" htmlFor="r-name">
            <Input
              id="r-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. T. Nagar loop"
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Driver" htmlFor="r-driver" className="col-span-2">
              <Select
                id="r-driver"
                value={form.assignedDriverId}
                onChange={(e) => setForm({ ...form, assignedDriverId: e.target.value })}
              >
                <option value="">Unassigned</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Order" htmlFor="r-order">
              <Input
                id="r-order"
                type="number"
                min={1}
                value={form.order}
                onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
              />
            </Field>
          </div>
          <Field label="Status" htmlFor="r-status">
            <Select
              id="r-status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as RouteStatus })}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-medium text-text-2">Stops (in order)</span>
              <Button variant="secondary" size="sm" onClick={addStop}>
                <Plus size={14} />
                Add stop
              </Button>
            </div>
            <div className="space-y-2">
              {form.stops.map((stop, i) => (
                <div key={i} className="border border-border rounded-[3px] p-2.5 bg-surface-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xs font-medium text-muted tnum">Stop {i + 1}</span>
                    {form.stops.length > 1 && (
                      <button
                        onClick={() => removeStop(i)}
                        aria-label="Remove stop"
                        className="text-muted hover:text-exception p-0.5"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Input
                      placeholder="Area name"
                      value={stop.areaName}
                      onChange={(e) => setStop(i, { areaName: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="13.02, 80.22"
                        className="font-mono"
                        value={stop.coordinates}
                        onChange={(e) => setStop(i, { coordinates: e.target.value })}
                      />
                      <Input
                        placeholder="ETA e.g. 09:35"
                        value={stop.eta}
                        onChange={(e) => setStop(i, { eta: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SidePanel>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete route"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirmDelete) deleteRoute(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-text-2">
          Delete the <span className="font-medium text-text">{confirmDelete?.name}</span> route? This
          cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
