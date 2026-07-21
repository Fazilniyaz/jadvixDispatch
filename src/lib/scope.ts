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
      reminders.filter(
        (r) =>
          r.hubId === hubId &&
          (!user ||
            r.forRoles.includes(user.role) ||
            (!!user.employeeId && r.forEmployeeId === user.employeeId))
      ),
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
