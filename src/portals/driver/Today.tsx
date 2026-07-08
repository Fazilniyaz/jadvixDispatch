import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Hash, MapPin, Warehouse } from 'lucide-react';
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


  if (!me) return null;

  const myProducts = products.filter((p) => p.assignedEmployeeId === me.id);
  const remaining = myProducts.filter((p) => p.status !== 'delivered').length;
  const myBay = bays.find((b) => b.assignedDriverId === me.id);
  const myLocations = routes
    .filter((r) => r.assignedDriverId === me.id)
    .sort((a, b) => a.order - b.order);
  const shift = shifts.find((s) => s.name === me.shift);


  // Current shift index to display wave/shift number
  const shiftIndex = shifts.findIndex((s) => s.name === me.shift);
  const waveNumber = shiftIndex >= 0 ? shiftIndex + 1 : 1;

  // Single delivery stop (since there's only one stop per driver)
  const deliveryStop = myLocations[0];

  return (
    <div>
      <PageHeader
        title={`Good day, ${me.name.split(' ')[0]}`}
        description="Your shift at a glance — everything you need for the day."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile
          label="Shift timing"
          value={shift?.window ?? '—'}
          hint={shift?.name ?? me.shift}
          icon={Clock}
          accent
        />
        <KpiTile
          label="Wave / Shift"
          value={`#${waveNumber}`}
          hint={`${shift?.name ?? me.shift} shift`}
          icon={Hash}
        />
        <KpiTile
          label="Your bay"
          value={myBay ? myBay.id.toUpperCase() : '—'}
          hint={myBay ? `${myBay.stocks} stocks` : 'Not assigned'}
          icon={Warehouse}
        />
        <KpiTile
          label="Delivery stop"
          value={deliveryStop?.areaName ?? '—'}
          hint={deliveryStop ? `ETA ${deliveryStop.eta}` : 'No stop assigned'}
          icon={MapPin}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <Card>
          <CardHeader title="Shift" />
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-text">{shift?.name ?? me.shift}</div>
                <div className="text-2xs text-muted">{shift?.window ?? ''}</div>
              </div>
              <StatusPill status={shift?.status ?? 'pending'} />
            </div>
            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="text-[13px] text-text-2">Vehicle</span>
              <span className="font-mono text-2xs text-text-2">{me.vehicleNo}</span>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Your locations"
            subtitle={myLocations.length ? `${myLocations.length} locations` : 'No locations assigned'}
            action={
              <Link
                to="/driver/route"
                className="inline-flex items-center gap-1 h-8 px-3 text-[13px] font-medium text-text-2 hover:text-text hover:bg-surface-2 rounded-[3px] border border-transparent"
              >
                All locations
                <ArrowRight size={14} />
              </Link>
            }
          />
          <div className="p-4">
            {myLocations.length ? (
              <RouteChain stops={myLocations} />
            ) : (
              <p className="text-[13px] text-text-2">You have no locations assigned for today.</p>
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
              to="/driver/performance"
              className="inline-flex items-center h-8 px-3 text-[13px] font-medium text-text bg-surface hover:bg-surface-2 rounded-[3px] border border-border"
            >
              Open performance
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
