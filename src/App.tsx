import { lazy, Suspense, useEffect, type ComponentType } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { useThemeEffect } from '@/store/useTheme';
import { useStore, usePermittedModules } from '@/store/useStore';
import { PortalShell } from '@/components/PortalShell';
import type { ModuleKey } from '@/lib/types';

// Landing page is retained in src/pages/Landing.tsx but not routed — "/" goes
// straight to the login screen.
import Login from '@/pages/Login';

const Dashboard = lazy(() => import('@/modules/Dashboard'));
const Companies = lazy(() => import('@/modules/Companies'));
const Invoices = lazy(() => import('@/modules/Invoices'));
const Hubs = lazy(() => import('@/modules/Hubs'));
const Stats = lazy(() => import('@/modules/Stats'));
const Products = lazy(() => import('@/modules/Products'));
const Employees = lazy(() => import('@/modules/Employees'));
const Shifts = lazy(() => import('@/modules/Shifts'));
const Bays = lazy(() => import('@/modules/Bays'));
const Locations = lazy(() => import('@/modules/Locations'));
const Leave = lazy(() => import('@/modules/Leave'));
const Communication = lazy(() => import('@/modules/Communication'));
const Vehicles = lazy(() => import('@/modules/Vehicles'));
const Salary = lazy(() => import('@/modules/Salary'));
const Billing = lazy(() => import('@/modules/Billing'));
const Queries = lazy(() => import('@/modules/Queries'));
const RemindersPage = lazy(() => import('@/modules/Reminders'));
const SettingsPage = lazy(() => import('@/modules/Settings'));

const REGISTRY: Record<ModuleKey, ComponentType> = {
  dashboard: Dashboard,
  companies: Companies,
  invoices: Invoices,
  hubs: Hubs,
  stats: Stats,
  products: Products,
  employees: Employees,
  shifts: Shifts,
  bays: Bays,
  locations: Locations,
  leave: Leave,
  communication: Communication,
  vehicles: Vehicles,
  salary: Salary,
  billing: Billing,
  queries: Queries,
  reminders: RemindersPage,
  settings: SettingsPage,
};

function Fallback() {
  return (
    <div className="grid place-items-center py-24">
      <span className="font-mono text-2xs uppercase tracking-[0.2em] text-muted animate-pulse">
        Loading…
      </span>
    </div>
  );
}

/** Renders the module named in the URL, if the signed-in role may open it. */
function ModuleRoute() {
  const { moduleKey } = useParams<{ moduleKey: string }>();
  const permitted = usePermittedModules();
  const key = moduleKey as ModuleKey;
  const Component = key ? REGISTRY[key] : undefined;

  if (!Component) return <Navigate to="/app/dashboard" replace />;
  if (!permitted.includes(key)) {
    return (
      <div className="border border-border rounded-[4px] bg-surface p-10 text-center">
        <h2 className="font-display text-xl font-semibold text-text">Module not available</h2>
        <p className="mt-2 text-[13px] text-text-2 max-w-sm mx-auto">
          Your role doesn’t have access to this module. Ask your Super Admin to enable it in
          Settings → Portal access.
        </p>
      </div>
    );
  }
  return (
    <Suspense fallback={<Fallback />}>
      <Component />
    </Suspense>
  );
}

function AppArea() {
  const user = useStore((s) => s.user);
  const syncMissed = useStore((s) => s.syncMissedCheckInReminders);

  // Stands in for the server job that watches for missed check-ins.
  useEffect(() => {
    if (user) syncMissed();
  }, [user, syncMissed]);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <PortalShell>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path=":moduleKey" element={<ModuleRoute />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </PortalShell>
  );
}

export default function App() {
  useThemeEffect();
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/app/*" element={<AppArea />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
