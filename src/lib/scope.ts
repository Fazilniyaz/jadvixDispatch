import { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { today } from '@/data/seed';
import type { Employee, LeaveRequest } from './types';

/**
 * Every hub-level module reads through these so the whole app follows the
 * currently selected hub. Switch the hub in the header and every screen moves.
 */
export const useScopeId = () => useStore((s) => s.activeHubId);

export function useScopedEmployees() {
  const hubId = useScopeId();
  const employees = useStore((s) => s.employees);
  return useMemo(() => employees.filter((e) => e.hubId === hubId), [employees, hubId]);
}

export function useScopedProducts() {
  const hubId = useScopeId();
  const products = useStore((s) => s.products);
  return useMemo(() => products.filter((p) => p.hubId === hubId), [products, hubId]);
}

export function useScopedShifts() {
  const hubId = useScopeId();
  const shifts = useStore((s) => s.shifts);
  return useMemo(
    () => shifts.filter((s) => s.hubId === hubId).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [shifts, hubId]
  );
}

export function useScopedRoutes() {
  const hubId = useScopeId();
  const routes = useStore((s) => s.routes);
  return useMemo(
    () => routes.filter((r) => r.hubId === hubId).sort((a, b) => a.order - b.order),
    [routes, hubId]
  );
}

export function useScopedBays(date?: string) {
  const hubId = useScopeId();
  const bays = useStore((s) => s.bays);
  return useMemo(
    () => bays.filter((b) => b.hubId === hubId && (date ? b.date === date : true)),
    [bays, hubId, date]
  );
}

export function useScopedLeave() {
  const hubId = useScopeId();
  const leaveRequests = useStore((s) => s.leaveRequests);
  return useMemo(() => leaveRequests.filter((l) => l.hubId === hubId), [leaveRequests, hubId]);
}

export function useScopedTickets() {
  const hubId = useScopeId();
  const vehicleTickets = useStore((s) => s.vehicleTickets);
  return useMemo(() => vehicleTickets.filter((t) => t.hubId === hubId), [vehicleTickets, hubId]);
}

export function useScopedQueries() {
  const hubId = useScopeId();
  const queries = useStore((s) => s.queries);
  return useMemo(() => queries.filter((q) => q.hubId === hubId), [queries, hubId]);
}

export function useScopedReminders() {
  const hubId = useScopeId();
  const reminders = useStore((s) => s.reminders);
  const user = useStore((s) => s.user);
  return useMemo(
    () =>
      reminders.filter((r) => {
        if (r.hubId !== hubId || !user) return r.hubId === hubId;
        // Personal reminders go to exactly one person.
        if (r.forEmployeeId) return r.forEmployeeId === user.employeeId;
        return r.forRoles.includes(user.role);
      }),
    [reminders, hubId, user]
  );
}

export function useScopedPenalties() {
  const hubId = useScopeId();
  const penalties = useStore((s) => s.penalties);
  return useMemo(() => penalties.filter((p) => p.hubId === hubId), [penalties, hubId]);
}

export function useScopedPayslips() {
  const hubId = useScopeId();
  const payslips = useStore((s) => s.payslips);
  return useMemo(() => payslips.filter((p) => p.hubId === hubId), [payslips, hubId]);
}

export function useScopedCheckIns() {
  const hubId = useScopeId();
  const checkIns = useStore((s) => s.checkIns);
  return useMemo(() => checkIns.filter((c) => c.hubId === hubId), [checkIns, hubId]);
}

export function useScopedMessages() {
  const hubId = useScopeId();
  const messages = useStore((s) => s.messages);
  return useMemo(() => messages.filter((m) => m.hubId === hubId), [messages, hubId]);
}

/** True when the employee is on approved leave covering `date`. */
export function onLeave(e: Employee, leave: LeaveRequest[], date = today()) {
  if (e.status === 'leave') return true;
  return leave.some(
    (l) => l.employeeId === e.id && l.status === 'approved' && l.from <= date && l.to >= date
  );
}

export const money = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

/* ── Uniqueness guards — used by every create/edit form ─────────────────── */

const norm = (v: string) => v.trim().toLowerCase();

/** True when another credential already uses this email. */
export function useEmailTaken() {
  const credentials = useStore((s) => s.credentials);
  const employees = useStore((s) => s.employees);
  return (email: string, exceptCredentialId?: string) => {
    const key = norm(email);
    if (!key) return false;
    return (
      credentials.some((c) => c.id !== exceptCredentialId && norm(c.email) === key) ||
      employees.some((e) => e.email && norm(e.email) === key && e.id !== exceptCredentialId)
    );
  };
}

/** True when another hub already uses this code (codes are global identifiers). */
export function useHubCodeTaken() {
  const hubs = useStore((s) => s.hubs);
  return (code: string, exceptHubId?: string) => {
    const key = norm(code);
    if (!key) return false;
    return hubs.some((h) => h.id !== exceptHubId && norm(h.code) === key);
  };
}

/** True when another product at this hub already uses this code. */
export function useProductCodeTaken() {
  const products = useStore((s) => s.products);
  return (code: string, exceptId?: string) => {
    const key = norm(code);
    if (!key) return false;
    return products.some((p) => p.id !== exceptId && norm(p.code) === key);
  };
}

/** Render "HH:MM" in the user's chosen 12h/24h format. Used app-wide. */
export function formatTime(hhmm: string, fmt: '12h' | '24h'): string {
  if (!hhmm || !hhmm.includes(':')) return hhmm || '—';
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  if (Number.isNaN(h)) return hhmm;
  if (fmt === '24h') return `${String(h).padStart(2, '0')}:${mStr}`;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${suffix}`;
}

/** Hook form: reads the setting from the store. */
export function useTimeFormatter() {
  const fmt = useStore((s) => s.timeFormat);
  return (hhmm: string) => formatTime(hhmm, fmt);
}
