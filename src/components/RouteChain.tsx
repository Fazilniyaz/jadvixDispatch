import { ArrowRight, MapPin } from 'lucide-react';
import type { RouteStop } from '@/lib/types';

interface RouteChainProps {
  stops: RouteStop[];
}

// Horizontal, numbered ordered stop chain. Text-based (no map).
// Wraps on narrow screens; scrolls horizontally when needed.
export function RouteChain({ stops }: RouteChainProps) {
  return (
    <div className="overflow-x-auto">
      <ol className="flex items-stretch gap-0 min-w-max">
        {stops.map((stop, i) => (
          <li key={i} className="flex items-stretch">
            <div className="flex flex-col gap-1 border border-border rounded-[3px] bg-surface-2 px-3 py-2 w-44">
              <div className="flex items-center gap-2">
                <span className="grid h-5 w-5 shrink-0 place-items-center bg-surface border border-border rounded-[3px] text-2xs font-semibold text-text-2 tnum">
                  {i + 1}
                </span>
                <span className="flex items-center gap-1 text-[13px] font-medium text-text truncate">
                  <MapPin size={12} className="text-muted shrink-0" />
                  {stop.areaName}
                </span>
              </div>
              <span className="font-mono text-2xs text-text-2 tnum pl-7">{stop.coordinates}</span>
              <span className="text-2xs text-muted pl-7">ETA {stop.eta}</span>
            </div>
            {i < stops.length - 1 && (
              <div className="flex items-center px-1 text-muted">
                <ArrowRight size={14} />
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
