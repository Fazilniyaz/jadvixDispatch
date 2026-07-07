import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/Card';
import { StatusPill } from '@/components/StatusPill';
import { RouteChain } from '@/components/RouteChain';
import { useCurrentEmployee, useStore } from '@/store/useStore';

export default function MyRoute() {
  const me = useCurrentEmployee();
  const routes = useStore((s) => s.routes);

  if (!me) return null;

  const myRoutes = routes.filter((r) => r.assignedDriverId === me.id).sort((a, b) => a.order - b.order);

  return (
    <div>
      <PageHeader
        title="My Route"
        description="Your ordered stops for the day, by area and coordinate. No map — follow the sequence."
      />

      {myRoutes.length === 0 ? (
        <Card className="p-10 text-center text-[13px] text-text-2">
          No route is assigned to you today.
        </Card>
      ) : (
        <div className="space-y-4">
          {myRoutes.map((r) => (
            <Card key={r.id}>
              <CardHeader
                title={r.name}
                subtitle={`${r.stops.length} stops`}
                action={<StatusPill status={r.status} />}
              />
              <div className="p-4">
                <RouteChain stops={r.stops} />
              </div>
              <div className="border-t border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left font-medium text-muted text-2xs uppercase tracking-wide px-4 py-2 w-10">
                        #
                      </th>
                      <th className="text-left font-medium text-muted text-2xs uppercase tracking-wide px-4 py-2">
                        Area
                      </th>
                      <th className="text-left font-medium text-muted text-2xs uppercase tracking-wide px-4 py-2">
                        Coordinates
                      </th>
                      <th className="text-right font-medium text-muted text-2xs uppercase tracking-wide px-4 py-2">
                        ETA
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.stops.map((s, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-4 py-2.5 font-mono text-2xs text-muted tnum">
                          {String(i + 1).padStart(2, '0')}
                        </td>
                        <td className="px-4 py-2.5 text-text font-medium">{s.areaName}</td>
                        <td className="px-4 py-2.5 font-mono text-2xs text-text-2 tnum">
                          {s.coordinates}
                        </td>
                        <td className="px-4 py-2.5 text-right text-text-2 tnum">{s.eta}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
