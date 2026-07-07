import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { Role } from '@/lib/types';
import { useStore } from '@/store/useStore';

interface ProtectedRouteProps {
  role: Role;
  children: ReactNode;
}

// Redirects to /login when there is no session, or to the correct
// portal when a signed-in user hits the wrong role's routes.
export function ProtectedRoute({ role, children }: ProtectedRouteProps) {
  const user = useStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/driver'} replace />;
  }
  return <>{children}</>;
}
