import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/Card';
import { StatusPill } from '@/components/StatusPill';
import { RouteChain } from '@/components/RouteChain';
import { useCurrentEmployee, useStore } from '@/store/useStore';

export default function MyRoute() {
  const me = useCurrentEmployee();
  const routes = useStore((s) => s.routes);

  if (!me) return null;

  const myLocations = routes
    .filter((r) => r.assignedDriverId === me.id)
    .sort((a, b) => a.order - b.order);

  return (
    <div>
      <PageHeader
        title="My Locations"
        description="Your delivery locations for the day, by area and coordinate. No map — follow the sequence."
      />

      {myLocations.length === 0 ? (
        <Card className="p-10 text-center text-[13px] text-text-2">
          No location is assigned to you today.
        </Card>
      ) : (
        <Card>
          <CardHeader
            title="Assigned locations"
            subtitle={`${myLocations.length} location${myLocations.length === 1 ? '' : 's'}`}
          />
          <div className="p-4">
            <RouteChain stops={myLocations} />
          </div>
          <div className="border-t border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-medium text-muted text-2xs uppercase tracking-wide px-4 py-2 w-10">
                    #
                  </th>
                  <th className="text-left font-medium text-muted text-2xs uppercase tracking-wide px-4 py-2">
                    Location
                  </th>
                  <th className="text-left font-medium text-muted text-2xs uppercase tracking-wide px-4 py-2">
                    Coordinates
                  </th>
                  <th className="text-left font-medium text-muted text-2xs uppercase tracking-wide px-4 py-2">
                    ETA
                  </th>
                  <th className="text-right font-medium text-muted text-2xs uppercase tracking-wide px-4 py-2">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {myLocations.map((r, i) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 font-mono text-2xs text-muted tnum">
                      {String(i + 1).padStart(2, '0')}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="text-text font-medium">{r.name}</div>
                      <div className="text-2xs text-muted">{r.areaName}</div>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-2xs text-text-2 tnum">
                      {r.coordinates || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-text-2 tnum">{r.eta || '—'}</td>
                    <td className="px-4 py-2.5 text-right">
                      <StatusPill status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
