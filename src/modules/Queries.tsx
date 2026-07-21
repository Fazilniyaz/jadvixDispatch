import { useState } from 'react';
import { EyeOff, Plus, Siren } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusPill } from '@/components/StatusPill';
import { KpiTile } from '@/components/KpiTile';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Field, Input, Select, Textarea } from '@/components/Field';
import { useStore, useCurrentEmployee } from '@/store/useStore';
import { useScopedEmployees, useScopedQueries } from '@/lib/scope';
import type { QueryStatus, QueryTicket, QueryType } from '@/lib/types';

const TYPES: { value: QueryType; label: string }[] = [
  { value: 'delivery-error', label: 'Delivery error' },
  { value: 'accident', label: 'Accident' },
  { value: 'salary-mismatch', label: 'Salary mismatch' },
  { value: 'fraud', label: 'Suspected fraud' },
  { value: 'other', label: 'Other' },
];
const STATUSES: QueryStatus[] = ['open', 'investigating', 'resolved', 'dismissed'];
const TONE: Record<QueryStatus, string> = { open: 'pending', investigating: 'planned', resolved: 'delivered', dismissed: 'idle' };

export default function Queries() {
  const user = useStore((s) => s.user);
  const hubId = useStore((s) => s.activeHubId);
  const labels = useStore((s) => s.moduleLabels);
  const addQuery = useStore((s) => s.addQuery);
  const updateQuery = useStore((s) => s.updateQuery);
  const me = useCurrentEmployee();
  const employees = useScopedEmployees();
  const queries = useScopedQueries();

  const isDriver = user?.role === 'driver';
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: 'delivery-error' as QueryType, subject: '', body: '', offenderEmployeeId: '' });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [resp, setResp] = useState<Record<string, string>>({});

  const errorCount = queries.filter((q) => q.type === 'delivery-error').length;
  const openCount = queries.filter((q) => q.status === 'open' || q.status === 'investigating').length;

  /** Drivers see the error count, but only their OWN name — never a colleague's. */
  const offenderLabel = (q: QueryTicket) => {
    if (!q.offenderEmployeeId) return '—';
    const name = employees.find((e) => e.id === q.offenderEmployeeId)?.name ?? 'Unknown';
    if (!isDriver) return name;
    return q.offenderEmployeeId === me?.id ? `${name} (you)` : 'Hidden';
  };

  const submit = () => {
    if (!hubId || !user || !form.subject.trim()) return;
    addQuery({
      hubId, type: form.type, subject: form.subject.trim(), body: form.body.trim(),
      raisedById: isDriver ? me?.id ?? '' : user.role,
      raisedByRole: user.role,
      offenderEmployeeId: isDriver ? null : form.offenderEmployeeId || null,
    });
    setForm({ type: 'delivery-error', subject: '', body: '', offenderEmployeeId: '' });
    setOpen(false);
  };

  const cols: Column<QueryTicket>[] = [
    { key: 'type', header: 'Type', render: (q) => <span className="text-text-2 capitalize">{q.type.replace('-', ' ')}</span> },
    { key: 'subject', header: 'Subject', render: (q) => <span className="text-[13px] font-medium text-text">{q.subject}</span> },
    { key: 'who', header: 'Concerning', render: (q) => (
      <span className={q.offenderEmployeeId && isDriver && q.offenderEmployeeId !== me?.id ? 'text-muted inline-flex items-center gap-1' : 'text-text-2'}>
        {q.offenderEmployeeId && isDriver && q.offenderEmployeeId !== me?.id && <EyeOff size={12} />}
        {offenderLabel(q)}
      </span>
    ) },
    { key: 'status', header: 'Status', render: (q) => <StatusPill status={TONE[q.status]} label={q.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title={labels.queries}
        description="Accidents, salary mismatches, delivery errors and suspected fraud — logged and tracked."
        action={<Button variant="primary" onClick={() => setOpen(true)}><Plus size={16} />Raise query</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <KpiTile label="Delivery errors" value={errorCount} icon={Siren} accent />
        <KpiTile label="Open / investigating" value={openCount} icon={Siren} />
        <KpiTile label="Total queries" value={queries.length} icon={Siren} />
      </div>

      {isDriver && (
        <p className="mb-3 text-2xs text-muted inline-flex items-center gap-1.5">
          <EyeOff size={12} /> Error counts are visible to everyone, but colleagues’ names are hidden.
        </p>
      )}

      <Card>
        <DataTable
          columns={cols}
          rows={queries}
          rowKey={(q) => q.id}
          onRowClick={(q) => setExpanded(expanded === q.id ? null : q.id)}
          expandedKey={expanded}
          renderExpanded={(q) => (
            <div className="px-4 py-4 space-y-3">
              <p className="text-[13px] text-text bg-surface p-3 rounded-[3px] border border-border">{q.body || 'No detail provided.'}</p>
              {q.response && <p className="text-[13px] text-text-2"><b className="text-text">Response:</b> {q.response}</p>}
              {!isDriver && (
                <div className="space-y-2">
                  <Textarea placeholder="Add a response…" value={resp[q.id] ?? q.response}
                    onChange={(e) => setResp((r) => ({ ...r, [q.id]: e.target.value }))} />
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={q.status} onChange={(e) => updateQuery(q.id, { status: e.target.value as QueryStatus })} className="w-40">
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </Select>
                    <Button size="sm" variant="primary" onClick={() => updateQuery(q.id, { response: resp[q.id] ?? q.response })}>Save response</Button>
                  </div>
                </div>
              )}
            </div>
          )}
          empty="No queries raised."
        />
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Raise a query"
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={!form.subject.trim()}>Submit</Button></>}>
        <div className="space-y-4">
          <Field label="Type">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as QueryType })}>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </Field>
          <Field label="Subject"><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field>
          <Field label="Detail"><Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></Field>
          {!isDriver && (
            <Field label="Concerning employee" hint="Their name stays hidden from other drivers">
              <Select value={form.offenderEmployeeId} onChange={(e) => setForm({ ...form, offenderEmployeeId: e.target.value })}>
                <option value="">Not about a specific person</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </Select>
            </Field>
          )}
        </div>
      </Modal>
    </div>
  );
}
