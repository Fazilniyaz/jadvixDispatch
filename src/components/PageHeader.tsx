import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  eyebrow?: ReactNode;
}

export function PageHeader({ title, description, action, eyebrow }: PageHeaderProps) {
  return (
    <div className="mb-6 pb-5 border-b border-border">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <div className="font-mono text-2xs uppercase tracking-[0.18em] text-muted mb-2">
              {eyebrow}
            </div>
          )}
          <h2 className="font-display text-[1.75rem] leading-tight font-semibold tracking-tight text-text">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-text-2 mt-2 max-w-2xl leading-relaxed">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
