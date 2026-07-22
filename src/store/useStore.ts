import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AuthUser,
  Bay,
  BayStatus,
  CheckIn,
  Company,
  Credential,
  Employee,
  Hub,
  Invoice,
  LeaveRequest,
  Message,
  ModuleKey,
  ModuleLabels,
  Payslip,
  Penalty,
  PermissionMap,
  Product,

  QueryTicket,
  Reminder,
  Role,
  Route,
  Shift,
  VehicleTicket,
  VehicleTicketStatus,
} from '@/lib/types';
import { buildDefaultPermissions, defaultModuleLabels, MODULE_BY_KEY } from '@/lib/modules';
import {
  currentPeriod,
  daysAgo,
  defaultProductTypes,
  seedBays,
  seedCheckIns,
  seedCompanies,
  seedCredentials,
  seedEmployees,
  seedHubs,
  seedInvoices,
  seedLeaveRequests,
  seedMessages,
  seedPayslips,
  seedPenalties,
  seedProducts,
  seedQueries,
  seedReminders,
  seedRoutes,
  seedShifts,
  seedVehicleTickets,
  today,
} from '@/data/seed';

export type ThemePref = 'light' | 'dark' | 'system';
export type TimeFormat = '12h' | '24h';

const nid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;
const nowIso = () => new Date().toISOString();
const hhmm = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

interface State {
  // session / ui
  user: AuthUser | null;
  theme: ThemePref;
  timeFormat: TimeFormat; // applies to every time shown in the app
  sidebarCollapsed: boolean;
  activeHubId: string | null; // the "default hub" the dashboard is scoped to

  // tenancy
  companies: Company[];
  hubs: Hub[];
  credentials: Credential[];
  permissions: Record<string, PermissionMap>; // companyId → role → modules (company default)
  hubPermissions: Record<string, PermissionMap>; // hubId → role → modules (per-hub override)

  // operations
  employees: Employee[];
  shifts: Shift[];
  products: Product[];
  routes: Route[];
  bays: Bay[];
  checkIns: CheckIn[];
  leaveRequests: LeaveRequest[];
  messages: Message[];
  vehicleTickets: VehicleTicket[];
  queries: QueryTicket[];
  reminders: Reminder[];

  // money
  penalties: Penalty[];
  payslips: Payslip[];
  invoices: Invoice[];

  // config
  moduleLabels: ModuleLabels;
  productTypes: string[];
  maxBays: number;

  /* ── auth ── */
  login: (email: string, password: string, hubCode?: string) => { ok: boolean; blocked?: boolean };
  logout: () => void;
  switchHub: (hubId: string) => void;
  setTheme: (t: ThemePref) => void;
  setTimeFormat: (f: TimeFormat) => void;
  toggleSidebar: () => void;

  /* ── permissions ── */
  setRoleModules: (companyId: string, role: Role, modules: ModuleKey[]) => void;
  toggleRoleModule: (companyId: string, role: Role, key: ModuleKey) => void;
  setHubRoleModules: (hubId: string, role: Role, modules: ModuleKey[]) => void;
  toggleHubRoleModule: (hubId: string, role: Role, key: ModuleKey) => void;

  /* ── companies / hubs / credentials ── */
  addCompany: (c: Omit<Company, 'id' | 'createdAt'>) => void;
  updateCompany: (id: string, patch: Partial<Company>) => void;
  deleteCompany: (id: string) => void;
  addHub: (h: Omit<Hub, 'id' | 'createdAt'>) => void;
  updateHub: (id: string, patch: Partial<Hub>) => void;
  deleteHub: (id: string) => void;
  addCredential: (c: Omit<Credential, 'id' | 'createdAt' | 'blocked'>) => void;
  updateCredential: (id: string, patch: Partial<Credential>) => void;
  deleteCredential: (id: string) => void;

  /* ── employees ── */
  addEmployee: (e: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, patch: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  /* ── products / shifts / locations ── */
  addProduct: (p: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addProductType: (t: string) => void;
  deleteProductType: (t: string) => void;
  addShift: (s: Omit<Shift, 'id'>) => void;
  updateShift: (id: string, patch: Partial<Shift>) => void;
  deleteShift: (id: string) => void;
  addRoute: (r: Omit<Route, 'id'>) => void;
  updateRoute: (id: string, patch: Partial<Route>) => void;
  deleteRoute: (id: string) => void;

  /* ── bays ── */
  ensureBays: (hubId: string, shiftId: string, date: string) => void;
  updateBay: (id: string, patch: Partial<Bay>) => void;
  reorderBays: (ids: string[]) => void;
  swapBayNumber: (hubId: string, shiftId: string, date: string, bayId: string, n: number) => void;
  assignBayDriver: (bayId: string, driverId: string | null) => void;
  completeBayDay: (hubId: string, shiftId: string, date: string) => void;
  duplicateBayDay: (hubId: string, shiftId: string, fromDate: string, toDate: string) => void;
  setMaxBays: (n: number) => void;

  /* ── attendance / vehicles ── */
  checkIn: (hubId: string, employeeId: string, photos: CheckIn['photos']) => void;
  addVehicleTicket: (t: Omit<VehicleTicket, 'id' | 'status' | 'adminRemarks' | 'createdAt' | 'updatedAt'>) => void;
  updateVehicleTicket: (id: string, status: VehicleTicketStatus, remarks?: string) => void;

  /* ── leave ── */
  addLeaveRequest: (r: Omit<LeaveRequest, 'id' | 'status'>) => void;
  decideLeave: (id: string, status: 'approved' | 'rejected', by: string) => void;

  /* ── communication ── */
  sendMessage: (m: Omit<Message, 'id' | 'time' | 'createdAt'>) => void;

  /* ── queries ── */
  addQuery: (q: Omit<QueryTicket, 'id' | 'status' | 'response' | 'createdAt' | 'updatedAt'>) => void;
  updateQuery: (id: string, patch: Partial<QueryTicket>) => void;

  /* ── reminders ── */
  pushReminder: (r: Omit<Reminder, 'id' | 'read' | 'createdAt'>) => void;
  markReminderRead: (id: string) => void;
  syncMissedCheckInReminders: () => void;

  /* ── money ── */
  addPenalty: (p: Omit<Penalty, 'id' | 'status'>) => void;
  updatePenalty: (id: string, patch: Partial<Penalty>) => void;
  generatePayslips: (hubId: string, period: string, cadence: 'monthly' | 'weekly') => void;
  updatePayslip: (id: string, patch: Partial<Payslip>) => void;
  generateInvoice: (companyId: string, period: string) => void;
  updateInvoice: (id: string, patch: Partial<Invoice>) => void;

  /* ── config ── */
  setModuleLabel: (k: ModuleKey, label: string) => void;
  resetModuleLabels: () => void;
  resetDemo: () => void;
}

const seedState = () => ({
  companies: seedCompanies,
  hubs: seedHubs,
  credentials: seedCredentials,
  permissions: {
    'co-01': buildDefaultPermissions(),
    'co-02': buildDefaultPermissions(),
  } as Record<string, PermissionMap>,
  hubPermissions: {} as Record<string, PermissionMap>,
  employees: seedEmployees,
  shifts: seedShifts,
  products: seedProducts,
  routes: seedRoutes,
  bays: seedBays,
  checkIns: seedCheckIns,
  leaveRequests: seedLeaveRequests,
  messages: seedMessages,
  vehicleTickets: seedVehicleTickets,
  queries: seedQueries,
  reminders: seedReminders,
  penalties: seedPenalties,
  payslips: seedPayslips,
  invoices: seedInvoices,
  moduleLabels: { ...defaultModuleLabels } as ModuleLabels,
  productTypes: [...defaultProductTypes],
  maxBays: 12,
  activeHubId: 'hub-01' as string | null,
});

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      user: null,
      theme: 'system',
      timeFormat: '24h',
      sidebarCollapsed: false,
      ...seedState(),

      /* ── auth ─────────────────────────────────────────────────────────── */
      login: (email, password, hubCode) => {
        const key = email.trim().toLowerCase();
        const cred = get().credentials.find(
          (c) => c.email.trim().toLowerCase() === key && c.password === password
        );
        if (!cred) return { ok: false };
        if (cred.blocked) return { ok: false, blocked: true };
        // Hub roles may additionally be verified by hub code when supplied.
        if (hubCode && cred.hubCode && cred.hubCode.toLowerCase() !== hubCode.trim().toLowerCase()) {
          return { ok: false };
        }
        const emp = cred.employeeId
          ? get().employees.find((e) => e.id === cred.employeeId)
          : null;
        if (emp && emp.status === 'inactive') return { ok: false, blocked: true };
        const company = cred.companyId ? get().companies.find((c) => c.id === cred.companyId) : null;
        const name =
          emp?.name ??
          (cred.role === 'master'
            ? 'Jadvix Master'
            : cred.role === 'super-admin'
              ? company?.name ?? 'Super Admin'
              : cred.email.split('@')[0]);
        set({
          user: {
            credentialId: cred.id,
            role: cred.role,
            companyId: cred.companyId,
            hubId: cred.hubId,
            employeeId: cred.employeeId,
            name,
            email: cred.email,
          },
          // Super Admin lands on their company's first hub; others are pinned.
          activeHubId:
            cred.hubId ??
            get().hubs.find((h) => h.companyId === cred.companyId)?.id ??
            null,
        });
        return { ok: true };
      },
      logout: () => set({ user: null }),
      switchHub: (hubId) => set({ activeHubId: hubId }),
      setTheme: (theme) => set({ theme }),
      setTimeFormat: (timeFormat) => set({ timeFormat }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      /* ── permissions ──────────────────────────────────────────────────── */
      setRoleModules: (companyId, role, modules) =>
        set((s) => ({
          permissions: {
            ...s.permissions,
            [companyId]: { ...s.permissions[companyId], [role]: modules },
          },
        })),
      setHubRoleModules: (hubId, role, modules) =>
        set((s) => ({
          hubPermissions: {
            ...s.hubPermissions,
            [hubId]: { ...(s.hubPermissions[hubId] ?? buildDefaultPermissions()), [role]: modules },
          },
        })),
      toggleHubRoleModule: (hubId, role, key) =>
        set((s) => {
          const map = s.hubPermissions[hubId] ?? buildDefaultPermissions();
          const cur = map[role] ?? [];
          const next = cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key];
          return { hubPermissions: { ...s.hubPermissions, [hubId]: { ...map, [role]: next } } };
        }),
      toggleRoleModule: (companyId, role, key) =>
        set((s) => {
          const map = s.permissions[companyId] ?? buildDefaultPermissions();
          const cur = map[role] ?? [];
          const next = cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key];
          return {
            permissions: { ...s.permissions, [companyId]: { ...map, [role]: next } },
          };
        }),

      /* ── companies / hubs / credentials ───────────────────────────────── */
      addCompany: (c) =>
        set((s) => {
          const id = nid('co');
          return {
            companies: [...s.companies, { ...c, id, createdAt: nowIso() }],
            permissions: { ...s.permissions, [id]: buildDefaultPermissions() },
          };
        }),
      updateCompany: (id, patch) =>
        set((s) => ({ companies: s.companies.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      deleteCompany: (id) =>
        set((s) => {
          const hubIds = s.hubs.filter((h) => h.companyId === id).map((h) => h.id);
          return {
            companies: s.companies.filter((c) => c.id !== id),
            hubs: s.hubs.filter((h) => h.companyId !== id),
            credentials: s.credentials.filter((c) => c.companyId !== id),
            employees: s.employees.filter((e) => !hubIds.includes(e.hubId)),
          };
        }),
      addHub: (h) => set((s) => ({ hubs: [...s.hubs, { ...h, id: nid('hub'), createdAt: nowIso() }] })),
      updateHub: (id, patch) =>
        set((s) => ({ hubs: s.hubs.map((h) => (h.id === id ? { ...h, ...patch } : h)) })),
      deleteHub: (id) =>
        set((s) => ({
          hubs: s.hubs.filter((h) => h.id !== id),
          credentials: s.credentials.filter((c) => c.hubId !== id),
          employees: s.employees.filter((e) => e.hubId !== id),
          bays: s.bays.filter((b) => b.hubId !== id),
          activeHubId: s.activeHubId === id ? s.hubs.find((h) => h.id !== id)?.id ?? null : s.activeHubId,
        })),
      addCredential: (c) =>
        set((s) => ({
          credentials: [...s.credentials, { ...c, id: nid('cr'), blocked: false, createdAt: nowIso() }],
        })),
      updateCredential: (id, patch) =>
        set((s) => ({ credentials: s.credentials.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      deleteCredential: (id) =>
        set((s) => ({ credentials: s.credentials.filter((c) => c.id !== id) })),

      /* ── employees ────────────────────────────────────────────────────── */
      addEmployee: (e) =>
        set((s) => {
          const id = nid('emp');
          const employees = [...s.employees, { ...e, id }];
          // Drivers with credentials get a matching login automatically.
          const credentials =
            e.role === 'driver' && e.email && e.password
              ? [
                  ...s.credentials,
                  {
                    id: nid('cr'),
                    role: 'driver' as Role,
                    companyId: s.hubs.find((h) => h.id === e.hubId)?.companyId ?? null,
                    hubId: e.hubId,
                    employeeId: id,
                    email: e.email,
                    password: e.password,
                    hubCode: s.hubs.find((h) => h.id === e.hubId)?.code ?? '',
                    blocked: false,
                    createdAt: nowIso(),
                  },
                ]
              : s.credentials;
          return { employees, credentials };
        }),
      updateEmployee: (id, patch) =>
        set((s) => ({
          employees: s.employees.map((e) => (e.id === id ? { ...e, ...patch } : e)),
          // keep the driver's login in sync
          credentials: s.credentials.map((c) =>
            c.employeeId === id
              ? {
                  ...c,
                  ...(patch.email !== undefined ? { email: patch.email ?? c.email } : {}),
                  ...(patch.password !== undefined ? { password: patch.password ?? c.password } : {}),
                  ...(patch.status !== undefined ? { blocked: patch.status === 'inactive' } : {}),
                }
              : c
          ),
        })),
      deleteEmployee: (id) =>
        set((s) => ({
          employees: s.employees.filter((e) => e.id !== id),
          credentials: s.credentials.filter((c) => c.employeeId !== id),
          bays: s.bays.map((b) =>
            b.assignedDriverId === id && !b.completed
              ? { ...b, assignedDriverId: null, vehicleNo: '' }
              : b
          ),
        })),

      /* ── products / shifts / locations ────────────────────────────────── */
      addProduct: (p) =>
        set((s) => ({
          products: [
            { ...p, id: nid('p'), code: p.code?.trim() || `JDX-${nid('').slice(1, 5).toUpperCase()}` },
            ...s.products,
          ],
        })),
      updateProduct: (id, patch) =>
        set((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      deleteProduct: (id) =>
        set((s) => ({
          products: s.products.filter((p) => p.id !== id),
          bays: s.bays.map((b) => (b.productId === id && !b.completed ? { ...b, productId: null } : b)),
        })),
      addProductType: (t) =>
        set((s) => (s.productTypes.includes(t) ? {} : { productTypes: [...s.productTypes, t] })),
      deleteProductType: (t) =>
        set((s) => ({
          productTypes: s.productTypes.filter((x) => x !== t),
          products: s.products.map((p) => (p.type === t ? { ...p, type: 'Standard' } : p)),
        })),
      addShift: (sh) => set((s) => ({ shifts: [...s.shifts, { ...sh, id: nid('sh') }] })),
      updateShift: (id, patch) =>
        set((s) => ({ shifts: s.shifts.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteShift: (id) =>
        set((s) => ({
          shifts: s.shifts.filter((x) => x.id !== id),
          bays: s.bays.filter((b) => b.shiftId !== id),
        })),
      addRoute: (r) => set((s) => ({ routes: [...s.routes, { ...r, id: nid('loc') }] })),
      updateRoute: (id, patch) =>
        set((s) => ({ routes: s.routes.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      deleteRoute: (id) =>
        set((s) => ({
          routes: s.routes.filter((r) => r.id !== id),
          bays: s.bays.map((b) => (b.routeId === id && !b.completed ? { ...b, routeId: null } : b)),
        })),

      /* ── bays ─────────────────────────────────────────────────────────── */
      ensureBays: (hubId, shiftId, date) =>
        set((s) => {
          const mine = s.bays
            .filter((b) => b.hubId === hubId && b.shiftId === shiftId && b.date === date)
            .sort((a, b) => a.number - b.number);
          const others = s.bays.filter(
            (b) => !(b.hubId === hubId && b.shiftId === shiftId && b.date === date)
          );

          // Shrinking: drop surplus rows from the end, but never discard a bay
          // that's been staged or already completed.
          if (mine.length > s.maxBays) {
            const keep: typeof mine = [];
            const droppable = (b: (typeof mine)[number]) =>
              !b.completed && !b.assignedDriverId && !b.productId && !b.routeId;
            for (let i = mine.length - 1; i >= 0; i--) {
              const surplus = mine.length - keep.length - (mine.length - 1 - i) > s.maxBays;
              if (surplus && droppable(mine[i])) continue;
              keep.unshift(mine[i]);
            }
            const trimmed = keep.map((b, i) => ({ ...b, number: i + 1 }));
            return { bays: [...others, ...trimmed] };
          }

          if (mine.length === s.maxBays) {
            const already = mine.every((b, i) => b.number === i + 1);
            if (already) return {};
            return { bays: [...others, ...mine.map((b, i) => ({ ...b, number: i + 1 }))] };
          }

          const renum = mine.map((b, i) => ({ ...b, number: i + 1 }));
          const created: Bay[] = Array.from({ length: s.maxBays - renum.length }, (_, i) => ({
            id: nid('bay'),
            hubId,
            shiftId,
            date,
            number: renum.length + i + 1,
            assignedDriverId: null,
            vehicleNo: '',
            productId: null,
            routeId: null,
            status: 'active' as BayStatus,
            completed: false,
          }));
          return { bays: [...others, ...renum, ...created] };
        }),
      updateBay: (id, patch) =>
        set((s) => ({
          bays: s.bays.map((b) => (b.id === id && !b.completed ? { ...b, ...patch } : b)),
        })),
      reorderBays: (ids) =>
        set((s) => {
          const pos = new Map(ids.map((id, i) => [id, i + 1] as const));
          return {
            bays: s.bays.map((b) => (pos.has(b.id) && !b.completed ? { ...b, number: pos.get(b.id)! } : b)),
          };
        }),
      swapBayNumber: (hubId, shiftId, date, bayId, n) =>
        set((s) => {
          const target = s.bays.find((b) => b.id === bayId);
          if (!target || target.completed || target.number === n) return {};
          const cur = target.number;
          return {
            bays: s.bays.map((b) => {
              if (b.hubId !== hubId || b.shiftId !== shiftId || b.date !== date) return b;
              if (b.id === bayId) return { ...b, number: n };
              if (b.number === n) return { ...b, number: cur };
              return b;
            }),
          };
        }),
      assignBayDriver: (bayId, driverId) =>
        set((s) => {
          const bay = s.bays.find((b) => b.id === bayId);
          if (!bay || bay.completed) return {};
          const driver = driverId ? s.employees.find((e) => e.id === driverId) : null;
          return {
            bays: s.bays.map((b) => {
              if (b.id === bayId)
                return { ...b, assignedDriverId: driverId, vehicleNo: driver?.vehicleNo ?? '' };
              // one driver per bay, per shift+date
              if (
                driverId &&
                b.assignedDriverId === driverId &&
                b.date === bay.date &&
                b.shiftId === bay.shiftId &&
                !b.completed
              )
                return { ...b, assignedDriverId: null, vehicleNo: '' };
              return b;
            }),
          };
        }),
      completeBayDay: (hubId, shiftId, date) =>
        set((s) => ({
          bays: s.bays.map((b) =>
            b.hubId === hubId && b.shiftId === shiftId && b.date === date
              ? { ...b, completed: true, completedAt: nowIso() }
              : b
          ),
        })),
      duplicateBayDay: (hubId, shiftId, fromDate, toDate) =>
        set((s) => {
          const source = s.bays
            .filter((b) => b.hubId === hubId && b.shiftId === shiftId && b.date === fromDate)
            .sort((a, b) => a.number - b.number);
          if (source.length === 0) return {};
          const kept = s.bays.filter(
            (b) => !(b.hubId === hubId && b.shiftId === shiftId && b.date === toDate)
          );
          // Carry the whole staged plan across — driver, vehicle, product,
          // location and status — not just the row count.
          const copies: Bay[] = source.map((b, i) => ({
            id: nid('bay'),
            hubId: b.hubId,
            shiftId: b.shiftId,
            date: toDate,
            number: i + 1,
            assignedDriverId: b.assignedDriverId,
            vehicleNo: b.vehicleNo,
            productId: b.productId,
            routeId: b.routeId,
            status: b.status,
            completed: false,
            completedAt: undefined,
          }));
          return { bays: [...kept, ...copies] };
        }),
      setMaxBays: (n) => set({ maxBays: Math.max(1, Math.min(40, Math.floor(n) || 1)) }),

      /* ── attendance / vehicles ────────────────────────────────────────── */
      checkIn: (hubId, employeeId, photos) =>
        set((s) => {
          const date = today();
          const existing = s.checkIns.find((c) => c.employeeId === employeeId && c.date === date);
          if (existing) {
            return {
              checkIns: s.checkIns.map((c) =>
                c.id === existing.id ? { ...c, photos, createdAt: nowIso() } : c
              ),
            };
          }
          return {
            checkIns: [
              ...s.checkIns,
              { id: nid('ci'), hubId, employeeId, date, photos, createdAt: nowIso() },
            ],
          };
        }),
      addVehicleTicket: (t) =>
        set((s) => ({
          vehicleTickets: [
            { ...t, id: nid('vt'), status: 'submitted', adminRemarks: '', createdAt: nowIso(), updatedAt: nowIso() },
            ...s.vehicleTickets,
          ],
        })),
      updateVehicleTicket: (id, status, remarks) =>
        set((s) => ({
          vehicleTickets: s.vehicleTickets.map((v) =>
            v.id === id
              ? { ...v, status, adminRemarks: remarks ?? v.adminRemarks, updatedAt: nowIso() }
              : v
          ),
        })),

      /* ── leave ────────────────────────────────────────────────────────── */
      addLeaveRequest: (r) =>
        set((s) => {
          const emp = s.employees.find((e) => e.id === r.employeeId);
          return {
            leaveRequests: [{ ...r, id: nid('lv'), status: 'pending' }, ...s.leaveRequests],
            reminders: [
              {
                id: nid('rm'),
                hubId: r.hubId,
                type: 'leave-request' as const,
                title: 'Leave request awaiting review',
                body: `${emp?.name ?? 'An employee'} requested leave (${r.from} → ${r.to}).`,
                forRoles: ['hub-manager', 'hub-team-leader', 'hub-finance'] as Role[],
                read: false,
                createdAt: nowIso(),
                link: '/app/leave',
              },
              ...s.reminders,
            ],
          };
        }),
      decideLeave: (id, status, by) =>
        set((s) => {
          const req = s.leaveRequests.find((r) => r.id === id);
          return {
            leaveRequests: s.leaveRequests.map((r) =>
              r.id === id ? { ...r, status, decidedBy: by } : r
            ),
            employees:
              req && status === 'approved'
                ? s.employees.map((e) => (e.id === req.employeeId ? { ...e, status: 'leave' } : e))
                : s.employees,
            // Tell the driver what was decided.
            reminders: req
              ? [
                  {
                    id: nid('rm'),
                    hubId: req.hubId,
                    type: 'leave-request' as const,
                    title: `Leave ${status}`,
                    body: `Your leave (${req.from} → ${req.to}) was ${status}${by ? ` by ${by}` : ''}.`,
                    forRoles: ['driver'] as Role[],
                    forEmployeeId: req.employeeId,
                    read: false,
                    createdAt: nowIso(),
                    link: '/app/leave',
                  },
                  ...s.reminders,
                ]
              : s.reminders,
          };
        }),

      /* ── communication ────────────────────────────────────────────────── */
      sendMessage: (m) =>
        set((s) => ({
          messages: [...s.messages, { ...m, id: nid('ms'), time: hhmm(), createdAt: nowIso() }],
        })),

      /* ── queries ──────────────────────────────────────────────────────── */
      addQuery: (q) =>
        set((s) => ({
          queries: [
            { ...q, id: nid('q'), status: 'open', response: '', createdAt: nowIso(), updatedAt: nowIso() },
            ...s.queries,
          ],
          reminders: [
            {
              id: nid('rm'),
              hubId: q.hubId,
              type: 'query' as const,
              title: `New query — ${q.subject}`,
              body: q.body.slice(0, 120),
              forRoles: ['hub-manager', 'hub-team-leader', 'hub-finance'] as Role[],
              read: false,
              createdAt: nowIso(),
              link: '/app/queries',
            },
            ...s.reminders,
          ],
        })),
      updateQuery: (id, patch) =>
        set((s) => ({
          queries: s.queries.map((q) => (q.id === id ? { ...q, ...patch, updatedAt: nowIso() } : q)),
        })),

      /* ── reminders ────────────────────────────────────────────────────── */
      pushReminder: (r) =>
        set((s) => ({
          reminders: [{ ...r, id: nid('rm'), read: false, createdAt: nowIso() }, ...s.reminders],
        })),
      markReminderRead: (id) =>
        set((s) => ({ reminders: s.reminders.map((r) => (r.id === id ? { ...r, read: true } : r)) })),
      /** Any driver with no check-in for 2+ days raises an alert (once per day). */
      syncMissedCheckInReminders: () =>
        set((s) => {
          const cutoff = daysAgo(2);
          const stamp = today();
          const created: Reminder[] = [];
          s.employees
            .filter((e) => e.role === 'driver' && e.status !== 'inactive' && e.status !== 'leave')
            .forEach((e) => {
              const last = s.checkIns
                .filter((c) => c.employeeId === e.id)
                .sort((a, b) => b.date.localeCompare(a.date))[0];
              const missed = !last || last.date < cutoff;
              const already = s.reminders.some(
                (r) =>
                  r.type === 'missed-checkin' &&
                  r.forEmployeeId === e.id &&
                  r.createdAt.slice(0, 10) === stamp
              );
              if (missed && !already) {
                created.push({
                  id: nid('rm'),
                  hubId: e.hubId,
                  type: 'missed-checkin',
                  title: 'Driver has not checked in for 2 days',
                  body: `${e.name} last checked in ${last ? last.date : 'never'}.`,
                  forRoles: ['hub-manager', 'hub-team-leader', 'super-admin'],
                  forEmployeeId: e.id,
                  read: false,
                  createdAt: nowIso(),
                  link: '/app/vehicles',
                });
              }
            });
          return created.length ? { reminders: [...created, ...s.reminders] } : {};
        }),

      /* ── money ────────────────────────────────────────────────────────── */
      addPenalty: (p) =>
        set((s) => {
          const emp = s.employees.find((e) => e.id === p.employeeId);
          return {
            penalties: [{ ...p, id: nid('pn'), status: 'pending' }, ...s.penalties],
            reminders: [
              {
                id: nid('rm'),
                hubId: p.hubId,
                type: 'billing' as const,
                title: 'A penalty was raised against you',
                body: `${p.reason} — ${p.amount}. Raised ${p.date}.`,
                forRoles: ['driver'] as Role[],
                forEmployeeId: p.employeeId,
                read: false,
                createdAt: nowIso(),
                link: '/app/billing',
              },
              ...s.reminders,
            ],
            employees: emp ? s.employees : s.employees,
          };
        }),
      updatePenalty: (id, patch) =>
        set((s) => ({ penalties: s.penalties.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      generatePayslips: (hubId, period, cadence) =>
        set((s) => {
          const staff = s.employees.filter((e) => e.hubId === hubId && e.status !== 'inactive');
          const existing = s.payslips.filter((p) => !(p.hubId === hubId && p.period === period));
          const slips: Payslip[] = staff.map((e) => {
            const pen = s.penalties
              .filter((p) => p.employeeId === e.id && p.status === 'applied')
              .reduce((sum, p) => sum + p.amount, 0);
            const base = cadence === 'weekly' ? Math.round(e.monthlyPay / 4) : e.monthlyPay;
            return {
              id: nid('ps'),
              hubId,
              employeeId: e.id,
              period,
              cadence,
              baseAmount: base,
              penalties: pen,
              net: Math.max(0, base - pen),
              status: 'draft',
              issuedAt: nowIso(),
            };
          });
          return { payslips: [...existing, ...slips] };
        }),
      updatePayslip: (id, patch) =>
        set((s) => {
          const slip = s.payslips.find((p) => p.id === id);
          const notify = slip && (patch.status === 'issued' || patch.status === 'paid');
          return {
            payslips: s.payslips.map((p) => (p.id === id ? { ...p, ...patch } : p)),
            reminders: notify
              ? [
                  {
                    id: nid('rm'),
                    hubId: slip!.hubId,
                    type: 'billing' as const,
                    title: patch.status === 'paid' ? 'Your salary has been paid' : 'Your payslip is ready',
                    body: `${slip!.period} · net ${slip!.net}.`,
                    forRoles: ['driver'] as Role[],
                    forEmployeeId: slip!.employeeId,
                    read: false,
                    createdAt: nowIso(),
                    link: '/app/salary',
                  },
                  ...s.reminders,
                ]
              : s.reminders,
          };
        }),
      /** Master billing: setup + per hub + per employee, with leaver proration. */
      generateInvoice: (companyId, period) =>
        set((s) => {
          const co = s.companies.find((c) => c.id === companyId);
          if (!co) return {};
          const hubIds = s.hubs.filter((h) => h.companyId === companyId).map((h) => h.id);
          const staff = s.employees.filter((e) => hubIds.includes(e.hubId));
          let fullCount = 0;
          let halfCount = 0;
          staff.forEach((e) => {
            if (!e.resignedAt) return fullCount++;
            const days = Math.round(
              (new Date(e.resignedAt).getTime() - new Date(e.joinedAt).getTime()) / 86400000
            );
            if (days <= 14) halfCount++;
            else fullCount++;
          });
          const lines = [
            { label: 'Platform setup fee', qty: 1, unit: co.setupFee, amount: co.setupFee },
            { label: 'Hubs', qty: hubIds.length, unit: co.perHubFee, amount: hubIds.length * co.perHubFee },
            { label: 'Employees (full)', qty: fullCount, unit: co.perEmployeeFee, amount: fullCount * co.perEmployeeFee },
            ...(halfCount
              ? [
                  {
                    label: 'Employees (≤14 days — half)',
                    qty: halfCount,
                    unit: co.perEmployeeFee / 2,
                    amount: (halfCount * co.perEmployeeFee) / 2,
                  },
                ]
              : []),
          ];
          const total = lines.reduce((sum, l) => sum + l.amount, 0);
          const others = s.invoices.filter((i) => !(i.companyId === companyId && i.period === period));
          return {
            invoices: [
              { id: nid('inv'), companyId, period, lines, total, status: 'draft', issuedAt: nowIso() },
              ...others,
            ],
          };
        }),
      updateInvoice: (id, patch) =>
        set((s) => ({ invoices: s.invoices.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),

      /* ── config ───────────────────────────────────────────────────────── */
      setModuleLabel: (k, label) =>
        set((s) => ({ moduleLabels: { ...s.moduleLabels, [k]: label } })),
      resetModuleLabels: () => set({ moduleLabels: { ...defaultModuleLabels } as ModuleLabels }),
      resetDemo: () => set({ ...seedState() }),
    }),
    { name: 'jadvix-hubos', version: 1 }
  )
);

/**
 * Live cross-tab sync. Without this, a change made by (say) a Hub Manager in one
 * tab is invisible to a Super Admin in another until they log out and back in.
 * Rehydrating on the storage event makes every open portal update instantly.
 */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'jadvix-hubos') {
      const session = useStore.getState().user;
      void useStore.persist.rehydrate();
      // Keep *this* tab signed in as whoever it was — only the data should sync.
      queueMicrotask(() => {
        if (session && useStore.getState().user?.credentialId !== session.credentialId) {
          useStore.setState({ user: session });
        }
      });
    }
  });
}

/* ── Derived selectors — the wiring every portal shares ──────────────────── */

export const useCurrentUser = () => useStore((s) => s.user);

/** The hub currently in scope (Super Admin can switch; others are pinned). */
export const useActiveHub = () => {
  const hubs = useStore((s) => s.hubs);
  const activeHubId = useStore((s) => s.activeHubId);
  return hubs.find((h) => h.id === activeHubId) ?? null;
};

export const useCurrentEmployee = () => {
  const user = useStore((s) => s.user);
  const employees = useStore((s) => s.employees);
  if (!user?.employeeId) return null;
  return employees.find((e) => e.id === user.employeeId) ?? null;
};

/** Modules the signed-in role may open, in registry order. */
export const usePermittedModules = (): ModuleKey[] => {
  const user = useStore((s) => s.user);
  const permissions = useStore((s) => s.permissions);
  const hubPermissions = useStore((s) => s.hubPermissions);
  if (!user) return [];
  if (user.role === 'master') {
    return ['dashboard', 'companies', 'invoices', 'settings'];
  }
  // A hub's own grant wins; otherwise fall back to the company default.
  const hubMap = user.hubId ? hubPermissions[user.hubId] : undefined;
  const companyMap = user.companyId ? permissions[user.companyId] : undefined;
  const granted = hubMap?.[user.role] ?? companyMap?.[user.role] ?? [];
  // Hard ceiling: a role can never open a module it isn't available to —
  // e.g. Hub Management is Super Admin only, since hub roles run a single hub.
  return granted.filter((key) => MODULE_BY_KEY[key]?.availableTo.includes(user.role));
};

export const useHasModule = (key: ModuleKey) => usePermittedModules().includes(key);

/** Scoped collection helpers — everything a hub portal reads. */
export const useHubScope = () => {
  const activeHubId = useStore((s) => s.activeHubId);
  return activeHubId;
};

export function isOnLeave(employee: Employee, leaveRequests: LeaveRequest[], date = today()) {
  if (employee.status === 'leave') return true;
  return leaveRequests.some(
    (l) => l.employeeId === employee.id && l.status === 'approved' && l.from <= date && l.to >= date
  );
}

export { currentPeriod };
