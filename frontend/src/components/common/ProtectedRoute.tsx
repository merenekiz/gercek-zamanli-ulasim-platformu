'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppSelector } from '@/lib/store/hooks';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
}

/**
 * ProtectedRoute Component
 *
 * Wraps pages that require authentication.
 * Redirects to login if user is not authenticated.
 * Optionally checks for required role.
 *
 * @example
 * // Basic usage
 * <ProtectedRoute>
 *   <DashboardPage />
 * </ProtectedRoute>
 *
 * // With role check
 * <ProtectedRoute requiredRole="ADMIN">
 *   <AdminPanel />
 * </ProtectedRoute>
 */
export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, loading } = useAppSelector(
    (state) => state.auth
  );

  useEffect(() => {
    // Wait for auth state to load
    if (loading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      // Save intended destination for redirect after login
      const returnUrl = encodeURIComponent(pathname);
      router.push(`/login?returnUrl=${returnUrl}`);
      return;
    }

    // Check role if required
    if (requiredRole && user) {
      const roleHierarchy = {
        USER: 1,
        ADMIN: 2,
        SUPER_ADMIN: 3,
      };

      const userRoleLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole];

      if (userRoleLevel < requiredRoleLevel) {
        // User doesn't have required role, redirect to dashboard
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, user, loading, pathname, router, requiredRole]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Don't render children until authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Check role access
  if (requiredRole && user) {
    const roleHierarchy = {
      USER: 1,
      ADMIN: 2,
      SUPER_ADMIN: 3,
    };

    const userRoleLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      return null;
    }
  }

  return <>{children}</>;
}
