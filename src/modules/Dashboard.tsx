import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  Camera,
  CheckCircle2,
  MapPin,
  Package,
  ReceiptText,
  Siren,
  TrendingUp,
  Truck,
  Users,
  Warehouse,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/Card';
import { KpiTile } from '@/components/KpiTile';
import { StatusPill } from '@/components/StatusPill';
import { useStore, useCurrentEmployee } from '@/store/useStore';
import {
  money,
  onLeave,
  useScopedBays,
  useScopedCheckIns,
  useScopedEmployees,
  useScopedLeave,
  useScopedProducts,
  useScopedQueries,
  useScopedRoutes,
  useScopedShifts,
  useTimeFormatter,
} from '@/lib/scope';
import { today } from '@/data/seed';

export default function Dashboard() {
  const user = useStore((s) => s.user);
  if (!user) return null;
  if (user.role === 'master') return <MasterDashboard />;
  if (user.role === 'driver') return <DriverDashboard />;
  return <HubDashboard />;
}

/* ── Master ──────────────────────────────────────────────────────────────── */

function MasterDashboard() {
  const companies = useStore((s) => s.companies);
  const hubs = useStore((s) => s.hubs);
  const employees = useStore((s) => s.employees);
  const invoices = useStore((s) => s.invoices);

  const outstanding = invoices
    .filter((i) => i.status !== 'paid')
    .reduce((sum, i) => sum + i.total, 0);
  const collected = invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);

  return (
    <div>
      <PageHeader
        title="Master control"
        eyebrow="Jadvix · internal"
        description="Every client company on the platform, what they run, and what they owe."
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Companies" value={companies.length} icon={Building2} accent />
        <KpiTile label="Hubs billed" value={hubs.length} icon={Warehouse} />
        <KpiTile label="Employees billed" value={employees.length} icon={Users} />
        <KpiTile label="Outstanding" value={money(outstanding)} icon={ReceiptText} />
      </div>

      <Card className="mt-4">
        <CardHeader title="Clients" subtitle={`${money(collected)} collected to date`} />
        <div className="divide-y divide-border">
          {companies.map((c) => {
            const ch = hubs.filter((h) => h.companyId === c.id);
            const ce = employees.filter((e) => ch.some((h) => h.id === e.hubId));
            const due = invoices
              .filter((i) => i.companyId === c.id && i.status !== 'paid')
              .reduce((s, i) => s + i.total, 0);
            return (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-text truncate">{c.name}</div>
                  <div className="text-2xs text-muted font-mono">{c.code} · {c.city}</div>
                </div>
                <div className="flex items-center gap-5 shrink-0 text-right">
                  <Metric label="hubs" value={ch.length} />
                  <Metric label="staff" value={ce.length} />
                  <div>
                    <div className="text-[13px] font-semibold tnum" style={{ color: due ? 'var(--exception)' : 'var(--delivered)' }}>
                      {money(due)}
                    </div>
                    <div className="text-2xs text-muted">due</div>
                  </div>
                  <StatusPill status={c.status === 'active' ? 'active' : 'idle'} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="mt-4 flex gap-2">
        <Link to="/app/companies" className="inline-flex h-9 items-center gap-2 px-4 text-sm font-medium rounded-[3px] border border-accent bg-accent text-white">
          Manage companies
        </Link>
        <Link to="/app/invoices" className="inline-flex h-9 items-center gap-2 px-4 text-sm font-medium rounded-[3px] border border-border bg-surface text-text hover:bg-surface-2">
          Invoices
        </Link>
      </div>
    </div>
  );
}

/* ── Hub authorities & Super Admin ───────────────────────────────────────── */

function HubDashboard() {
  const employees = useScopedEmployees();
  const products = useScopedProducts();
  const shifts = useScopedShifts();
  const routes = useScopedRoutes();
  const bays = useScopedBays(today());
  const leave = useScopedLeave();
  const queries = useScopedQueries();
  const checkIns = useScopedCheckIns();
  const fmtTime = useTimeFormatter();

  const drivers = employees.filter((e) => e.role === 'driver');
  const staffed = bays.filter((b) => b.assignedDriverId).length;
  const delivered = products.filter((p) => p.deliveryStatus === 'delivered').length;
  const exceptions = products.filter((p) => p.status === 'exception').length;
  const checkedInToday = checkIns.filter((c) => c.date === today()).length;
  const pendingLeave = leave.filter((l) => l.status === 'pending').length;
  const openQueries = queries.filter((q) => q.status !== 'resolved' && q.status !== 'dismissed').length;

  return (
    <div>
      <PageHeader
        title="Hub overview"
        description="Today at this hub — staffing, load, deliveries and anything needing attention."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Bays staffed" value={`${staffed}/${bays.length}`} icon={Warehouse} accent />
        <KpiTile label="Drivers checked in" value={`${checkedInToday}/${drivers.length}`} icon={Camera} />
        <KpiTile label="Delivered" value={delivered} icon={CheckCircle2} />
        <KpiTile label="Exceptions" value={exceptions} icon={AlertTriangle} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Today’s waves" subtitle={`${shifts.length} shifts scheduled`} />
          <div className="divide-y divide-border">
            {shifts.map((sh) => {
              const sb = bays.filter((b) => b.shiftId === sh.id);
              const filled = sb.filter((b) => b.assignedDriverId).length;
              const done = sb.every((b) => b.completed) && sb.length > 0;
              return (
                <div key={sh.id} className="flex items-center gap-3 px-4 py-3">
                  <CalendarClock size={15} className="text-muted shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-text">{sh.name}</div>
                    <div className="text-2xs text-muted tnum">starts {fmtTime(sh.startTime)}</div>
                  </div>
                  <span className="text-2xs text-text-2 tnum">{filled}/{sb.length} bays</span>
                  <StatusPill status={done ? 'completed' : filled ? 'active' : 'idle'} label={done ? 'Completed' : filled ? 'Running' : 'Idle'} />
                </div>
              );
            })}
            {shifts.length === 0 && <p className="px-4 py-6 text-[13px] text-text-2">No shifts yet.</p>}
          </div>
        </Card>

        <Card>
          <CardHeader title="Needs attention" />
          <div className="p-4 space-y-2.5">
            <Attention icon={AlertTriangle} label="Pending leave requests" value={pendingLeave} to="/app/leave" />
            <Attention icon={Siren} label="Open queries" value={openQueries} to="/app/queries" />
            <Attention icon={Camera} label="Drivers not checked in" value={drivers.length - checkedInToday} to="/app/vehicles" />
            <Attention icon={Users} label="On leave today" value={drivers.filter((d) => onLeave(d, leave)).length} to="/app/employees" />
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <Card>
          <CardHeader title="Fleet" subtitle={`${drivers.length} drivers`} />
          <div className="divide-y divide-border max-h-72 overflow-y-auto">
            {drivers.map((d) => {
              const away = onLeave(d, leave);
              const bay = bays.find((b) => b.assignedDriverId === d.id);
              return (
                <div key={d.id} className={`flex items-center gap-3 px-4 py-2.5 ${away ? 'opacity-45' : ''}`}>
                  <Truck size={14} className="text-muted shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] text-text truncate">{d.name}</div>
                    <div className="text-2xs text-muted font-mono">{d.vehicleNo}</div>
                  </div>
                  {bay ? (
                    <span className="text-2xs text-text-2 tnum">Bay {bay.number}</span>
                  ) : (
                    <span className="text-2xs text-muted">Unassigned</span>
                  )}
                  <StatusPill status={away ? 'leave' : d.status} />
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Locations" subtitle={`${routes.length} delivery points`} />
          <div className="divide-y divide-border max-h-72 overflow-y-auto">
            {routes.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                <MapPin size={14} className="text-muted shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] text-text truncate">{r.name}</div>
                  <div className="text-2xs text-muted">{r.areaName}</div>
                </div>
                <span className="text-2xs text-text-2 tnum">ETA {r.eta || '—'}</span>
                <StatusPill status={r.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ── Driver ──────────────────────────────────────────────────────────────── */

function DriverDashboard() {
  const me = useCurrentEmployee();
  const bays = useScopedBays(today());
  const shifts = useScopedShifts();
  const routes = useScopedRoutes();
  const products = useScopedProducts();
  const checkIns = useScopedCheckIns();
  const queries = useScopedQueries();
  const fmtTime = useTimeFormatter();
  const leave = useScopedLeave();

  if (!me) return null;

  const away = onLeave(me, leave);

  // Every bay assigned to me today, in the order the waves actually run.
  const myAssignments = away
    ? []
    : bays
        .filter((b) => b.assignedDriverId === me.id)
        .map((b) => ({ bay: b, shift: shifts.find((s) => s.id === b.shiftId) ?? null }))
        .sort((a, z) => (a.shift?.startTime ?? '').localeCompare(z.shift?.startTime ?? ''));

  // Show the wave I'm on now — the earliest one that hasn't been completed.
  // Once a manager completes the Morning wave, this rolls on to the next.
  const currentIdx = myAssignments.findIndex((a) => !a.bay.completed);
  const current = currentIdx >= 0 ? myAssignments[currentIdx] : null;
  const allDone = myAssignments.length > 0 && currentIdx === -1;

  const myBay = current?.bay;
  const myShift = current?.shift ?? null;
  const myRoute = myBay ? routes.find((r) => r.id === myBay.routeId) : null;
  const myProduct = myBay ? products.find((p) => p.id === myBay.productId) : null;
  const checkedIn = checkIns.some((c) => c.employeeId === me.id && c.date === today());
  const myErrors = queries.filter((q) => q.offenderEmployeeId === me.id).length;

  return (
    <div>
      <PageHeader
        title={`Good day, ${me.name.split(' ')[0]}`}
        description="Everything assigned to you today."
      />

      {!checkedIn && !away && (
        <Card className="mb-4 p-4 flex flex-col sm:flex-row sm:items-center gap-3" >
          <Camera size={18} className="text-accent shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-text">Check in for today</div>
            <div className="text-2xs text-text-2">
              Submit four photos of your vehicle to record attendance and vehicle condition.
            </div>
          </div>
          <Link
            to="/app/vehicles"
            className="inline-flex h-9 items-center px-4 text-sm font-medium rounded-[3px] bg-accent border border-accent text-white shrink-0"
          >
            Check in
          </Link>
        </Card>
      )}

      {away && (
        <Card className="mb-4 p-4 text-[13px] text-text-2">
          You’re marked <b className="text-text">on leave</b> today — no bay has been assigned to you.
        </Card>
      )}

      {allDone && (
        <Card className="mb-4 p-4 flex items-center gap-3">
          <CheckCircle2 size={18} className="text-delivered shrink-0" />
          <div className="text-[13px] text-text-2">
            All of your waves for today are <b className="text-text">completed</b>. Nothing further
            is assigned.
          </div>
        </Card>
      )}

      {/* More than one wave today — show the running order at a glance. */}
      {myAssignments.length > 1 && (
        <Card className="mb-4">
          <CardHeader title="Your waves today" subtitle={`${myAssignments.length} assignments`} />
          <div className="divide-y divide-border">
            {myAssignments.map(({ bay, shift }) => {
              const isCurrent = bay.id === myBay?.id;
              return (
                <div
                  key={bay.id}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5',
                    bay.completed && 'opacity-50'
                  )}
                >
                  <CalendarClock size={14} className="text-muted shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-text truncate">
                      {shift?.name ?? 'Shift'}
                      {isCurrent && (
                        <span className="ml-2 text-2xs font-medium text-accent border border-accent rounded-[3px] px-1.5 py-0.5">
                          Now
                        </span>
                      )}
                    </div>
                    <div className="text-2xs text-muted tnum">
                      starts {shift ? fmtTime(shift.startTime) : '—'} · Bay {bay.number}
                    </div>
                  </div>
                  <StatusPill
                    status={bay.completed ? 'completed' : bay.status}
                    label={bay.completed ? 'Completed' : undefined}
                  />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile
          label="Your shift"
          value={myShift?.name ?? '—'}
          hint={myShift ? `Starts ${fmtTime(myShift.startTime)}` : 'Not assigned'}
          icon={CalendarClock}
          accent
        />
        <KpiTile
          label="Your bay"
          value={myBay ? `Bay ${myBay.number}` : '—'}
          hint={myBay ? myBay.vehicleNo || 'No vehicle' : 'Not assigned'}
          icon={Warehouse}
        />
        <KpiTile
          label="Delivery stop"
          value={myRoute?.areaName ?? '—'}
          hint={myRoute ? `ETA ${myRoute.eta}` : 'No stop assigned'}
          icon={MapPin}
        />
        <KpiTile label="Delivered" value={me.deliveredCount} hint={`${me.errorCount} errors`} icon={TrendingUp} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <Card>
          <CardHeader title="Today’s assignment" subtitle={myBay ? 'Set by your hub' : 'Nothing assigned yet'} />
          <div className="p-4 space-y-3">
            {myBay ? (
              <>
                <Row icon={CalendarClock} label="Shift" value={myShift ? `${myShift.name} · ${fmtTime(myShift.startTime)}` : '—'} />
                <Row icon={Warehouse} label="Bay" value={`Bay ${myBay.number}`} />
                <Row icon={Truck} label="Vehicle" value={myBay.vehicleNo || me.vehicleNo} mono />
                <Row icon={Package} label="Product" value={myProduct ? `${myProduct.name} (${myProduct.type})` : 'None'} />
                <Row icon={MapPin} label="Location" value={myRoute ? `${myRoute.name} · ${myRoute.coordinates}` : 'None'} />
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-2xs uppercase tracking-wide text-muted">Bay status</span>
                  <StatusPill status={myBay.status} />
                </div>
              </>
            ) : (
              <p className="text-[13px] text-text-2">
                Your hub hasn’t assigned you a bay for today yet. It will appear here as soon as they do.
              </p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Your record" />
          <div className="p-4 grid grid-cols-2 gap-3">
            <Mini label="Successful" value={me.deliveredCount} tone="var(--delivered)" />
            <Mini label="Errors" value={me.errorCount} tone="var(--exception)" />
            <Mini label="Queries about you" value={myErrors} tone="var(--text)" />
            <Mini label="Checked in" value={checkedIn ? 'Yes' : 'No'} tone={checkedIn ? 'var(--delivered)' : 'var(--exception)'} />
          </div>
          <div className="px-4 pb-4">
            <Link to="/app/salary" className="text-[13px] font-medium text-accent hover:text-accent-hover">
              View payslips →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ── bits ────────────────────────────────────────────────────────────────── */

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-[13px] font-semibold text-text tnum">{value}</div>
      <div className="text-2xs text-muted">{label}</div>
    </div>
  );
}

function Attention({
  icon: Icon,
  label,
  value,
  to,
}: {
  icon: typeof AlertTriangle;
  label: string;
  value: number;
  to: string;
}) {
  return (
    <Link to={to} className="flex items-center gap-2.5 rounded-[3px] px-2 py-2 hover:bg-surface-2">
      <Icon size={14} className={value > 0 ? 'text-accent' : 'text-muted'} />
      <span className="text-[13px] text-text-2 flex-1">{label}</span>
      <span
        className="text-[13px] font-semibold tnum"
        style={{ color: value > 0 ? 'var(--accent)' : 'var(--muted)' }}
      >
        {value}
      </span>
    </Link>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon size={14} className="text-muted shrink-0" />
      <span className="text-2xs uppercase tracking-wide text-muted w-20 shrink-0">{label}</span>
      <span className={`text-[13px] text-text truncate ${mono ? 'font-mono text-2xs' : ''}`}>{value}</span>
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: number | string; tone: string }) {
  return (
    <div className="border border-border rounded-[3px] bg-surface px-3 py-2">
      <div className="font-display text-xl font-semibold tnum leading-none" style={{ color: tone }}>
        {value}
      </div>
      <div className="text-2xs text-muted mt-1">{label}</div>
    </div>
  );
}
