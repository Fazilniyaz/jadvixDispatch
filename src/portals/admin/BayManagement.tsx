import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { StatusPill } from '@/components/StatusPill';
import { SidePanel } from '@/components/SidePanel';
import { Button } from '@/components/Button';
import { Field, Input, Select } from '@/components/Field';
import { useStore } from '@/store/useStore';
import type { Bay } from '@/lib/types';

export default function BayManagement() {
  const bays = useStore((s) => s.bays);
  const employees = useStore((s) => s.employees);
  const products = useStore((s) => s.products);
  const labels = useStore((s) => s.moduleLabels);
  const updateBay = useStore((s) => s.updateBay);

  const drivers = employees.filter((e) => e.role === 'driver');
  const driverName = (id: string | null) => employees.find((e) => e.id === id)?.name ?? 'Unassigned';

  const [editing, setEditing] = useState<Bay | null>(null);
  const [form, setForm] = useState({ assignedDriverId: '', vehicleNo: '', loaded: 0, capacity: 0 });

  const openEdit = (b: Bay) => {
    setEditing(b);
    setForm({
      assignedDriverId: b.assignedDriverId ?? '',
      vehicleNo: b.vehicleNo,
      loaded: b.loaded,
      capacity: b.capacity,
    });
  };

  const save = () => {
    if (!editing) return;
    const driver = drivers.find((d) => d.id === form.assignedDriverId);
    updateBay(editing.id, {
      assignedDriverId: form.assignedDriverId || null,
      vehicleNo: form.assignedDriverId ? driver?.vehicleNo ?? form.vehicleNo : form.vehicleNo,
      loaded: Number(form.loaded) || 0,
      capacity: Number(form.capacity) || 0,
    });
    setEditing(null);
  };

  return (
    <div>
      <PageHeader
        title={labels.bays}
        description="Loading bays, their assigned vehicles, and load against capacity."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {bays.map((b) => {
          const pct = b.capacity ? Math.round((b.loaded / b.capacity) * 100) : 0;
          const full = pct >= 100;
          const assigned = !!b.assignedDriverId;
          const productCount = products.filter((p) => p.bayId === b.id).length;
          return (
            <Card key={b.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-sm font-semibold text-text">{b.id.toUpperCase()}</div>
                  <div className="text-2xs text-muted mt-0.5">{productCount} products staged</div>
                </div>
                <StatusPill
                  status={!assigned ? 'idle' : full ? 'full' : 'loading'}
                  label={!assigned ? 'Idle' : full ? 'Full' : 'Loading'}
                />
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-2xs text-text-2 mb-1.5">
                  <span>Load</span>
                  <span className="tnum">
                    {b.loaded} / {b.capacity} ({pct}%)
                  </span>
                </div>
                <div className="h-2.5 bg-surface-2 border border-border rounded-[2px] overflow-hidden">
                  <div
                    className="h-full"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor: full ? 'var(--transit)' : 'var(--accent)',
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 border-t border-border pt-3 space-y-1.5 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Driver</span>
                  <span className="text-text">{driverName(b.assignedDriverId)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Vehicle</span>
                  <span className="font-mono text-2xs text-text-2">{b.vehicleNo}</span>
                </div>
              </div>

              <div className="mt-4">
                <Button variant="secondary" size="sm" className="w-full" onClick={() => openEdit(b)}>
                  Manage bay
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <SidePanel
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `Bay ${editing.id.toUpperCase()}` : ''}
        subtitle="Assign a vehicle and set load"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="Loaded" htmlFor="b-loaded">
              <Input
                id="b-loaded"
                type="number"
                min={0}
                value={form.loaded}
                onChange={(e) => setForm({ ...form, loaded: Number(e.target.value) })}
              />
            </Field>
            <Field label="Capacity" htmlFor="b-cap">
              <Input
                id="b-cap"
                type="number"
                min={0}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
              />
            </Field>
          </div>
        </div>
      </SidePanel>
    </div>
  );
}
