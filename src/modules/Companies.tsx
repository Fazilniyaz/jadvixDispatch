import { useState } from 'react';
import { KeyRound, Pencil, Plus, ReceiptText, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Field, Input, Select } from '@/components/Field';
import { useStore, currentPeriod } from '@/store/useStore';
import { money } from '@/lib/scope';
import type { Company } from '@/lib/types';

/**
 * What a company owes Jadvix this month: setup fee + per hub + per employee,
 * with the leaver rule (≤14 days worked = half rate).
 */
function billingFor(
  co: Company,
  hubCount: number,
  staff: { joinedAt: string; resignedAt?: string }[]
) {
  let full = 0;
  let half = 0;
  staff.forEach((e) => {
    if (!e.resignedAt) return full++;
    const days = Math.round((new Date(e.resignedAt).getTime() - new Date(e.joinedAt).getTime()) / 86400000);
    if (days <= 14) half++;
    else full++;
  });
  const hubs = hubCount * co.perHubFee;
  const employees = full * co.perEmployeeFee + (half * co.perEmployeeFee) / 2;
  return { hubs, employees, full, half, total: co.setupFee + hubs + employees };
}

type Form = Omit<Company, 'id' | 'createdAt'> & { adminEmail: string; adminPassword: string };
const empty = (): Form => ({
  name: '', code: '', contactEmail: '', city: '', status: 'active',
  setupFee: 15000, perHubFee: 8000, perEmployeeFee: 350,
  adminEmail: '', adminPassword: '',
});

export default function Companies() {
  const companies = useStore((s) => s.companies);
  const hubs = useStore((s) => s.hubs);
  const employees = useStore((s) => s.employees);
  const credentials = useStore((s) => s.credentials);
  const addCompany = useStore((s) => s.addCompany);
  const updateCompany = useStore((s) => s.updateCompany);
  const deleteCompany = useStore((s) => s.deleteCompany);
  const addCredential = useStore((s) => s.addCredential);
  const invoices = useStore((s) => s.invoices);
  const generateInvoice = useStore((s) => s.generateInvoice);

  const period = currentPeriod();
  const hubsOf = (id: string) => hubs.filter((h) => h.companyId === id);
  const staffOf = (id: string) => {
    const ids = hubsOf(id).map((h) => h.id);
    return employees.filter((e) => ids.includes(e.hubId));
  };

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState<Form>(empty());
  const [confirm, setConfirm] = useState<Company | null>(null);

  const save = () => {
    if (!form.name.trim()) return;
    const { adminEmail, adminPassword, ...co } = form;
    if (editing) {
      updateCompany(editing.id, co);
    } else {
      addCompany(co);
      // Issue the Super Admin login straight away.
      const created = useStore.getState().companies.slice(-1)[0];
      if (created && adminEmail.trim() && adminPassword) {
        addCredential({
          role: 'super-admin', companyId: created.id, hubId: null, employeeId: null,
          email: adminEmail.trim(), password: adminPassword, hubCode: '',
        });
      }
    }
    setOpen(false); setEditing(null);
  };

  const cols: Column<Company>[] = [
    { key: 'name', header: 'Company', render: (c) => <span className="font-medium text-text">{c.name}</span> },
    { key: 'code', header: 'Code', render: (c) => <span className="font-mono text-2xs text-text-2">{c.code}</span> },
    { key: 'city', header: 'City', render: (c) => <span className="text-text-2">{c.city}</span> },
    { key: 'hubs', header: 'Hubs', headerClassName: 'text-right', className: 'text-right', render: (c) => <span className="tnum text-text font-medium">{hubsOf(c.id).length}</span> },
    { key: 'staff', header: 'Employees', headerClassName: 'text-right', className: 'text-right', render: (c) => {
      const s = staffOf(c.id);
      const leavers = s.filter((e) => e.resignedAt).length;
      return (
        <span className="tnum text-text font-medium">
          {s.length}
          {leavers > 0 && <span className="text-2xs text-muted font-normal"> ({leavers} left)</span>}
        </span>
      );
    } },
    { key: 'amount', header: 'Monthly due', headerClassName: 'text-right', className: 'text-right', render: (c) => {
      const b = billingFor(c, hubsOf(c.id).length, staffOf(c.id));
      return (
        <div>
          <div className="tnum font-semibold text-text">{money(b.total)}</div>
          <div className="text-2xs text-muted tnum">
            {money(c.setupFee)} + {hubsOf(c.id).length}×hub + {b.full}
            {b.half ? `+${b.half}½` : ''}×emp
          </div>
        </div>
      );
    } },
    { key: 'admin', header: 'Super Admin', render: (c) => {
      const cr = credentials.find((x) => x.companyId === c.id && x.role === 'super-admin');
      return cr ? <span className="inline-flex items-center gap-1 text-2xs text-text-2"><KeyRound size={11} className="text-muted" />{cr.email}</span> : <span className="text-2xs text-muted">—</span>;
    } },
    { key: 'status', header: 'Status', render: (c) => {
      const inv = invoices.find((i) => i.companyId === c.id && i.period === period);
      return inv ? <StatusPill status={inv.status === 'paid' ? 'delivered' : inv.status === 'overdue' ? 'exception' : 'planned'} label={`Invoice ${inv.status}`} />
        : <StatusPill status="pending" label="Not invoiced" />;
    } },
    { key: 'actions', header: '', headerClassName: 'text-right', className: 'text-right', render: (c) => {
      const inv = invoices.find((i) => i.companyId === c.id && i.period === period);
      return (
        <div className="flex items-center justify-end gap-1.5">
          <Button size="sm" variant={inv ? 'ghost' : 'secondary'} onClick={() => generateInvoice(c.id, period)}>
            <ReceiptText size={13} />{inv ? 'Re-issue' : 'Invoice'}
          </Button>
          <button onClick={() => { setEditing(c); setForm({ ...c, adminEmail: '', adminPassword: '' }); setOpen(true); }} aria-label="Edit" className="text-muted hover:text-text p-1.5 rounded-[3px] hover:bg-surface-2"><Pencil size={15} /></button>
          <button onClick={() => setConfirm(c)} aria-label="Delete" className="text-muted hover:text-exception p-1.5 rounded-[3px] hover:bg-surface-2"><Trash2 size={15} /></button>
        </div>
      );
    } },
  ];

  const grandTotal = companies.reduce(
    (sum, c) => sum + billingFor(c, hubsOf(c.id).length, staffOf(c.id)).total,
    0
  );

  return (
    <div>
      <PageHeader
        title="Companies"
        eyebrow="Jadvix · internal"
        description="Every client on the platform, what they run, and their commercial terms."
        action={<Button variant="primary" onClick={() => { setEditing(null); setForm(empty()); setOpen(true); }}><Plus size={16} />New company</Button>}
      />
      <Card>
        <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 border-b border-border">
          <span className="text-2xs uppercase tracking-wide text-muted">Billing period</span>
          <span className="font-mono text-[13px] text-text tnum">{period}</span>
          <span className="ml-auto text-2xs text-muted">Total billable this month</span>
          <span className="font-display text-lg font-semibold text-accent tnum">{money(grandTotal)}</span>
        </div>
        <DataTable columns={cols} rows={companies} rowKey={(c) => c.id} empty="No companies yet." />
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit ${editing.name}` : 'Onboard a company'}
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={!form.name.trim()}>{editing ? 'Save changes' : 'Create company'}</Button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Company name" className="sm:col-span-2"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Code"><Input className="font-mono" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></Field>
            <Field label="City"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
            <Field label="Contact email" className="sm:col-span-2"><Input type="email" className="font-mono" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} /></Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Company['status'] })}>
                <option value="active">Active</option><option value="suspended">Suspended</option>
              </Select>
            </Field>
          </div>
          <div className="border border-border rounded-[3px] bg-surface-2 p-3">
            <h4 className="text-2xs uppercase tracking-wide text-muted mb-3">Commercial terms (monthly)</h4>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Setup fee"><Input type="number" className="tnum" value={form.setupFee} onChange={(e) => setForm({ ...form, setupFee: Number(e.target.value) })} /></Field>
              <Field label="Per hub"><Input type="number" className="tnum" value={form.perHubFee} onChange={(e) => setForm({ ...form, perHubFee: Number(e.target.value) })} /></Field>
              <Field label="Per employee"><Input type="number" className="tnum" value={form.perEmployeeFee} onChange={(e) => setForm({ ...form, perEmployeeFee: Number(e.target.value) })} /></Field>
            </div>
          </div>
          {!editing && (
            <div className="border border-border rounded-[3px] p-3">
              <h4 className="text-2xs uppercase tracking-wide text-muted mb-3">Super Admin login</h4>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Email"><Input type="email" className="font-mono" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} /></Field>
                <Field label="Password"><Input className="font-mono" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} /></Field>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Delete company"
        footer={<><Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => { if (confirm) deleteCompany(confirm.id); setConfirm(null); }}>Delete</Button></>}>
        <p className="text-[13px] text-text-2">Delete <b className="text-text">{confirm?.name}</b>? Every hub, login and employee under it is removed. Billed to date: {money(0)}.</p>
      </Modal>
    </div>
  );
}
