import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export const CheckEmail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const email = location.state?.email || ''; // Get email from route state

  const handleResend = async () => {
    if (!email) {
      toast.error('Email address not found. Please go back to signup.');
      return;
    }
    
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        throw error;
      }
      
      toast.success('Confirmation email resent! Please check your inbox.');
    } catch (error: any) {
      console.error('Error resending confirmation email:', error);
      toast.error(error.message || 'Failed to resend confirmation email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="text-center p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-primary-100 rounded-full p-4">
              <Mail className="h-12 w-12 text-primary-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Confirm your signup
          </h1>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            We've sent a confirmation email to{' '}
            <span className="font-semibold text-gray-800">{email}</span>.
            Please click the link in your inbox to activate your account before logging in.
          </p>
          
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-primary-700 text-left">
                <p className="font-medium mb-1">What happens next?</p>
                <ul className="space-y-1">
                  <li>• Check your email inbox (and spam folder)</li>
                  <li>• Click the confirmation link</li>
                  <li>• Return here to sign in</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button
              onClick={handleResend}
              loading={resending}
              variant="outline"
              className="w-full"
              disabled={!email}
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Resend confirmation email
            </Button>

            <Button
              onClick={() => navigate('/auth')}
              className="w-full"
            >
              I have confirmed my email
            </Button>
          </div>
          
          {!email && (
            <div className="mt-4 p-3 bg-warning-50 border border-warning-200 rounded-lg">
              <p className="text-sm text-warning-700">
                Email address not found. Please return to the signup page.
              </p>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};