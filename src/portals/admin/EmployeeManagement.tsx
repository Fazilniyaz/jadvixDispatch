import { useMemo, useState } from 'react';
import { ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react';
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

type FormState = {
  id: string;
  name: string;
  vehicleNo: string;
  contactNo: string;
  role: EmployeeRole;
  shift: string;
  status: EmployeeStatus;
};

const emptyForm = (): FormState => ({
  id: '',
  name: '',
  vehicleNo: '',
  contactNo: '',
  role: 'driver',
  shift: 'Morning',
  status: 'active',
});

const formFrom = (e: Employee): FormState => ({
  id: e.id,
  name: e.name,
  vehicleNo: e.vehicleNo,
  contactNo: e.contactNo,
  role: e.role,
  shift: e.shift,
  status: e.status,
});

export default function EmployeeManagement() {
  const employees = useStore((s) => s.employees);
  const routes = useStore((s) => s.routes);
  const labels = useStore((s) => s.moduleLabels);
  const shifts = useStore((s) => s.shifts);
  const addEmployee = useStore((s) => s.addEmployee);
  const updateEmployee = useStore((s) => s.updateEmployee);
  const deleteEmployee = useStore((s) => s.deleteEmployee);

  const [search, setSearch] = useState('');

  // Create flow (centered modal).
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(emptyForm());

  // Inline expand / edit flow.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm());
  const [confirmDelete, setConfirmDelete] = useState<Employee | null>(null);

  const routeName = (id: string) => routes.find((r) => r.id === id)?.name ?? id;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      `${e.id} ${e.name} ${e.vehicleNo} ${e.contactNo} ${e.role}`.toLowerCase().includes(q)
    );
  }, [employees, search]);

  const idTaken = (id: string) => employees.some((e) => e.id === id.trim());

  const openCreate = () => {
    setCreateForm(emptyForm());
    setCreateOpen(true);
  };

  const saveCreate = () => {
    addEmployee({
      id: createForm.id.trim() || undefined,
      name: createForm.name,
      vehicleNo: createForm.vehicleNo,
      contactNo: createForm.contactNo,
      role: createForm.role,
      shift: createForm.shift,
      status: createForm.status,
      deliveredCount: 0,
      errorCount: 0,
      recentBayIds: [],
      recentRouteIds: [],
      history: [],
    });
    setCreateOpen(false);
  };

  const toggleRow = (e: Employee) => {
    if (expandedId === e.id) {
      setExpandedId(null);
    } else {
      setExpandedId(e.id);
      setEditForm(formFrom(e));
    }
  };

  const saveEdit = () => {
    if (!expandedId) return;
    updateEmployee(expandedId, {
      name: editForm.name,
      vehicleNo: editForm.vehicleNo,
      contactNo: editForm.contactNo,
      role: editForm.role,
      shift: editForm.shift,
      status: editForm.status,
    });
    setExpandedId(null);
  };

  const columns: Column<Employee>[] = [
    {
      key: 'expand',
      header: '',
      render: (e) => (
        <ChevronRight
          size={15}
          className={cn(
            'text-muted transition-transform',
            expandedId === e.id && 'rotate-90 text-text'
          )}
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
      render: (e) => <span className="font-mono text-2xs text-text-2">{e.vehicleNo}</span>,
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (e) => <span className="font-mono text-2xs text-text-2 tnum">{e.contactNo}</span>,
    },
    { key: 'role', header: 'Role', render: (e) => <span className="text-text-2 capitalize">{e.role}</span> },
    { key: 'shift', header: 'Shift', render: (e) => <span className="text-text-2">{e.shift || '—'}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (e) => <StatusPill status={e.status === 'active' ? 'active' : 'leave'} />,
    },
    {
      key: 'deliveries',
      header: 'Recent deliveries',
      render: (e) => <span className="text-text tnum font-medium">{e.deliveredCount}</span>,
      headerClassName: 'text-right',
      className: 'text-right',
    },
  ];

  const renderExpanded = (e: Employee) => {
    const dirty =
      editForm.name !== e.name ||
      editForm.vehicleNo !== e.vehicleNo ||
      editForm.contactNo !== e.contactNo ||
      editForm.role !== e.role ||
      editForm.shift !== e.shift ||
      editForm.status !== e.status;

    return (
      <div className="px-3 sm:px-4 py-4 border-t border-border">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Editable details */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Pencil size={13} className="text-muted" />
              <h4 className="text-2xs uppercase tracking-wide text-muted">Edit details</h4>
              <span className="font-mono text-2xs text-muted ml-auto tnum">{e.id.toUpperCase()}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Full name" htmlFor={`e-name-${e.id}`}>
                <Input
                  id={`e-name-${e.id}`}
                  value={editForm.name}
                  onChange={(ev) => setEditForm({ ...editForm, name: ev.target.value })}
                />
              </Field>
              <Field label="Vehicle no" htmlFor={`e-vehicle-${e.id}`}>
                <Input
                  id={`e-vehicle-${e.id}`}
                  className="font-mono"
                  value={editForm.vehicleNo}
                  onChange={(ev) => setEditForm({ ...editForm, vehicleNo: ev.target.value })}
                />
              </Field>
              <Field label="Contact no" htmlFor={`e-contact-${e.id}`}>
                <Input
                  id={`e-contact-${e.id}`}
                  className="font-mono"
                  value={editForm.contactNo}
                  onChange={(ev) => setEditForm({ ...editForm, contactNo: ev.target.value })}
                />
              </Field>
              <Field label="Role" htmlFor={`e-role-${e.id}`}>
                <Select
                  id={`e-role-${e.id}`}
                  value={editForm.role}
                  onChange={(ev) => setEditForm({ ...editForm, role: ev.target.value as EmployeeRole })}
                >
                  <option value="driver">Driver</option>
                  <option value="dispatcher">Dispatcher</option>
                </Select>
              </Field>
              <Field label="Shift" htmlFor={`e-shift-${e.id}`}>
                <Select
                  id={`e-shift-${e.id}`}
                  value={editForm.shift}
                  onChange={(ev) => setEditForm({ ...editForm, shift: ev.target.value })}
                >
                  <option value="">Unassigned</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Status" htmlFor={`e-status-${e.id}`}>
                <Select
                  id={`e-status-${e.id}`}
                  value={editForm.status}
                  onChange={(ev) =>
                    setEditForm({ ...editForm, status: ev.target.value as EmployeeStatus })
                  }
                >
                  <option value="active">Active</option>
                  <option value="leave">On leave</option>
                </Select>
              </Field>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-4">
              <Button
                variant="primary"
                onClick={saveEdit}
                disabled={!editForm.name.trim() || !dirty}
              >
                Save changes
              </Button>
              <Button variant="ghost" onClick={() => setExpandedId(null)}>
                Cancel
              </Button>
              <Button variant="danger" className="ml-auto" onClick={() => setConfirmDelete(e)}>
                <Trash2 size={14} />
                Delete
              </Button>
            </div>
          </div>

          {/* Read-only activity */}
          <div className="space-y-4 lg:border-l lg:border-border lg:pl-5">
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Delivered" value={e.deliveredCount} />
              <Stat label="Recent bays" value={e.recentBayIds.length} />
              <Stat label="Recent routes" value={e.recentRouteIds.length} />
            </div>

            <div>
              <h4 className="text-2xs uppercase tracking-wide text-muted mb-2">Recently visited</h4>
              <div className="flex flex-wrap gap-1.5">
                {e.recentBayIds.map((b) => (
                  <span
                    key={b}
                    className="font-mono text-2xs border border-border rounded-[3px] px-1.5 py-0.5 text-text-2"
                  >
                    {b.toUpperCase()}
                  </span>
                ))}
                {e.recentRouteIds.map((r) => (
                  <span
                    key={r}
                    className="text-2xs border border-border rounded-[3px] px-1.5 py-0.5 text-text-2"
                  >
                    {routeName(r)}
                  </span>
                ))}
                {e.recentBayIds.length === 0 && e.recentRouteIds.length === 0 && (
                  <span className="text-2xs text-muted">No recent activity</span>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-2xs uppercase tracking-wide text-muted mb-2">Delivery history</h4>
              {e.history.length === 0 ? (
                <p className="text-2xs text-muted">No records yet.</p>
              ) : (
                <div className="border border-border rounded-[3px] divide-y divide-border">
                  {e.history.map((h, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 text-[13px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-2xs text-text-2 tnum">{h.productCode}</span>
                        <span className="text-text-2 truncate">{h.route}</span>
                      </div>
                      <span className="text-2xs text-muted tnum">{h.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title={labels.employees}
        description="Drivers and dispatchers, their vehicles, shifts and delivery history."
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
              placeholder="Search ID, name, vehicle or contact"
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
          onRowClick={toggleRow}
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
            <Button
              variant="primary"
              onClick={saveCreate}
              disabled={
                !createForm.name.trim() || (!!createForm.id.trim() && idTaken(createForm.id))
              }
            >
              Add employee
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Employee ID" htmlFor="c-id" hint="Leave blank to auto-generate">
            <Input
              id="c-id"
              className="font-mono"
              placeholder="e.g. EMP-042"
              value={createForm.id}
              onChange={(e) => setCreateForm({ ...createForm, id: e.target.value })}
            />
            {!!createForm.id.trim() && idTaken(createForm.id) && (
              <p className="text-2xs text-exception mt-1">This ID is already in use.</p>
            )}
          </Field>
          <Field label="Full name" htmlFor="c-name">
            <Input
              id="c-name"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Vehicle no" htmlFor="c-vehicle">
              <Input
                id="c-vehicle"
                className="font-mono"
                value={createForm.vehicleNo}
                onChange={(e) => setCreateForm({ ...createForm, vehicleNo: e.target.value })}
              />
            </Field>
            <Field label="Contact no" htmlFor="c-contact">
              <Input
                id="c-contact"
                className="font-mono"
                value={createForm.contactNo}
                onChange={(e) => setCreateForm({ ...createForm, contactNo: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Role" htmlFor="c-role">
              <Select
                id="c-role"
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as EmployeeRole })}
              >
                <option value="driver">Driver</option>
                <option value="dispatcher">Dispatcher</option>
              </Select>
            </Field>
            <Field label="Shift" htmlFor="c-shift">
              <Select
                id="c-shift"
                value={createForm.shift}
                onChange={(e) => setCreateForm({ ...createForm, shift: e.target.value })}
              >
                {shifts.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status" htmlFor="c-status">
              <Select
                id="c-status"
                value={createForm.status}
                onChange={(e) =>
                  setCreateForm({ ...createForm, status: e.target.value as EmployeeStatus })
                }
              >
                <option value="active">Active</option>
                <option value="leave">On leave</option>
              </Select>
            </Field>
          </div>
        </div>
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
                if (confirmDelete) {
                  deleteEmployee(confirmDelete.id);
                  if (expandedId === confirmDelete.id) setExpandedId(null);
                }
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
          unassigns them from any products and cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border rounded-[3px] bg-surface px-3 py-2">
      <div className="text-lg font-semibold text-text tnum leading-none">{value}</div>
      <div className="text-2xs text-muted mt-1">{label}</div>
    </div>
  );
}
