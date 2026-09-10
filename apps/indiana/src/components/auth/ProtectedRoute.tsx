import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const location = useLocation();
  const token = localStorage.getItem('crystal_jwt');
  const userStr = localStorage.getItem('crystal_user');

  if (!token || !userStr) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  try {
    const user = JSON.parse(userStr);
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      if (user.role === 'caregiver') {
        return <Navigate to="/caregiver/portal" replace />;
      }
      if (user.role === 'care_coordinator' || user.role === 'registered_nurse') {
        return <Navigate to="/clients" replace />;
      }
      if (user.role === 'super_admin' || user.role === 'agency_admin') {
        return <Navigate to="/admin" replace />;
      }
      return <Navigate to="/portal/client" replace />;
    }
  } catch {
    localStorage.removeItem('crystal_jwt');
    localStorage.removeItem('crystal_user');
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
};
