import { useMemo, useState } from 'react';
import { KeyRound, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Field, Input, Select } from '@/components/Field';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { money, onLeave, useScopedEmployees, useScopedLeave } from '@/lib/scope';
import { today } from '@/data/seed';
import { HUB_AUTHORITY_ROLES, ROLE_LABELS, type Employee, type EmployeeStatus, type Role } from '@/lib/types';

const STATUSES: { value: EmployeeStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'full-time', label: 'Full-time' },
  { value: 'contract-based', label: 'Contract-based' },
  { value: 'leave', label: 'On leave' },
  { value: 'inactive', label: 'Inactive (blocked)' },
];

type Form = {
  name: string; vehicleNo: string; contactNo: string; role: string;
  status: EmployeeStatus; email: string; password: string;
  monthlyPay: number; canMessage: Role[];
};

const empty = (): Form => ({
  name: '', vehicleNo: '', contactNo: '', role: 'driver', status: 'active',
  email: '', password: '', monthlyPay: 0, canMessage: ['hub-manager', 'hub-team-leader'],
});

export default function Employees() {
  const hubId = useStore((s) => s.activeHubId);
  const labels = useStore((s) => s.moduleLabels);
  const addEmployee = useStore((s) => s.addEmployee);
  const updateEmployee = useStore((s) => s.updateEmployee);
  const deleteEmployee = useStore((s) => s.deleteEmployee);
  const employees = useScopedEmployees();
  const leave = useScopedLeave();

  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty());
  const [editing, setEditing] = useState<Employee | null>(null);
  const [confirm, setConfirm] = useState<Employee | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      `${e.id} ${e.name} ${e.vehicleNo} ${e.contactNo} ${e.role} ${e.email ?? ''}`.toLowerCase().includes(q)
    );
  }, [employees, search]);

  const save = () => {
    if (!form.name.trim() || !hubId) return;
    const payload = {
      hubId,
      name: form.name.trim(),
      vehicleNo: form.vehicleNo.trim(),
      contactNo: form.contactNo.trim(),
      role: form.role,
      status: form.status,
      email: form.role === 'driver' ? form.email.trim() || undefined : undefined,
      password: form.role === 'driver' ? form.password || undefined : undefined,
      canMessage: form.canMessage,
      monthlyPay: Number(form.monthlyPay) || 0,
      joinedAt: today(),
      deliveredCount: 0,
      errorCount: 0,
      history: [],
    };
    if (editing) updateEmployee(editing.id, payload);
    else addEmployee(payload);
    setCreateOpen(false);
    setEditing(null);
  };

  const openEdit = (e: Employee) => {
    setEditing(e);
    setForm({
      name: e.name, vehicleNo: e.vehicleNo, contactNo: e.contactNo, role: e.role,
      status: e.status, email: e.email ?? '', password: e.password ?? '',
      monthlyPay: e.monthlyPay, canMessage: e.canMessage ?? [],
    });
  };

  const cols: Column<Employee>[] = [
    { key: 'name', header: 'Name', render: (e) => (
      <span className={cn('font-medium text-text', onLeave(e, leave) && 'opacity-45')}>{e.name}</span>
    ) },
    { key: 'role', header: 'Role', render: (e) => <span className="text-text-2 capitalize">{e.role}</span> },
    { key: 'vehicle', header: 'Vehicle', render: (e) => <span className="font-mono text-2xs text-text-2">{e.vehicleNo || '—'}</span> },
    { key: 'contact', header: 'Contact', render: (e) => <span className="font-mono text-2xs text-text-2 tnum">{e.contactNo || '—'}</span> },
    { key: 'login', header: 'Login', render: (e) => e.role === 'driver' && e.email
      ? <span className="inline-flex items-center gap-1 text-2xs text-text-2"><KeyRound size={11} className="text-muted" />{e.email}</span>
      : <span className="text-2xs text-muted">—</span> },
    { key: 'pay', header: 'Monthly pay', headerClassName: 'text-right', className: 'text-right',
      render: (e) => <span className="tnum text-text">{money(e.monthlyPay)}</span> },
    { key: 'status', header: 'Status', render: (e) => (
      <StatusPill status={onLeave(e, leave) ? 'leave' : e.status} />
    ) },
    { key: 'actions', header: '', headerClassName: 'text-right', className: 'text-right', render: (e) => (
      <div className="flex items-center justify-end gap-1">
        <button onClick={(ev) => { ev.stopPropagation(); openEdit(e); }} aria-label={`Edit ${e.name}`} className="text-muted hover:text-text p-1.5 rounded-[3px] hover:bg-surface-2"><Pencil size={15} /></button>
        <button onClick={(ev) => { ev.stopPropagation(); setConfirm(e); }} aria-label={`Delete ${e.name}`} className="text-muted hover:text-exception p-1.5 rounded-[3px] hover:bg-surface-2"><Trash2 size={15} /></button>
      </div>
    ) },
  ];

  const fields = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Full name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Jane Doe" /></Field>
        <Field label="Role" hint="Preset or custom">
          <Input list="emp-roles" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
        </Field>
        <Field label="Vehicle no"><Input className="font-mono" value={form.vehicleNo} onChange={(e) => setForm({ ...form, vehicleNo: e.target.value })} /></Field>
        <Field label="Contact no"><Input className="font-mono" value={form.contactNo} onChange={(e) => setForm({ ...form, contactNo: e.target.value })} /></Field>
        <Field label="Monthly pay"><Input type="number" min={0} className="tnum" value={form.monthlyPay} onChange={(e) => setForm({ ...form, monthlyPay: Number(e.target.value) })} /></Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as EmployeeStatus })}>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
        </Field>
      </div>

      {form.role === 'driver' && (
        <div className="border border-border rounded-[3px] bg-surface-2 p-3">
          <div className="flex items-center gap-1.5 mb-3 text-muted">
            <KeyRound size={13} /><h4 className="text-2xs uppercase tracking-wide">Driver portal login</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Login email"><Input type="email" className="font-mono" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Password"><Input className="font-mono" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
          </div>
          <p className="text-2xs text-muted mt-2">Set status to <b className="text-text-2">Inactive</b> to block this login.</p>
        </div>
      )}

      <Field label="May message" hint="Who this employee is allowed to contact">
        <div className="flex flex-wrap gap-1.5">
          {HUB_AUTHORITY_ROLES.map((r) => {
            const on = form.canMessage.includes(r);
            return (
              <button
                key={r}
                type="button"
                onClick={() => setForm({ ...form, canMessage: on ? form.canMessage.filter((x) => x !== r) : [...form.canMessage, r] })}
                className={cn('text-2xs rounded-[3px] border px-2 py-1', on ? 'border-accent text-accent bg-accent/10' : 'border-border text-text-2 hover:bg-surface-2')}
              >
                {ROLE_LABELS[r]}
              </button>
            );
          })}
        </div>
      </Field>
    </div>
  );

  return (
    <div>
      <datalist id="emp-roles"><option value="driver" /><option value="dispatcher" /></datalist>
      <PageHeader
        title={labels.employees}
        description="Staff at this hub, their portal logins and pay."
        action={<Button variant="primary" onClick={() => { setForm(empty()); setCreateOpen(true); }}><Plus size={16} />Add employee</Button>}
      />
      <Card>
        <div className="p-3 border-b border-border">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <Input placeholder="Search name, vehicle, contact or email" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <DataTable columns={cols} rows={rows} rowKey={(e) => e.id} empty="No employees at this hub yet." />
      </Card>

      <Modal open={createOpen || !!editing} onClose={() => { setCreateOpen(false); setEditing(null); }}
        title={editing ? `Edit ${editing.name}` : 'Add employee'}
        footer={<>
          <Button variant="ghost" onClick={() => { setCreateOpen(false); setEditing(null); }}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={!form.name.trim()}>{editing ? 'Save changes' : 'Add employee'}</Button>
        </>}>
        {fields}
      </Modal>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Delete employee"
        footer={<>
          <Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => { if (confirm) deleteEmployee(confirm.id); setConfirm(null); }}>Delete</Button>
        </>}>
        <p className="text-[13px] text-text-2">
          Delete <b className="text-text">{confirm?.name}</b>? This revokes their login and frees any bay they hold.
        </p>
      </Modal>
    </div>
  );
}
