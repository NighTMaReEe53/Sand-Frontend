import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Role } from '../types/auth.types';

export interface ProtectedRouteProps {
  allowedRoles?: Role[];
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { isAuthenticated, role, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
};

/**
 * GuestRoute — redirects authenticated users away from auth pages (login/register).
 * Teachers & Admins go to /dashboard, Students go to /my-courses, unknown roles go to /.
 */
export const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, role } = useAuthStore();

  if (isAuthenticated) {
    if (role === 'TEACHER' || role === 'ADMIN') {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/my-courses" replace />;
  }

  return <>{children}</>;
};
