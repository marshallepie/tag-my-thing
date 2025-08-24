import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  // Simplified role checking - most users are 'standard'
  requiredRole?: 'standard' | 'moderator' | 'admin';
  // Optional feature flags instead of complex role hierarchy
  requiresBusinessFeatures?: boolean;
  requiresModeration?: boolean;
  requiresAdmin?: boolean;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole = 'standard',
  requiresBusinessFeatures = false,
  requiresModeration = false,
  requiresAdmin = false,
  redirectTo = '/auth'
}) => {
  const { 
    user, 
    profile, 
    loading, 
    initialized, 
    isAuthenticated, 
    hasProfile
  } = useAuth();

  // Show loading while auth is being determined
  if (!initialized || loading) {
    console.log('ProtectedRoute: Loading auth state', { initialized, loading });
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    console.log('ProtectedRoute: User not authenticated, redirecting to:', redirectTo);
    return <Navigate to={redirectTo} replace />;
  }

  // Wait for profile to load for any role/feature checks
  if (!hasProfile && (requiredRole !== 'standard' || requiresBusinessFeatures || requiresModeration || requiresAdmin)) {
    console.log('ProtectedRoute: Waiting for profile to load for permission checks');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // UNIFIED PERMISSION CHECKING
  // Most users have 'standard' role and all referral privileges by default
  
  // Check admin requirements
  if (requiresAdmin && profile?.role !== 'admin') {
    console.log('ProtectedRoute: Admin access required but user role is:', profile?.role);
    return <Navigate to="/unauthorized" replace />;
  }

  // Check moderation requirements (admins can also moderate)
  if (requiresModeration && !['moderator', 'admin'].includes(profile?.role || '')) {
    console.log('ProtectedRoute: Moderation access required but user role is:', profile?.role);
    return <Navigate to="/unauthorized" replace />;
  }

  // Check business features (flag-based, not role-based)
  if (requiresBusinessFeatures && !profile?.is_business_user) {
    console.log('ProtectedRoute: Business features required but user is not business user');
    return <Navigate to="/business-upgrade" replace />;
  }

  // Check specific role requirement (fallback)
  if (requiredRole !== 'standard' && profile?.role !== requiredRole) {
    console.log('ProtectedRoute: Required role', requiredRole, 'but user role is:', profile?.role);
    return <Navigate to="/unauthorized" replace />;
  }

  // All checks passed - render the protected component
  console.log('ProtectedRoute: Access granted for user:', user?.id, 'with role:', profile?.role);
  return <>{children}</>;
};