import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Send, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Field';
import { cn } from '@/lib/utils';
import { useStore, useCurrentEmployee } from '@/store/useStore';
import { HUB_AUTHORITY_ROLES, ROLE_LABELS, type Role } from '@/lib/types';

/** Authorities are addressed per hub, so a message reaches *that* hub's manager. */
const authorityId = (hubId: string, role: Role) => `${hubId}:${role}`;

interface Contact {
  id: string;
  label: string;
  sub?: string;
  hubId: string;
}

export default function Communication() {
  const user = useStore((s) => s.user);
  const labels = useStore((s) => s.moduleLabels);
  const hubs = useStore((s) => s.hubs);
  const employees = useStore((s) => s.employees);
  const credentials = useStore((s) => s.credentials);
  const messages = useStore((s) => s.messages);
  const sendMessage = useStore((s) => s.sendMessage);
  const me = useCurrentEmployee();

  const isDriver = user?.role === 'driver';
  const isSuper = user?.role === 'super-admin';

  /** Who *I* am on the wire. */
  const myId = isDriver
    ? me?.id ?? ''
    : isSuper
      ? 'super-admin'
      : authorityId(user?.hubId ?? '', user?.role ?? 'hub-manager');

  const contacts: Contact[] = useMemo(() => {
    if (!user) return [];
    const companyHubs = hubs.filter((h) => h.companyId === user.companyId);

    // Driver → only the roles Super Admin approved for them, at their own hub.
    if (isDriver) {
      const hubId = me?.hubId ?? '';
      return (me?.canMessage ?? []).map((r) => ({
        id: authorityId(hubId, r),
        label: ROLE_LABELS[r],
        sub: hubs.find((h) => h.id === hubId)?.name,
        hubId,
      }));
    }

    // Super Admin → every hub's authorities, plus every driver, across all hubs.
    if (isSuper) {
      const authorities: Contact[] = [];
      companyHubs.forEach((h) => {
        HUB_AUTHORITY_ROLES.forEach((r) => {
          const hasLogin = credentials.some((c) => c.hubId === h.id && c.role === r);
          if (hasLogin) {
            authorities.push({ id: authorityId(h.id, r), label: ROLE_LABELS[r], sub: h.name, hubId: h.id });
          }
        });
      });
      const drivers: Contact[] = employees
        .filter((e) => e.role === 'driver' && companyHubs.some((h) => h.id === e.hubId))
        .map((e) => ({
          id: e.id,
          label: e.name,
          sub: hubs.find((h) => h.id === e.hubId)?.name,
          hubId: e.hubId,
        }));
      return [...authorities, ...drivers];
    }

    // Hub authority → their own hub's drivers, their fellow authorities, and Super Admin.
    const hubId = user.hubId ?? '';
    const hub = hubs.find((h) => h.id === hubId);
    const peers: Contact[] = HUB_AUTHORITY_ROLES.filter((r) => r !== user.role)
      .filter((r) => credentials.some((c) => c.hubId === hubId && c.role === r))
      .map((r) => ({ id: authorityId(hubId, r), label: ROLE_LABELS[r], sub: hub?.name, hubId }));
    const drivers: Contact[] = employees
      .filter((e) => e.role === 'driver' && e.hubId === hubId)
      .map((e) => ({ id: e.id, label: e.name, sub: 'Driver', hubId }));
    return [
      { id: 'super-admin', label: ROLE_LABELS['super-admin'], sub: 'Head office', hubId },
      ...peers,
      ...drivers,
    ];
  }, [user, isDriver, isSuper, me, hubs, employees, credentials]);

  const [peer, setPeer] = useState<string>('');
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contacts.length && !contacts.some((c) => c.id === peer)) setPeer(contacts[0].id);
  }, [contacts, peer]);

  const peerContact = contacts.find((c) => c.id === peer);

  // Threads are matched by participants, so cross-hub conversations work.
  const thread = messages.filter(
    (m) => (m.fromId === myId && m.toId === peer) || (m.fromId === peer && m.toId === myId)
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [thread.length, peer]);

  const nameOf = (id: string) => {
    if (id === myId) return 'You';
    const c = contacts.find((x) => x.id === id);
    if (c) return c.label;
    const emp = employees.find((e) => e.id === id);
    if (emp) return emp.name;
    const role = id.includes(':') ? (id.split(':')[1] as Role) : (id as Role);
    return ROLE_LABELS[role] ?? id;
  };

  const onSend = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user || !peerContact) return;
    sendMessage({
      hubId: peerContact.hubId,
      fromId: myId,
      fromRole: user.role,
      toId: peer,
      text: text.trim(),
    });
    setText('');
  };

  return (
    <div>
      <PageHeader
        title={labels.communication}
        description={
          isDriver
            ? 'You can only message the people your hub has approved.'
            : isSuper
              ? 'Reach any hub’s manager, team leader or HR & finance — and any driver.'
              : 'Message your hub’s drivers, your fellow authorities, or head office.'
        }
      />

      {contacts.length === 0 ? (
        <Card className="p-10 text-center">
          <ShieldAlert size={20} className="mx-auto text-muted mb-2" />
          <p className="text-[13px] text-text-2">
            You haven’t been granted permission to message anyone. Ask your Super Admin.
          </p>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-[260px_1fr] gap-4">
          <Card className="overflow-hidden">
            <div className="px-3 py-2 border-b border-border text-2xs uppercase tracking-wide text-muted">
              Contacts ({contacts.length})
            </div>
            <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
              {contacts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setPeer(c.id)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 hover:bg-surface-2',
                    peer === c.id && 'bg-surface-2'
                  )}
                >
                  <div className={cn('text-[13px] truncate', peer === c.id ? 'text-text font-medium' : 'text-text-2')}>
                    {c.label}
                  </div>
                  {c.sub && <div className="text-2xs text-muted truncate">{c.sub}</div>}
                </button>
              ))}
            </div>
          </Card>

          <Card className="flex flex-col h-[calc(100vh-16rem)] min-h-[380px]">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <span className="h-2 w-2 rounded-full bg-delivered" />
              <span className="text-sm font-semibold text-text">{peerContact?.label ?? '—'}</span>
              {peerContact?.sub && <span className="text-2xs text-muted">· {peerContact.sub}</span>}
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {thread.length === 0 && <p className="text-[13px] text-text-2">No messages yet — say hello.</p>}
              {thread.map((m) => {
                const mine = m.fromId === myId;
                return (
                  <div key={m.id} className={cn('flex flex-col max-w-[80%]', mine ? 'ml-auto items-end' : 'items-start')}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-2xs font-medium text-text-2">{nameOf(m.fromId)}</span>
                      <span className="text-2xs text-muted tnum">{m.time}</span>
                    </div>
                    <div
                      className={cn(
                        'text-[13px] px-3 py-2 rounded-[3px] border',
                        mine ? 'bg-accent text-white border-accent' : 'bg-surface-2 text-text border-border'
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
                placeholder={`Message ${peerContact?.label ?? ''}…`}
                aria-label="Message"
              />
              <Button type="submit" variant="primary" disabled={!text.trim()} aria-label="Send">
                <Send size={16} />
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
