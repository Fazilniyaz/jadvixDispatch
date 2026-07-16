import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, MapPin, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusPill } from '@/components/StatusPill';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { Field, Input, Select } from '@/components/Field';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import type { Bay, Shift } from '@/lib/types';

type FormState = {
  number: number;
  shiftId: string;
  date: string;
};

const today = () => new Date().toISOString().slice(0, 10);

export default function BayManagement() {
  const bays = useStore((s) => s.bays);
  const employees = useStore((s) => s.employees);
  const products = useStore((s) => s.products);
  const shifts = useStore((s) => s.shifts);
  const routes = useStore((s) => s.routes);
  const labels = useStore((s) => s.moduleLabels);
  const activeShiftId = useStore((s) => s.activeShiftId);
  const maxBays = useStore((s) => s.maxBays);
  const addBay = useStore((s) => s.addBay);
  const updateBay = useStore((s) => s.updateBay);
  const deleteBay = useStore((s) => s.deleteBay);

  const defaultShiftId = activeShiftId || shifts[0]?.id || '';

  // ---- Shift-derived helpers: a bay connects only to a shift, so everything
  // else (employees, locations, products, stock, timings, status) flows from it.
  const shiftById = (id: string | null) => shifts.find((s) => s.id === id) ?? null;
  const empsOf = (shift: Shift | null) =>
    shift ? employees.filter((e) => e.shift === shift.name) : [];
  const routesOf = (shift: Shift | null) =>
    shift ? routes.filter((r) => r.shiftId === shift.id) : [];
  const productsOf = (shift: Shift | null) =>
    (shift?.products ?? [])
      .map((sp) => ({ ...sp, product: products.find((p) => p.id === sp.productId) }))
      .filter((x) => x.product);
  const stockOf = (shift: Shift | null) =>
    (shift?.products ?? []).reduce((sum, p) => sum + p.stock, 0);

  const usedNumbers = useMemo(() => new Set(bays.map((b) => b.number)), [bays]);
  const freeNumbers = useMemo(
    () => Array.from({ length: maxBays }, (_, i) => i + 1).filter((n) => !usedNumbers.has(n)),
    [maxBays, usedNumbers]
  );
  const nextFree = freeNumbers[0] ?? null;
  const atCapacity = bays.length >= maxBays || nextFree === null;

  const [search, setSearch] = useState('');

  // Create flow (centered modal).
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>({
    number: 1,
    shiftId: defaultShiftId,
    date: today(),
  });

  // Inline expand / edit flow.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>({ number: 1, shiftId: defaultShiftId, date: today() });
  const [confirmDelete, setConfirmDelete] = useState<Bay | null>(null);

  const rows = useMemo(() => {
    const sorted = [...bays].sort((a, b) => a.number - b.number);
    const q = search.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((b) => {
      const shift = shiftById(b.shiftId);
      const emps = empsOf(shift).map((e) => e.name).join(' ');
      return `bay ${b.number} ${shift?.name ?? ''} ${emps} ${b.date}`.toLowerCase().includes(q);
    });
  }, [bays, employees, shifts, search]);

  const formFrom = (b: Bay): FormState => ({
    number: b.number,
    shiftId: b.shiftId ?? defaultShiftId,
    date: b.date || today(),
  });

  const openCreate = () => {
    setCreateForm({ number: nextFree ?? 1, shiftId: defaultShiftId, date: today() });
    setCreateOpen(true);
  };

  const saveCreate = () => {
    const shift = shiftById(createForm.shiftId);
    addBay({
      number: createForm.number,
      shiftId: createForm.shiftId || null,
      // Legacy fields kept for the dashboard/driver views; stock mirrors the shift.
      assignedDriverId: null,
      vehicleNo: '',
      stocks: stockOf(shift),
      date: createForm.date || today(),
    });
    setCreateOpen(false);
  };

  const toggleRow = (b: Bay) => {
    if (expandedId === b.id) {
      setExpandedId(null);
    } else {
      setExpandedId(b.id);
      setEditForm(formFrom(b));
    }
  };

  const openEdit = (b: Bay) => {
    setExpandedId(b.id);
    setEditForm(formFrom(b));
  };

  const saveEdit = () => {
    if (!expandedId) return;
    const shift = shiftById(editForm.shiftId);
    updateBay(expandedId, {
      number: editForm.number,
      shiftId: editForm.shiftId || null,
      stocks: stockOf(shift),
      date: editForm.date || today(),
    });
    setExpandedId(null);
  };

  // Inline bay-number change from within the table row.
  const changeNumber = (b: Bay, n: number) => {
    if (n === b.number || usedNumbers.has(n)) return;
    updateBay(b.id, { number: n });
  };

  // A summary string of names, truncated with a "+N" tail for compact cells.
  const summarize = (names: string[]) => {
    if (names.length === 0) return '—';
    if (names.length === 1) return names[0];
    return `${names[0]} +${names.length - 1}`;
  };

  const columns: Column<Bay>[] = [
    {
      key: 'expand',
      header: '',
      render: (b) => (
        <ChevronRight
          size={15}
          className={cn('text-muted transition-transform', expandedId === b.id && 'rotate-90 text-text')}
        />
      ),
      className: 'w-8 pr-0',
      headerClassName: 'w-8 pr-0',
    },
    {
      key: 'number',
      header: 'Bay #',
      render: (b) => (
        // Self-contained styled select (not the shared Select) so the number always
        // renders clearly and stays editable straight from the row.
        <div className="relative inline-flex items-center" onClick={(e) => e.stopPropagation()}>
          <span className="pointer-events-none absolute left-2.5 text-2xs font-mono uppercase tracking-wide text-accent/70">
            Bay
          </span>
          <select
            aria-label={`Bay number for bay ${b.number}`}
            value={b.number}
            onChange={(e) => {
              e.stopPropagation();
              changeNumber(b, Number(e.target.value));
            }}
            className="tnum font-mono font-semibold text-sm text-accent border border-border rounded-[4px] h-8 pl-10 pr-6 cursor-pointer focus:border-accent focus:outline-none appearance-none"
            style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}
          >
            {Array.from({ length: maxBays }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n} disabled={n !== b.number && usedNumbers.has(n)}>
                {n}
              </option>
            ))}
          </select>
          <ChevronDown size={13} className="pointer-events-none absolute right-1.5 text-accent/60" />
        </div>
      ),
    },
    {
      key: 'shift',
      header: 'Shift',
      render: (b) => {
        const shift = shiftById(b.shiftId);
        return <span className="font-medium text-text">{shift?.name ?? '—'}</span>;
      },
    },
    {
      key: 'employee',
      header: 'Employee',
      render: (b) => {
        const names = empsOf(shiftById(b.shiftId)).map((e) => e.name);
        return (
          <span
            className={cn(
              'flex items-center gap-1.5 max-w-[10rem]',
              names.length ? 'text-text-2' : 'text-muted'
            )}
            title={names.join(', ')}
          >
            <Users size={13} className="shrink-0 text-muted" />
            <span className="truncate">{summarize(names)}</span>
          </span>
        );
      },
    },
    {
      key: 'location',
      header: 'Location',
      render: (b) => {
        const names = routesOf(shiftById(b.shiftId)).map((r) => r.name);
        return (
          <span
            className={cn(
              'flex items-center gap-1.5 max-w-[10rem]',
              names.length ? 'text-text-2' : 'text-muted'
            )}
            title={names.join(', ')}
          >
            <MapPin size={13} className="shrink-0 text-muted" />
            <span className="truncate">{summarize(names)}</span>
          </span>
        );
      },
    },
    {
      key: 'product',
      header: 'Product',
      render: (b) => {
        const count = productsOf(shiftById(b.shiftId)).length;
        return count ? (
          <span className="tnum text-text-2">
            {count} <span className="text-2xs text-muted">item{count === 1 ? '' : 's'}</span>
          </span>
        ) : (
          <span className="text-muted">—</span>
        );
      },
      headerClassName: 'text-right',
      className: 'text-right',
    },
    {
      key: 'stocks',
      header: 'Available stocks',
      render: (b) => {
        const stock = stockOf(shiftById(b.shiftId));
        return (
          <span className="tnum text-text font-semibold">
            {stock} <span className="text-2xs font-normal text-muted">stk</span>
          </span>
        );
      },
      headerClassName: 'text-right',
      className: 'text-right',
    },
    {
      key: 'date',
      header: 'Date',
      render: (b) => <span className="text-text-2 tnum">{b.date || '—'}</span>,
    },
    {
      key: 'timings',
      header: 'Timings',
      render: (b) => {
        const shift = shiftById(b.shiftId);
        return <span className="text-text-2 tnum whitespace-nowrap">{shift?.window ?? '—'}</span>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (b) => {
        const shift = shiftById(b.shiftId);
        return shift ? (
          <StatusPill status={shift.status} />
        ) : (
          <StatusPill status="idle" label="Unassigned" />
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (b) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={(ev) => {
              ev.stopPropagation();
              openEdit(b);
            }}
          >
            <Pencil size={14} />
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            aria-label={`Delete bay ${b.number}`}
            onClick={(ev) => {
              ev.stopPropagation();
              setConfirmDelete(b);
            }}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
      headerClassName: 'text-right',
      className: 'text-right',
    },
  ];

  const renderExpanded = (b: Bay) => {
    const dirty =
      editForm.number !== b.number ||
      editForm.shiftId !== (b.shiftId ?? defaultShiftId) ||
      editForm.date !== (b.date || today());

    const shift = shiftById(b.shiftId);
    const emps = empsOf(shift);
    const locs = routesOf(shift);
    const prods = productsOf(shift);
    const numberTaken = editForm.number !== b.number && usedNumbers.has(editForm.number);

    return (
      <div className="px-3 sm:px-4 py-4 border-t border-border">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Editable details — bay connects only to a shift */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Pencil size={13} className="text-muted" />
              <h4 className="text-2xs uppercase tracking-wide text-muted">Edit bay</h4>
              <span className="font-mono text-2xs text-muted ml-auto tnum">BAY {b.number}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Bay number" htmlFor={`b-number-${b.id}`}>
                <Select
                  id={`b-number-${b.id}`}
                  value={editForm.number}
                  onChange={(ev) => setEditForm({ ...editForm, number: Number(ev.target.value) })}
                >
                  {Array.from({ length: maxBays }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n} disabled={n !== b.number && usedNumbers.has(n)}>
                      {n}
                    </option>
                  ))}
                </Select>
                {numberTaken && <p className="text-2xs text-exception mt-1">That number is taken.</p>}
              </Field>
              <Field label="Shift" htmlFor={`b-shift-${b.id}`} hint="Everything below derives from the shift">
                <Select
                  id={`b-shift-${b.id}`}
                  value={editForm.shiftId}
                  onChange={(ev) => setEditForm({ ...editForm, shiftId: ev.target.value })}
                >
                  <option value="">Unassigned</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Date" htmlFor={`b-date-${b.id}`}>
                <Input
                  id={`b-date-${b.id}`}
                  type="date"
                  value={editForm.date}
                  onChange={(ev) => setEditForm({ ...editForm, date: ev.target.value })}
                />
              </Field>
              <Field label="Timings" htmlFor={`b-timings-${b.id}`}>
                <Input id={`b-timings-${b.id}`} value={shift?.window ?? '—'} readOnly />
              </Field>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <Stat label="Staff" value={emps.length} />
              <Stat label="Locations" value={locs.length} />
              <Stat label="Avail. stock" value={stockOf(shift)} />
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-4">
              <Button variant="primary" onClick={saveEdit} disabled={!dirty || numberTaken}>
                Save changes
              </Button>
              <Button variant="ghost" onClick={() => setExpandedId(null)}>
                Cancel
              </Button>
              <Button variant="danger" className="ml-auto" onClick={() => setConfirmDelete(b)}>
                <Trash2 size={14} />
                Delete
              </Button>
            </div>
          </div>

          {/* Read-only, shift-derived detail */}
          <div className="space-y-4 lg:border-l lg:border-border lg:pl-5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-text">{shift?.name ?? 'No shift'}</span>
              {shift && <StatusPill status={shift.status} />}
              <span className="text-2xs text-muted ml-auto tnum">
                {shift?.window ?? ''} · {b.date}
              </span>
            </div>

            <div>
              <h4 className="text-2xs uppercase tracking-wide text-muted mb-2">
                Employees on shift ({emps.length})
              </h4>
              {emps.length === 0 ? (
                <p className="text-2xs text-muted">No employees on this shift.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {emps.map((e) => (
                    <span
                      key={e.id}
                      className="inline-flex items-center gap-1.5 text-2xs border border-border rounded-[3px] px-1.5 py-0.5 text-text-2"
                    >
                      {e.name}
                      <span className="text-muted capitalize">· {e.role}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-2xs uppercase tracking-wide text-muted mb-2">
                Locations ({locs.length})
              </h4>
              {locs.length === 0 ? (
                <p className="text-2xs text-muted">No locations on this shift.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {locs.map((r) => (
                    <span
                      key={r.id}
                      className="text-2xs border border-border rounded-[3px] px-1.5 py-0.5 text-text-2"
                    >
                      {r.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-2xs uppercase tracking-wide text-muted mb-2">
                Products &amp; stock ({prods.length})
              </h4>
              {prods.length === 0 ? (
                <p className="text-2xs text-muted">No products on this shift.</p>
              ) : (
                <div className="border border-border rounded-[3px] divide-y divide-border">
                  {prods.map(({ product, stock }) => (
                    <div key={product!.id} className="flex items-center justify-between px-3 py-2 text-[13px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-2xs text-text-2 tnum">{product!.code}</span>
                        <span className="text-text-2 truncate">{product!.name}</span>
                        <span className="text-2xs text-muted shrink-0">{product!.type}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-2xs text-text tnum font-medium">{stock} stk</span>
                        <StatusPill status={product!.status} />
                      </div>
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
        title={labels.bays}
        description="Numbered loading bays. Each connects to a shift and inherits its staff, locations, products and stock."
        action={
          <Button variant="primary" onClick={openCreate} disabled={shifts.length === 0 || atCapacity}>
            <Plus size={16} />
            New bay
          </Button>
        }
      />

      {shifts.length === 0 ? (
        <div className="border border-border rounded-[4px] bg-surface p-8 text-center text-[13px] text-text-2">
          No shifts yet. Create a shift first, then add bays under it.
        </div>
      ) : (
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border-b border-border">
            <div className="relative flex-1 min-w-0 sm:max-w-sm">
              <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
              <Input
                placeholder="Search bay #, shift, employee or date"
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <span className="text-2xs text-muted sm:ml-auto whitespace-nowrap">
              {bays.length} / {maxBays} bays used
            </span>
          </div>
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(b) => b.id}
            onRowClick={toggleRow}
            expandedKey={expandedId}
            renderExpanded={renderExpanded}
            empty="No bays match your search."
          />
        </Card>
      )}

      {/* Create bay — centered modal (shift-only) */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New bay"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={saveCreate}
              disabled={!createForm.shiftId || usedNumbers.has(createForm.number)}
            >
              Create bay
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-2xs text-muted">
            A bay only needs a number and a shift — its staff, locations, products and stock all
            come from the shift you pick.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bay number" htmlFor="c-number" hint={`1 – ${maxBays}`}>
              <Select
                id="c-number"
                value={createForm.number}
                onChange={(e) => setCreateForm({ ...createForm, number: Number(e.target.value) })}
              >
                {freeNumbers.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Date" htmlFor="c-date">
              <Input
                id="c-date"
                type="date"
                value={createForm.date}
                onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Shift" htmlFor="c-shift">
            <Select
              id="c-shift"
              value={createForm.shiftId}
              onChange={(e) => setCreateForm({ ...createForm, shiftId: e.target.value })}
            >
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.window}
                </option>
              ))}
            </Select>
          </Field>

          {createForm.shiftId && (
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Staff" value={empsOf(shiftById(createForm.shiftId)).length} />
              <Stat label="Locations" value={routesOf(shiftById(createForm.shiftId)).length} />
              <Stat label="Avail. stock" value={stockOf(shiftById(createForm.shiftId))} />
            </div>
          )}
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete bay"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirmDelete) {
                  deleteBay(confirmDelete.id);
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
          Delete bay <span className="font-mono text-2xs">BAY {confirmDelete?.number}</span>? Any
          products staged here will be unassigned from it. This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border rounded-[3px] bg-surface px-3 py-2">
      <div className="text-lg font-semibold text-text tnum leading-none">{value}</div>
      <div className="text-2xs text-muted mt-1 truncate">{label}</div>
    </div>
  );
}
