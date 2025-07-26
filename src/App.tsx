import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Landing } from './pages/Landing';
import { Launch } from './pages/Launch';
import { Auth } from './pages/Auth';
import { InfluencerAuth } from './pages/InfluencerAuth';
import { Dashboard } from './pages/Dashboard';
import { TagAsset } from './pages/TagAsset';
import { Assets } from './pages/Assets';
import { Wallet } from './pages/Wallet';
import { NextOfKin } from './pages/NextOfKin';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { InfluencerReferrals } from './pages/InfluencerReferrals';
import { AdminInfluencerDashboard } from './pages/AdminInfluencerDashboard';
import { Unauthorized } from './pages/Unauthorized';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { CustomerSupport } from './pages/CustomerSupport';
import { GDPRCompliance } from './pages/GDPRCompliance';
import { CookiePolicy } from './pages/CookiePolicy';
import { DataProcessingAgreement } from './pages/DataProcessingAgreement';
import { GeneralTaggingLanding } from './pages/GeneralTaggingLanding';
import { NFTTaggingLanding } from './pages/NFTTaggingLanding';
import { MyWillTaggingLanding } from './pages/MyWillTaggingLanding';
import { BusinessTaggingLanding } from './pages/BusinessTaggingLanding';
import { BusinessDashboard } from './pages/BusinessDashboard';
import { ProductVerificationPage } from './pages/ProductVerificationPage';
import { PublicAssetsPage } from './pages/PublicAssetsPage';
import { useAuth } from './hooks/useAuth';

// Loading component for better UX
const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Error boundary for route errors
const RouteErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    setHasError(false);
  }, [location]);

  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
          <p className="text-gray-600 mb-6">
            The page you're looking for doesn't exist or there was an error loading it.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  try {
    return <>{children}</>;
  } catch (error) {
    console.error('Route error:', error);
    setHasError(true);
    return null;
  }
};

// Protected Route Component with role-based redirects
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading, initialized } = useAuth();

  if (!initialized || loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

// Admin Influencer Route Component
const AdminInfluencerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdminInfluencer, loading, initialized, isAuthenticated } = useAuth();

  if (!initialized || loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdminInfluencer) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

const BusinessUserRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading, initialized, isAuthenticated } = useAuth();

  if (!initialized || loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // The BusinessDashboard component itself will handle the 'is_business_user' check
  // and display a message if the user is not a business user.
  return <>{children}</>;
};

// Referrals Route Component (for all authenticated users)
const ReferralsRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, loading, initialized, isAuthenticated } = useAuth();

  if (!initialized || loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // All authenticated users can access referrals now

  return <>{children}</>;
};

// Auth redirect component
const AuthRedirect: React.FC = () => {
  const { isAuthenticated, loading, initialized } = useAuth();
  
  console.log('AuthRedirect - State:', { isAuthenticated, loading, initialized });

  if (!initialized || loading) {
    console.log('AuthRedirect - Showing loading screen');
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    console.log('AuthRedirect - User authenticated, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('AuthRedirect - User not authenticated, showing auth form');
  return <Auth />;
};

// Route wrapper with error boundary
const SafeRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RouteErrorBoundary>
    {children}
  </RouteErrorBoundary>
);

function App() {
  return (
    <Router>
      <div className="App">
        <React.Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/" 
              element={
                <SafeRoute>
                  <Landing />
                </SafeRoute>
              } 
            />
            <Route 
              path="/launch" 
              element={
                <SafeRoute>
                  <Launch />
                </SafeRoute>
              } 
            />
            <Route 
              path="/auth" 
              element={
                <SafeRoute>
                  <AuthRedirect />
                </SafeRoute>
              } 
            />
            <Route 
              path="/influencer-signup" 
              element={
                <SafeRoute>
                  <InfluencerAuth />
                </SafeRoute>
              } 
            />
            <Route 
              path="/tag" 
              element={
                <SafeRoute>
                  <TagAsset />
                </SafeRoute>
              } 
            />
            <Route 
              path="/support" 
              element={
                <SafeRoute>
                  <CustomerSupport />
                </SafeRoute>
              } 
            />
            <Route 
              path="/gdpr-compliance" 
              element={
                <SafeRoute>
                  <GDPRCompliance />
                </SafeRoute>
              } 
            />
            <Route 
              path="/privacy-policy" 
              element={
                <SafeRoute>
                  <PrivacyPolicy />
                </SafeRoute>
              } 
            />
            <Route 
              path="/terms-of-service" 
              element={
                <SafeRoute>
                  <TermsOfService />
                </SafeRoute>
              } 
            />
            <Route 
              path="/cookie-policy" 
              element={
                <SafeRoute>
                  <CookiePolicy />
                </SafeRoute>
              } 
            />
            <Route 
              path="/data-processing-agreement" 
              element={
                <SafeRoute>
                  <DataProcessingAgreement />
                </SafeRoute>
              } 
            />

            {/* Specialized Landing Pages */}
            <Route 
              path="/general-tagging" 
              element={
                <SafeRoute>
                  <GeneralTaggingLanding />
                </SafeRoute>
              } 
            />
            <Route 
              path="/nft-tagging" 
              element={
                <SafeRoute>
                  <NFTTaggingLanding />
                </SafeRoute>
              } 
            />
            <Route 
              path="/mywill-tagging" 
              element={
                <SafeRoute>
                  <MyWillTaggingLanding />
                </SafeRoute>
              } 
            />
            <Route 
              path="/business-tagging" 
              element={
                <SafeRoute>
                  <BusinessTaggingLanding />
                </SafeRoute>
              } 
            />
            <Route 
              path="/verify/:serialNumber" 
              element={
                <SafeRoute>
                  <ProductVerificationPage />
                </SafeRoute>
              } 
            />
            <Route 
              path="/public-assets" 
              element={
                <SafeRoute>
                  <PublicAssetsPage />
                </SafeRoute>
              } 
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <SafeRoute>
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                </SafeRoute>
              }
            />

            <Route
              path="/assets"
              element={
                <SafeRoute>
                  <ProtectedRoute>
                    <Assets />
                  </ProtectedRoute>
                </SafeRoute>
              }
            />

            <Route
              path="/wallet"
              element={
                <SafeRoute>
                  <ProtectedRoute>
                    <Wallet />
                  </ProtectedRoute>
                </SafeRoute>
              }
            />

            <Route
              path="/nok"
              element={
                <SafeRoute>
                  <ProtectedRoute>
                    <NextOfKin />
                  </ProtectedRoute>
                </SafeRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <SafeRoute>
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                </SafeRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <SafeRoute>
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                </SafeRoute>
              }
            />

            {/* Referrals Routes (All Users) */}
            <Route
              path="/referrals"
              element={
                <SafeRoute>
                  <ReferralsRoute>
                    <InfluencerReferrals />
                  </ReferralsRoute>
                </SafeRoute>
              }
            />
            
            {/* Legacy route redirect */}
            <Route
              path="/influencer-referrals"
              element={<Navigate to="/referrals" replace />}
            />

            {/* Admin Influencer Dashboard Route */}
            <Route
              path="/admin-influencer-dashboard"
              element={
                <SafeRoute>
                  <AdminInfluencerRoute>
                    <AdminInfluencerDashboard />
                  </AdminInfluencerRoute>
                </SafeRoute>
              }
            />

            {/* Business Dashboard Route */}
            <Route
              path="/business-dashboard"
              element={
                <SafeRoute>
                  <BusinessUserRoute>
                    <BusinessDashboard />
                  </BusinessUserRoute>
                </SafeRoute>
              }
            />

            {/* Unauthorized Route */}
            <Route
              path="/unauthorized"
              element={
                <SafeRoute>
                  <Unauthorized />
                </SafeRoute>
              }
            />

            {/* Catch all route - 404 handler */}
            <Route 
              path="*" 
              element={
                <SafeRoute>
                  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center max-w-md mx-auto p-6">
                      <h1 className="text-2xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
                      <p className="text-gray-600 mb-6">
                        The page you're looking for doesn't exist.
                      </p>
                      <button
                        onClick={() => window.location.href = '/'}
                        className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Go Home
                      </button>
                    </div>
                  </div>
                </SafeRoute>
              } 
            />
          </Routes>
        </React.Suspense>

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10B981',
              },
            },
            error: {
              style: {
                background: '#EF4444',
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;