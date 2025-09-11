import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; 
import { useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ScrollToTop } from './components/layout/ScrollToTop';
import { AuthCallback } from './pages/AuthCallback';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';


// Lazy load all page components for better performance
const Auth = React.lazy(() =>
  import('./pages/Auth').then(module => ({ default: module.Auth }))
);
const InfluencerAuth = React.lazy(() =>
  import('./pages/InfluencerAuth').then(module => ({ default: module.InfluencerAuth }))
);
const Dashboard = React.lazy(() =>
  import('./pages/Dashboard').then(module => ({ default: module.Dashboard }))
);
const Assets = React.lazy(() =>
  import('./pages/Assets').then(module => ({ default: module.Assets }))
);
const Wallet = React.lazy(() =>
  import('./pages/Wallet').then(module => ({ default: module.Wallet }))
);
const Profile = React.lazy(() =>
  import('./pages/Profile').then(module => ({ default: module.Profile }))
);
const Settings = React.lazy(() =>
  import('./pages/Settings').then(module => ({ default: module.Settings }))
);
const TagAsset = React.lazy(() =>
  import('./pages/TagAsset').then(module => ({ default: module.TagAsset }))
);
const NextOfKin = React.lazy(() =>
  import('./pages/NextOfKin').then(module => ({ default: module.NextOfKin }))
);
const InfluencerReferrals = React.lazy(() =>
  import('./pages/InfluencerReferrals').then(module => ({ default: module.InfluencerReferrals }))
);
const BusinessDashboard = React.lazy(() =>
  import('./pages/BusinessDashboard').then(module => ({ default: module.BusinessDashboard }))
);
const AdminInfluencerDashboard = React.lazy(() =>
  import('./pages/AdminInfluencerDashboard').then(module => ({ default: module.AdminInfluencerDashboard }))
);
const BugReports = React.lazy(() =>
  import('./pages/BugReports').then(module => ({ default: module.BugReports }))
);
const PublicAssetsPage = React.lazy(() =>
  import('./pages/PublicAssetsPage').then(module => ({ default: module.PublicAssetsPage }))
);
const ProductVerificationPage = React.lazy(() =>
  import('./pages/ProductVerificationPage').then(module => ({ default: module.ProductVerificationPage }))
);
const Landing = React.lazy(() =>
  import('./pages/Landing').then(module => ({ default: module.Landing }))
);
const Launch = React.lazy(() =>
  import('./pages/Launch').then(module => ({ default: module.Launch }))
);
const Dao = React.lazy(() =>
  import('./pages/Dao').then(module => ({ default: module.Dao }))
);
const CookiePolicy = React.lazy(() =>
  import('./pages/CookiePolicy').then(module => ({ default: module.CookiePolicy }))
);
const PrivacyPolicy = React.lazy(() =>
  import('./pages/PrivacyPolicy').then(module => ({ default: module.PrivacyPolicy }))
);
const TermsOfService = React.lazy(() =>
  import('./pages/TermsOfService').then(module => ({ default: module.TermsOfService }))
);
const GDPRCompliance = React.lazy(() =>
  import('./pages/GDPRCompliance').then(module => ({ default: module.GDPRCompliance }))
);
const DataProcessingAgreement = React.lazy(() =>
  import('./pages/DataProcessingAgreement').then(module => ({ default: module.DataProcessingAgreement }))
);
const CustomerSupport = React.lazy(() =>
  import('./pages/CustomerSupport').then(module => ({ default: module.CustomerSupport }))
);
const GeneralTaggingLanding = React.lazy(() =>
  import('./pages/GeneralTaggingLanding').then(module => ({ default: module.GeneralTaggingLanding }))
);
const NFTTaggingLanding = React.lazy(() =>
  import('./pages/NFTTaggingLanding').then(module => ({ default: module.NFTTaggingLanding }))
);
const MyWillTaggingLanding = React.lazy(() =>
  import('./pages/MyWillTaggingLanding').then(module => ({ default: module.MyWillTaggingLanding }))
);
const BusinessTaggingLanding = React.lazy(() =>
  import('./pages/BusinessTaggingLanding').then(module => ({ default: module.BusinessTaggingLanding }))
);
const Unauthorized = React.lazy(() =>
  import('./pages/Unauthorized').then(module => ({ default: module.Unauthorized }))
);
const CheckEmail = React.lazy(() =>
  import('./pages/CheckEmail').then(module => ({ default: module.CheckEmail }))
);
const FAQ = React.lazy(() =>
  import('./pages/FAQ').then(module => ({ default: module.FAQ }))
);
const AboutUs = React.lazy(() =>
  import('./pages/AboutUs').then(module => ({ default: module.AboutUs }))
);
const Careers = React.lazy(() =>
  import('./pages/Careers').then(module => ({ default: module.Careers }))
);
const Documentation = React.lazy(() =>
  import('./pages/Documentation').then(module => ({ default: module.Documentation }))
);

function App() {
  const { initialized, loading } = useAuth();
  const location = useLocation();

  // Capture referral code from URL and store in cookie
  React.useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode) {
      console.log('App: Referral code detected in URL:', refCode);
      // Note: Referral code will be handled by Auth components
    }
  }, [location.search]);

  // Show loading screen while auth is being determined
  if (!initialized || loading) {
    console.log('App: Showing loading screen', { initialized, loading });
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ScrollToTop />
      <React.Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading page...</p>
          </div>
        </div>
      }>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/signup" element={<Auth />} />
          <Route path="/check-email" element={<CheckEmail />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Landing Pages */}
          <Route path="/launch" element={<Launch />} />
          <Route path="/dao" element={<Dao />} />
          <Route path="/general-tagging" element={<GeneralTaggingLanding />} />
          <Route path="/nft-tagging" element={<NFTTaggingLanding />} />
          <Route path="/mywill-tagging" element={<MyWillTaggingLanding />} />
          <Route path="/business-tagging" element={<BusinessTaggingLanding />} />
          
          {/* Auth Variants */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/signup" element={<Auth />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/business-auth" element={<Auth />} />
          <Route path="/influencer-signup" element={<InfluencerAuth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Legal Pages */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/gdpr-compliance" element={<GDPRCompliance />} />
          <Route path="/data-processing-agreement" element={<DataProcessingAgreement />} />
          <Route path="/support" element={<CustomerSupport />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/documentation" element={<Documentation />} />
          
          {/* Public Asset Pages */}
          <Route path="/public-assets" element={<PublicAssetsPage />} />
          <Route path="/verify/:serialNumber" element={<ProductVerificationPage />} />
          
          {/* Protected Routes - Basic User */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/tag" element={
            <ProtectedRoute>
              <TagAsset />
            </ProtectedRoute>
          } />
          
          <Route path="/assets" element={
            <ProtectedRoute>
              <Assets />
            </ProtectedRoute>
          } />
          
          <Route path="/wallet" element={
            <ProtectedRoute>
              <Wallet />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          
          <Route path="/nok" element={
            <ProtectedRoute>
              <NextOfKin />
            </ProtectedRoute>
          } />
          
          {/* Protected Routes - All Users Can Access Referrals */}
          <Route path="/referrals" element={
            <ProtectedRoute>
              <InfluencerReferrals />
            </ProtectedRoute>
          } />
          
          {/* Legacy referral route redirect */}
          <Route path="/influencer-referrals" element={<Navigate to="/referrals" replace />} />
          
// ✅ FIXED: Update business route protection
          <Route path="/business-dashboard" element={
            <ProtectedRoute requiresBusinessFeatures={true}>
              <BusinessDashboard />
            </ProtectedRoute>
          } />

// ✅ FIXED: Update admin routes (admins can access everything)
          <Route path="/admin-influencer-dashboard" element={
            <ProtectedRoute requiresAdmin={true}>
              <AdminInfluencerDashboard />
            </ProtectedRoute>
          } />

          <Route path="/bug-reports" element={
            <ProtectedRoute requiresAdmin={true}>
              <BugReports />
            </ProtectedRoute>
          } />

// ✅ FIXED: Moderator routes
          <Route path="/moderator" element={
            <ProtectedRoute requiresModeration={true}>
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Moderator Panel</h1>
                  <p className="text-gray-600">Moderator functionality is here</p>
                </div>
              </div>
            </ProtectedRoute>
          } />

// ✅ FIXED: Admin routes
          <Route path="/admin" element={
            <ProtectedRoute requiresAdmin={true}>
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Panel</h1>
                  <p className="text-gray-600">Admin functionality is here</p>
                </div>
              </div>
            </ProtectedRoute>
          } />
          {/* Catch-all route - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </React.Suspense>
    <Toaster 
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '14px',
          },
          success: {
            style: {
              background: '#10B981',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10B981',
            },
          },
          error: {
            style: {
              background: '#EF4444',
            },
            iconTheme: {
              primary: '#fff', 
              secondary: '#EF4444',
            },
          },
        }}
      />
    </>
  );
}

export default App;