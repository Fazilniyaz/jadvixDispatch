// ─────────────────────────────────────────────────────────────────────────────
// Jadvix HubOS — domain model
//
// Tenancy: Master (Jadvix)  →  Company (Super Admin)  →  Hub  →  people.
// Almost every operational record carries a `hubId`; the store scopes reads to
// the currently selected hub so every module shows one hub at a time.
// ─────────────────────────────────────────────────────────────────────────────

/* ── Roles & access ─────────────────────────────────────────────────────── */

export type Role =
  | 'master'
  | 'super-admin'
  | 'hub-manager'
  | 'hub-team-leader'
  | 'hub-finance'
  | 'driver';

export const HUB_AUTHORITY_ROLES: Role[] = ['hub-manager', 'hub-team-leader', 'hub-finance'];

export const ROLE_LABELS: Record<Role, string> = {
  master: 'Master',
  'super-admin': 'Super Admin',
  'hub-manager': 'Hub Manager',
  'hub-team-leader': 'Team Leader',
  'hub-finance': 'HR & Finance',
  driver: 'Driver',
};

export type ModuleKey =
  | 'dashboard'
  | 'stats'
  | 'hubs'
  | 'products'
  | 'employees'
  | 'shifts'
  | 'bays'
  | 'locations'
  | 'leave'
  | 'communication'
  | 'vehicles'
  | 'salary'
  | 'billing'
  | 'queries'
  | 'reminders'
  | 'companies'
  | 'invoices'
  | 'settings';

/** Which modules a role may open, per company. Super Admin edits this. */
export type PermissionMap = Record<Role, ModuleKey[]>;

/* ── Tenancy ────────────────────────────────────────────────────────────── */

export type CompanyStatus = 'active' | 'suspended';

export interface Company {
  id: string;
  name: string;
  code: string;            // short tenant code, e.g. NORTHWIND
  contactEmail: string;
  city: string;
  status: CompanyStatus;
  createdAt: string;       // ISO
  // Commercial terms charged by Jadvix (Master portal).
  setupFee: number;        // recurring monthly platform fee
  perHubFee: number;       // per hub, per month
  perEmployeeFee: number;  // per employee, per month
}

export interface Hub {
  id: string;
  companyId: string;
  name: string;
  code: string;            // hub code used in credentials
  address: string;
  city: string;
  imageUrl: string;        // remote or data URI; may be empty
  createdAt: string;
}

/* ── Credentials ────────────────────────────────────────────────────────── */

export interface Credential {
  id: string;
  role: Role;
  /** Master has neither; Super Admin has companyId; hub roles + drivers have both. */
  companyId: string | null;
  hubId: string | null;
  employeeId: string | null; // drivers link to their Employee record
  email: string;
  password: string;
  hubCode: string;           // blank for master / super-admin
  blocked: boolean;
  createdAt: string;
}

export interface AuthUser {
  credentialId: string;
  role: Role;
  companyId: string | null;
  hubId: string | null;
  employeeId: string | null;
  name: string;
  email: string;
}

/* ── People ─────────────────────────────────────────────────────────────── */

export type EmployeeRole = 'driver' | 'dispatcher' | (string & {});

export type EmployeeStatus =
  | 'full-time'
  | 'contract-based'
  | 'leave'
  | 'active'
  | 'inactive';

export interface DeliveryRecord {
  date: string;
  productCode: string;
  route: string;
}

export interface Employee {
  id: string;
  hubId: string;
  name: string;
  vehicleNo: string;
  contactNo: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  // Portal login (drivers). Mirrored into a Credential when set.
  email?: string;
  password?: string;
  /** Roles this person is allowed to message. Super Admin decides. */
  canMessage: Role[];
  // Payroll inputs
  monthlyPay: number;
  joinedAt: string;          // ISO date — drives Master's leaver proration
  resignedAt?: string;       // ISO date when they left
  deliveredCount: number;
  errorCount: number;
  history: DeliveryRecord[];
}

/* ── Operations ─────────────────────────────────────────────────────────── */

export type ProductType = 'Fragile' | 'Baked' | 'Packed' | 'Frozen' | 'Standard' | (string & {});
export type DeliveryStatus = 'pending' | 'delivered' | 'failed';
export type ProductStatus =
  | 'scheduled'
  | 'picked'
  | 'transit'
  | 'out'
  | 'delivered'
  | 'exception';

export interface Product {
  id: string;
  hubId: string;
  code: string;
  name: string;
  type: ProductType;
  status: ProductStatus;
  deliveryStatus: DeliveryStatus;
}

/** A shift has a START TIME ONLY — no end time. */
export interface Shift {
  id: string;
  hubId: string;
  name: string;
  startTime: string; // "HH:MM"
}

export type RouteStatus = 'planned' | 'active' | 'completed';

/** A location is a single delivery point. */
export interface Route {
  id: string;
  hubId: string;
  name: string;
  areaName: string;
  coordinates: string;
  eta: string;
  order: number;
  status: RouteStatus;
}

export type BayStatus = 'active' | 'shipped' | 'ready';

/**
 * The hub of the system. A bay row for a given shift + date ties together an
 * employee, a product and a location. Once its day is completed it is frozen.
 */
export interface Bay {
  id: string;
  hubId: string;
  shiftId: string | null;
  date: string;              // yyyy-mm-dd
  number: number;            // per shift+date, 1..maxBays
  assignedDriverId: string | null;
  vehicleNo: string;
  productId: string | null;
  routeId: string | null;
  status: BayStatus;
  completed: boolean;        // frozen / immutable
  completedAt?: string;
}

/* ── Attendance & vehicles ──────────────────────────────────────────────── */

export interface CheckIn {
  id: string;
  hubId: string;
  employeeId: string;
  date: string;              // yyyy-mm-dd
  /** Four sides — data URIs or placeholder markers. */
  photos: { front: string; back: string; left: string; right: string };
  createdAt: string;
}

export type VehicleTicketStatus = 'submitted' | 'reviewed' | 'accepted' | 'failed';

export interface VehicleTicket {
  id: string;
  hubId: string;
  employeeId: string;
  vehicleNo: string;
  subject: string;
  notes: string;
  photoAttached: boolean;
  status: VehicleTicketStatus;
  adminRemarks: string;
  createdAt: string;
  updatedAt: string;
}

/* ── Leave ──────────────────────────────────────────────────────────────── */

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  hubId: string;
  employeeId: string;
  from: string;
  to: string;
  reason: string;
  status: LeaveStatus;
  decidedBy?: string;
}

/* ── Communication ──────────────────────────────────────────────────────── */

export interface Message {
  id: string;
  hubId: string;
  /** Employee id for drivers, or a role key for authorities. */
  fromId: string;
  fromRole: Role;
  toId: string;
  text: string;
  time: string;
  createdAt: string;
}

/* ── Queries (incidents) ────────────────────────────────────────────────── */

export type QueryType = 'accident' | 'salary-mismatch' | 'delivery-error' | 'fraud' | 'other';
export type QueryStatus = 'open' | 'investigating' | 'resolved' | 'dismissed';

export interface QueryTicket {
  id: string;
  hubId: string;
  type: QueryType;
  subject: string;
  body: string;
  raisedById: string;        // employee id or role key
  raisedByRole: Role;
  /** When set, the employee at fault — name is hidden from other drivers. */
  offenderEmployeeId: string | null;
  status: QueryStatus;
  response: string;
  createdAt: string;
  updatedAt: string;
}

/* ── Reminders ──────────────────────────────────────────────────────────── */

export type ReminderType = 'leave-request' | 'missed-checkin' | 'query' | 'billing' | 'notice';

export interface Reminder {
  id: string;
  hubId: string;
  type: ReminderType;
  title: string;
  body: string;
  /** Who should see it. */
  forRoles: Role[];
  forEmployeeId?: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

/* ── Money ──────────────────────────────────────────────────────────────── */

export type PayrollStatus = 'draft' | 'issued' | 'paid';

export interface Payslip {
  id: string;
  hubId: string;
  employeeId: string;
  period: string;            // "2026-07" or "2026-W29"
  cadence: 'monthly' | 'weekly';
  baseAmount: number;
  penalties: number;
  net: number;
  status: PayrollStatus;
  issuedAt: string;
}

export type PenaltyStatus = 'pending' | 'applied' | 'waived';

export interface Penalty {
  id: string;
  hubId: string;
  employeeId: string;
  reason: string;
  amount: number;
  date: string;
  status: PenaltyStatus;
}

/** Master → Company invoice. */
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export interface InvoiceLine {
  label: string;
  qty: number;
  unit: number;
  amount: number;
}

export interface Invoice {
  id: string;
  companyId: string;
  period: string;            // "2026-07"
  lines: InvoiceLine[];
  total: number;
  status: InvoiceStatus;
  issuedAt: string;
}

/* ── Misc ───────────────────────────────────────────────────────────────── */

export type ModuleLabels = Record<ModuleKey, string>;
