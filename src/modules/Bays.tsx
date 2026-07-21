import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Copy,
  Download,
  GripVertical,
  Lock,
  MapPin,
  Package,
  Truck,
  Users,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { onLeave, useScopedBays, useScopedEmployees, useScopedLeave, useScopedProducts, useScopedRoutes, useScopedShifts } from '@/lib/scope';
import { daysAgo, today } from '@/data/seed';
import { exportRows } from '@/lib/exporters';
import type { BayStatus } from '@/lib/types';

const STATUS_OPTIONS: { value: BayStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'ready', label: 'Ready to go' },
  { value: 'shipped', label: 'Shipped' },
];

const cell =
  'h-8 w-full bg-surface border border-border rounded-[3px] px-2 text-[13px] text-text focus:border-accent focus:outline-none disabled:opacity-60';

export default function Bays() {
  const hubId = useStore((s) => s.activeHubId);
  const maxBays = useStore((s) => s.maxBays);
  const setMaxBays = useStore((s) => s.setMaxBays);
  const ensureBays = useStore((s) => s.ensureBays);
  const updateBay = useStore((s) => s.updateBay);
  const reorderBays = useStore((s) => s.reorderBays);
  const swapBayNumber = useStore((s) => s.swapBayNumber);
  const assignBayDriver = useStore((s) => s.assignBayDriver);
  const completeBayDay = useStore((s) => s.completeBayDay);
  const duplicateBayDay = useStore((s) => s.duplicateBayDay);
  const labels = useStore((s) => s.moduleLabels);

  const shifts = useScopedShifts();
  const employees = useScopedEmployees();
  const products = useScopedProducts();
  const routes = useScopedRoutes();
  const leave = useScopedLeave();
  const allBays = useScopedBays();

  const [date, setDate] = useState(today());
  const [shiftId, setShiftId] = useState<string>('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dupOpen, setDupOpen] = useState(false);
  const [dupFrom, setDupFrom] = useState(daysAgo(1));

  const UNASSIGNED_TAB = '__un';
  const onUnassignedTab = shiftId === UNASSIGNED_TAB;
  const activeShift = shifts.find((s) => s.id === shiftId) ?? shifts[0];

  // Only snap back to a real shift when the selection is genuinely stale —
  // never when the Unassigned tab is deliberately open.
  useEffect(() => {
    if (onUnassignedTab) return;
    if (shifts.length && !shifts.some((s) => s.id === shiftId)) setShiftId(shifts[0].id);
  }, [shifts, shiftId, onUnassignedTab]);

  useEffect(() => {
    if (hubId && activeShift) ensureBays(hubId, activeShift.id, date);
  }, [hubId, activeShift?.id, date, maxBays, ensureBays]);

  const rows = useMemo(
    () =>
      allBays
        .filter((b) => b.shiftId === activeShift?.id && b.date === date)
        .sort((a, b) => a.number - b.number),
    [allBays, activeShift?.id, date]
  );

  const drivers = employees.filter((e) => e.role === 'driver');
  const frozen = rows.length > 0 && rows.every((b) => b.completed);
  const unassignedDrivers = drivers.filter(
    (d) => !allBays.some((b) => b.date === date && b.assignedDriverId === d.id)
  );

  const empById = (id: string | null) => employees.find((e) => e.id === id) ?? null;
  const prodById = (id: string | null) => products.find((p) => p.id === id) ?? null;
  const routeById = (id: string | null) => routes.find((r) => r.id === id) ?? null;

  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId || frozen) return setDragId(null);
    const ids = rows.map((b) => b.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from > -1 && to > -1) {
      ids.splice(from, 1);
      ids.splice(to, 0, dragId);
      reorderBays(ids);
    }
    setDragId(null);
  };

  const doExport = (fmt: 'csv' | 'excel' | 'json') =>
    exportRows(
      `bays-${activeShift?.name ?? 'shift'}-${date}`,
      rows.map((b) => ({
        Bay: b.number,
        Employee: empById(b.assignedDriverId)?.name ?? '',
        Vehicle: b.vehicleNo,
        Product: prodById(b.productId)?.name ?? '',
        Location: routeById(b.routeId)?.name ?? '',
        Date: b.date,
        Status: b.status,
        Completed: b.completed ? 'yes' : 'no',
      })),
      fmt
    );

  if (!shifts.length) {
    return (
      <div>
        <PageHeader title={labels.bays} description="Assign employees, products and locations per bay." />
        <Card className="p-10 text-center text-[13px] text-text-2">
          No shifts at this hub yet. Create a shift first, then stage its bays here.
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={labels.bays}
        description="The hub that connects everything — employees, products and locations, per shift and per day."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 bg-surface border border-border rounded-[3px] px-2 text-[13px] text-text tnum focus:border-accent focus:outline-none"
              aria-label="Bay date"
            />
            <Button variant="secondary" onClick={() => setDupOpen(true)}>
              <Copy size={15} />
              Duplicate
            </Button>
            <Button
              variant="primary"
              disabled={frozen || rows.length === 0}
              onClick={() => hubId && activeShift && completeBayDay(hubId, activeShift.id, date)}
            >
              <CheckCircle2 size={15} />
              {frozen ? 'Completed' : 'Complete day'}
            </Button>
          </div>
        }
      />

      {/* Shift tabs */}
      <div className="flex items-end gap-1 border-b border-border overflow-x-auto">
        {shifts.map((s) => {
          const active = s.id === activeShift?.id;
          const filled = allBays.filter((b) => b.shiftId === s.id && b.date === date && b.assignedDriverId).length;
          return (
            <button
              key={s.id}
              onClick={() => { setShiftId(s.id); setExpanded(null); }}
              className={cn(
                '-mb-px shrink-0 px-4 py-2.5 rounded-t-[6px] border border-b-0 text-left transition-colors',
                active ? 'bg-surface border-border' : 'border-transparent hover:bg-surface-2'
              )}
            >
              <div className={cn('text-[13px] font-medium whitespace-nowrap', active ? 'text-text' : 'text-text-2')}>
                {s.name}
              </div>
              <div className="text-2xs text-muted tnum">starts {s.startTime} · {filled}/{maxBays}</div>
            </button>
          );
        })}
        <button
          onClick={() => { setShiftId('__un'); setExpanded(null); }}
          className={cn(
            '-mb-px shrink-0 px-4 py-2.5 rounded-t-[6px] border border-b-0 flex items-center gap-2',
            shiftId === '__un' ? 'bg-surface border-border' : 'border-transparent hover:bg-surface-2'
          )}
        >
          <Users size={14} className={shiftId === '__un' ? 'text-accent' : 'text-muted'} />
          <div className="text-left">
            <div className="text-[13px] font-medium text-text-2 whitespace-nowrap">Unassigned</div>
            <div className="text-2xs text-muted tnum">{unassignedDrivers.length} available</div>
          </div>
        </button>
      </div>

      <div className="border border-border border-t-0 rounded-b-[6px] bg-surface">
        {shiftId === '__un' ? (
          <div className="p-4">
            <h3 className="text-sm font-semibold text-text mb-3">Unassigned drivers ({unassignedDrivers.length})</h3>
            {unassignedDrivers.length === 0 ? (
              <p className="text-[13px] text-text-2 py-6 text-center">Every driver has a bay for {date}.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {unassignedDrivers.map((d) => {
                  const away = onLeave(d, leave, date);
                  const free = allBays.filter((b) => b.date === date && !b.assignedDriverId && !b.completed);
                  return (
                    <div key={d.id} className={cn('border border-border rounded-[4px] bg-bg p-3', away && 'opacity-50')}>
                      <div className="text-[13px] font-medium text-text truncate">{d.name}</div>
                      <div className="text-2xs text-muted font-mono">{d.vehicleNo}</div>
                      {away ? (
                        <p className="mt-2 text-2xs text-muted">On leave — cannot be assigned.</p>
                      ) : (
                        <select
                          value=""
                          onChange={(e) => e.target.value && assignBayDriver(e.target.value, d.id)}
                          className={cn(cell, 'mt-2')}
                        >
                          <option value="">Assign to bay…</option>
                          {free.map((b) => {
                            const sh = shifts.find((s) => s.id === b.shiftId);
                            return (
                              <option key={b.id} value={b.id}>
                                {sh?.name ?? 'Shift'} · Bay {b.number}
                              </option>
                            );
                          })}
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            {frozen && (
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-surface-2 text-[13px] text-text-2">
                <Lock size={14} className="text-muted" />
                This day is completed and locked. Duplicate it to a new date to reuse the plan.
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-border">
              <span className="text-2xs text-muted">Bays per shift</span>
              <input
                type="number"
                min={1}
                max={40}
                value={maxBays}
                onChange={(e) => setMaxBays(Number(e.target.value))}
                className="h-8 w-16 bg-surface border border-border rounded-[3px] px-2 text-[13px] tnum focus:border-accent focus:outline-none"
              />
              <div className="ml-auto flex items-center gap-1.5">
                <Download size={14} className="text-muted" />
                {(['csv', 'excel', 'json'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => doExport(f)}
                    className="text-2xs uppercase tracking-wide border border-border rounded-[3px] px-2 py-1 text-text-2 hover:bg-surface-2"
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm min-w-[900px]">
                <thead>
                  <tr className="border-b border-border bg-surface-2">
                    {['Bay #', 'Employee', 'Product', 'Date', 'Location', 'Status', ''].map((h, i) => (
                      <th key={i} className="text-left font-mono font-medium text-muted text-2xs uppercase tracking-[0.12em] px-3 py-2.5 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((b) => {
                    const emp = empById(b.assignedDriverId);
                    const staffed = !!emp;
                    const isOpen = expanded === b.id;
                    return (
                      <BayRow key={b.id}>
                        <tr
                          onClick={() => setExpanded(isOpen ? null : b.id)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => onDrop(b.id)}
                          className={cn(
                            'border-b border-border cursor-pointer hover:bg-surface-2',
                            dragId === b.id && 'opacity-40',
                            isOpen && 'bg-surface-2'
                          )}
                          style={{
                            borderLeft: `3px solid ${staffed ? 'var(--delivered)' : 'var(--border)'}`,
                            backgroundColor: staffed && !isOpen ? 'color-mix(in srgb, var(--delivered) 5%, transparent)' : undefined,
                          }}
                        >
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              <span
                                draggable={!b.completed}
                                onClick={(e) => e.stopPropagation()}
                                onDragStart={() => setDragId(b.id)}
                                onDragEnd={() => setDragId(null)}
                                className={cn('text-muted', b.completed ? 'opacity-30' : 'cursor-grab hover:text-text')}
                              >
                                <GripVertical size={15} />
                              </span>
                              <span className="text-2xs font-mono uppercase text-muted">Bay</span>
                              <input
                                type="number"
                                min={1}
                                max={maxBays}
                                value={b.number}
                                disabled={b.completed}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) =>
                                  hubId && activeShift &&
                                  swapBayNumber(hubId, activeShift.id, date, b.id, Number(e.target.value))
                                }
                                className="w-14 h-8 bg-surface border border-border rounded-[3px] px-2 text-sm font-mono font-semibold text-accent tnum focus:border-accent focus:outline-none disabled:opacity-60"
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2 min-w-[180px]" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={b.assignedDriverId ?? ''}
                              disabled={b.completed}
                              onChange={(e) => assignBayDriver(b.id, e.target.value || null)}
                              className={cn(cell, !staffed && 'text-muted')}
                            >
                              <option value="">Slot available</option>
                              {drivers.map((d) => {
                                const away = onLeave(d, leave, date);
                                return (
                                  <option key={d.id} value={d.id} disabled={away}>
                                    {d.name}{away ? ' · on leave' : ''}
                                  </option>
                                );
                              })}
                            </select>
                          </td>
                          <td className="px-3 py-2 min-w-[180px]" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={b.productId ?? ''}
                              disabled={b.completed}
                              onChange={(e) => updateBay(b.id, { productId: e.target.value || null })}
                              className={cn(cell, !b.productId && 'text-muted')}
                            >
                              <option value="">— none —</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2 text-[13px] text-text-2 tnum whitespace-nowrap">{b.date}</td>
                          <td className="px-3 py-2 min-w-[160px]" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={b.routeId ?? ''}
                              disabled={b.completed}
                              onChange={(e) => updateBay(b.id, { routeId: e.target.value || null })}
                              className={cn(cell, !b.routeId && 'text-muted')}
                            >
                              <option value="">— none —</option>
                              {routes.map((r) => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={b.status}
                              disabled={b.completed}
                              onChange={(e) => updateBay(b.id, { status: e.target.value as BayStatus })}
                              className={cell}
                            >
                              {STATUS_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2 w-8 text-muted">
                            {b.completed ? <Lock size={14} /> : null}
                          </td>
                        </tr>
                        {isOpen && (
                          <tr className="border-b border-border bg-surface-2">
                            <td colSpan={7} className="p-0">
                              <div className="px-4 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <Detail icon={<Truck size={14} />} title="Shift">
                                  <D k="Name" v={activeShift?.name ?? '—'} />
                                  <D k="Starts" v={activeShift?.startTime ?? '—'} />
                                </Detail>
                                <Detail icon={<Users size={14} />} title="Employee">
                                  {emp ? (
                                    <>
                                      <D k="Name" v={emp.name} />
                                      <D k="Vehicle" v={emp.vehicleNo} />
                                      <D k="Contact" v={emp.contactNo} />
                                    </>
                                  ) : <p className="text-[13px] text-muted">Slot available</p>}
                                </Detail>
                                <Detail icon={<MapPin size={14} />} title="Location">
                                  {routeById(b.routeId) ? (
                                    <>
                                      <D k="Name" v={routeById(b.routeId)!.name} />
                                      <D k="Area" v={routeById(b.routeId)!.areaName} />
                                      <D k="ETA" v={routeById(b.routeId)!.eta} />
                                    </>
                                  ) : <p className="text-[13px] text-muted">No location</p>}
                                </Detail>
                                <Detail icon={<Package size={14} />} title="Product">
                                  {prodById(b.productId) ? (
                                    <>
                                      <D k="Code" v={prodById(b.productId)!.code} />
                                      <D k="Name" v={prodById(b.productId)!.name} />
                                      <D k="Type" v={prodById(b.productId)!.type} />
                                    </>
                                  ) : <p className="text-[13px] text-muted">No product</p>}
                                </Detail>
                              </div>
                            </td>
                          </tr>
                        )}
                      </BayRow>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Duplicate a past day onto another date */}
      <Modal
        open={dupOpen}
        onClose={() => setDupOpen(false)}
        title="Duplicate a day's bay plan"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDupOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (hubId && activeShift) duplicateBayDay(hubId, activeShift.id, dupFrom, date);
                setDupOpen(false);
              }}
            >
              Copy onto {date}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-[13px] text-text-2">
            Copy a previous day’s plan for <b className="text-text">{activeShift?.name}</b> onto{' '}
            <b className="text-text">{date}</b>. Existing bays for that date are replaced.
          </p>
          <label className="flex items-center gap-2">
            <CalendarDays size={15} className="text-muted" />
            <input
              type="date"
              value={dupFrom}
              onChange={(e) => setDupFrom(e.target.value)}
              className="h-9 bg-surface border border-border rounded-[3px] px-2 text-[13px] tnum focus:border-accent focus:outline-none"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}

function BayRow({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function Detail({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="border border-border rounded-[4px] bg-surface p-3">
      <div className="flex items-center gap-1.5 mb-2 text-muted">
        {icon}
        <h4 className="text-2xs uppercase tracking-wide">{title}</h4>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function D({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-2xs text-muted">{k}</span>
      <span className="text-[13px] text-text truncate">{v}</span>
    </div>
  );
}
