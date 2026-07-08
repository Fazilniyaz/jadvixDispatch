import { useMemo, useState } from 'react';
import { ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Field, Input, Select } from '@/components/Field';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import type { Route, RouteStatus } from '@/lib/types';

const STATUSES: RouteStatus[] = ['planned', 'active', 'completed'];

interface FormState {
  name: string;
  areaName: string;
  coordinates: string;
  eta: string;
  shiftId: string;
  assignedDriverId: string;
  status: RouteStatus;
  order: number;
}

const emptyForm = (order: number, shiftId: string): FormState => ({
  name: '',
  areaName: '',
  coordinates: '',
  eta: '',
  shiftId,
  assignedDriverId: '',
  status: 'planned',
  order,
});

const formFrom = (r: Route): FormState => ({
  name: r.name,
  areaName: r.areaName,
  coordinates: r.coordinates,
  eta: r.eta,
  shiftId: r.shiftId ?? '',
  assignedDriverId: r.assignedDriverId ?? '',
  status: r.status,
  order: r.order,
});

const toPatch = (form: FormState) => ({
  name: form.name.trim(),
  areaName: form.areaName.trim(),
  coordinates: form.coordinates.trim(),
  eta: form.eta.trim(),
  shiftId: form.shiftId || null,
  assignedDriverId: form.assignedDriverId || null,
  status: form.status,
  order: Number(form.order) || 1,
});

export default function RouteManagement() {
  const routes = useStore((s) => s.routes);
  const employees = useStore((s) => s.employees);
  const shifts = useStore((s) => s.shifts);
  const labels = useStore((s) => s.moduleLabels);
  const addRoute = useStore((s) => s.addRoute);
  const updateRoute = useStore((s) => s.updateRoute);
  const deleteRoute = useStore((s) => s.deleteRoute);

  const drivers = employees.filter((e) => e.role === 'driver');
  const driverName = (id: string | null) => employees.find((e) => e.id === id)?.name ?? 'Unassigned';
  const shiftName = (id: string | null) => shifts.find((s) => s.id === id)?.name ?? '—';

  const [search, setSearch] = useState('');

  // Create flow (centered modal).
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(emptyForm(1, shifts[0]?.id ?? ''));

  // Inline expand / edit flow.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm(1, ''));
  const [confirmDelete, setConfirmDelete] = useState<Route | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...routes].sort((a, b) => a.order - b.order);
    if (!q) return sorted;
    return sorted.filter((r) => {
      const driver = driverName(r.assignedDriverId).toLowerCase();
      return `${r.name} ${r.areaName} ${driver}`.toLowerCase().includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routes, search, employees]);

  const openCreate = () => {
    setCreateForm(emptyForm(routes.length + 1, shifts[0]?.id ?? ''));
    setCreateOpen(true);
  };
  const saveCreate = () => {
    addRoute(toPatch(createForm));
    setCreateOpen(false);
  };

  const toggleRow = (r: Route) => {
    if (expandedId === r.id) {
      setExpandedId(null);
    } else {
      setExpandedId(r.id);
      setEditForm(formFrom(r));
    }
  };
  const saveEdit = () => {
    if (!expandedId) return;
    updateRoute(expandedId, toPatch(editForm));
    setExpandedId(null);
  };

  const columns: Column<Route>[] = [
    {
      key: 'expand',
      header: '',
      render: (r) => (
        <ChevronRight
          size={15}
          className={cn('text-muted transition-transform', expandedId === r.id && 'rotate-90 text-text')}
        />
      ),
      className: 'w-8 pr-0',
      headerClassName: 'w-8 pr-0',
    },
    {
      key: 'order',
      header: '#',
      render: (r) => (
        <span className="font-mono text-2xs text-muted tnum">{String(r.order).padStart(2, '0')}</span>
      ),
    },
    { key: 'name', header: 'Location', render: (r) => <span className="font-medium text-text">{r.name}</span> },
    { key: 'area', header: 'Area', render: (r) => <span className="text-text-2">{r.areaName}</span> },
    {
      key: 'coordinates',
      header: 'Coordinates',
      render: (r) => <span className="font-mono text-2xs text-text-2 tnum">{r.coordinates || '—'}</span>,
    },
    { key: 'eta', header: 'ETA', render: (r) => <span className="text-text-2 tnum">{r.eta || '—'}</span> },
    { key: 'shift', header: 'Shift', render: (r) => <span className="text-text-2">{shiftName(r.shiftId)}</span> },
    {
      key: 'driver',
      header: 'Driver',
      render: (r) => <span className="text-text-2">{driverName(r.assignedDriverId)}</span>,
    },
    { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
  ];

  // Shared field grid for create + inline edit.
  const fields = (form: FormState, setForm: (f: FormState) => void, idp: string) => (
    <>
      <Field label="Location name" htmlFor={`${idp}-name`} className="sm:col-span-2">
        <Input
          id={`${idp}-name`}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Islington"
        />
      </Field>
      <Field label="Area name" htmlFor={`${idp}-area`}>
        <Input
          id={`${idp}-area`}
          value={form.areaName}
          onChange={(e) => setForm({ ...form, areaName: e.target.value })}
          placeholder="e.g. Islington"
        />
      </Field>
      <Field label="ETA" htmlFor={`${idp}-eta`}>
        <Input
          id={`${idp}-eta`}
          value={form.eta}
          onChange={(e) => setForm({ ...form, eta: e.target.value })}
          placeholder="e.g. 10:10"
        />
      </Field>
      <Field label="Coordinates" htmlFor={`${idp}-coords`} className="sm:col-span-2">
        <Input
          id={`${idp}-coords`}
          className="font-mono"
          value={form.coordinates}
          onChange={(e) => setForm({ ...form, coordinates: e.target.value })}
          placeholder="13.02, 80.22"
        />
      </Field>
      <Field label="Order" htmlFor={`${idp}-order`}>
        <Input
          id={`${idp}-order`}
          type="number"
          min={1}
          value={form.order}
          onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
        />
      </Field>
      <Field label="Shift" htmlFor={`${idp}-shift`}>
        <Select
          id={`${idp}-shift`}
          value={form.shiftId}
          onChange={(e) => setForm({ ...form, shiftId: e.target.value })}
        >
          <option value="">Unassigned</option>
          {shifts.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Driver" htmlFor={`${idp}-driver`}>
        <Select
          id={`${idp}-driver`}
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
      <Field label="Status" htmlFor={`${idp}-status`}>
        <Select
          id={`${idp}-status`}
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
    </>
  );

  const renderExpanded = (r: Route) => {
    const dirty =
      editForm.name !== r.name ||
      editForm.areaName !== r.areaName ||
      editForm.coordinates !== r.coordinates ||
      editForm.eta !== r.eta ||
      editForm.shiftId !== (r.shiftId ?? '') ||
      editForm.assignedDriverId !== (r.assignedDriverId ?? '') ||
      editForm.status !== r.status ||
      Number(editForm.order) !== r.order;
    return (
      <div className="px-3 sm:px-4 py-4 border-t border-border">
        <div className="flex items-center gap-1.5 mb-3">
          <Pencil size={13} className="text-muted" />
          <h4 className="text-2xs uppercase tracking-wide text-muted">Edit location</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {fields(editForm, setEditForm, `re-${r.id}`)}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <Button variant="primary" onClick={saveEdit} disabled={!editForm.name.trim() || !dirty}>
            Save changes
          </Button>
          <Button variant="ghost" onClick={() => setExpandedId(null)}>
            Cancel
          </Button>
          <Button variant="danger" className="ml-auto" onClick={() => setConfirmDelete(r)}>
            <Trash2 size={14} />
            Delete
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title={labels.routes}
        description="Delivery locations by area and coordinate, each under a shift and assignable to a driver."
        action={
          <Button variant="primary" onClick={openCreate}>
            <Plus size={16} />
            New location
          </Button>
        }
      />

      <Card>
        <div className="p-3 border-b border-border">
          <div className="relative max-w-md">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              placeholder="Search by location, area or driver"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(r) => r.id}
          onRowClick={toggleRow}
          expandedKey={expandedId}
          renderExpanded={renderExpanded}
          empty="No locations match your search."
        />
      </Card>

      {/* Create location — centered modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New location"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveCreate} disabled={!createForm.name.trim()}>
              Create location
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {fields(createForm, setCreateForm, 'rc')}
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete location"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirmDelete) {
                  deleteRoute(confirmDelete.id);
                  if (expandedId === confirmDelete.id) setExpandedId(null);
                }
                setConfirmDelete(null);
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-text-2">
          Delete the <span className="font-medium text-text">{confirmDelete?.name}</span> location?
          Any products pointing at it will be unassigned. This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
