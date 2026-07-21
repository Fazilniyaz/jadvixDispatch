import {
  BarChart3,
  Building2,
  CalendarClock,
  FileText,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  Package,
  PlaneTakeoff,
  ReceiptText,
  Settings as SettingsIcon,
  Siren,
  Users,
  Wallet,
  Warehouse,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { ModuleKey, PermissionMap, Role } from './types';

export interface ModuleMeta {
  key: ModuleKey;
  label: string;
  icon: LucideIcon;
  /** Roles that may EVER see this module (hard ceiling — Super Admin can't grant beyond it). */
  availableTo: Role[];
  /** Ticked by default when Super Admin creates a portal for this role. */
  defaultFor: Role[];
  group: 'overview' | 'operations' | 'people' | 'money' | 'system';
}

const ALL_HUB: Role[] = ['hub-manager', 'hub-team-leader', 'hub-finance'];
const HUB_AND_SUPER: Role[] = ['super-admin', ...ALL_HUB];
const HUB_SUPER_DRIVER: Role[] = ['super-admin', ...ALL_HUB, 'driver'];

/**
 * The single source of truth for navigation and routing. Every portal renders
 * the same shell; only this list (filtered by permissions) differs.
 */
export const MODULES: ModuleMeta[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    availableTo: ['master', ...HUB_SUPER_DRIVER],
    defaultFor: ['master', ...HUB_SUPER_DRIVER],
    group: 'overview',
  },
  // ── Master only ──
  {
    key: 'companies',
    label: 'Companies',
    icon: Building2,
    availableTo: ['master'],
    defaultFor: ['master'],
    group: 'overview',
  },
  {
    key: 'invoices',
    label: 'Invoices',
    icon: ReceiptText,
    availableTo: ['master'],
    defaultFor: ['master'],
    group: 'money',
  },
  // ── Super Admin only ──
  {
    key: 'hubs',
    label: 'Hub Management',
    icon: Building2,
    availableTo: ['super-admin'],
    defaultFor: ['super-admin'],
    group: 'overview',
  },
  // ── Operations ──
  {
    key: 'stats',
    label: 'Stats',
    icon: BarChart3,
    availableTo: HUB_AND_SUPER,
    defaultFor: ['super-admin', 'hub-manager', 'hub-team-leader'],
    group: 'overview',
  },
  {
    key: 'products',
    label: 'Product Management',
    icon: Package,
    availableTo: HUB_AND_SUPER,
    defaultFor: ['super-admin', 'hub-manager', 'hub-team-leader'],
    group: 'operations',
  },
  {
    key: 'employees',
    label: 'Employee Management',
    icon: Users,
    availableTo: HUB_AND_SUPER,
    defaultFor: ['super-admin', 'hub-manager', 'hub-team-leader'],
    group: 'people',
  },
  {
    key: 'shifts',
    label: 'Shift Management',
    icon: CalendarClock,
    availableTo: HUB_AND_SUPER,
    defaultFor: ['super-admin', 'hub-manager', 'hub-team-leader'],
    group: 'operations',
  },
  {
    key: 'bays',
    label: 'Bay Management',
    icon: Warehouse,
    availableTo: HUB_AND_SUPER,
    defaultFor: ['super-admin', 'hub-manager', 'hub-team-leader'],
    group: 'operations',
  },
  {
    key: 'locations',
    label: 'Location Management',
    icon: MapPin,
    availableTo: HUB_AND_SUPER,
    defaultFor: ['super-admin', 'hub-manager', 'hub-team-leader'],
    group: 'operations',
  },
  // ── Shared with drivers ──
  {
    key: 'leave',
    label: 'Leave Requests',
    icon: PlaneTakeoff,
    availableTo: HUB_SUPER_DRIVER,
    defaultFor: HUB_SUPER_DRIVER,
    group: 'people',
  },
  {
    key: 'communication',
    label: 'Communication',
    icon: MessageSquare,
    availableTo: HUB_SUPER_DRIVER,
    defaultFor: HUB_SUPER_DRIVER,
    group: 'people',
  },
  {
    key: 'vehicles',
    label: 'Vehicle Management',
    icon: Wrench,
    availableTo: HUB_SUPER_DRIVER,
    defaultFor: HUB_SUPER_DRIVER,
    group: 'operations',
  },
  {
    key: 'salary',
    label: 'Salary & Invoice',
    icon: Wallet,
    availableTo: HUB_SUPER_DRIVER,
    defaultFor: HUB_SUPER_DRIVER,
    group: 'money',
  },
  {
    key: 'billing',
    label: 'Billing & Penalties',
    icon: FileText,
    availableTo: HUB_SUPER_DRIVER,
    defaultFor: HUB_SUPER_DRIVER,
    group: 'money',
  },
  {
    key: 'queries',
    label: 'Queries',
    icon: Siren,
    availableTo: HUB_SUPER_DRIVER,
    defaultFor: HUB_SUPER_DRIVER,
    group: 'people',
  },
  {
    key: 'reminders',
    label: 'Reminders',
    icon: PlaneTakeoff,
    availableTo: HUB_SUPER_DRIVER,
    defaultFor: HUB_SUPER_DRIVER,
    group: 'people',
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: SettingsIcon,
    availableTo: ['master', ...HUB_SUPER_DRIVER],
    defaultFor: ['master', ...HUB_SUPER_DRIVER],
    group: 'system',
  },
];

export const MODULE_BY_KEY: Record<ModuleKey, ModuleMeta> = MODULES.reduce(
  (acc, m) => ({ ...acc, [m.key]: m }),
  {} as Record<ModuleKey, ModuleMeta>
);

export const defaultModuleLabels = MODULES.reduce(
  (acc, m) => ({ ...acc, [m.key]: m.label }),
  {} as Record<ModuleKey, string>
);

/** Build the starting permission map a new company gets. */
export function buildDefaultPermissions(): PermissionMap {
  const roles: Role[] = [
    'master',
    'super-admin',
    'hub-manager',
    'hub-team-leader',
    'hub-finance',
    'driver',
  ];
  return roles.reduce((acc, role) => {
    acc[role] = MODULES.filter((m) => m.defaultFor.includes(role)).map((m) => m.key);
    return acc;
  }, {} as PermissionMap);
}

/** Modules a Super Admin is allowed to toggle for a given role. */
export function grantableModules(role: Role): ModuleMeta[] {
  return MODULES.filter((m) => m.availableTo.includes(role));
}
