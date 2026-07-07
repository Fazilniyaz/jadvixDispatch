import { Link } from 'react-router-dom';
import { ArrowRight, Clock, MapPin, Package, Warehouse } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/Card';
import { KpiTile } from '@/components/KpiTile';
import { StatusPill } from '@/components/StatusPill';
import { RouteChain } from '@/components/RouteChain';
import { useCurrentEmployee, useStore } from '@/store/useStore';

export default function Today() {
  const me = useCurrentEmployee();
  const products = useStore((s) => s.products);
  const routes = useStore((s) => s.routes);
  const bays = useStore((s) => s.bays);
  const shifts = useStore((s) => s.shifts);
  const waves = useStore((s) => s.waves);
  const activeWaveId = useStore((s) => s.activeWaveId);

  if (!me) return null;

  const myProducts = products.filter((p) => p.assignedEmployeeId === me.id);
  const remaining = myProducts.filter((p) => p.status !== 'delivered').length;
  const myBay = bays.find((b) => b.assignedDriverId === me.id);
  const myRoute = routes.find((r) => r.assignedDriverId === me.id);
  const shift = shifts.find((s) => s.name === me.shift);
  const activeWave = waves.find((w) => w.id === activeWaveId);
  const nextStop = myRoute?.stops[0];

  return (
    <div>
      <PageHeader
        title={`Good day, ${me.name.split(' ')[0]}`}
        description="Your shift at a glance — everything you need for the day."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Assigned products" value={myProducts.length} icon={Package} accent />
        <KpiTile label="Remaining" value={remaining} icon={Clock} />
        <KpiTile
          label="Your bay"
          value={myBay ? myBay.id.toUpperCase() : '—'}
          hint={myBay ? `${myBay.loaded}/${myBay.capacity} loaded` : 'Not assigned'}
          icon={Warehouse}
        />
        <KpiTile
          label="Next stop"
          value={nextStop?.areaName ?? '—'}
          hint={nextStop ? `ETA ${nextStop.eta}` : undefined}
          icon={MapPin}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <Card>
          <CardHeader title="Shift & wave" />
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-text">{shift?.name ?? me.shift}</div>
                <div className="text-2xs text-muted">{shift?.window ?? ''}</div>
              </div>
              <StatusPill status="active" />
            </div>
            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="text-[13px] text-text-2">Current wave</span>
              <span className="text-sm font-semibold text-text">Wave {activeWave?.number ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-text-2">Vehicle</span>
              <span className="font-mono text-2xs text-text-2">{me.vehicleNo}</span>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Route summary"
            subtitle={myRoute?.name ?? 'No route assigned'}
            action={
              <Link
                to="/driver/route"
                className="inline-flex items-center gap-1 h-8 px-3 text-[13px] font-medium text-text-2 hover:text-text hover:bg-surface-2 rounded-[3px] border border-transparent"
              >
                Full route
                <ArrowRight size={14} />
              </Link>
            }
          />
          <div className="p-4">
            {myRoute ? (
              <RouteChain stops={myRoute.stops} />
            ) : (
              <p className="text-[13px] text-text-2">You have no route assigned for today.</p>
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Your deliveries"
          subtitle={`${remaining} of ${myProducts.length} still to deliver`}
          action={
            <Link
              to="/driver/deliveries"
              className="inline-flex items-center h-8 px-3 text-[13px] font-medium text-text bg-surface hover:bg-surface-2 rounded-[3px] border border-border"
            >
              Open deliveries
            </Link>
          }
        />
        <div className="p-4 space-y-2">
          {myProducts.slice(0, 5).map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-2xs text-text-2 tnum">{p.code}</span>
                <span className="text-[13px] text-text truncate">{p.name}</span>
              </div>
              <StatusPill status={p.status} />
            </div>
          ))}
          {myProducts.length === 0 && (
            <p className="text-[13px] text-text-2">No products assigned to you yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
