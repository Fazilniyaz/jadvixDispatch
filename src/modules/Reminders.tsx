import { Link } from 'react-router-dom';
import { Bell, Check } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { useScopedReminders } from '@/lib/scope';
import type { ReminderType } from '@/lib/types';

const TONE: Record<ReminderType, string> = {
  'leave-request': 'var(--out)',
  'missed-checkin': 'var(--exception)',
  query: 'var(--transit)',
  billing: 'var(--picked)',
  notice: 'var(--muted)',
};

export default function Reminders() {
  const labels = useStore((s) => s.moduleLabels);
  const markRead = useStore((s) => s.markReminderRead);
  const reminders = useScopedReminders();

  const unread = reminders.filter((r) => !r.read);
  const read = reminders.filter((r) => r.read);

  return (
    <div>
      <PageHeader
        title={labels.reminders}
        description="Leave requests, missed check-ins and anything else that needs attention."
      />

      {reminders.length === 0 ? (
        <Card className="p-10 text-center">
          <Bell size={20} className="mx-auto text-muted mb-2" />
          <p className="text-[13px] text-text-2">Nothing needs your attention right now.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
              <span className="text-sm font-semibold text-text">Unread</span>
              <span className="text-2xs text-muted tnum">{unread.length}</span>
            </div>
            <div className="divide-y divide-border">
              {unread.length === 0 && <p className="px-4 py-6 text-[13px] text-text-2">All caught up.</p>}
              {unread.map((r) => (
                <div key={r.id} className="flex items-start gap-3 px-4 py-3">
                  <span className="mt-1.5 h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: TONE[r.type] }} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-text">{r.title}</div>
                    <div className="text-2xs text-text-2 mt-0.5">{r.body}</div>
                    <div className="text-2xs text-muted mt-1 tnum">{new Date(r.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.link && (
                      <Link to={r.link} className="text-2xs font-medium text-accent hover:text-accent-hover">Open</Link>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => markRead(r.id)} aria-label="Mark read"><Check size={14} /></Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {read.length > 0 && (
            <Card>
              <div className="px-4 py-2.5 border-b border-border text-sm font-semibold text-text">Earlier</div>
              <div className="divide-y divide-border">
                {read.map((r) => (
                  <div key={r.id} className={cn('flex items-start gap-3 px-4 py-3 opacity-60')}>
                    <span className="mt-1.5 h-2 w-2 rounded-full shrink-0 bg-muted" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] text-text">{r.title}</div>
                      <div className="text-2xs text-text-2 mt-0.5">{r.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
