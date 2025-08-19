import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'nok' | 'moderator' | 'admin' | 'influencer' | 'admin_influencer';
  requiredBusinessUser?: boolean;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredBusinessUser = false,
  redirectTo = '/auth'
}) => {
  const { 
    user, 
    profile, 
    loading, 
    initialized, 
    isAuthenticated, 
    hasProfile,
    isAdmin,
    isModerator,
    isInfluencer,
    isAdminInfluencer,
    isBusinessUser
  } = useAuth();

  // Show loading while auth is being determined
  if (!initialized || loading) {
    console.log('ProtectedRoute: Showing loading state', { initialized, loading });
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

  // Wait for profile to load for role-based checks
  if (!hasProfile && (requiredRole || requiredBusinessUser)) {
    console.log('ProtectedRoute: Waiting for profile to load for role checks');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Check role requirements
  if (requiredRole && profile?.role !== requiredRole) {
    // Special handling for admin roles
    if (requiredRole === 'admin' && !isAdmin) {
      return <Navigate to="/unauthorized" replace />;
    }
    if (requiredRole === 'moderator' && !isModerator) {
      return <Navigate to="/unauthorized" replace />;
    }
    if (requiredRole === 'influencer' && !isInfluencer) {
      return <Navigate to="/unauthorized" replace />;
    }
    if (requiredRole === 'admin_influencer' && !isAdminInfluencer) {
      return <Navigate to="/unauthorized" replace />;
    }
    if (requiredRole === 'user' && profile?.role !== 'user') {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check business user requirement
  if (requiredBusinessUser && !isBusinessUser) {
    return <Navigate to="/unauthorized" replace />;
  }

  // All checks passed, render the protected component
  return <>{children}</>;
};