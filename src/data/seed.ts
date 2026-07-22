import type {
  Bay,
  CheckIn,
  Company,
  Credential,
  Employee,
  Hub,
  Invoice,
  LeaveRequest,
  Message,
  Payslip,
  Penalty,
  Product,
  QueryTicket,
  Reminder,
  Route,
  Shift,
  VehicleTicket,
} from '@/lib/types';

/* ── date helpers (keep the demo always "today") ─────────────────────────── */
/**
 * Local yyyy-mm-dd. Deliberately NOT toISOString() — that converts to UTC and
 * can report the wrong day for anyone east/west of Greenwich.
 */
export const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const today = () => isoDate(new Date());
export const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDate(d);
};
const nowIso = () => new Date().toISOString();
export const currentPeriod = () => new Date().toISOString().slice(0, 7);

export const defaultProductTypes: string[] = ['Fragile', 'Baked', 'Packed', 'Frozen', 'Standard'];

/* ── Companies ───────────────────────────────────────────────────────────── */
export const seedCompanies: Company[] = [
  {
    id: 'co-01',
    name: 'Northwind Logistics',
    code: 'NORTHWIND',
    contactEmail: 'ops@northwind.example',
    city: 'Chennai',
    status: 'active',
    createdAt: daysAgo(240),
    setupFee: 15000,
    perHubFee: 8000,
    perEmployeeFee: 350,
  },
  {
    id: 'co-02',
    name: 'Meridian Freight',
    code: 'MERIDIAN',
    contactEmail: 'hello@meridian.example',
    city: 'Manchester',
    status: 'active',
    createdAt: daysAgo(96),
    setupFee: 12000,
    perHubFee: 8000,
    perEmployeeFee: 350,
  },
];

/* ── Hubs ────────────────────────────────────────────────────────────────── */
export const seedHubs: Hub[] = [
  {
    id: 'hub-01',
    companyId: 'co-01',
    name: 'Chennai Central',
    code: 'CHN-01',
    address: '14 Anna Salai, Teynampet',
    city: 'Chennai',
    imageUrl: '',
    createdAt: daysAgo(240),
  },
  {
    id: 'hub-02',
    companyId: 'co-01',
    name: 'London East',
    code: 'LDN-02',
    address: 'Unit 7, Hackney Wick Estate',
    city: 'London',
    imageUrl: '',
    createdAt: daysAgo(180),
  },
  {
    id: 'hub-03',
    companyId: 'co-02',
    name: 'Manchester North',
    code: 'MCR-01',
    address: '22 Cheetham Hill Road',
    city: 'Manchester',
    imageUrl: '',
    createdAt: daysAgo(96),
  },
];

/* ── Employees ───────────────────────────────────────────────────────────── */
const emp = (
  id: string,
  hubId: string,
  name: string,
  vehicleNo: string,
  contactNo: string,
  role: string,
  status: Employee['status'],
  monthlyPay: number,
  joinedDaysAgo: number,
  delivered: number,
  errors: number,
  email?: string,
  password?: string
): Employee => ({
  id,
  hubId,
  name,
  vehicleNo,
  contactNo,
  role,
  status,
  email,
  password,
  canMessage: ['hub-manager', 'hub-team-leader'],
  monthlyPay,
  joinedAt: daysAgo(joinedDaysAgo),
  deliveredCount: delivered,
  errorCount: errors,
  history: [],
});

export const seedEmployees: Employee[] = [
  // hub-01 · Chennai Central
  emp('emp-01', 'hub-01', 'Arjun Menon', 'TN-09-BX-4471', '+91 98407 21188', 'driver', 'full-time', 32000, 210, 34, 2, 'driver@gmail.com', 'driver@123'),
  emp('emp-02', 'hub-01', 'Priya Ramesh', 'TN-07-CH-2093', '+91 99620 33471', 'driver', 'active', 30000, 150, 28, 3, 'priya@northwind.example', 'priya@123'),
  emp('emp-03', 'hub-01', 'Meera Nair', 'TN-11-DK-1207', '+91 98847 66102', 'driver', 'active', 30000, 120, 30, 2, 'meera@northwind.example', 'meera@123'),
  emp('emp-04', 'hub-01', 'Karthik Subramaniam', 'TN-01-AZ-8890', '+91 90031 55420', 'driver', 'leave', 29000, 90, 22, 4, 'karthik@northwind.example', 'karthik@123'),
  emp('emp-05', 'hub-01', 'Grace Okafor', 'LB19 TRC', '+44 7700 900987', 'dispatcher', 'full-time', 38000, 200, 0, 0),
  // A short-tenure leaver — drives Master's proration demo (worked 9 days).
  emp('emp-06', 'hub-01', 'Rahul Verma', 'TN-05-QP-1180', '+91 90000 11223', 'driver', 'inactive', 28000, 9, 3, 1),

  // hub-02 · London East
  emp('emp-07', 'hub-02', 'David Whitmore', 'LK21 XJV', '+44 7700 900321', 'driver', 'active', 2600, 170, 41, 1, 'david@northwind.example', 'david@123'),
  emp('emp-08', 'hub-02', 'Sara Iqbal', 'LG70 ZNP', '+44 7700 900654', 'driver', 'contract-based', 2400, 140, 19, 2, 'sara@northwind.example', 'sara@123'),
  emp('emp-09', 'hub-02', 'Tom Bishop', 'LM22 WPD', '+44 7700 900112', 'dispatcher', 'full-time', 3100, 160, 0, 0),

  // hub-03 · Manchester North (Meridian)
  emp('emp-10', 'hub-03', 'Aisha Bello', 'MA19 KLT', '+44 7700 900777', 'driver', 'active', 2500, 80, 26, 1, 'aisha@meridian.example', 'aisha@123'),
  emp('emp-11', 'hub-03', 'Liam Doyle', 'MB21 RRT', '+44 7700 900888', 'driver', 'full-time', 2550, 70, 18, 0, 'liam@meridian.example', 'liam@123'),
];
seedEmployees[5].resignedAt = daysAgo(1); // Rahul Verma left yesterday

/* ── Credentials ─────────────────────────────────────────────────────────── */
const cred = (
  id: string,
  role: Credential['role'],
  email: string,
  password: string,
  companyId: string | null,
  hubId: string | null,
  hubCode: string,
  employeeId: string | null = null
): Credential => ({
  id,
  role,
  companyId,
  hubId,
  employeeId,
  email,
  password,
  hubCode,
  blocked: false,
  createdAt: daysAgo(200),
});

export const seedCredentials: Credential[] = [
  cred('cr-master', 'master', 'master@jadvix.com', 'master@123', null, null, ''),
  // Super admins
  cred('cr-sa-01', 'super-admin', 'admin@gmail.com', 'admin@123', 'co-01', null, ''),
  cred('cr-sa-02', 'super-admin', 'meridian@gmail.com', 'meridian@123', 'co-02', null, ''),
  // Hub authorities — Northwind / Chennai
  cred('cr-mgr-01', 'hub-manager', 'manager@gmail.com', 'manager@123', 'co-01', 'hub-01', 'CHN-01'),
  cred('cr-tl-01', 'hub-team-leader', 'lead@gmail.com', 'lead@123', 'co-01', 'hub-01', 'CHN-01'),
  cred('cr-fin-01', 'hub-finance', 'finance@gmail.com', 'finance@123', 'co-01', 'hub-01', 'CHN-01'),
  // Hub authorities — Northwind / London
  cred('cr-mgr-02', 'hub-manager', 'london@gmail.com', 'london@123', 'co-01', 'hub-02', 'LDN-02'),
  // Drivers
  cred('cr-drv-01', 'driver', 'driver@gmail.com', 'driver@123', 'co-01', 'hub-01', 'CHN-01', 'emp-01'),
  cred('cr-drv-02', 'driver', 'priya@northwind.example', 'priya@123', 'co-01', 'hub-01', 'CHN-01', 'emp-02'),
  cred('cr-drv-03', 'driver', 'meera@northwind.example', 'meera@123', 'co-01', 'hub-01', 'CHN-01', 'emp-03'),
  cred('cr-drv-04', 'driver', 'karthik@northwind.example', 'karthik@123', 'co-01', 'hub-01', 'CHN-01', 'emp-04'),
  cred('cr-drv-07', 'driver', 'david@northwind.example', 'david@123', 'co-01', 'hub-02', 'LDN-02', 'emp-07'),
  cred('cr-drv-08', 'driver', 'sara@northwind.example', 'sara@123', 'co-01', 'hub-02', 'LDN-02', 'emp-08'),
  cred('cr-drv-10', 'driver', 'aisha@meridian.example', 'aisha@123', 'co-02', 'hub-03', 'MCR-01', 'emp-10'),
  cred('cr-drv-11', 'driver', 'liam@meridian.example', 'liam@123', 'co-02', 'hub-03', 'MCR-01', 'emp-11'),
];

/* ── Shifts (start time only) ────────────────────────────────────────────── */
export const seedShifts: Shift[] = [
  { id: 'sh-01', hubId: 'hub-01', name: 'Morning Wave', startTime: '06:00' },
  { id: 'sh-02', hubId: 'hub-01', name: 'Afternoon Wave', startTime: '14:00' },
  { id: 'sh-03', hubId: 'hub-01', name: 'Night Wave', startTime: '22:00' },
  { id: 'sh-04', hubId: 'hub-02', name: 'Early Wave', startTime: '05:30' },
  { id: 'sh-05', hubId: 'hub-02', name: 'Late Wave', startTime: '15:00' },
  { id: 'sh-06', hubId: 'hub-03', name: 'Day Wave', startTime: '07:00' },
];

/* ── Locations ───────────────────────────────────────────────────────────── */
export const seedRoutes: Route[] = [
  { id: 'loc-01', hubId: 'hub-01', name: 'Adyar', areaName: 'Adyar', coordinates: '13.0067, 80.2570', eta: '09:40', order: 1, status: 'active' },
  { id: 'loc-02', hubId: 'hub-01', name: 'T. Nagar', areaName: 'T. Nagar', coordinates: '13.0418, 80.2341', eta: '10:15', order: 2, status: 'active' },
  { id: 'loc-03', hubId: 'hub-01', name: 'Velachery', areaName: 'Velachery', coordinates: '12.9750, 80.2210', eta: '11:05', order: 3, status: 'planned' },
  { id: 'loc-04', hubId: 'hub-01', name: 'Anna Nagar', areaName: 'Anna Nagar', coordinates: '13.0850, 80.2101', eta: '12:30', order: 4, status: 'planned' },
  { id: 'loc-05', hubId: 'hub-02', name: 'Islington', areaName: 'Islington', coordinates: '51.5465, -0.1058', eta: '10:10', order: 1, status: 'active' },
  { id: 'loc-06', hubId: 'hub-02', name: 'Camden Town', areaName: 'Camden Town', coordinates: '51.5390, -0.1426', eta: '11:35', order: 2, status: 'planned' },
  { id: 'loc-07', hubId: 'hub-03', name: 'Salford', areaName: 'Salford', coordinates: '53.4875, -2.2901', eta: '09:20', order: 1, status: 'active' },
];

/* ── Products ────────────────────────────────────────────────────────────── */
const prod = (
  id: string,
  hubId: string,
  code: string,
  name: string,
  type: string,
  status: Product['status'],
  deliveryStatus: Product['deliveryStatus']
): Product => ({ id, hubId, code, name, type, status, deliveryStatus });

export const seedProducts: Product[] = [
  prod('p-01', 'hub-01', 'JDX-4A9C', 'Ceramic dinnerware set', 'Fragile', 'out', 'pending'),
  prod('p-02', 'hub-01', 'JDX-77B1', 'Artisan sourdough (12)', 'Baked', 'transit', 'pending'),
  prod('p-03', 'hub-01', 'JDX-3C55', 'Flat-pack shelving', 'Packed', 'picked', 'pending'),
  prod('p-04', 'hub-01', 'JDX-8821', 'Frozen seafood crate', 'Frozen', 'scheduled', 'pending'),
  prod('p-05', 'hub-01', 'JDX-4417', 'Office supplies carton', 'Standard', 'delivered', 'delivered'),
  prod('p-06', 'hub-01', 'JDX-6650', 'Electronics parcel', 'Packed', 'exception', 'failed'),
  prod('p-07', 'hub-01', 'JDX-9F03', 'Wine case (mixed)', 'Fragile', 'out', 'pending'),
  prod('p-08', 'hub-02', 'JDX-5B10', 'Glassware pallet', 'Fragile', 'scheduled', 'pending'),
  prod('p-09', 'hub-02', 'JDX-6A2F', 'Patisserie boxes (30)', 'Baked', 'picked', 'pending'),
  prod('p-10', 'hub-03', 'JDX-0E7A', 'Retail apparel bundle', 'Packed', 'scheduled', 'pending'),
];

/* ── Bays ────────────────────────────────────────────────────────────────── */
/** Today's staged bays for the demo hub, plus a completed (frozen) yesterday. */
const bay = (
  id: string,
  hubId: string,
  shiftId: string,
  date: string,
  number: number,
  driverId: string | null,
  vehicleNo: string,
  productId: string | null,
  routeId: string | null,
  status: Bay['status'],
  completed = false
): Bay => ({
  id,
  hubId,
  shiftId,
  date,
  number,
  assignedDriverId: driverId,
  vehicleNo,
  productId,
  routeId,
  status,
  completed,
  completedAt: completed ? nowIso() : undefined,
});

export const seedBays: Bay[] = [
  // Today — Morning Wave @ Chennai
  bay('bay-01', 'hub-01', 'sh-01', today(), 1, 'emp-01', 'TN-09-BX-4471', 'p-01', 'loc-01', 'active'),
  bay('bay-02', 'hub-01', 'sh-01', today(), 2, 'emp-02', 'TN-07-CH-2093', 'p-03', 'loc-02', 'ready'),
  bay('bay-03', 'hub-01', 'sh-01', today(), 3, 'emp-03', 'TN-11-DK-1207', 'p-05', 'loc-03', 'shipped'),
  // Today — Afternoon Wave @ Chennai
  bay('bay-04', 'hub-01', 'sh-02', today(), 1, null, '', 'p-04', 'loc-04', 'active'),
  // Yesterday — completed & frozen (calendar / duplicate demo)
  bay('bay-05', 'hub-01', 'sh-01', daysAgo(1), 1, 'emp-01', 'TN-09-BX-4471', 'p-02', 'loc-01', 'shipped', true),
  bay('bay-06', 'hub-01', 'sh-01', daysAgo(1), 2, 'emp-02', 'TN-07-CH-2093', 'p-07', 'loc-02', 'shipped', true),
  // London East today
  bay('bay-07', 'hub-02', 'sh-04', today(), 1, 'emp-07', 'LK21 XJV', 'p-08', 'loc-05', 'active'),
  // Manchester today
  bay('bay-08', 'hub-03', 'sh-06', today(), 1, 'emp-10', 'MA19 KLT', 'p-10', 'loc-07', 'ready'),
];

/* ── Check-ins ───────────────────────────────────────────────────────────── */
const PH = 'photo'; // placeholder marker — real check-ins store data URIs
export const seedCheckIns: CheckIn[] = [
  {
    id: 'ci-01',
    hubId: 'hub-01',
    employeeId: 'emp-01',
    date: today(),
    photos: { front: PH, back: PH, left: PH, right: PH },
    createdAt: nowIso(),
  },
  {
    id: 'ci-02',
    hubId: 'hub-01',
    employeeId: 'emp-02',
    date: today(),
    photos: { front: PH, back: PH, left: PH, right: PH },
    createdAt: nowIso(),
  },
  // emp-03 (Meera) has NOT checked in for 2 days → triggers a reminder
  {
    id: 'ci-03',
    hubId: 'hub-01',
    employeeId: 'emp-03',
    date: daysAgo(3),
    photos: { front: PH, back: PH, left: PH, right: PH },
    createdAt: nowIso(),
  },
];

/* ── Leave ───────────────────────────────────────────────────────────────── */
export const seedLeaveRequests: LeaveRequest[] = [
  { id: 'lv-01', hubId: 'hub-01', employeeId: 'emp-04', from: daysAgo(1), to: daysAgo(-2), reason: 'Family commitment', status: 'approved' },
  { id: 'lv-02', hubId: 'hub-01', employeeId: 'emp-02', from: daysAgo(-4), to: daysAgo(-5), reason: 'Medical appointment', status: 'pending' },
  { id: 'lv-03', hubId: 'hub-02', employeeId: 'emp-08', from: daysAgo(-7), to: daysAgo(-8), reason: 'Personal', status: 'pending' },
];

/* ── Messages ────────────────────────────────────────────────────────────── */
export const seedMessages: Message[] = [
  { id: 'ms-01', hubId: 'hub-01', fromId: 'hub-01:hub-manager', fromRole: 'hub-manager', toId: 'emp-01', text: 'Morning wave is live — confirm your bay load before rolling out.', time: '06:12', createdAt: nowIso() },
  { id: 'ms-02', hubId: 'hub-01', fromId: 'emp-01', fromRole: 'driver', toId: 'hub-01:hub-manager', text: 'Bay 1 loaded. Heading to Adyar now.', time: '06:20', createdAt: nowIso() },
  { id: 'ms-03', hubId: 'hub-01', fromId: 'hub-01:hub-manager', fromRole: 'hub-manager', toId: 'emp-01', text: 'Noted. JDX-4A9C is fragile — handle with care.', time: '06:22', createdAt: nowIso() },
];

/* ── Vehicle tickets ─────────────────────────────────────────────────────── */
export const seedVehicleTickets: VehicleTicket[] = [
  { id: 'vt-01', hubId: 'hub-01', employeeId: 'emp-01', vehicleNo: 'TN-09-BX-4471', subject: 'Flat tyre, front left', notes: 'Punctured by a nail near Adyar depot.', photoAttached: true, status: 'submitted', adminRemarks: '', createdAt: nowIso(), updatedAt: nowIso() },
  { id: 'vt-02', hubId: 'hub-01', employeeId: 'emp-02', vehicleNo: 'TN-07-CH-2093', subject: 'Engine rattle above 40mph', notes: 'Persistent rattling sound from the engine bay.', photoAttached: false, status: 'reviewed', adminRemarks: 'Booked into the workshop after today’s shift.', createdAt: nowIso(), updatedAt: nowIso() },
];

/* ── Queries ─────────────────────────────────────────────────────────────── */
export const seedQueries: QueryTicket[] = [
  { id: 'q-01', hubId: 'hub-01', type: 'delivery-error', subject: 'Parcel delivered to wrong door', body: 'JDX-6650 was left at 14B instead of 14A. Customer called the hub.', raisedById: 'hub-team-leader', raisedByRole: 'hub-team-leader', offenderEmployeeId: 'emp-02', status: 'investigating', response: '', createdAt: nowIso(), updatedAt: nowIso() },
  { id: 'q-02', hubId: 'hub-01', type: 'salary-mismatch', subject: 'Overtime not counted in June', body: 'Two night runs are missing from my June payslip.', raisedById: 'emp-01', raisedByRole: 'driver', offenderEmployeeId: null, status: 'open', response: '', createdAt: nowIso(), updatedAt: nowIso() },
];

/* ── Reminders ───────────────────────────────────────────────────────────── */
export const seedReminders: Reminder[] = [
  { id: 'rm-01', hubId: 'hub-01', type: 'leave-request', title: 'Leave request awaiting review', body: 'Priya Ramesh requested leave.', forRoles: ['hub-manager', 'hub-team-leader', 'hub-finance'], read: false, createdAt: nowIso(), link: '/app/leave' },
  { id: 'rm-02', hubId: 'hub-01', type: 'query', title: 'Delivery error under investigation', body: 'JDX-6650 delivered to the wrong address.', forRoles: ['hub-manager', 'hub-team-leader'], read: false, createdAt: nowIso(), link: '/app/queries' },
];

/* ── Money ───────────────────────────────────────────────────────────────── */
export const seedPenalties: Penalty[] = [
  { id: 'pn-01', hubId: 'hub-01', employeeId: 'emp-02', reason: 'Delivery error — JDX-6650 wrong address', amount: 500, date: daysAgo(2), status: 'applied' },
  { id: 'pn-02', hubId: 'hub-01', employeeId: 'emp-04', reason: 'Late check-in (3 occurrences)', amount: 300, date: daysAgo(5), status: 'pending' },
];

export const seedPayslips: Payslip[] = [
  { id: 'ps-01', hubId: 'hub-01', employeeId: 'emp-01', period: currentPeriod(), cadence: 'monthly', baseAmount: 32000, penalties: 0, net: 32000, status: 'issued', issuedAt: nowIso() },
  { id: 'ps-02', hubId: 'hub-01', employeeId: 'emp-02', period: currentPeriod(), cadence: 'monthly', baseAmount: 30000, penalties: 500, net: 29500, status: 'draft', issuedAt: nowIso() },
];

export const seedInvoices: Invoice[] = [
  {
    id: 'inv-01',
    companyId: 'co-01',
    period: currentPeriod(),
    lines: [
      { label: 'Platform setup fee', qty: 1, unit: 15000, amount: 15000 },
      { label: 'Hubs', qty: 2, unit: 8000, amount: 16000 },
      { label: 'Employees', qty: 9, unit: 350, amount: 3150 },
    ],
    total: 34150,
    status: 'sent',
    issuedAt: nowIso(),
  },
];
