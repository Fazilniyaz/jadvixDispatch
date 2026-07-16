import { Navigate, Route, Routes } from 'react-router-dom';
import { useThemeEffect } from '@/store/useTheme';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Landing page is retained for future use but disabled for now — "/" goes
// straight to the login screen. Re-enable by restoring the import and the
// route below.
// import Landing from '@/pages/Landing';
import Signup from '@/pages/Signup';
import Login from '@/pages/Login';

import AdminLayout from '@/portals/admin/AdminLayout';
import Dashboard from '@/portals/admin/Dashboard';
import Stats from '@/portals/shared/Stats';
import ProductManagement from '@/portals/admin/ProductManagement';
import EmployeeManagement from '@/portals/admin/EmployeeManagement';
import ShiftManagement from '@/portals/admin/ShiftManagement';
import BayManagement from '@/portals/admin/BayManagement';
import RouteManagement from '@/portals/admin/RouteManagement';
import LeaveRequests from '@/portals/admin/LeaveRequests';
import Communication from '@/portals/admin/Communication';
import VehicleManagement from '@/portals/admin/VehicleManagement';
import Settings from '@/portals/shared/Settings';

import DriverLayout from '@/portals/driver/DriverLayout';
import Today from '@/portals/driver/Today';
import MyPerformance from '@/portals/driver/MyPerformance';
import MyRoute from '@/portals/driver/MyRoute';
import DriverCommunication from '@/portals/driver/DriverCommunication';
import MyVehicles from '@/portals/driver/MyVehicles';
import Leave from '@/portals/driver/Leave';

export default function App() {
  useThemeEffect();

  return (
    <Routes>
      {/* Landing page disabled for now — kept in src/pages/Landing.tsx for future use.
          <Route path="/" element={<Landing />} /> */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="stats" element={<Stats />} />
        <Route path="products" element={<ProductManagement />} />
        <Route path="employees" element={<EmployeeManagement />} />
        <Route path="shifts" element={<ShiftManagement />} />
        <Route path="bays" element={<BayManagement />} />
        <Route path="routes" element={<RouteManagement />} />
        <Route path="leave" element={<LeaveRequests />} />
        <Route path="communication" element={<Communication />} />
        <Route path="vehicles" element={<VehicleManagement />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route
        path="/driver"
        element={
          <ProtectedRoute role="driver">
            <DriverLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Today />} />
        <Route path="stats" element={<Stats />} />
        <Route path="performance" element={<MyPerformance />} />
        <Route path="route" element={<MyRoute />} />
        <Route path="communication" element={<DriverCommunication />} />
        <Route path="vehicles" element={<MyVehicles />} />
        <Route path="leave" element={<Leave />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
