import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validToken, setValidToken] = useState(false);

  useEffect(() => {
    const verifyResetToken = async () => {
      console.log('=== RESET PASSWORD DEBUG ===');
      console.log('Full URL:', window.location.href);
      console.log('Search params:', location.search);
      
      const urlParams = new URLSearchParams(location.search);
      const token = urlParams.get('token');
      const type = urlParams.get('type');
      
      console.log('Token:', token);
      console.log('Type:', type);
      
      if (!token || type !== 'recovery') {
        console.error('Invalid reset link - missing token or wrong type');
        toast.error('Invalid reset link. Please try requesting a new password reset.');
        navigate('/forgot-password');
        return;
      }
      
      try {
        // Verify the session with the token
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'recovery'
        });
        
        console.log('Token verification result:', { data, error });
        
        if (error) {
          console.error('Token verification failed:', error);
          toast.error('Invalid or expired reset link. Please request a new one.');
          navigate('/forgot-password');
          return;
        }
        
        console.log('Reset token verified successfully');
        setValidToken(true);
        toast.success('Reset link verified! Please enter your new password.');
        
      } catch (error) {
        console.error('Token verification error:', error);
        toast.error('Something went wrong. Please try again.');
        navigate('/forgot-password');
      }
    };
    
    verifyResetToken();
  }, [location, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validToken) {
      toast.error('Invalid reset session. Please request a new password reset.');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Attempting to update password...');
      
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });
      
      console.log('Update password result:', { data, error });
      
      if (error) {
        console.error('Password update error:', error);
        throw error;
      }
      
      toast.success('Password updated successfully! Please sign in with your new password.');
      navigate('/auth');
      
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (!validToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter new password (min 6 characters)"
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Confirm new password"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};