import { useMemo, useState, type ReactNode } from 'react';
import { ChevronRight, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Field, Input, Select } from '@/components/Field';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import type { Product, ProductStatus, ProductType } from '@/lib/types';

const deliveryLabel = (s: Product['deliveryStatus']) =>
  s === 'delivered' ? 'Done' : s === 'failed' ? 'Failed' : 'Pending';

const STATUSES: ProductStatus[] = ['scheduled', 'picked', 'transit', 'out', 'delivered', 'exception'];

// Product Management is an independent module: a product carries only its own
// intrinsic attributes (code, name, type, status). Any link to a shift, employee,
// bay or location is owned and orchestrated by Bay Management, not set here.
interface FormState {
  code: string;
  name: string;
  type: ProductType;
  status: ProductStatus;
}

const emptyForm = (): FormState => ({
  code: '',
  name: '',
  type: 'Standard',
  status: 'scheduled',
});

const formFrom = (p: Product): FormState => ({
  code: p.code,
  name: p.name,
  type: p.type,
  status: p.status,
});

const deliveryFor = (status: ProductStatus) =>
  status === 'delivered' ? 'delivered' : status === 'exception' ? 'failed' : 'pending';

export default function ProductManagement() {
  const products = useStore((s) => s.products);
  const labels = useStore((s) => s.moduleLabels);
  const productTypes = useStore((s) => s.productTypes);
  const addProduct = useStore((s) => s.addProduct);
  const updateProduct = useStore((s) => s.updateProduct);
  const deleteProduct = useStore((s) => s.deleteProduct);
  const addProductType = useStore((s) => s.addProductType);
  const deleteProductType = useStore((s) => s.deleteProductType);

  const [search, setSearch] = useState('');
  const [fType, setFType] = useState('all');
  const [fStatus, setFStatus] = useState('all');

  // Create flow (centered modal).
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(emptyForm());

  // Edit flow (centered modal).
  const [editing, setEditing] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm());

  // Delete flow.
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);

  // Click a row to expand a read-only detail view (edit/delete stay on the row).
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Add product type flow.
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [newType, setNewType] = useState('');

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (q && !(`${p.code} ${p.name}`.toLowerCase().includes(q))) return false;
      if (fType !== 'all' && p.type !== fType) return false;
      if (fStatus !== 'all' && p.status !== fStatus) return false;
      return true;
    });
  }, [products, search, fType, fStatus]);

  const openCreate = () => {
    setCreateForm(emptyForm());
    setCreateOpen(true);
  };

  const saveCreate = () => {
    if (!createForm.name.trim()) return;
    // Fill the link fields with neutral defaults — Bay Management owns those.
    addProduct({
      code: createForm.code,
      name: createForm.name.trim(),
      type: createForm.type,
      status: createForm.status,
      stocks: 0,
      assignedEmployeeId: null,
      arrivalInfo: '',
      shiftId: null,
      bayId: null,
      routeId: null,
      deliveryStatus: deliveryFor(createForm.status),
      eta: '',
    });
    setCreateOpen(false);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setEditForm(formFrom(p));
  };

  const saveEdit = () => {
    if (!editing || !editForm.name.trim()) return;
    updateProduct(editing.id, {
      code: editForm.code,
      name: editForm.name.trim(),
      type: editForm.type,
      status: editForm.status,
      deliveryStatus: deliveryFor(editForm.status),
    });
    setEditing(null);
  };

  const typeExists = productTypes.some((t) => t.toLowerCase() === newType.trim().toLowerCase());

  const saveType = () => {
    const trimmed = newType.trim();
    if (!trimmed || typeExists) return;
    addProductType(trimmed);
    setCreateForm((f) => ({ ...f, type: trimmed }));
    setNewType('');
    setTypeModalOpen(false);
  };

  const removeType = (t: string) => {
    const remaining = productTypes.filter((x) => x !== t);
    const fallback = remaining.includes('Standard') ? 'Standard' : remaining[0] ?? '';
    deleteProductType(t);
    if (fType === t) setFType('all');
    setCreateForm((f) => (f.type === t ? { ...f, type: fallback } : f));
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
    { key: 'status', header: 'Status', render: (p) => <StatusPill status={p.status} /> },
    {
      key: 'actions',
      header: '',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(p);
            }}
            aria-label={`Edit ${p.name}`}
            title="Edit"
            className="text-muted hover:text-text p-1.5 rounded-[3px] hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete(p);
            }}
            aria-label={`Delete ${p.name}`}
            title="Delete"
            className="text-muted hover:text-exception p-1.5 rounded-[3px] hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  // Read-only detail shown when a row is expanded.
  const renderExpanded = (p: Product) => (
    <div className="px-3 sm:px-4 py-4 border-t border-border">
      <div className="flex items-center gap-1.5 mb-3">
        <h4 className="text-2xs uppercase tracking-wide text-muted">Product details</h4>
        <span className="font-mono text-2xs text-muted ml-auto tnum">{p.code}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Detail label="Product">{p.name}</Detail>
        <Detail label="Code" mono>{p.code}</Detail>
        <Detail label="Type">{p.type}</Detail>
        <Detail label="Status">
          <StatusPill status={p.status} />
        </Detail>
        <Detail label="Delivery">{deliveryLabel(p.deliveryStatus)}</Detail>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <Button variant="secondary" size="sm" onClick={() => openEdit(p)}>
          <Pencil size={14} />
          Edit
        </Button>
        <Button variant="danger" size="sm" onClick={() => setConfirmDelete(p)}>
          <Trash2 size={14} />
          Delete
        </Button>
      </div>
    </div>
  );

  // Shared field grid for create + edit modals.
  const fields = (form: FormState, setForm: (f: FormState) => void, idp: string) => (
    <>
      <Field label="Product name" htmlFor={`${idp}-name`} className="sm:col-span-2">
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
          {productTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Status" htmlFor={`${idp}-status`} className="sm:col-span-2">
        <Select
          id={`${idp}-status`}
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as ProductStatus })}
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

  return (
    <div>
      <PageHeader
        title={labels.products}
        description="An independent catalogue of products — each with its own code, type and status."
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setTypeModalOpen(true)}>
              <Plus size={16} />
              Add product type
            </Button>
            <Button variant="primary" onClick={openCreate}>
              <Plus size={16} />
              New product
            </Button>
          </div>
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
          <div className="grid grid-cols-2 gap-2 sm:w-auto">
            <Select value={fType} onChange={(e) => setFType(e.target.value)} aria-label="Filter by type" className="sm:w-40">
              <option value="all">All types</option>
              {productTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <Select value={fStatus} onChange={(e) => setFStatus(e.target.value)} aria-label="Filter by status" className="sm:w-40">
              <option value="all">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(p) => p.id}
          onRowClick={(p) => setExpandedId((prev) => (prev === p.id ? null : p.id))}
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

      {/* Edit product — centered modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={
          <span className="flex items-center gap-2">
            Edit product
            {editing && <span className="font-mono text-2xs text-muted tnum">{editing.code}</span>}
          </span>
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveEdit} disabled={!editForm.name.trim()}>
              Save changes
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {editing && fields(editForm, setEditForm, `pe-${editing.id}`)}
        </div>
      </Modal>

      {/* Add product type — centered modal */}
      <Modal
        open={typeModalOpen}
        onClose={() => {
          setTypeModalOpen(false);
          setNewType('');
        }}
        title="Add product type"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setTypeModalOpen(false);
                setNewType('');
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={saveType} disabled={!newType.trim() || typeExists}>
              Add type
            </Button>
          </>
        }
      >
        <Field label="Type name" htmlFor="new-product-type" hint="Becomes available in the Type dropdown">
          <Input
            id="new-product-type"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveType();
            }}
            placeholder="e.g. Hazardous"
            autoFocus
          />
          {!!newType.trim() && typeExists && (
            <p className="text-2xs text-exception mt-1">This type already exists.</p>
          )}
        </Field>
        {productTypes.length > 0 && (
          <div className="mt-4">
            <h4 className="text-2xs uppercase tracking-wide text-muted mb-2">Existing types</h4>
            <div className="flex flex-wrap gap-1.5">
              {productTypes.map((t) => {
                const inUse = products.filter((p) => p.type === t).length;
                const last = productTypes.length === 1;
                return (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 text-2xs border border-border rounded-[3px] pl-1.5 pr-1 py-0.5 text-text-2"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => removeType(t)}
                      disabled={last}
                      aria-label={`Delete ${t} type`}
                      title={
                        last
                          ? 'At least one type must remain'
                          : inUse
                            ? `${inUse} product(s) will move to Standard`
                            : `Delete ${t}`
                      }
                      className="grid place-items-center h-4 w-4 rounded-[2px] text-muted hover:text-exception hover:bg-surface-2 disabled:opacity-40 disabled:hover:text-muted disabled:hover:bg-transparent"
                    >
                      <X size={11} />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}
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

function Detail({
  label,
  children,
  mono,
}: {
  label: string;
  children: ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-2xs uppercase tracking-wide text-muted mb-0.5">{label}</div>
      <div className={cn('text-[13px] text-text font-medium', mono && 'font-mono')}>{children}</div>
    </div>
  );
}
