import { useMemo, useState } from 'react';
import { ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Field, Input, Select, Textarea } from '@/components/Field';
import { cn } from '@/lib/utils';
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
  bayId: null,
  routeId: null,
  deliveryStatus: 'pending',
  status: 'scheduled',
  eta: '',
});

const formFrom = (p: Product): FormState => {
  const { id: _id, ...rest } = p;
  void _id;
  return rest;
};

const deliveryFor = (status: ProductStatus) =>
  status === 'delivered' ? 'delivered' : status === 'exception' ? 'failed' : 'pending';

export default function ProductManagement() {
  const products = useStore((s) => s.products);
  const employees = useStore((s) => s.employees);
  const shifts = useStore((s) => s.shifts);
  const bays = useStore((s) => s.bays);
  const routes = useStore((s) => s.routes);
  const labels = useStore((s) => s.moduleLabels);
  const addProduct = useStore((s) => s.addProduct);
  const updateProduct = useStore((s) => s.updateProduct);
  const deleteProduct = useStore((s) => s.deleteProduct);

  const empName = (id: string | null) => employees.find((e) => e.id === id)?.name ?? '—';
  const shiftName = (id: string | null) => shifts.find((s) => s.id === id)?.name ?? '—';
  const bayLabel = (id: string | null) => (id ? id.toUpperCase() : '—');
  const routeName = (id: string | null) => routes.find((r) => r.id === id)?.name ?? '—';

  const [search, setSearch] = useState('');
  const [fType, setFType] = useState('all');
  const [fStatus, setFStatus] = useState('all');
  const [fShift, setFShift] = useState('all');
  const [fDriver, setFDriver] = useState('all');

  // Create flow (centered modal).
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(emptyForm());

  // Inline expand / edit flow.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm());
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
    setCreateForm(emptyForm());
    setCreateOpen(true);
  };

  const saveCreate = () => {
    addProduct(createForm);
    setCreateOpen(false);
  };

  const toggleRow = (p: Product) => {
    if (expandedId === p.id) {
      setExpandedId(null);
    } else {
      setExpandedId(p.id);
      setEditForm(formFrom(p));
    }
  };

  const saveEdit = () => {
    if (!expandedId) return;
    updateProduct(expandedId, editForm);
    setExpandedId(null);
  };

  const columns: Column<Product>[] = [
    {
      key: 'expand',
      header: '',
      render: (p) => (
        <ChevronRight
          size={15}
          className={cn('text-muted transition-transform', expandedId === p.id && 'rotate-90 text-text')}
        />
      ),
      className: 'w-8 pr-0',
      headerClassName: 'w-8 pr-0',
    },
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
      key: 'bay',
      header: 'Bay',
      render: (p) => <span className="font-mono text-2xs text-text-2">{bayLabel(p.bayId)}</span>,
    },
    {
      key: 'route',
      header: 'Location',
      render: (p) => <span className="text-text-2">{routeName(p.routeId)}</span>,
    },
    {
      key: 'delivery',
      header: 'Delivery',
      render: (p) => (
        <span className="text-text-2">
          {p.deliveryStatus === 'delivered' ? 'Done' : p.deliveryStatus === 'failed' ? 'Failed' : 'Pending'}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (p) => <StatusPill status={p.status} /> },
    { key: 'eta', header: 'ETA', render: (p) => <span className="text-text-2 tnum">{p.eta || '—'}</span> },
  ];

  // Shared field grid for the inline editor.
  const fields = (
    form: FormState,
    setForm: (f: FormState) => void,
    idp: string
  ) => (
    <>
      <Field label="Product name" htmlFor={`${idp}-name`} className="sm:col-span-2 lg:col-span-3">
        <Input
          id={`${idp}-name`}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Ceramic dinnerware set"
        />
      </Field>
      <Field label="Code" htmlFor={`${idp}-code`} hint="Leave blank to auto-generate">
        <Input
          id={`${idp}-code`}
          className="font-mono"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          placeholder="JDX-…"
        />
      </Field>
      <Field label="Type" htmlFor={`${idp}-type`}>
        <Select
          id={`${idp}-type`}
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
      <Field label="Status" htmlFor={`${idp}-status`}>
        <Select
          id={`${idp}-status`}
          value={form.status}
          onChange={(e) => {
            const status = e.target.value as ProductStatus;
            setForm({ ...form, status, deliveryStatus: deliveryFor(status) });
          }}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Assigned employee" htmlFor={`${idp}-emp`}>
        <Select
          id={`${idp}-emp`}
          value={form.assignedEmployeeId ?? ''}
          onChange={(e) => setForm({ ...form, assignedEmployeeId: e.target.value || null })}
        >
          <option value="">Unassigned</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Location" htmlFor={`${idp}-route`}>
        <Select
          id={`${idp}-route`}
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
      <Field label="Shift" htmlFor={`${idp}-shift`}>
        <Select
          id={`${idp}-shift`}
          value={form.shiftId ?? ''}
          onChange={(e) => setForm({ ...form, shiftId: e.target.value || null })}
        >
          <option value="">None</option>
          {shifts.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Bay" htmlFor={`${idp}-bay`}>
        <Select
          id={`${idp}-bay`}
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
      <Field label="ETA" htmlFor={`${idp}-eta`}>
        <Input
          id={`${idp}-eta`}
          value={form.eta}
          onChange={(e) => setForm({ ...form, eta: e.target.value })}
          placeholder="e.g. 10:30"
        />
      </Field>
      <Field label="Arrival info" htmlFor={`${idp}-arrival`} className="sm:col-span-2 lg:col-span-3">
        <Textarea
          id={`${idp}-arrival`}
          value={form.arrivalInfo}
          onChange={(e) => setForm({ ...form, arrivalInfo: e.target.value })}
          placeholder="How and when it was received"
        />
      </Field>
    </>
  );

  const renderExpanded = (p: Product) => {
    const dirty = (Object.keys(editForm) as (keyof FormState)[]).some((k) => editForm[k] !== p[k]);
    return (
      <div className="px-3 sm:px-4 py-4 border-t border-border">
        <div className="flex items-center gap-1.5 mb-3">
          <Pencil size={13} className="text-muted" />
          <h4 className="text-2xs uppercase tracking-wide text-muted">Edit product</h4>
          <span className="font-mono text-2xs text-muted ml-auto tnum">{p.code}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {fields(editForm, setEditForm, `pe-${p.id}`)}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <Button variant="primary" onClick={saveEdit} disabled={!editForm.name.trim() || !dirty}>
            Save changes
          </Button>
          <Button variant="ghost" onClick={() => setExpandedId(null)}>
            Cancel
          </Button>
          <Button variant="danger" className="ml-auto" onClick={() => setConfirmDelete(p)}>
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
          onRowClick={toggleRow}
          expandedKey={expandedId}
          renderExpanded={renderExpanded}
          empty="No products match these filters."
        />
        <div className="px-3 py-2 border-t border-border text-2xs text-muted">
          Showing {rows.length} of {products.length} products
        </div>
      </Card>

      {/* Create product — centered modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New product"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveCreate} disabled={!createForm.name.trim()}>
              Create product
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fields(createForm, setCreateForm, 'pc')}
        </div>
      </Modal>

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
                if (confirmDelete) {
                  deleteProduct(confirmDelete.id);
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
          Delete <span className="font-medium text-text">{confirmDelete?.name}</span> (
          <span className="font-mono text-2xs">{confirmDelete?.code}</span>)? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
