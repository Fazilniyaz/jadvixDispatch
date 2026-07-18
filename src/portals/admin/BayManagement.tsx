import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Calendar,
  ChevronRight,
  GripVertical,
  MapPin,
  Minus,
  Package,
  Plus,
  Truck,
  UserPlus,
  Users,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { StatusPill } from '@/components/StatusPill';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import type { Bay, BayStatus, Employee, Product, Route, Shift } from '@/lib/types';

const BAY_STATUS_OPTIONS: { value: BayStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'ready', label: 'Ready to go' },
  { value: 'shipped', label: 'Shipped' },
];

const UNASSIGNED = '__unassigned__';
const cellSelect =
  'h-8 w-full bg-surface border border-border rounded-[3px] px-2 text-[13px] text-text ' +
  'focus:border-accent focus:outline-none cursor-pointer disabled:opacity-60';

export default function BayManagement() {
  const bays = useStore((s) => s.bays);
  const employees = useStore((s) => s.employees);
  const products = useStore((s) => s.products);
  const shifts = useStore((s) => s.shifts);
  const routes = useStore((s) => s.routes);
  const labels = useStore((s) => s.moduleLabels);
  const maxBays = useStore((s) => s.maxBays);
  const activeShiftId = useStore((s) => s.activeShiftId);
  const ensureShiftBays = useStore((s) => s.ensureShiftBays);
  const reorderShiftBays = useStore((s) => s.reorderShiftBays);
  const swapBayNumber = useStore((s) => s.swapBayNumber);
  const assignBayDriver = useStore((s) => s.assignBayDriver);
  const updateBay = useStore((s) => s.updateBay);
  const setMaxBays = useStore((s) => s.setMaxBays);

  const drivers = useMemo(() => employees.filter((e) => e.role === 'driver'), [employees]);

  // Lookups.
  const empById = (id: string | null) => employees.find((e) => e.id === id) ?? null;
  const productById = (id: string | null) => products.find((p) => p.id === id) ?? null;
  const routeById = (id: string | null) => routes.find((r) => r.id === id) ?? null;
  const shiftById = (id: string | null) => shifts.find((s) => s.id === id) ?? null;

  const [tab, setTab] = useState<string>(activeShiftId || shifts[0]?.id || UNASSIGNED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Materialise each shift's bays up to maxBays so every tab shows a full grid.
  useEffect(() => {
    shifts.forEach((s) => ensureShiftBays(s.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shifts.length, maxBays]);

  // Keep the active tab valid when shifts change.
  useEffect(() => {
    if (tab !== UNASSIGNED && !shifts.some((s) => s.id === tab)) {
      setTab(shifts[0]?.id ?? UNASSIGNED);
    }
  }, [shifts, tab]);

  const shiftBays = useMemo(
    () => bays.filter((b) => b.shiftId === tab).sort((a, b) => a.number - b.number),
    [bays, tab]
  );

  const unassignedDrivers = useMemo(
    () => drivers.filter((d) => !bays.some((b) => b.assignedDriverId === d.id)),
    [drivers, bays]
  );

  // ---- Drag and drop: reorder rows → renumber bays ----
  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const ids = shiftBays.map((b) => b.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from !== -1 && to !== -1) {
      ids.splice(from, 1);
      ids.splice(to, 0, dragId);
      reorderShiftBays(tab, ids);
    }
    setDragId(null);
    setOverId(null);
  };

  const occupied = (shiftId: string) =>
    bays.filter((b) => b.shiftId === shiftId && b.assignedDriverId).length;

  return (
    <div>
      <PageHeader
        title={labels.bays}
        description="The hub that reconnects everything: assign each bay an employee, product, location and status per shift."
        action={
          <div className="flex items-center gap-2">
            <span className="text-2xs text-muted hidden sm:inline">Bays per shift</span>
            <div className="inline-flex items-center border border-border rounded-[3px]">
              <button
                onClick={() => setMaxBays(maxBays - 1)}
                disabled={maxBays <= 1}
                aria-label="Fewer bays"
                className="h-9 w-8 grid place-items-center text-muted hover:text-text disabled:opacity-40"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center text-sm font-semibold text-text tnum">{maxBays}</span>
              <button
                onClick={() => setMaxBays(maxBays + 1)}
                aria-label="More bays"
                className="h-9 w-8 grid place-items-center text-muted hover:text-text"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        }
      />

      {shifts.length === 0 ? (
        <Card className="p-10 text-center text-[13px] text-text-2">
          No shifts yet. Create a shift first, then stage its bays here.
        </Card>
      ) : (
        <>
          {/* Browser-style tabs: one per shift + an Unassigned employees tab */}
          <div className="flex items-end gap-1 border-b border-border overflow-x-auto">
            {shifts.map((s) => {
              const active = tab === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setTab(s.id);
                    setExpandedId(null);
                  }}
                  className={cn(
                    '-mb-px shrink-0 px-4 py-2.5 rounded-t-[6px] border border-b-0 text-left transition-colors',
                    active
                      ? 'bg-surface border-border'
                      : 'border-transparent hover:bg-surface-2'
                  )}
                >
                  <div
                    className={cn(
                      'text-[13px] font-medium whitespace-nowrap',
                      active ? 'text-text' : 'text-text-2'
                    )}
                  >
                    {s.name}
                  </div>
                  <div className="text-2xs text-muted tnum whitespace-nowrap">
                    {s.window} · {occupied(s.id)}/{maxBays}
                  </div>
                </button>
              );
            })}
            <button
              onClick={() => {
                setTab(UNASSIGNED);
                setExpandedId(null);
              }}
              className={cn(
                '-mb-px shrink-0 px-4 py-2.5 rounded-t-[6px] border border-b-0 flex items-center gap-2 transition-colors',
                tab === UNASSIGNED ? 'bg-surface border-border' : 'border-transparent hover:bg-surface-2'
              )}
            >
              <Users size={14} className={tab === UNASSIGNED ? 'text-accent' : 'text-muted'} />
              <div className="text-left">
                <div
                  className={cn(
                    'text-[13px] font-medium whitespace-nowrap',
                    tab === UNASSIGNED ? 'text-text' : 'text-text-2'
                  )}
                >
                  Unassigned employees
                </div>
                <div className="text-2xs text-muted tnum">{unassignedDrivers.length} available</div>
              </div>
            </button>
          </div>

          {/* Tab content */}
          <div className="border border-border border-t-0 rounded-b-[6px] bg-surface">
            {tab === UNASSIGNED ? (
              <UnassignedPanel
                unassignedDrivers={unassignedDrivers}
                bays={bays}
                shiftById={shiftById}
                onAssign={(bayId, driverId) => assignBayDriver(bayId, driverId)}
              />
            ) : (
              <BayTable
                shift={shiftById(tab)}
                rows={shiftBays}
                drivers={drivers}
                products={products}
                routes={routes}
                bays={bays}
                maxBays={maxBays}
                expandedId={expandedId}
                dragId={dragId}
                overId={overId}
                empById={empById}
                productById={productById}
                routeById={routeById}
                shiftById={shiftById}
                onToggleExpand={(id) => setExpandedId((prev) => (prev === id ? null : id))}
                onDragStart={setDragId}
                onDragEnterRow={setOverId}
                onDragEndReset={() => {
                  setDragId(null);
                  setOverId(null);
                }}
                onDrop={handleDrop}
                onNumber={(bayId, n) => swapBayNumber(tab, bayId, n)}
                onDriver={(bayId, id) => assignBayDriver(bayId, id)}
                onProduct={(bayId, id) =>
                  updateBay(bayId, { productId: id, stocks: productById(id)?.stocks ?? 0 })
                }
                onRoute={(bayId, id) => updateBay(bayId, { routeId: id })}
                onDate={(bayId, date) => updateBay(bayId, { date })}
                onStatus={(bayId, status) => updateBay(bayId, { status })}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────── Bay table (per shift) ─────────────────────────── */

interface BayTableProps {
  shift: Shift | null;
  rows: Bay[];
  drivers: Employee[];
  products: Product[];
  routes: Route[];
  bays: Bay[];
  maxBays: number;
  expandedId: string | null;
  dragId: string | null;
  overId: string | null;
  empById: (id: string | null) => Employee | null;
  productById: (id: string | null) => Product | null;
  routeById: (id: string | null) => Route | null;
  shiftById: (id: string | null) => Shift | null;
  onToggleExpand: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnterRow: (id: string) => void;
  onDragEndReset: () => void;
  onDrop: (targetId: string) => void;
  onNumber: (bayId: string, n: number) => void;
  onDriver: (bayId: string, id: string | null) => void;
  onProduct: (bayId: string, id: string | null) => void;
  onRoute: (bayId: string, id: string | null) => void;
  onDate: (bayId: string, date: string) => void;
  onStatus: (bayId: string, status: BayStatus) => void;
}

function BayTable(props: BayTableProps) {
  const {
    shift,
    rows,
    drivers,
    products,
    routes,
    bays,
    maxBays,
    expandedId,
    dragId,
    overId,
    empById,
    productById,
    routeById,
    shiftById,
    onToggleExpand,
    onDragStart,
    onDragEnterRow,
    onDragEndReset,
    onDrop,
    onNumber,
    onDriver,
    onProduct,
    onRoute,
    onStatus,
    onDate,
  } = props;

  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm min-w-[880px]">
        <thead>
          <tr className="border-b border-border bg-surface-2">
            {['Bay #', 'Employee', 'Product', 'Date', 'Location', 'Status', ''].map((h, i) => (
              <th
                key={i}
                className="text-left font-mono font-medium text-muted text-2xs uppercase tracking-[0.12em] px-3 py-2.5 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => {
            const assigned = !!b.assignedDriverId;
            const isExpanded = expandedId === b.id;
            const isOver = overId === b.id && dragId !== b.id;
            return (
              <BayRowGroup key={b.id}>
                <tr
                  onClick={() => onToggleExpand(b.id)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    onDragEnterRow(b.id);
                  }}
                  onDrop={() => onDrop(b.id)}
                  className={cn(
                    'border-b border-border cursor-pointer hover:bg-surface-2 transition-colors',
                    dragId === b.id && 'opacity-40',
                    isOver && 'border-t-2 border-t-accent',
                    isExpanded && 'bg-surface-2'
                  )}
                  style={{
                    borderLeft: `3px solid ${assigned ? 'var(--delivered)' : 'var(--border)'}`,
                    backgroundColor:
                      assigned && !isExpanded
                        ? 'color-mix(in srgb, var(--delivered) 5%, transparent)'
                        : undefined,
                  }}
                >
                  {/* Bay # + drag handle */}
                  <td className="px-3 py-2 align-middle">
                    <div className="flex items-center gap-1.5">
                      <span
                        draggable
                        onClick={stop}
                        onDragStart={(e) => {
                          e.stopPropagation();
                          onDragStart(b.id);
                        }}
                        onDragEnd={onDragEndReset}
                        title="Drag to reorder"
                        className="cursor-grab active:cursor-grabbing text-muted hover:text-text"
                      >
                        <GripVertical size={15} />
                      </span>
                      <span className="text-2xs font-mono uppercase text-muted">Bay</span>
                      <input
                        type="number"
                        min={1}
                        max={maxBays}
                        value={b.number}
                        onClick={stop}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (n >= 1 && n <= maxBays) onNumber(b.id, n);
                        }}
                        aria-label={`Bay number, currently ${b.number}`}
                        className="w-14 h-8 bg-surface border border-border rounded-[3px] px-2 text-sm font-mono font-semibold text-accent tnum focus:border-accent focus:outline-none"
                      />
                    </div>
                  </td>

                  {/* Employee */}
                  <td className="px-3 py-2 align-middle min-w-[180px]" onClick={stop}>
                    <select
                      value={b.assignedDriverId ?? ''}
                      onChange={(e) => onDriver(b.id, e.target.value || null)}
                      className={cn(cellSelect, !assigned && 'text-muted')}
                    >
                      <option value="">Slot available</option>
                      {drivers.map((d) => {
                        const other = bays.find((x) => x.assignedDriverId === d.id && x.id !== b.id);
                        const otherShift = other ? shiftById(other.shiftId) : null;
                        return (
                          <option key={d.id} value={d.id}>
                            {d.name}
                            {other ? ` · in ${otherShift?.name ?? 'bay'} #${other.number}` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </td>

                  {/* Product */}
                  <td className="px-3 py-2 align-middle min-w-[180px]" onClick={stop}>
                    <select
                      value={b.productId ?? ''}
                      onChange={(e) => onProduct(b.id, e.target.value || null)}
                      className={cn(cellSelect, !b.productId && 'text-muted')}
                    >
                      <option value="">— none —</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.type})
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Date */}
                  <td className="px-3 py-2 align-middle" onClick={stop}>
                    <input
                      type="date"
                      value={b.date}
                      onChange={(e) => onDate(b.id, e.target.value)}
                      className={cn(cellSelect, 'tnum w-[9.5rem]')}
                    />
                  </td>

                  {/* Location */}
                  <td className="px-3 py-2 align-middle min-w-[160px]" onClick={stop}>
                    <select
                      value={b.routeId ?? ''}
                      onChange={(e) => onRoute(b.id, e.target.value || null)}
                      className={cn(cellSelect, !b.routeId && 'text-muted')}
                    >
                      <option value="">— none —</option>
                      {routes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-2 align-middle" onClick={stop}>
                    <select
                      value={b.status}
                      onChange={(e) => onStatus(b.id, e.target.value as BayStatus)}
                      className={cellSelect}
                    >
                      {BAY_STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Expand chevron */}
                  <td className="px-3 py-2 align-middle w-8">
                    <ChevronRight
                      size={15}
                      className={cn('text-muted transition-transform', isExpanded && 'rotate-90 text-text')}
                    />
                  </td>
                </tr>

                {isExpanded && (
                  <tr className="border-b border-border bg-surface-2">
                    <td colSpan={7} className="p-0">
                      <BayDetail
                        bay={b}
                        shift={shift}
                        employee={empById(b.assignedDriverId)}
                        product={productById(b.productId)}
                        route={routeById(b.routeId)}
                      />
                    </td>
                  </tr>
                )}
              </BayRowGroup>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Fragment wrapper so a row + its detail row share one key.
function BayRowGroup({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/* ───────────────────────────── Expanded detail ───────────────────────────── */

function BayDetail({
  bay,
  shift,
  employee,
  product,
  route,
}: {
  bay: Bay;
  shift: Shift | null;
  employee: Employee | null;
  product: Product | null;
  route: Route | null;
}) {
  return (
    <div className="px-3 sm:px-4 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <DetailCard icon={<Truck size={14} />} title="Shift">
        {shift ? (
          <>
            <Row label="Name" value={shift.name} />
            <Row label="Window" value={shift.window} mono />
            <Row label="Status" value={<StatusPill status={shift.status} />} />
          </>
        ) : (
          <Empty>No shift</Empty>
        )}
      </DetailCard>

      <DetailCard icon={<Users size={14} />} title="Employee">
        {employee ? (
          <>
            <Row label="Name" value={employee.name} />
            <Row label="Role" value={<span className="capitalize">{employee.role}</span>} />
            <Row label="Vehicle" value={employee.vehicleNo || '—'} mono />
            <Row label="Contact" value={employee.contactNo || '—'} mono />
            <Row label="Status" value={<StatusPill status={employee.status} />} />
          </>
        ) : (
          <Empty>Slot available</Empty>
        )}
      </DetailCard>

      <DetailCard icon={<MapPin size={14} />} title="Location">
        {route ? (
          <>
            <Row label="Name" value={route.name} />
            <Row label="Area" value={route.areaName} />
            <Row label="Coordinates" value={route.coordinates || '—'} mono />
            <Row label="ETA" value={route.eta || '—'} mono />
            <Row label="Status" value={<StatusPill status={route.status} />} />
          </>
        ) : (
          <Empty>No location</Empty>
        )}
      </DetailCard>

      <DetailCard icon={<Package size={14} />} title="Product">
        {product ? (
          <>
            <Row label="Code" value={product.code} mono />
            <Row label="Name" value={product.name} />
            <Row label="Type" value={product.type} />
            <Row label="Status" value={<StatusPill status={product.status} />} />
          </>
        ) : (
          <Empty>No product</Empty>
        )}
      </DetailCard>

      <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-4 text-2xs text-muted pt-1">
        <span className="inline-flex items-center gap-1.5">
          <Calendar size={12} /> Staged for <span className="text-text-2 tnum">{bay.date || '—'}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          Bay status <StatusPill status={bay.status} />
        </span>
      </div>
    </div>
  );
}

function DetailCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
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

function Row({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-2xs text-muted shrink-0">{label}</span>
      <span className={cn('text-[13px] text-text text-right truncate', mono && 'font-mono text-2xs')}>
        {value}
      </span>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-[13px] text-muted">{children}</p>;
}

/* ─────────────────────────── Unassigned employees ─────────────────────────── */

function UnassignedPanel({
  unassignedDrivers,
  bays,
  shiftById,
  onAssign,
}: {
  unassignedDrivers: Employee[];
  bays: Bay[];
  shiftById: (id: string | null) => Shift | null;
  onAssign: (bayId: string, driverId: string) => void;
}) {
  // Empty bay slots, grouped for a readable "Shift · Bay n" dropdown.
  const emptySlots = useMemo(
    () =>
      bays
        .filter((b) => !b.assignedDriverId)
        .sort((a, b) => a.number - b.number)
        .map((b) => ({ bay: b, shift: shiftById(b.shiftId) })),
    [bays, shiftById]
  );

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <UserPlus size={15} className="text-accent" />
        <h3 className="text-sm font-semibold text-text">Unassigned drivers</h3>
        <span className="text-2xs text-muted tnum">({unassignedDrivers.length})</span>
      </div>

      {unassignedDrivers.length === 0 ? (
        <p className="text-[13px] text-text-2 py-6 text-center">
          Every driver is assigned to a bay. Free one up from its shift tab to see them here.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {unassignedDrivers.map((d) => (
            <div key={d.id} className="border border-border rounded-[4px] bg-bg p-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[3px] bg-surface-2 border border-border text-2xs font-semibold text-text-2">
                  {d.name
                    .split(' ')
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join('')}
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-text truncate">{d.name}</div>
                  <div className="text-2xs text-muted font-mono truncate">{d.vehicleNo || 'No vehicle'}</div>
                </div>
                <StatusPill status={d.status} className="ml-auto" />
              </div>
              <label className="mt-3 block">
                <span className="text-2xs text-muted">Assign to bay</span>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) onAssign(e.target.value, d.id);
                  }}
                  className={cn(cellSelect, 'mt-1')}
                  disabled={emptySlots.length === 0}
                >
                  <option value="">
                    {emptySlots.length === 0 ? 'No free bays' : 'Choose a bay…'}
                  </option>
                  {emptySlots.map(({ bay, shift }) => (
                    <option key={bay.id} value={bay.id}>
                      {shift?.name ?? 'Shift'} · Bay {bay.number}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
