import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ScrollToTop } from './components/layout/ScrollToTop';

// Import all page components
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Assets } from './pages/Assets';
import { Wallet } from './pages/Wallet';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { TagAsset } from './pages/TagAsset';
import { NextOfKin } from './pages/NextOfKin';
import { InfluencerReferrals } from './pages/InfluencerReferrals';
import { BusinessDashboard } from './pages/BusinessDashboard';
import { AdminInfluencerDashboard } from './pages/AdminInfluencerDashboard';
import { BugReports } from './pages/BugReports';
import { PublicAssetsPage } from './pages/PublicAssetsPage';
import { ProductVerificationPage } from './pages/ProductVerificationPage';
import { Landing } from './pages/Landing';
import { Launch } from './pages/Launch';
import { Dao } from './pages/Dao';
import { CookiePolicy } from './pages/CookiePolicy';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { GDPRCompliance } from './pages/GDPRCompliance';
import { DataProcessingAgreement } from './pages/DataProcessingAgreement';
import { CustomerSupport } from './pages/CustomerSupport';
import { InfluencerAuth } from './pages/InfluencerAuth';
import { BusinessAuth } from './pages/BusinessAuth';
import { GeneralTaggingLanding } from './pages/GeneralTaggingLanding';
import { NFTTaggingLanding } from './pages/NFTTaggingLanding';
import { MyWillTaggingLanding } from './pages/MyWillTaggingLanding';
import { BusinessTaggingLanding } from './pages/BusinessTaggingLanding';
import { Unauthorized } from './pages/Unauthorized';
import { CheckEmail } from './pages/CheckEmail';
import { FAQ } from './pages/FAQ';

// Import legacy components for password reset functionality
import ResetPassword from './ResetPassword';
import UpdatePassword from './UpdatePassword';

function App() {
  const { initialized, loading } = useAuth();

  // Show loading screen while auth is being determined
  if (!initialized || loading) {
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
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/signup" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/update-password" element={<UpdatePassword />} />
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
      <Route path="/influencer-signup" element={<InfluencerAuth />} />
      <Route path="/business-auth" element={<BusinessAuth />} />
      
      {/* Legal Pages */}
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/cookie-policy" element={<CookiePolicy />} />
      <Route path="/gdpr-compliance" element={<GDPRCompliance />} />
      <Route path="/data-processing-agreement" element={<DataProcessingAgreement />} />
      <Route path="/support" element={<CustomerSupport />} />
      <Route path="/faq" element={<FAQ />} />
      
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
      
      {/* Protected Routes - Business Users */}
      <Route path="/business-dashboard" element={
        <ProtectedRoute requiredBusinessUser={true}>
          <BusinessDashboard />
        </ProtectedRoute>
      } />
      
      {/* Protected Routes - Admin Influencers */}
      <Route path="/admin-influencer-dashboard" element={
        <ProtectedRoute requiredRole="admin_influencer">
          <AdminInfluencerDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/bug-reports" element={
        <ProtectedRoute requiredRole="admin_influencer">
          <BugReports />
        </ProtectedRoute>
      } />
      
      {/* Protected Routes - Admins */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin">
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Panel</h1>
              <p className="text-gray-600">Admin functionality coming soon</p>
            </div>
          </div>
        </ProtectedRoute>
      } />
      
      {/* Protected Routes - Moderators */}
      <Route path="/moderator" element={
        <ProtectedRoute requiredRole="moderator">
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Moderator Panel</h1>
              <p className="text-gray-600">Moderator functionality coming soon</p>
            </div>
          </div>
        </ProtectedRoute>
      } />
      
      {/* Catch-all route - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

export default App;