import { useMemo, useState, type ReactNode } from 'react';
import { ChevronRight, KeyRound, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Field, Input, Select } from '@/components/Field';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import type { Employee, EmployeeRole, EmployeeStatus } from '@/lib/types';

const statusLabel = (s: EmployeeStatus) =>
  s === 'full-time'
    ? 'Full-time'
    : s === 'contract-based'
      ? 'Contract-based'
      : s === 'leave'
        ? 'On leave'
        : s === 'inactive'
          ? 'Inactive (blocked)'
          : 'Active';

// Employee Management is fully independent — no link to shifts, products or
// locations. Driver login credentials (email + password) are set here; a driver
// whose status is 'inactive' is blocked from signing in.

const STATUS_OPTIONS: { value: EmployeeStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'full-time', label: 'Full-time' },
  { value: 'contract-based', label: 'Contract-based' },
  { value: 'leave', label: 'On leave' },
  { value: 'inactive', label: 'Inactive (blocked)' },
];

type FormState = {
  id: string;
  name: string;
  vehicleNo: string;
  contactNo: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  email: string;
  password: string;
};

const emptyForm = (): FormState => ({
  id: '',
  name: '',
  vehicleNo: '',
  contactNo: '',
  role: 'driver',
  status: 'active',
  email: '',
  password: '',
});

const formFrom = (e: Employee): FormState => ({
  id: e.id,
  name: e.name,
  vehicleNo: e.vehicleNo,
  contactNo: e.contactNo,
  role: e.role,
  status: e.status,
  email: e.email ?? '',
  password: e.password ?? '',
});

export default function EmployeeManagement() {
  const employees = useStore((s) => s.employees);
  const labels = useStore((s) => s.moduleLabels);
  const addEmployee = useStore((s) => s.addEmployee);
  const updateEmployee = useStore((s) => s.updateEmployee);
  const deleteEmployee = useStore((s) => s.deleteEmployee);

  const [search, setSearch] = useState('');

  // Create flow (centered modal).
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(emptyForm());

  // Edit flow (centered modal).
  const [editing, setEditing] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm());

  const [confirmDelete, setConfirmDelete] = useState<Employee | null>(null);

  // Click a row to expand a read-only detail view (edit/delete stay on the row).
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      `${e.id} ${e.name} ${e.vehicleNo} ${e.contactNo} ${e.role} ${e.email ?? ''}`
        .toLowerCase()
        .includes(q)
    );
  }, [employees, search]);

  const idTaken = (id: string) => employees.some((e) => e.id === id.trim());
  // An email must be unique across employees (excluding the one being edited).
  const emailTaken = (email: string, exceptId?: string) => {
    const key = email.trim().toLowerCase();
    if (!key) return false;
    return employees.some(
      (e) => e.id !== exceptId && (e.email ?? '').trim().toLowerCase() === key
    );
  };

  const openCreate = () => {
    setCreateForm(emptyForm());
    setCreateOpen(true);
  };

  const saveCreate = () => {
    const isDriver = createForm.role === 'driver';
    addEmployee({
      id: createForm.id.trim() || undefined,
      name: createForm.name.trim(),
      vehicleNo: createForm.vehicleNo.trim(),
      contactNo: createForm.contactNo.trim(),
      role: createForm.role,
      shift: '', // retained on the model but not managed here
      status: createForm.status,
      email: isDriver ? createForm.email.trim() || undefined : undefined,
      password: isDriver ? createForm.password || undefined : undefined,
      deliveredCount: 0,
      errorCount: 0,
      recentBayIds: [],
      recentRouteIds: [],
      history: [],
    });
    setCreateOpen(false);
  };

  const openEdit = (e: Employee) => {
    setEditing(e);
    setEditForm(formFrom(e));
  };

  const saveEdit = () => {
    if (!editing) return;
    const isDriver = editForm.role === 'driver';
    updateEmployee(editing.id, {
      name: editForm.name.trim(),
      vehicleNo: editForm.vehicleNo.trim(),
      contactNo: editForm.contactNo.trim(),
      role: editForm.role,
      status: editForm.status,
      // Non-drivers have no portal login; clear any stale credentials.
      email: isDriver ? editForm.email.trim() || undefined : undefined,
      password: isDriver ? editForm.password || undefined : undefined,
    });
    setEditing(null);
  };

  const columns: Column<Employee>[] = [
    {
      key: 'expand',
      header: '',
      render: (e) => (
        <ChevronRight
          size={15}
          className={cn('text-muted transition-transform', expandedId === e.id && 'rotate-90 text-text')}
        />
      ),
      className: 'w-8 pr-0',
      headerClassName: 'w-8 pr-0',
    },
    {
      key: 'id',
      header: 'ID',
      render: (e) => <span className="font-mono text-2xs text-text-2 tnum">{e.id.toUpperCase()}</span>,
    },
    { key: 'name', header: 'Name', render: (e) => <span className="font-medium text-text">{e.name}</span> },
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (e) => <span className="font-mono text-2xs text-text-2">{e.vehicleNo || '—'}</span>,
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (e) => <span className="font-mono text-2xs text-text-2 tnum">{e.contactNo || '—'}</span>,
    },
    { key: 'role', header: 'Role', render: (e) => <span className="text-text-2 capitalize">{e.role}</span> },
    {
      key: 'login',
      header: 'Login',
      render: (e) =>
        e.role === 'driver' && e.email ? (
          <span className="inline-flex items-center gap-1 text-2xs text-text-2">
            <KeyRound size={12} className="text-muted" />
            {e.email}
          </span>
        ) : (
          <span className="text-2xs text-muted">—</span>
        ),
    },
    { key: 'status', header: 'Status', render: (e) => <StatusPill status={e.status} /> },
    {
      key: 'actions',
      header: '',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (e) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(ev) => {
              ev.stopPropagation();
              openEdit(e);
            }}
            aria-label={`Edit ${e.name}`}
            title="Edit"
            className="text-muted hover:text-text p-1.5 rounded-[3px] hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={(ev) => {
              ev.stopPropagation();
              setConfirmDelete(e);
            }}
            aria-label={`Delete ${e.name}`}
            title="Delete"
            className="text-muted hover:text-exception p-1.5 rounded-[3px] hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  // Read-only detail shown when a row is expanded.
  const renderExpanded = (e: Employee) => (
    <div className="px-3 sm:px-4 py-4 border-t border-border">
      <div className="flex items-center gap-1.5 mb-3">
        <h4 className="text-2xs uppercase tracking-wide text-muted">Employee details</h4>
        <span className="font-mono text-2xs text-muted ml-auto tnum">{e.id.toUpperCase()}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Detail label="Full name">{e.name}</Detail>
        <Detail label="Role"><span className="capitalize">{e.role}</span></Detail>
        <Detail label="Status">
          <StatusPill status={e.status} label={statusLabel(e.status)} />
        </Detail>
        <Detail label="Vehicle" mono>{e.vehicleNo || '—'}</Detail>
        <Detail label="Contact" mono>{e.contactNo || '—'}</Detail>
        {e.role === 'driver' && (
          <Detail label="Login email" mono>{e.email || 'Not set'}</Detail>
        )}
      </div>
      <div className="flex items-center gap-2 mt-4">
        <Button variant="secondary" size="sm" onClick={() => openEdit(e)}>
          <Pencil size={14} />
          Edit
        </Button>
        <Button variant="danger" size="sm" onClick={() => setConfirmDelete(e)}>
          <Trash2 size={14} />
          Delete
        </Button>
      </div>
    </div>
  );

  // Shared field grid for create + edit modals. `lockId` disables the ID field (edit).
  const fields = (
    form: FormState,
    setForm: (f: FormState) => void,
    idp: string,
    opts: { lockId: boolean; exceptId?: string }
  ) => {
    const isDriver = form.role === 'driver';
    const dupEmail = isDriver && !!form.email.trim() && emailTaken(form.email, opts.exceptId);
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field
            label="Employee ID"
            htmlFor={`${idp}-id`}
            hint={opts.lockId ? 'Cannot be changed' : 'Leave blank to auto-generate'}
          >
            <Input
              id={`${idp}-id`}
              className="font-mono"
              placeholder="e.g. EMP-042"
              value={form.id}
              disabled={opts.lockId}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
            />
            {!opts.lockId && !!form.id.trim() && idTaken(form.id) && (
              <p className="text-2xs text-exception mt-1">This ID is already in use.</p>
            )}
          </Field>
          <Field label="Full name" htmlFor={`${idp}-name`}>
            <Input
              id={`${idp}-name`}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Jane Doe"
            />
          </Field>
          <Field label="Vehicle no" htmlFor={`${idp}-vehicle`}>
            <Input
              id={`${idp}-vehicle`}
              className="font-mono"
              value={form.vehicleNo}
              onChange={(e) => setForm({ ...form, vehicleNo: e.target.value })}
              placeholder="e.g. TN-09-BX-4471"
            />
          </Field>
          <Field label="Contact no" htmlFor={`${idp}-contact`}>
            <Input
              id={`${idp}-contact`}
              className="font-mono"
              value={form.contactNo}
              onChange={(e) => setForm({ ...form, contactNo: e.target.value })}
              placeholder="+91 …"
            />
          </Field>
          <Field label="Role" htmlFor={`${idp}-role`} hint="Preset or custom">
            <Input
              id={`${idp}-role`}
              list="employee-role-options"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="e.g. Supervisor"
            />
          </Field>
          <Field label="Status" htmlFor={`${idp}-status`}>
            <Select
              id={`${idp}-status`}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as EmployeeStatus })}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {/* Driver login credentials */}
        {isDriver && (
          <div className="border border-border rounded-[3px] bg-surface-2 p-3">
            <div className="flex items-center gap-1.5 mb-3">
              <KeyRound size={13} className="text-muted" />
              <h4 className="text-2xs uppercase tracking-wide text-muted">Driver portal login</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Login email" htmlFor={`${idp}-email`}>
                <Input
                  id={`${idp}-email`}
                  type="email"
                  className="font-mono"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="driver@company.com"
                />
                {dupEmail && (
                  <p className="text-2xs text-exception mt-1">
                    Another employee already uses this email.
                  </p>
                )}
              </Field>
              <Field label="Password" htmlFor={`${idp}-password`}>
                <Input
                  id={`${idp}-password`}
                  type="text"
                  className="font-mono"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Set a password"
                />
              </Field>
            </div>
            <p className="text-2xs text-muted mt-2">
              The driver signs in with these on the driver portal. Set status to{' '}
              <span className="font-medium text-text-2">Inactive</span> to block their login.
            </p>
          </div>
        )}
      </div>
    );
  };

  // Validity: name required; unique ID on create; unique driver email.
  const createInvalid =
    !createForm.name.trim() ||
    (!!createForm.id.trim() && idTaken(createForm.id)) ||
    (createForm.role === 'driver' && emailTaken(createForm.email));
  const editInvalid =
    !editForm.name.trim() ||
    (editForm.role === 'driver' && emailTaken(editForm.email, editing?.id));

  return (
    <div>
      {/* Role presets — the input still accepts any custom text. */}
      <datalist id="employee-role-options">
        <option value="driver" />
        <option value="dispatcher" />
      </datalist>

      <PageHeader
        title={labels.employees}
        description="An independent staff register — drivers, dispatchers and their portal logins."
        action={
          <Button variant="primary" onClick={openCreate}>
            <Plus size={16} />
            Add employee
          </Button>
        }
      />

      <Card>
        <div className="p-3 border-b border-border">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              placeholder="Search ID, name, vehicle, contact or email"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(e) => e.id}
          onRowClick={(e) => setExpandedId((prev) => (prev === e.id ? null : e.id))}
          expandedKey={expandedId}
          renderExpanded={renderExpanded}
          empty="No employees match your search."
        />
      </Card>

      {/* Create employee — centered modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add employee"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveCreate} disabled={createInvalid}>
              Add employee
            </Button>
          </>
        }
      >
        {fields(createForm, setCreateForm, 'ec', { lockId: false })}
      </Modal>

      {/* Edit employee — centered modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={
          <span className="flex items-center gap-2">
            Edit employee
            {editing && (
              <span className="font-mono text-2xs text-muted tnum">{editing.id.toUpperCase()}</span>
            )}
          </span>
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveEdit} disabled={editInvalid}>
              Save changes
            </Button>
          </>
        }
      >
        {editing && fields(editForm, setEditForm, `ee-${editing.id}`, { lockId: true, exceptId: editing.id })}
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete employee"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirmDelete) deleteEmployee(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-text-2">
          Delete <span className="font-medium text-text">{confirmDelete?.name}</span> (
          <span className="font-mono text-2xs">{confirmDelete?.id.toUpperCase()}</span>)? This
          revokes any portal login and cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

function Detail({
  label,
  children,
  mono,
}: {
  label: string;
  children: ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-2xs uppercase tracking-wide text-muted mb-0.5">{label}</div>
      <div className={cn('text-[13px] text-text font-medium', mono && 'font-mono')}>{children}</div>
    </div>
  );
}
