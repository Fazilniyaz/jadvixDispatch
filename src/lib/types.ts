// Domain types for Jadvix Dispatch.

export type Role = 'admin' | 'driver';

// Built-in types plus any custom types added from Product Management.
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
  code: string; // mono product code
  name: string;
  type: ProductType;
  assignedEmployeeId: string | null;
  arrivalInfo: string; // how / when received
  shiftId: string | null;
  bayId: string | null;
  routeId: string | null;
  deliveryStatus: DeliveryStatus;
  status: ProductStatus;
  eta: string;
}

// Built-in roles plus any custom role label entered when creating an employee.
export type EmployeeRole = 'driver' | 'dispatcher' | (string & {});
export type EmployeeStatus = 'active' | 'leave';

export interface DeliveryRecord {
  date: string;
  productCode: string;
  route: string;
}

export interface Employee {
  id: string;
  name: string;
  vehicleNo: string;
  contactNo: string;
  role: EmployeeRole;
  shift: string; // shift name
  status: EmployeeStatus;
  deliveredCount: number;
  errorCount: number; // failed / exception deliveries
  recentBayIds: string[];
  recentRouteIds: string[];
  history: DeliveryRecord[];
}

// Each shift runs as a single wave, so its status lives on the shift itself.
export type ShiftStatus = 'pending' | 'active' | 'completed';

export interface Shift {
  id: string;
  name: string; // Morning | Afternoon | Night
  window: string;
  status: ShiftStatus;
}

export interface Bay {
  id: string;
  shiftId: string | null; // the shift this bay runs under
  assignedDriverId: string | null;
  vehicleNo: string;
  stocks: number; // number of items staged in the bay
  date: string; // yyyy-mm-dd the bay was staged for
}

// A single delivery point (area + coordinates + ETA).
export interface RouteStop {
  areaName: string;
  coordinates: string; // "13.02, 80.22"
  eta: string;
}

export type RouteStatus = 'planned' | 'active' | 'completed';

// A location is a single delivery point that belongs to a shift.
export interface Route {
  id: string;
  name: string;
  areaName: string;
  coordinates: string; // "13.02, 80.22"
  eta: string;
  shiftId: string | null;
  assignedDriverId: string | null;
  order: number;
  status: RouteStatus;
}

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  from: string;
  to: string;
  reason: string;
  status: LeaveStatus;
}

export interface Message {
  id: string;
  from: 'dispatch' | 'driver';
  authorId: string;
  text: string;
  time: string;
}

// Vehicle repair tickets submitted by drivers and reviewed by admin.
export type VehicleTicketStatus = 'submitted' | 'reviewed' | 'accepted' | 'failed';

export interface VehicleTicket {
  id: string;
  employeeId: string;        // the driver who submitted
  vehicleNo: string;
  subject: string;            // short title
  notes: string;              // description of the repair
  photoAttached: boolean;     // whether a photo was attached
  status: VehicleTicketStatus;
  adminRemarks: string;       // admin can add remarks during review
  createdAt: string;          // ISO date string
  updatedAt: string;          // ISO date string
}

export type ModuleKey =
  | 'dashboard'
  | 'products'
  | 'employees'
  | 'shifts'
  | 'bays'
  | 'routes'
  | 'leave'
  | 'communication'
  | 'vehicles'
  | 'settings';

export type ModuleLabels = Record<ModuleKey, string>;

export interface AuthUser {
  email: string;
  role: Role;
  employeeId: string | null;
  name: string;
}
