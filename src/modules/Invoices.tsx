import { useState } from 'react';
import { Download, ReceiptText } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/Card';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusPill } from '@/components/StatusPill';
import { KpiTile } from '@/components/KpiTile';
import { Button } from '@/components/Button';
import { Select } from '@/components/Field';
import { useStore, currentPeriod } from '@/store/useStore';
import { money } from '@/lib/scope';
import { exportRows } from '@/lib/exporters';
import type { Invoice } from '@/lib/types';

const TONE: Record<Invoice['status'], string> = { draft: 'pending', sent: 'planned', paid: 'delivered', overdue: 'exception' };

export default function Invoices() {
  const companies = useStore((s) => s.companies);
  const invoices = useStore((s) => s.invoices);
  const generateInvoice = useStore((s) => s.generateInvoice);
  const updateInvoice = useStore((s) => s.updateInvoice);

  const [companyId, setCompanyId] = useState(companies[0]?.id ?? '');
  const [period, setPeriod] = useState(currentPeriod());
  const [expanded, setExpanded] = useState<string | null>(null);

  const coName = (id: string) => companies.find((c) => c.id === id)?.name ?? id;
  const outstanding = invoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + i.total, 0);
  const collected = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0);

  const cols: Column<Invoice>[] = [
    { key: 'co', header: 'Company', render: (i) => <span className="font-medium text-text">{coName(i.companyId)}</span> },
    { key: 'period', header: 'Period', render: (i) => <span className="text-text-2 tnum">{i.period}</span> },
    { key: 'lines', header: 'Lines', headerClassName: 'text-right', className: 'text-right', render: (i) => <span className="tnum text-text-2">{i.lines.length}</span> },
    { key: 'total', header: 'Total', headerClassName: 'text-right', className: 'text-right', render: (i) => <span className="tnum font-semibold text-text">{money(i.total)}</span> },
    { key: 'status', header: 'Status', render: (i) => <StatusPill status={TONE[i.status]} label={i.status} /> },
    { key: 'actions', header: '', headerClassName: 'text-right', className: 'text-right', render: (i) => (
      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
        {i.status === 'draft' && <Button size="sm" variant="secondary" onClick={() => updateInvoice(i.id, { status: 'sent' })}>Send</Button>}
        {i.status === 'sent' && <Button size="sm" variant="primary" onClick={() => updateInvoice(i.id, { status: 'paid' })}>Mark paid</Button>}
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader
        title="Invoices"
        eyebrow="Jadvix · internal"
        description="Metered monthly billing — setup fee, per hub and per employee, with leaver proration."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="w-48">
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)}
              className="h-9 bg-surface border border-border rounded-[3px] px-2 text-[13px] tnum focus:border-accent focus:outline-none" />
            <Button variant="primary" onClick={() => companyId && generateInvoice(companyId, period)}>
              <ReceiptText size={15} />Generate
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <KpiTile label="Outstanding" value={money(outstanding)} icon={ReceiptText} accent />
        <KpiTile label="Collected" value={money(collected)} icon={ReceiptText} />
        <KpiTile label="Invoices" value={invoices.length} icon={ReceiptText} />
      </div>

      <Card>
        <CardHeader title="All invoices" subtitle="Click a row to see the breakdown" />
        <DataTable
          columns={cols}
          rows={invoices}
          rowKey={(i) => i.id}
          onRowClick={(i) => setExpanded(expanded === i.id ? null : i.id)}
          expandedKey={expanded}
          renderExpanded={(i) => (
            <div className="px-4 py-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Item', 'Qty', 'Unit', 'Amount'].map((h) => (
                      <th key={h} className="text-left font-mono text-2xs uppercase tracking-wide text-muted px-2 py-1.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {i.lines.map((l, n) => (
                    <tr key={n} className="border-b border-border last:border-0">
                      <td className="px-2 py-1.5 text-text-2">{l.label}</td>
                      <td className="px-2 py-1.5 tnum text-text-2">{l.qty}</td>
                      <td className="px-2 py-1.5 tnum text-text-2">{money(l.unit)}</td>
                      <td className="px-2 py-1.5 tnum text-text font-medium">{money(l.amount)}</td>
                    </tr>
                  ))}
                  <tr><td colSpan={3} className="px-2 py-2 text-right text-2xs uppercase tracking-wide text-muted">Total</td>
                    <td className="px-2 py-2 tnum font-semibold text-text">{money(i.total)}</td></tr>
                </tbody>
              </table>
              <div className="flex items-center gap-1.5 mt-3 text-2xs text-muted">
                <Download size={13} />
                {(['csv', 'pdf', 'word'] as const).map((f) => (
                  <button key={f} onClick={() => exportRows(`invoice-${coName(i.companyId)}-${i.period}`, i.lines as unknown as Record<string, string | number>[], f)}
                    className="uppercase tracking-wide border border-border rounded-[3px] px-2 py-1 text-text-2 hover:bg-surface-2">{f}</button>
                ))}
              </div>
            </div>
          )}
          empty="No invoices yet — generate one above."
        />
      </Card>
    </div>
  );
}
