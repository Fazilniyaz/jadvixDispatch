import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Field';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

interface ChatPanelProps {
  side: 'dispatch' | 'driver';
  authorId: string;
  title?: string;
}

// One shared channel. Messages from either side appear on both.
// A short canned auto-reply from the other side simulates realtime.
const AUTO_REPLIES: Record<'dispatch' | 'driver', string[]> = {
  driver: ['Copy that.', 'On it now.', 'Understood, thanks.', 'Rolling to the next stop.'],
  dispatch: ['Noted, thanks.', 'Go ahead.', 'Confirmed from dispatch.', 'Keep us posted.'],
};

export function ChatPanel({ side, authorId, title = 'Live channel' }: ChatPanelProps) {
  const messages = useStore((s) => s.messages);
  const employees = useStore((s) => s.employees);
  const sendMessage = useStore((s) => s.sendMessage);
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const authorName = (m: (typeof messages)[number]) => {
    if (m.from === 'dispatch') return employees.find((e) => e.id === m.authorId)?.name ?? 'Dispatch';
    return employees.find((e) => e.id === m.authorId)?.name ?? 'Driver';
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const onSend = (e: FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    sendMessage(side, authorId, value);
    setText('');
    const other = side === 'dispatch' ? 'driver' : 'dispatch';
    const pool = AUTO_REPLIES[other];
    const reply = pool[Math.floor(Math.random() * pool.length)];
    const otherAuthor =
      other === 'driver' ? 'emp-01' : employees.find((e) => e.role === 'dispatcher')?.id ?? 'emp-06';
    window.setTimeout(() => sendMessage(other, otherAuthor, reply), 1400);
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-13rem)] min-h-[420px]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-delivered" />
          <span className="text-sm font-semibold text-text">{title}</span>
        </div>
        <span className="text-2xs text-muted">Dispatch ↔ Drivers</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m) => {
          const mine = m.from === side;
          return (
            <div key={m.id} className={cn('flex flex-col max-w-[80%]', mine ? 'ml-auto items-end' : 'items-start')}>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-2xs font-medium text-text-2">{authorName(m)}</span>
                <span className="text-2xs text-muted tnum">{m.time}</span>
              </div>
              <div
                className={cn(
                  'text-[13px] px-3 py-2 rounded-[3px] border',
                  mine
                    ? 'bg-accent text-white border-accent'
                    : 'bg-surface-2 text-text border-border'
                )}
              >
                {m.text}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={onSend} className="flex items-center gap-2 p-3 border-t border-border">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={side === 'dispatch' ? 'Message drivers…' : 'Message dispatch…'}
          aria-label="Message"
        />
        <Button type="submit" variant="primary" disabled={!text.trim()} aria-label="Send">
          <Send size={16} />
        </Button>
      </form>
    </Card>
  );
}
