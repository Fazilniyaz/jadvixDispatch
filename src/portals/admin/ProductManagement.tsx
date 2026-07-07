import { useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/Button';
import { SidePanel } from '@/components/SidePanel';
import { Modal } from '@/components/Modal';
import { Field, Input, Select, Textarea } from '@/components/Field';
import { useStore } from '@/store/useStore';
import type { Product, ProductStatus, ProductType } from '@/lib/types';

const TYPES: ProductType[] = ['Fragile', 'Baked', 'Packed', 'Frozen', 'Standard'];
const STATUSES: ProductStatus[] = ['scheduled', 'picked', 'transit', 'out', 'delivered', 'exception'];

type FormState = Omit<Product, 'id'>;

const emptyForm = (): FormState => ({
  code: '',
  name: '',
  type: 'Standard',
  assignedEmployeeId: null,
  arrivalInfo: '',
  shiftId: null,
  waveId: null,
  bayId: null,
  routeId: null,
  deliveryStatus: 'pending',
  status: 'scheduled',
  eta: '',
});

export default function ProductManagement() {
  const products = useStore((s) => s.products);
  const employees = useStore((s) => s.employees);
  const shifts = useStore((s) => s.shifts);
  const waves = useStore((s) => s.waves);
  const bays = useStore((s) => s.bays);
  const routes = useStore((s) => s.routes);
  const labels = useStore((s) => s.moduleLabels);
  const addProduct = useStore((s) => s.addProduct);
  const updateProduct = useStore((s) => s.updateProduct);
  const deleteProduct = useStore((s) => s.deleteProduct);

  const empName = (id: string | null) => employees.find((e) => e.id === id)?.name ?? '—';
  const shiftName = (id: string | null) => shifts.find((s) => s.id === id)?.name ?? '—';
  const waveNo = (id: string | null) => waves.find((w) => w.id === id)?.number ?? '—';
  const bayLabel = (id: string | null) => (id ? id.toUpperCase() : '—');
  const routeName = (id: string | null) => routes.find((r) => r.id === id)?.name ?? '—';

  const [search, setSearch] = useState('');
  const [fType, setFType] = useState('all');
  const [fStatus, setFStatus] = useState('all');
  const [fShift, setFShift] = useState('all');
  const [fDriver, setFDriver] = useState('all');

  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);

  const drivers = employees.filter((e) => e.role === 'driver');

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (q && !(`${p.code} ${p.name}`.toLowerCase().includes(q))) return false;
      if (fType !== 'all' && p.type !== fType) return false;
      if (fStatus !== 'all' && p.status !== fStatus) return false;
      if (fShift !== 'all' && p.shiftId !== fShift) return false;
      if (fDriver !== 'all' && p.assignedEmployeeId !== fDriver) return false;
      return true;
    });
  }, [products, search, fType, fStatus, fShift, fDriver]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setPanelOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    const { id: _id, ...rest } = p;
    void _id;
    setForm(rest);
    setPanelOpen(true);
  };

  const save = () => {
    if (editing) {
      updateProduct(editing.id, form);
    } else {
      addProduct(form);
    }
    setPanelOpen(false);
  };

  const wavesForShift = waves.filter((w) => !form.shiftId || w.shiftId === form.shiftId);

  const columns: Column<Product>[] = [
    {
      key: 'code',
      header: 'Code',
      render: (p) => <span className="font-mono text-2xs text-text-2 tnum">{p.code}</span>,
    },
    {
      key: 'name',
      header: 'Product',
      render: (p) => <span className="font-medium text-text">{p.name}</span>,
    },
    { key: 'type', header: 'Type', render: (p) => <span className="text-text-2">{p.type}</span> },
    {
      key: 'emp',
      header: 'Assigned',
      render: (p) => <span className="text-text-2">{empName(p.assignedEmployeeId)}</span>,
    },
    {
      key: 'shift',
      header: 'Shift',
      render: (p) => <span className="text-text-2">{shiftName(p.shiftId)}</span>,
    },
    {
      key: 'wave',
      header: 'Wave',
      render: (p) => <span className="text-text-2 tnum">{waveNo(p.waveId)}</span>,
    },
    {
      key: 'bay',
      header: 'Bay',
      render: (p) => <span className="font-mono text-2xs text-text-2">{bayLabel(p.bayId)}</span>,
    },
    {
      key: 'route',
      header: 'Route',
      render: (p) => <span className="text-text-2">{routeName(p.routeId)}</span>,
    },
    {
      key: 'delivery',
      header: 'Delivery',
      render: (p) => (
        <span className="text-text-2">{p.deliveryStatus === 'delivered' ? 'Done' : p.deliveryStatus === 'failed' ? 'Failed' : 'Pending'}</span>
      ),
    },
    { key: 'status', header: 'Status', render: (p) => <StatusPill status={p.status} /> },
    { key: 'eta', header: 'ETA', render: (p) => <span className="text-text-2 tnum">{p.eta || '—'}</span> },
    {
      key: 'actions',
      header: '',
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(p);
            }}
            aria-label="Edit"
            className="text-muted hover:text-text p-1 rounded-[3px]"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete(p);
            }}
            aria-label="Delete"
            className="text-muted hover:text-exception p-1 rounded-[3px]"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
      headerClassName: 'text-right',
      className: 'text-right',
    },
  ];

  return (
    <div>
      <PageHeader
        title={labels.products}
        description="Create, assign and track every product from arrival to delivery."
        action={
          <Button variant="primary" onClick={openCreate}>
            <Plus size={16} />
            New product
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col md:flex-row md:items-center gap-3 p-3 border-b border-border">
          <div className="relative flex-1 min-w-0">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              placeholder="Search by code or name"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Select value={fType} onChange={(e) => setFType(e.target.value)} aria-label="Filter by type">
              <option value="all">All types</option>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <Select value={fStatus} onChange={(e) => setFStatus(e.target.value)} aria-label="Filter by status">
              <option value="all">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Select value={fShift} onChange={(e) => setFShift(e.target.value)} aria-label="Filter by shift">
              <option value="all">All shifts</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            <Select value={fDriver} onChange={(e) => setFDriver(e.target.value)} aria-label="Filter by driver">
              <option value="all">All drivers</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(p) => p.id}
          onRowClick={openEdit}
          empty="No products match these filters."
        />
        <div className="px-3 py-2 border-t border-border text-2xs text-muted">
          Showing {rows.length} of {products.length} products
        </div>
      </Card>

      {/* Create / edit / detail panel */}
      <SidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editing ? 'Edit product' : 'New product'}
        subtitle={editing ? editing.code : 'Add a product to the board'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPanelOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save} disabled={!form.name.trim()}>
              {editing ? 'Save changes' : 'Create product'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {editing && (
            <div className="border border-border rounded-[3px] bg-surface-2 p-3 space-y-1.5 text-[13px]">
              <DetailRow label="Assigned to" value={empName(editing.assignedEmployeeId)} />
              <DetailRow label="Arrival" value={editing.arrivalInfo || '—'} />
              <DetailRow
                label="Delivered in"
                value={`${shiftName(editing.shiftId)} · Wave ${waveNo(editing.waveId)}`}
              />
              <DetailRow
                label="Delivery complete"
                value={editing.deliveryStatus === 'delivered' ? 'Yes' : 'No'}
              />
            </div>
          )}

          <Field label="Product name" htmlFor="p-name">
            <Input
              id="p-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Ceramic dinnerware set"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Code" htmlFor="p-code" hint="Leave blank to auto-generate">
              <Input
                id="p-code"
                className="font-mono"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="JDX-…"
              />
            </Field>
            <Field label="Type" htmlFor="p-type">
              <Select
                id="p-type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as ProductType })}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Arrival info" htmlFor="p-arrival">
            <Textarea
              id="p-arrival"
              value={form.arrivalInfo}
              onChange={(e) => setForm({ ...form, arrivalInfo: e.target.value })}
              placeholder="How and when it was received"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Assigned employee" htmlFor="p-emp">
              <Select
                id="p-emp"
                value={form.assignedEmployeeId ?? ''}
                onChange={(e) =>
                  setForm({ ...form, assignedEmployeeId: e.target.value || null })
                }
              >
                <option value="">Unassigned</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Route" htmlFor="p-route">
              <Select
                id="p-route"
                value={form.routeId ?? ''}
                onChange={(e) => setForm({ ...form, routeId: e.target.value || null })}
              >
                <option value="">None</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Shift" htmlFor="p-shift">
              <Select
                id="p-shift"
                value={form.shiftId ?? ''}
                onChange={(e) =>
                  setForm({ ...form, shiftId: e.target.value || null, waveId: null })
                }
              >
                <option value="">None</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Wave" htmlFor="p-wave">
              <Select
                id="p-wave"
                value={form.waveId ?? ''}
                onChange={(e) => setForm({ ...form, waveId: e.target.value || null })}
              >
                <option value="">None</option>
                {wavesForShift.map((w) => (
                  <option key={w.id} value={w.id}>
                    Wave {w.number}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Bay" htmlFor="p-bay">
              <Select
                id="p-bay"
                value={form.bayId ?? ''}
                onChange={(e) => setForm({ ...form, bayId: e.target.value || null })}
              >
                <option value="">None</option>
                {bays.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.id.toUpperCase()}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="ETA" htmlFor="p-eta">
              <Input
                id="p-eta"
                value={form.eta}
                onChange={(e) => setForm({ ...form, eta: e.target.value })}
                placeholder="e.g. 10:30"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Status" htmlFor="p-status">
              <Select
                id="p-status"
                value={form.status}
                onChange={(e) => {
                  const status = e.target.value as ProductStatus;
                  setForm({
                    ...form,
                    status,
                    deliveryStatus:
                      status === 'delivered' ? 'delivered' : status === 'exception' ? 'failed' : 'pending',
                  });
                }}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>
      </SidePanel>

      {/* Delete confirm */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete product"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirmDelete) deleteProduct(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-text-2">
          Delete <span className="font-medium text-text">{confirmDelete?.name}</span> (
          <span className="font-mono text-2xs">{confirmDelete?.code}</span>)? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="text-text text-right">{value}</span>
    </div>
  );
}
