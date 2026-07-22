import { useMemo, useState } from 'react';
import { Download, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Field, Input, Select } from '@/components/Field';
import { useStore } from '@/store/useStore';
import { useScopedProducts } from '@/lib/scope';
import { exportRows } from '@/lib/exporters';
import type { Product, ProductStatus } from '@/lib/types';

const STATUSES: ProductStatus[] = ['scheduled', 'picked', 'transit', 'out', 'delivered', 'exception'];
const deliveryFor = (s: ProductStatus) =>
  s === 'delivered' ? 'delivered' : s === 'exception' ? 'failed' : 'pending';

type Form = { code: string; name: string; type: string; status: ProductStatus };
const empty = (): Form => ({ code: '', name: '', type: 'Standard', status: 'scheduled' });

export default function Products() {
  const hubId = useStore((s) => s.activeHubId);
  const labels = useStore((s) => s.moduleLabels);
  const productTypes = useStore((s) => s.productTypes);
  const addProduct = useStore((s) => s.addProduct);
  const updateProduct = useStore((s) => s.updateProduct);
  const deleteProduct = useStore((s) => s.deleteProduct);
  const addProductType = useStore((s) => s.addProductType);
  const deleteProductType = useStore((s) => s.deleteProductType);
  const products = useScopedProducts();

  const [search, setSearch] = useState('');
  const [fType, setFType] = useState('all');
  const [fStatus, setFStatus] = useState('all');
  const [form, setForm] = useState<Form>(empty());
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [confirm, setConfirm] = useState<Product | null>(null);
  const [typeOpen, setTypeOpen] = useState(false);
  const [newType, setNewType] = useState('');

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (q && !`${p.code} ${p.name}`.toLowerCase().includes(q)) return false;
      if (fType !== 'all' && p.type !== fType) return false;
      if (fStatus !== 'all' && p.status !== fStatus) return false;
      return true;
    });
  }, [products, search, fType, fStatus]);

  const save = () => {
    if (!form.name.trim() || !hubId) return;
    const payload = {
      hubId, code: form.code, name: form.name.trim(), type: form.type,
      status: form.status, deliveryStatus: deliveryFor(form.status) as Product['deliveryStatus'],
    };
    if (editing) updateProduct(editing.id, payload);
    else addProduct(payload);
    setCreateOpen(false); setEditing(null);
  };

  const cols: Column<Product>[] = [
    { key: 'code', header: 'Code', render: (p) => <span className="font-mono text-2xs text-text-2 tnum">{p.code}</span> },
    { key: 'name', header: 'Product', render: (p) => <span className="font-medium text-text">{p.name}</span> },
    { key: 'type', header: 'Type', render: (p) => <span className="text-text-2">{p.type}</span> },
    { key: 'status', header: 'Status', render: (p) => <StatusPill status={p.status} /> },
    { key: 'actions', header: '', headerClassName: 'text-right', className: 'text-right', render: (p) => (
      <div className="flex items-center justify-end gap-1">
        <button onClick={() => { setEditing(p); setForm({ code: p.code, name: p.name, type: p.type, status: p.status }); }} aria-label="Edit" className="text-muted hover:text-text p-1.5 rounded-[3px] hover:bg-surface-2"><Pencil size={15} /></button>
        <button onClick={() => setConfirm(p)} aria-label="Delete" className="text-muted hover:text-exception p-1.5 rounded-[3px] hover:bg-surface-2"><Trash2 size={15} /></button>
      </div>
    ) },
  ];

  const fields = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="Product name" className="sm:col-span-2"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ceramic dinnerware set" /></Field>
      <Field label="Code" hint="Blank to auto-generate"><Input className="font-mono" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="JDX-…" /></Field>
      <Field label="Type">
        <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          {productTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
      </Field>
    </div>
  );

  return (
    <div>
      <PageHeader
        title={labels.products}
        description="This hub's product catalogue."
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setTypeOpen(true)}><Plus size={16} />Type</Button>
            <Button variant="primary" onClick={() => { setForm(empty()); setCreateOpen(true); }}><Plus size={16} />New product</Button>
          </div>
        }
      />
      <Card>
        <div className="flex flex-col md:flex-row md:items-center gap-3 p-3 border-b border-border">
          <div className="relative flex-1 min-w-0">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <Input placeholder="Search by code or name" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={fType} onChange={(e) => setFType(e.target.value)} aria-label="Filter type" className="sm:w-40">
              <option value="all">All types</option>
              {productTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Select value={fStatus} onChange={(e) => setFStatus(e.target.value)} aria-label="Filter status" className="sm:w-40">
              <option value="all">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
        </div>
        <DataTable columns={cols} rows={rows} rowKey={(p) => p.id} empty="No products match." />
        <div className="flex items-center gap-2 px-3 py-2 border-t border-border text-2xs text-muted">
          <span>Showing {rows.length} of {products.length}</span>
          <div className="ml-auto flex items-center gap-1.5">
            <Download size={13} />
            {(['csv', 'excel', 'pdf'] as const).map((f) => (
              <button key={f} onClick={() => exportRows('products', rows.map(({ id: _i, hubId: _h, ...r }) => r), f)}
                className="uppercase tracking-wide border border-border rounded-[3px] px-2 py-1 text-text-2 hover:bg-surface-2">{f}</button>
            ))}
          </div>
        </div>
      </Card>

      <Modal open={createOpen || !!editing} onClose={() => { setCreateOpen(false); setEditing(null); }}
        title={editing ? 'Edit product' : 'New product'}
        footer={<><Button variant="ghost" onClick={() => { setCreateOpen(false); setEditing(null); }}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={!form.name.trim()}>{editing ? 'Save changes' : 'Create'}</Button></>}>
        {fields}
      </Modal>

      <Modal open={typeOpen} onClose={() => setTypeOpen(false)} title="Product types"
        footer={<><Button variant="ghost" onClick={() => setTypeOpen(false)}>Close</Button>
          <Button variant="primary" disabled={!newType.trim()} onClick={() => { addProductType(newType.trim()); setNewType(''); }}>Add type</Button></>}>
        <Field label="New type"><Input value={newType} onChange={(e) => setNewType(e.target.value)} placeholder="e.g. Hazardous" /></Field>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {productTypes.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 text-2xs border border-border rounded-[3px] pl-1.5 pr-1 py-0.5 text-text-2">
              {t}
              <button onClick={() => deleteProductType(t)} disabled={productTypes.length === 1} aria-label={`Remove ${t}`}
                className="grid place-items-center h-4 w-4 rounded-[2px] text-muted hover:text-exception disabled:opacity-40"><X size={11} /></button>
            </span>
          ))}
        </div>
      </Modal>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Delete product"
        footer={<><Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => { if (confirm) deleteProduct(confirm.id); setConfirm(null); }}>Delete</Button></>}>
        <p className="text-[13px] text-text-2">Delete <b className="text-text">{confirm?.name}</b>? It will be removed from any open bay.</p>
      </Modal>
    </div>
  );
}
