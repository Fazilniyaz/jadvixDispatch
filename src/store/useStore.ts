import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AuthUser,
  Bay,
  Employee,
  LeaveRequest,
  Message,
  ModuleKey,
  ModuleLabels,
  Product,
  ProductStatus,
  Route,
  Shift,
  Wave,
} from '@/lib/types';
import {
  activeShiftId as seedActiveShiftId,
  activeWaveId as seedActiveWaveId,
  defaultModuleLabels,
  seedBays,
  seedEmployees,
  seedLeaveRequests,
  seedMessages,
  seedProducts,
  seedRoutes,
  seedShifts,
  seedWaves,
} from '@/data/seed';

export type ThemePref = 'light' | 'dark' | 'system';

// Demo credentials.
const CREDENTIALS: Record<string, { password: string; user: AuthUser }> = {
  'admin@gmail.com': {
    password: 'admin@123',
    user: { email: 'admin@gmail.com', role: 'admin', employeeId: null, name: 'Admin' },
  },
  'driver@gmail.com': {
    password: 'driver@123',
    user: { email: 'driver@gmail.com', role: 'driver', employeeId: 'emp-01', name: 'Arjun Menon' },
  },
};

function nid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowTime(): string {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

interface StoreState {
  // auth
  user: AuthUser | null;
  theme: ThemePref;

  // data
  products: Product[];
  employees: Employee[];
  shifts: Shift[];
  waves: Wave[];
  bays: Bay[];
  routes: Route[];
  leaveRequests: LeaveRequest[];
  messages: Message[];
  moduleLabels: ModuleLabels;
  activeShiftId: string;
  activeWaveId: string;

  // auth actions
  login: (email: string, password: string) => { ok: boolean; role?: string };
  logout: () => void;
  setTheme: (t: ThemePref) => void;

  // products
  addProduct: (p: Omit<Product, 'id' | 'code'> & { code?: string }) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  assignProduct: (id: string, employeeId: string | null) => void;
  advanceProductStatus: (id: string, status: ProductStatus) => void;

  // employees
  addEmployee: (e: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, patch: Partial<Employee>) => void;

  // shifts / waves
  addShift: (s: Omit<Shift, 'id' | 'waveIds'>) => void;
  updateShift: (id: string, patch: Partial<Shift>) => void;
  deleteShift: (id: string) => void;
  setActive: (shiftId: string, waveId: string) => void;
  updateWave: (id: string, patch: Partial<Wave>) => void;

  // bays
  updateBay: (id: string, patch: Partial<Bay>) => void;

  // routes
  addRoute: (r: Omit<Route, 'id'>) => void;
  updateRoute: (id: string, patch: Partial<Route>) => void;
  deleteRoute: (id: string) => void;

  // leave
  addLeaveRequest: (r: Omit<LeaveRequest, 'id' | 'status'>) => void;
  approveLeave: (id: string) => void;
  rejectLeave: (id: string) => void;

  // messages
  sendMessage: (from: 'dispatch' | 'driver', authorId: string, text: string) => void;

  // module labels
  setModuleLabel: (key: ModuleKey, label: string) => void;
  resetModuleLabels: () => void;

  // maintenance
  resetDemo: () => void;
}

const seedState = () => ({
  products: seedProducts,
  employees: seedEmployees,
  shifts: seedShifts,
  waves: seedWaves,
  bays: seedBays,
  routes: seedRoutes,
  leaveRequests: seedLeaveRequests,
  messages: seedMessages,
  moduleLabels: defaultModuleLabels,
  activeShiftId: seedActiveShiftId,
  activeWaveId: seedActiveWaveId,
});

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      user: null,
      theme: 'system',
      ...seedState(),

      login: (email, password) => {
        const rec = CREDENTIALS[email.trim().toLowerCase()];
        if (rec && rec.password === password) {
          set({ user: rec.user });
          return { ok: true, role: rec.user.role };
        }
        return { ok: false };
      },
      logout: () => set({ user: null }),
      setTheme: (theme) => set({ theme }),

      addProduct: (p) =>
        set((s) => ({
          products: [
            {
              ...p,
              id: nid('p'),
              code: p.code && p.code.trim() ? p.code : `JDX-${nid('').slice(1, 5).toUpperCase()}`,
            } as Product,
            ...s.products,
          ],
        })),
      updateProduct: (id, patch) =>
        set((s) => ({
          products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      deleteProduct: (id) =>
        set((s) => ({ products: s.products.filter((p) => p.id !== id) })),
      assignProduct: (id, employeeId) =>
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id ? { ...p, assignedEmployeeId: employeeId } : p
          ),
        })),
      advanceProductStatus: (id, status) =>
        set((s) => ({
          products: s.products.map((p) => {
            if (p.id !== id) return p;
            const deliveryStatus =
              status === 'delivered'
                ? 'delivered'
                : status === 'exception'
                  ? 'failed'
                  : 'pending';
            return { ...p, status, deliveryStatus };
          }),
        })),

      addEmployee: (e) => set((s) => ({ employees: [{ ...e, id: nid('emp') }, ...s.employees] })),
      updateEmployee: (id, patch) =>
        set((s) => ({
          employees: s.employees.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),

      addShift: (sh) =>
        set((s) => ({ shifts: [...s.shifts, { ...sh, id: nid('shift'), waveIds: [] }] })),
      updateShift: (id, patch) =>
        set((s) => ({ shifts: s.shifts.map((sh) => (sh.id === id ? { ...sh, ...patch } : sh)) })),
      deleteShift: (id) =>
        set((s) => ({
          shifts: s.shifts.filter((sh) => sh.id !== id),
          waves: s.waves.filter((w) => w.shiftId !== id),
        })),
      setActive: (activeShiftId, activeWaveId) => set({ activeShiftId, activeWaveId }),
      updateWave: (id, patch) =>
        set((s) => ({ waves: s.waves.map((w) => (w.id === id ? { ...w, ...patch } : w)) })),

      updateBay: (id, patch) =>
        set((s) => ({ bays: s.bays.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),

      addRoute: (r) => set((s) => ({ routes: [...s.routes, { ...r, id: nid('route') }] })),
      updateRoute: (id, patch) =>
        set((s) => ({ routes: s.routes.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      deleteRoute: (id) => set((s) => ({ routes: s.routes.filter((r) => r.id !== id) })),

      addLeaveRequest: (r) =>
        set((s) => ({
          leaveRequests: [{ ...r, id: nid('lr'), status: 'pending' }, ...s.leaveRequests],
        })),
      approveLeave: (id) =>
        set((s) => {
          const req = s.leaveRequests.find((r) => r.id === id);
          return {
            leaveRequests: s.leaveRequests.map((r) =>
              r.id === id ? { ...r, status: 'approved' } : r
            ),
            employees: req
              ? s.employees.map((e) => (e.id === req.employeeId ? { ...e, status: 'leave' } : e))
              : s.employees,
          };
        }),
      rejectLeave: (id) =>
        set((s) => ({
          leaveRequests: s.leaveRequests.map((r) =>
            r.id === id ? { ...r, status: 'rejected' } : r
          ),
        })),

      sendMessage: (from, authorId, text) =>
        set((s) => ({
          messages: [
            ...s.messages,
            { id: nid('m'), from, authorId, text, time: nowTime() },
          ],
        })),

      setModuleLabel: (key, label) =>
        set((s) => ({ moduleLabels: { ...s.moduleLabels, [key]: label } })),
      resetModuleLabels: () => set({ moduleLabels: { ...defaultModuleLabels } }),

      resetDemo: () => set({ ...seedState() }),
    }),
    {
      name: 'jadvix-dispatch',
    }
  )
);

// Selector helpers used across portals.
export const useCurrentEmployee = () => {
  const user = useStore((s) => s.user);
  const employees = useStore((s) => s.employees);
  if (!user?.employeeId) return null;
  return employees.find((e) => e.id === user.employeeId) ?? null;
};
