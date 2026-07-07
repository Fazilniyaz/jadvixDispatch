import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

// Panel / Card — a hairline-bordered surface. No large radius, no heavy shadow.
export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn('bg-surface border border-border rounded-[3px]', className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 px-4 py-3 border-b border-border',
        className
      )}
    >
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-text leading-tight">{title}</h3>
        {subtitle && <p className="text-[13px] text-text-2 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
