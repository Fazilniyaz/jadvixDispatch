import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/Button';
import { SidePanel } from '@/components/SidePanel';
import { Field, Input, Select } from '@/components/Field';
import { useStore } from '@/store/useStore';
import type { Employee, EmployeeRole, EmployeeStatus } from '@/lib/types';

type FormState = Pick<Employee, 'name' | 'vehicleNo' | 'contactNo' | 'role' | 'shift' | 'status'>;

const emptyForm = (): FormState => ({
  name: '',
  vehicleNo: '',
  contactNo: '',
  role: 'driver',
  shift: 'Morning',
  status: 'active',
});

export default function EmployeeManagement() {
  const employees = useStore((s) => s.employees);
  const routes = useStore((s) => s.routes);
  const labels = useStore((s) => s.moduleLabels);
  const shifts = useStore((s) => s.shifts);
  const addEmployee = useStore((s) => s.addEmployee);
  const updateEmployee = useStore((s) => s.updateEmployee);

  const [search, setSearch] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const routeName = (id: string) => routes.find((r) => r.id === id)?.name ?? id;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      `${e.name} ${e.vehicleNo} ${e.contactNo} ${e.role}`.toLowerCase().includes(q)
    );
  }, [employees, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setPanelOpen(true);
  };

  const openEdit = (e: Employee) => {
    setEditing(e);
    setForm({
      name: e.name,
      vehicleNo: e.vehicleNo,
      contactNo: e.contactNo,
      role: e.role,
      shift: e.shift,
      status: e.status,
    });
    setPanelOpen(true);
  };

  const save = () => {
    if (editing) {
      updateEmployee(editing.id, form);
    } else {
      addEmployee({
        ...form,
        deliveredCount: 0,
        recentBayIds: [],
        recentRouteIds: [],
        history: [],
      });
    }
    setPanelOpen(false);
  };

  const columns: Column<Employee>[] = [
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
    { key: 'shift', header: 'Shift', render: (e) => <span className="text-text-2">{e.shift}</span> },
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
              placeholder="Search name, vehicle or contact"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <DataTable columns={columns} rows={rows} rowKey={(e) => e.id} onRowClick={openEdit} />
      </Card>

      <SidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editing ? editing.name : 'Add employee'}
        subtitle={editing ? `${editing.id.toUpperCase()} · ${editing.role}` : 'New team member'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPanelOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save} disabled={!form.name.trim()}>
              {editing ? 'Save changes' : 'Add employee'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Full name" htmlFor="e-name">
            <Input
              id="e-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Vehicle no" htmlFor="e-vehicle">
              <Input
                id="e-vehicle"
                className="font-mono"
                value={form.vehicleNo}
                onChange={(e) => setForm({ ...form, vehicleNo: e.target.value })}
              />
            </Field>
            <Field label="Contact no" htmlFor="e-contact">
              <Input
                id="e-contact"
                className="font-mono"
                value={form.contactNo}
                onChange={(e) => setForm({ ...form, contactNo: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Role" htmlFor="e-role">
              <Select
                id="e-role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as EmployeeRole })}
              >
                <option value="driver">Driver</option>
                <option value="dispatcher">Dispatcher</option>
              </Select>
            </Field>
            <Field label="Shift" htmlFor="e-shift">
              <Select
                id="e-shift"
                value={form.shift}
                onChange={(e) => setForm({ ...form, shift: e.target.value })}
              >
                {shifts.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status" htmlFor="e-status">
              <Select
                id="e-status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as EmployeeStatus })}
              >
                <option value="active">Active</option>
                <option value="leave">On leave</option>
              </Select>
            </Field>
          </div>

          {editing && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Delivered" value={editing.deliveredCount} />
                <Stat label="Recent bays" value={editing.recentBayIds.length} />
                <Stat label="Recent routes" value={editing.recentRouteIds.length} />
              </div>

              <div>
                <h4 className="text-2xs uppercase tracking-wide text-muted mb-2">Recently visited</h4>
                <div className="flex flex-wrap gap-1.5">
                  {editing.recentBayIds.map((b) => (
                    <span
                      key={b}
                      className="font-mono text-2xs border border-border rounded-[3px] px-1.5 py-0.5 text-text-2"
                    >
                      {b.toUpperCase()}
                    </span>
                  ))}
                  {editing.recentRouteIds.map((r) => (
                    <span
                      key={r}
                      className="text-2xs border border-border rounded-[3px] px-1.5 py-0.5 text-text-2"
                    >
                      {routeName(r)}
                    </span>
                  ))}
                  {editing.recentBayIds.length === 0 && editing.recentRouteIds.length === 0 && (
                    <span className="text-2xs text-muted">No recent activity</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-2xs uppercase tracking-wide text-muted mb-2">Delivery history</h4>
                {editing.history.length === 0 ? (
                  <p className="text-2xs text-muted">No records yet.</p>
                ) : (
                  <div className="border border-border rounded-[3px] divide-y divide-border">
                    {editing.history.map((h, i) => (
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
          )}
        </div>
      </SidePanel>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border rounded-[3px] bg-surface-2 px-3 py-2">
      <div className="text-lg font-semibold text-text tnum leading-none">{value}</div>
      <div className="text-2xs text-muted mt-1">{label}</div>
    </div>
  );
}
