import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../lib/supabase';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { role, profile, isLoading, profileError } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  // Authenticated but profile row missing — send back to login to show the fix instructions
  if (profileError) {
    return <Navigate to="/login" replace />;
  }

  if (!role) return <Navigate to="/login" replace />;

  if (profile?.status === 'inactive') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card p-8 max-w-sm text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚫</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Account Suspended</h2>
          <p className="text-gray-500 text-sm">Your account has been deactivated. Contact your administrator.</p>
        </div>
      </div>
    );
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={getRoleHome(role)} replace />;
  }

  return <>{children}</>;
}

export function getRoleHome(role: UserRole): string {
  switch (role) {
    case 'super_admin':   return '/super-admin/dashboard';
    case 'water_admin':   return '/water/admin/dashboard';
    case 'water_cashier': return '/water/cashier/pos';
    case 'driver':        return '/water/driver/dashboard';
    case 'rb_manager':    return '/rb/manager/dashboard';
    case 'rb_cashier':    return '/rb/cashier/pos';
    default:              return '/login';
  }
}