// Domain types for Jadvix Dispatch.

export type Role = 'admin' | 'driver';

export type ProductType = 'Fragile' | 'Baked' | 'Packed' | 'Frozen' | 'Standard';
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
  waveId: string | null;
  bayId: string | null;
  routeId: string | null;
  deliveryStatus: DeliveryStatus;
  status: ProductStatus;
  eta: string;
}

export type EmployeeRole = 'driver' | 'dispatcher';
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
  recentBayIds: string[];
  recentRouteIds: string[];
  history: DeliveryRecord[];
}

export type WaveStatus = 'pending' | 'active' | 'completed';

export interface Wave {
  id: string;
  shiftId: string;
  number: string; // "1st", "2nd"
  window: string;
  status: WaveStatus;
  assignedEmployeeIds: string[];
}

export interface Shift {
  id: string;
  name: string; // Morning | Afternoon | Night
  window: string;
  waveIds: string[];
}

export interface Bay {
  id: string;
  assignedDriverId: string | null;
  vehicleNo: string;
  loaded: number;
  capacity: number;
}

export interface RouteStop {
  areaName: string;
  coordinates: string; // "13.02, 80.22"
  eta: string;
}

export type RouteStatus = 'planned' | 'active' | 'completed';

export interface Route {
  id: string;
  name: string; // "Area A -> Area B"
  stops: RouteStop[];
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

export type ModuleKey =
  | 'dashboard'
  | 'products'
  | 'employees'
  | 'shifts'
  | 'bays'
  | 'routes'
  | 'leave'
  | 'communication'
  | 'settings';

export type ModuleLabels = Record<ModuleKey, string>;

export interface AuthUser {
  email: string;
  role: Role;
  employeeId: string | null;
  name: string;
}
