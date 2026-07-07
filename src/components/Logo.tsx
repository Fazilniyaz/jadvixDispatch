import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showProduct?: boolean;
}

// Jadvix wordmark + product name. A sharp, geometric mark — no rounded blob.
export function Logo({ className, showProduct = true }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="grid h-7 w-7 place-items-center bg-accent text-white font-bold text-sm rounded-[3px] leading-none">
        J
      </span>
      <div className="leading-tight">
        <span className="block text-sm font-semibold text-text tracking-tight">Jadvix Ltd</span>
        {showProduct && (
          <span className="block text-2xs text-muted tracking-wide">Jadvix Dispatch</span>
        )}
      </div>
    </div>
  );
}
