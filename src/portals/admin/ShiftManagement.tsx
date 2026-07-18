import { useState, type ReactNode } from 'react';
import { AlertTriangle, ChevronRight, Clock, Pencil, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Field, Input } from '@/components/Field';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import type { Shift } from '@/lib/types';

// Shift Management is fully independent — a shift is just a name and a time
// window. The only rule is that windows may not overlap. Max 4 shifts.
const MAX_SHIFTS = 4;
const DASH = '–';

type FormState = { name: string; start: string; end: string };

const emptyForm = (): FormState => ({ name: '', start: '', end: '' });

// Pull the two HH:MM values back out of a stored "HH:MM – HH:MM" window.
function parseWindow(window: string): { start: string; end: string } {
  const m = window.match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
  return m ? { start: m[1], end: m[2] } : { start: '', end: '' };
}

const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const pad2 = (n: number) => String(n).padStart(2, '0');
const fmt = (min: number) => `${pad2(Math.floor(min / 60))}:${pad2(min % 60)}`;

// Expand a window into 1–2 day-segments (wraps past midnight when end < start).
function segments(start: number, end: number): [number, number][] {
  if (start === end) return [];
  if (start < end) return [[start, end]];
  return [
    [start, 1440],
    [0, end],
  ];
}

const rangesOverlap = (aS: number, aE: number, bS: number, bE: number) => aS < bE && bS < aE;

function windowsConflict(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  const a = segments(aStart, aEnd);
  const b = segments(bStart, bEnd);
  return a.some(([aS, aE]) => b.some(([bS, bE]) => rangesOverlap(aS, aE, bS, bE)));
}

// Human-friendly window length, accounting for overnight wrap.
function durationLabel(start: number, end: number): string {
  const mins = (end - start + 1440) % 1440 || 1440;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function ShiftManagement() {
  const shifts = useStore((s) => s.shifts);
  const labels = useStore((s) => s.moduleLabels);
  const addShift = useStore((s) => s.addShift);
  const updateShift = useStore((s) => s.updateShift);
  const deleteShift = useStore((s) => s.deleteShift);

  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [confirmDelete, setConfirmDelete] = useState<Shift | null>(null);
  // Conflict popup: which existing shifts clash with the one being saved.
  const [conflicts, setConflicts] = useState<Shift[] | null>(null);
  // Click a card to expand a read-only detail view.
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const atLimit = shifts.length >= MAX_SHIFTS;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setPanelOpen(true);
  };

  const openEdit = (s: Shift) => {
    setEditing(s);
    setForm({ name: s.name, ...parseWindow(s.window) });
    setPanelOpen(true);
  };

  const nameOk = form.name.trim().length > 0;
  const timesOk = !!form.start && !!form.end && form.start !== form.end;
  const canSave = nameOk && timesOk;

  const save = () => {
    if (!canSave) return;
    const startMin = toMin(form.start);
    const endMin = toMin(form.end);

    // Check the new window against every OTHER shift.
    const clashing = shifts.filter((s) => {
      if (editing && s.id === editing.id) return false;
      const w = parseWindow(s.window);
      if (!w.start || !w.end) return false;
      return windowsConflict(startMin, endMin, toMin(w.start), toMin(w.end));
    });

    if (clashing.length > 0) {
      setConflicts(clashing);
      return;
    }

    const window = `${fmt(startMin)} ${DASH} ${fmt(endMin)}`;
    const name = form.name.trim();
    if (editing) updateShift(editing.id, { name, window });
    else addShift({ name, window });
    setPanelOpen(false);
  };

  return (
    <div>
      <PageHeader
        title={labels.shifts}
        description="Plan the day in up to four shifts. Windows must not overlap."
        action={
          <Button variant="primary" onClick={openCreate} disabled={atLimit}>
            <Plus size={16} />
            New shift
          </Button>
        }
      />

      {atLimit && (
        <div className="mb-4 flex items-center gap-2 text-[13px] text-text-2 border border-border rounded-[3px] bg-surface-2 px-3 py-2">
          <AlertTriangle size={14} className="text-muted" />
          You've reached the maximum of {MAX_SHIFTS} shifts. Delete one to add another.
        </div>
      )}

      {shifts.length === 0 ? (
        <Card className="p-10 text-center text-[13px] text-text-2">
          No shifts yet. Create your first shift to plan the day.
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shifts.map((shift) => {
            const w = parseWindow(shift.window);
            const dur = w.start && w.end ? durationLabel(toMin(w.start), toMin(w.end)) : '';
            const overnight = !!w.start && !!w.end && toMin(w.end) < toMin(w.start);
            const isExpanded = expandedId === shift.id;
            return (
              <Card key={shift.id}>
                <CardHeader
                  title={shift.name}
                  subtitle={
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={12} className="text-muted" />
                      <span className="tnum">{shift.window}</span>
                    </span>
                  }
                  action={
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(shift)}
                        aria-label="Edit shift"
                        title="Edit"
                        className="text-muted hover:text-text p-1 rounded-[3px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(shift)}
                        aria-label="Delete shift"
                        title="Delete"
                        className="text-muted hover:text-exception p-1 rounded-[3px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  }
                />
                <button
                  type="button"
                  onClick={() => setExpandedId((prev) => (prev === shift.id ? null : shift.id))}
                  aria-expanded={isExpanded}
                  className="w-full p-4 flex items-end justify-between text-left hover:bg-surface-2 transition-colors"
                >
                  <div>
                    <div className="font-display text-2xl font-semibold text-text tnum leading-none">
                      {w.start || '—'}
                    </div>
                    <div className="text-2xs text-muted mt-1">start</div>
                  </div>
                  <div className="text-muted text-2xs flex items-center gap-1">
                    {dur}
                    <ChevronRight
                      size={13}
                      className={cn('transition-transform', isExpanded && 'rotate-90 text-text')}
                    />
                  </div>
                  <div className="text-right">
                    <div className="font-display text-2xl font-semibold text-text tnum leading-none">
                      {w.end || '—'}
                    </div>
                    <div className="text-2xs text-muted mt-1">end</div>
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-border px-4 py-3 grid grid-cols-2 gap-3">
                    <ShiftDetail label="Window" mono>{shift.window}</ShiftDetail>
                    <ShiftDetail label="Duration">{dur || '—'}</ShiftDetail>
                    <ShiftDetail label="Type">{overnight ? 'Overnight' : 'Daytime'}</ShiftDetail>
                    <ShiftDetail label="Shift ID" mono>{shift.id}</ShiftDetail>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / edit shift */}
      <Modal
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editing ? `Edit shift · ${editing.name}` : 'New shift'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPanelOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save} disabled={!canSave}>
              {editing ? 'Save changes' : 'Create shift'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Shift name" htmlFor="s-name">
            <Input
              id="s-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Morning Wave"
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start time" htmlFor="s-start">
              <Input
                id="s-start"
                type="time"
                className="tnum"
                value={form.start}
                onChange={(e) => setForm({ ...form, start: e.target.value })}
              />
            </Field>
            <Field label="End time" htmlFor="s-end">
              <Input
                id="s-end"
                type="time"
                className="tnum"
                value={form.end}
                onChange={(e) => setForm({ ...form, end: e.target.value })}
              />
            </Field>
          </div>
          {form.start && form.end && form.start === form.end && (
            <p className="text-2xs text-exception">Start and end time can't be the same.</p>
          )}
          <p className="text-2xs text-muted">
            An end time earlier than the start is treated as an overnight shift (e.g. 22:00 {DASH} 06:00).
          </p>
        </div>
      </Modal>

      {/* Conflict popup */}
      <Modal
        open={!!conflicts}
        onClose={() => setConflicts(null)}
        title={
          <span className="flex items-center gap-2 text-exception">
            <AlertTriangle size={16} />
            Shifts having conflicts
          </span>
        }
        footer={
          <Button variant="primary" onClick={() => setConflicts(null)}>
            Adjust times
          </Button>
        }
      >
        <p className="text-[13px] text-text-2">
          The window{' '}
          <span className="font-mono text-text tnum">
            {form.start} {DASH} {form.end}
          </span>{' '}
          overlaps with:
        </p>
        <ul className="mt-3 space-y-1.5">
          {conflicts?.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between border border-border rounded-[3px] px-3 py-2"
            >
              <span className="text-[13px] font-medium text-text">{s.name}</span>
              <span className="font-mono text-2xs text-text-2 tnum">{s.window}</span>
            </li>
          ))}
        </ul>
        <p className="text-2xs text-muted mt-3">
          Pick a window that doesn't cross any existing shift's time range.
        </p>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete shift"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirmDelete) deleteShift(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-text-2">
          Delete the <span className="font-medium text-text">{confirmDelete?.name}</span> shift? This
          cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

function ShiftDetail({
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
