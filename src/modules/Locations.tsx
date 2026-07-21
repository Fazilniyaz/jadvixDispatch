import { useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Field, Input, Select } from '@/components/Field';
import { useStore } from '@/store/useStore';
import { useScopedRoutes } from '@/lib/scope';
import type { Route, RouteStatus } from '@/lib/types';

const STATUSES: RouteStatus[] = ['planned', 'active', 'completed'];

type Form = { name: string; areaName: string; coordinates: string; eta: string; order: number; status: RouteStatus };
const empty = (order: number): Form => ({ name: '', areaName: '', coordinates: '', eta: '', order, status: 'planned' });

export default function Locations() {
  const hubId = useStore((s) => s.activeHubId);
  const labels = useStore((s) => s.moduleLabels);
  const addRoute = useStore((s) => s.addRoute);
  const updateRoute = useStore((s) => s.updateRoute);
  const deleteRoute = useStore((s) => s.deleteRoute);
  const routes = useScopedRoutes();

  const [search, setSearch] = useState('');
  const [form, setForm] = useState<Form>(empty(1));
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Route | null>(null);
  const [confirm, setConfirm] = useState<Route | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return routes;
    return routes.filter((r) => `${r.name} ${r.areaName}`.toLowerCase().includes(q));
  }, [routes, search]);

  const save = () => {
    if (!form.name.trim() || !hubId) return;
    const payload = {
      hubId, name: form.name.trim(), areaName: form.areaName.trim() || form.name.trim(),
      coordinates: form.coordinates.trim(), eta: form.eta.trim(),
      order: Number(form.order) || 1, status: form.status,
    };
    if (editing) updateRoute(editing.id, payload);
    else addRoute(payload);
    setOpen(false); setEditing(null);
  };

  const cols: Column<Route>[] = [
    { key: 'order', header: '#', render: (r) => <span className="font-mono text-2xs text-muted tnum">{String(r.order).padStart(2, '0')}</span> },
    { key: 'name', header: 'Location', render: (r) => <span className="font-medium text-text">{r.name}</span> },
    { key: 'area', header: 'Area', render: (r) => <span className="text-text-2">{r.areaName}</span> },
    { key: 'coords', header: 'Coordinates', render: (r) => <span className="font-mono text-2xs text-text-2 tnum">{r.coordinates || '—'}</span> },
    { key: 'eta', header: 'ETA', render: (r) => <span className="text-text-2 tnum">{r.eta || '—'}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
    { key: 'actions', header: '', headerClassName: 'text-right', className: 'text-right', render: (r) => (
      <div className="flex items-center justify-end gap-1">
        <button onClick={() => { setEditing(r); setForm({ name: r.name, areaName: r.areaName, coordinates: r.coordinates, eta: r.eta, order: r.order, status: r.status }); setOpen(true); }} aria-label="Edit" className="text-muted hover:text-text p-1.5 rounded-[3px] hover:bg-surface-2"><Pencil size={15} /></button>
        <button onClick={() => setConfirm(r)} aria-label="Delete" className="text-muted hover:text-exception p-1.5 rounded-[3px] hover:bg-surface-2"><Trash2 size={15} /></button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader
        title={labels.locations}
        description="Delivery points for this hub, assignable to bays."
        action={<Button variant="primary" onClick={() => { setEditing(null); setForm(empty(routes.length + 1)); setOpen(true); }}><Plus size={16} />New location</Button>}
      />
      <Card>
        <div className="p-3 border-b border-border">
          <div className="relative max-w-md">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <Input placeholder="Search by location or area" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <DataTable columns={cols} rows={rows} rowKey={(r) => r.id} empty="No locations yet." />
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit location' : 'New location'}
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={!form.name.trim()}>{editing ? 'Save changes' : 'Create'}</Button></>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Location name" className="sm:col-span-2"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Adyar" /></Field>
          <Field label="Area"><Input value={form.areaName} onChange={(e) => setForm({ ...form, areaName: e.target.value })} /></Field>
          <Field label="ETA"><Input value={form.eta} onChange={(e) => setForm({ ...form, eta: e.target.value })} placeholder="10:15" /></Field>
          <Field label="Coordinates" className="sm:col-span-2"><Input className="font-mono" value={form.coordinates} onChange={(e) => setForm({ ...form, coordinates: e.target.value })} placeholder="13.02, 80.22" /></Field>
          <Field label="Order"><Input type="number" min={1} value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} /></Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as RouteStatus })}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
        </div>
      </Modal>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Delete location"
        footer={<><Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => { if (confirm) deleteRoute(confirm.id); setConfirm(null); }}>Delete</Button></>}>
        <p className="text-[13px] text-text-2">Delete <b className="text-text">{confirm?.name}</b>? Open bays pointing at it will be cleared.</p>
      </Modal>
    </div>
  );
}
