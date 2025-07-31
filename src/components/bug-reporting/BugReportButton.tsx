import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, Camera, Send, X, AlertTriangle, CheckCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import toast from 'react-hot-toast';

interface BugReportData {
  errorMessage: string;
  consoleLogs: string;
  screenshotBase64: string;
  pageUrl: string;
  userAgent: string;
  metadata: Record<string, any>;
}

export const BugReportButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const { user, profile } = useAuth();

  // Capture console logs
  useEffect(() => {
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleLog = console.log;

    const capturedLogs: string[] = [];

    console.error = (...args) => {
      capturedLogs.push(`ERROR: ${args.join(' ')}`);
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args) => {
      capturedLogs.push(`WARN: ${args.join(' ')}`);
      originalConsoleWarn.apply(console, args);
    };

    console.log = (...args) => {
      // Only capture logs that look like errors or important messages
      const message = args.join(' ');
      if (message.includes('error') || message.includes('failed') || message.includes('timeout')) {
        capturedLogs.push(`LOG: ${message}`);
      }
      originalConsoleLog.apply(console, args);
    };

    setConsoleLogs(capturedLogs);

    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      console.log = originalConsoleLog;
    };
  }, []);

  const captureScreenshot = async (): Promise<string> => {
    try {
      const canvas = await html2canvas(document.body, {
        height: window.innerHeight,
        width: window.innerWidth,
        scrollX: 0,
        scrollY: 0,
        useCORS: true,
        allowTaint: true,
        scale: 0.5, // Reduce quality to keep file size manageable
      });
      
      return canvas.toDataURL('image/jpeg', 0.7);
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      throw new Error('Failed to capture screenshot');
    }
  };

  const handleOpenModal = async () => {
    try {
      setIsOpen(true);
      toast.loading('Capturing screenshot...', { id: 'screenshot' });
      
      // Small delay to ensure modal is rendered before screenshot
      setTimeout(async () => {
        try {
          const screenshotData = await captureScreenshot();
          setScreenshot(screenshotData);
          toast.success('Screenshot captured!', { id: 'screenshot' });
        } catch (error) {
          toast.error('Failed to capture screenshot', { id: 'screenshot' });
          console.error('Screenshot error:', error);
        }
      }, 100);
    } catch (error) {
      console.error('Error opening bug report:', error);
      toast.error('Failed to open bug report');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!errorMessage.trim()) {
      toast.error('Please describe the issue');
      return;
    }

    if (!screenshot) {
      toast.error('Screenshot is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const bugReportData: BugReportData = {
        errorMessage: errorMessage.trim(),
        consoleLogs: consoleLogs.slice(-20).join('\n'), // Last 20 log entries
        screenshotBase64: screenshot,
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        metadata: {
          timestamp: new Date().toISOString(),
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          userRole: profile?.role || 'unknown',
          userId: user?.id || 'anonymous'
        }
      };

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-bug-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(bugReportData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit bug report');
      }

      toast.success('Bug report submitted successfully! Thank you for helping us improve TagMyThing.');
      setIsOpen(false);
      setErrorMessage('');
      setScreenshot(null);
    } catch (error: any) {
      console.error('Bug report submission error:', error);
      toast.error(error.message || 'Failed to submit bug report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setErrorMessage('');
    setScreenshot(null);
  };

  // Don't show for unauthenticated users
  if (!user) {
    return null;
  }

  return (
    <>
      {/* Floating Bug Report Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleOpenModal}
        className="fixed bottom-6 right-6 z-50 bg-error-600 hover:bg-error-700 text-white p-4 rounded-full shadow-lg transition-colors"
        title="Report a Bug"
      >
        <Bug className="h-6 w-6" />
      </motion.button>

      {/* Bug Report Modal */}
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Report a Bug"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Screenshot Preview */}
          {screenshot && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Screenshot Captured
              </label>
              <div className="relative">
                <img
                  src={screenshot}
                  alt="Bug report screenshot"
                  className="w-full h-48 object-cover rounded-lg border border-gray-300"
                />
                <div className="absolute top-2 right-2 bg-success-100 text-success-800 px-2 py-1 rounded-full text-xs flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Captured
                </div>
              </div>
            </div>
          )}

          {/* Error Message Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Describe the Issue *
            </label>
            <textarea
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value)}
              placeholder="Please describe what went wrong, what you were trying to do, and any error messages you saw..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          {/* Console Logs Preview */}
          {consoleLogs.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recent Console Activity ({consoleLogs.length} entries)
              </label>
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 max-h-32 overflow-y-auto">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                  {consoleLogs.slice(-10).join('\n')}
                </pre>
              </div>
            </div>
          )}

          {/* User Context */}
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <h4 className="font-medium text-primary-900 mb-2">Report Context</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-primary-700">User:</span>
                <span className="ml-2 text-primary-900">{profile?.full_name || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-primary-700">Email:</span>
                <span className="ml-2 text-primary-900">{user.email}</span>
              </div>
              <div>
                <span className="text-primary-700">Page:</span>
                <span className="ml-2 text-primary-900 truncate">{window.location.pathname}</span>
              </div>
              <div>
                <span className="text-primary-700">Time:</span>
                <span className="ml-2 text-primary-900">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-warning-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-warning-800">
                <p className="font-medium mb-1">Privacy Notice</p>
                <p>
                  This report will include a screenshot of your current screen and recent console activity. 
                  Please ensure no sensitive information is visible before submitting.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              className="flex-1"
              disabled={!screenshot || !errorMessage.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              Submit Bug Report
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};