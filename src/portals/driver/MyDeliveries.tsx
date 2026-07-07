import { useState } from 'react';
import { AlertTriangle, Camera, Check, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/Button';
import { cn } from '@/lib/utils';
import { useCurrentEmployee, useStore } from '@/store/useStore';
import type { Product, ProductStatus } from '@/lib/types';

const FLOW: ProductStatus[] = ['picked', 'transit', 'out', 'delivered'];
const STEP_LABEL: Record<ProductStatus, string> = {
  scheduled: 'Scheduled',
  picked: 'Picked',
  transit: 'In transit',
  out: 'Out for delivery',
  delivered: 'Delivered',
  exception: 'Exception',
};

function nextStatus(current: ProductStatus): ProductStatus | null {
  if (current === 'scheduled') return 'picked';
  const i = FLOW.indexOf(current);
  if (i === -1 || i === FLOW.length - 1) return null;
  return FLOW[i + 1];
}

export default function MyDeliveries() {
  const me = useCurrentEmployee();
  const products = useStore((s) => s.products);
  const routes = useStore((s) => s.routes);
  const advance = useStore((s) => s.advanceProductStatus);
  const [pod, setPod] = useState<Record<string, boolean>>({});

  if (!me) return null;

  const routeName = (id: string | null) => routes.find((r) => r.id === id)?.name ?? '—';
  const myProducts = products.filter((p) => p.assignedEmployeeId === me.id);
  const active = myProducts.filter((p) => p.status !== 'delivered' && p.status !== 'exception');
  const done = myProducts.filter((p) => p.status === 'delivered' || p.status === 'exception');

  return (
    <div>
      <PageHeader
        title="My Deliveries"
        description="Advance each product through its delivery steps. Updates reflect on the admin board immediately."
      />

      <div className="flex items-center gap-4 mb-4 text-[13px]">
        <span className="text-text-2">
          <span className="font-semibold text-text tnum">{active.length}</span> in progress
        </span>
        <span className="text-text-2">
          <span className="font-semibold text-text tnum">{done.length}</span> completed
        </span>
      </div>

      <div className="space-y-3">
        {active.map((p) => (
          <DeliveryCard
            key={p.id}
            product={p}
            routeName={routeName(p.routeId)}
            onAdvance={advance}
            pod={!!pod[p.id]}
            onPod={() => setPod((s) => ({ ...s, [p.id]: !s[p.id] }))}
          />
        ))}
        {active.length === 0 && (
          <Card className="p-10 text-center text-[13px] text-text-2">
            All assigned products are completed. Nice work.
          </Card>
        )}
      </div>

      {done.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-text mt-8 mb-3">Completed today</h3>
          <div className="space-y-2">
            {done.map((p) => (
              <Card key={p.id} className="flex items-center justify-between gap-3 p-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-2xs text-text-2 tnum">{p.code}</span>
                  <span className="text-[13px] text-text truncate">{p.name}</span>
                </div>
                <StatusPill status={p.status} />
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DeliveryCard({
  product,
  routeName,
  onAdvance,
  pod,
  onPod,
}: {
  product: Product;
  routeName: string;
  onAdvance: (id: string, status: ProductStatus) => void;
  pod: boolean;
  onPod: () => void;
}) {
  const next = nextStatus(product.status);
  const currentIndex = FLOW.indexOf(product.status);

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xs text-text-2 tnum">{product.code}</span>
            <span className="text-text-2 text-2xs">· {product.type}</span>
          </div>
          <div className="text-sm font-semibold text-text mt-0.5">{product.name}</div>
          <div className="text-2xs text-muted mt-0.5">
            {routeName} · ETA {product.eta || '—'}
          </div>
        </div>
        <StatusPill status={product.status} />
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 mt-4">
        {FLOW.map((step, i) => {
          const reached = product.status !== 'exception' && currentIndex >= i;
          return (
            <div key={step} className="flex items-center gap-1 flex-1 last:flex-none">
              <div
                className={cn(
                  'flex items-center gap-1.5 text-2xs font-medium whitespace-nowrap',
                  reached ? 'text-text' : 'text-muted'
                )}
              >
                <span
                  className={cn(
                    'grid h-5 w-5 place-items-center rounded-[3px] border text-2xs',
                    reached ? 'bg-accent border-accent text-white' : 'bg-surface border-border'
                  )}
                >
                  {reached ? <Check size={12} /> : i + 1}
                </span>
                <span className="hidden sm:inline">{STEP_LABEL[step]}</span>
              </div>
              {i < FLOW.length - 1 && (
                <ChevronRight size={14} className="text-border shrink-0 hidden sm:block" />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border">
        {next && (
          <Button variant="primary" size="sm" onClick={() => onAdvance(product.id, next)}>
            Mark {STEP_LABEL[next].toLowerCase()}
          </Button>
        )}
        {product.status !== 'exception' && (
          <Button variant="danger" size="sm" onClick={() => onAdvance(product.id, 'exception')}>
            <AlertTriangle size={14} />
            Mark exception
          </Button>
        )}
        <button
          onClick={onPod}
          className={cn(
            'inline-flex items-center gap-1.5 h-8 px-3 text-[13px] font-medium rounded-[3px] border',
            pod
              ? 'border-delivered text-delivered'
              : 'border-border text-text-2 hover:bg-surface-2'
          )}
          style={pod ? { backgroundColor: 'color-mix(in srgb, var(--delivered) 12%, transparent)' } : undefined}
        >
          <Camera size={14} />
          {pod ? 'Proof captured' : 'Add proof of delivery'}
        </button>
      </div>
    </Card>
  );
}
