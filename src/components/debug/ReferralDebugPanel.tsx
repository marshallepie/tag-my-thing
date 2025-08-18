import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bug, Play, RefreshCw, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { debugReferralFlow, testReferralFunction } from '../../utils/referralDebugger';
import { runReferralTests } from '../../utils/referralTester';
import type { ReferralDebugResult } from '../../utils/referralDebugger';
import type { TestResult } from '../../utils/referralTester';

interface ReferralDebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
  defaultReferralCode?: string;
}

export const ReferralDebugPanel: React.FC<ReferralDebugPanelProps> = ({
  isOpen,
  onClose,
  defaultReferralCode = 'marshallepie'
}) => {
  const [referralCode, setReferralCode] = useState(defaultReferralCode);
  const [testEmail, setTestEmail] = useState('');
  const [debugResults, setDebugResults] = useState<ReferralDebugResult[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'debug' | 'test'>('debug');

  const handleDebugFlow = async () => {
    if (!referralCode || !testEmail) {
      alert('Please enter both referral code and test email');
      return;
    }

    setLoading(true);
    try {
      const results = await debugReferralFlow(referralCode, testEmail);
      setDebugResults(results);
    } catch (error) {
      console.error('Debug flow error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunTests = async () => {
    setLoading(true);
    try {
      const results = await runReferralTests(referralCode, testEmail);
      setTestResults(results);
    } catch (error) {
      console.error('Test run error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-error-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning-600" />;
      default:
        return <Info className="h-4 w-4 text-primary-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-success-50 border-success-200 text-success-800';
      case 'error':
        return 'bg-error-50 border-error-200 text-error-800';
      case 'warning':
        return 'bg-warning-50 border-warning-200 text-warning-800';
      default:
        return 'bg-primary-50 border-primary-200 text-primary-800';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Referral System Debugger"
      size="xl"
    >
      <div className="space-y-6">
        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Referral Code"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            placeholder="Enter referral code to test"
          />
          <Input
            label="Test User Email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Enter email of referred user"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('debug')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'debug'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Debug Flow
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'test'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Run Tests
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {activeTab === 'debug' ? (
            <Button
              onClick={handleDebugFlow}
              loading={loading}
              disabled={!referralCode || !testEmail}
              className="flex-1"
            >
              <Bug className="h-4 w-4 mr-2" />
              Debug Referral Flow
            </Button>
          ) : (
            <Button
              onClick={handleRunTests}
              loading={loading}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              Run All Tests
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={() => {
              setDebugResults([]);
              setTestResults([]);
            }}
          >
            Clear Results
          </Button>
        </div>

        {/* Results Section */}
        {activeTab === 'debug' && debugResults.length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Debug Results</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {debugResults.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm">{result.step}</span>
                        <span className="text-xs text-gray-500">{result.timestamp}</span>
                      </div>
                      <p className="text-sm">{result.message}</p>
                      {result.data && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer text-gray-600 hover:text-gray-800">
                            View Data
                          </summary>
                          <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === 'test' && testResults.length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 rounded-lg border ${
                    result.passed 
                      ? 'bg-success-50 border-success-200 text-success-800'
                      : 'bg-error-50 border-error-200 text-error-800'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {result.passed ? (
                      <CheckCircle className="h-4 w-4 text-success-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-error-600" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm mb-1">{result.test}</div>
                      <p className="text-sm">{result.message}</p>
                      {result.data && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer text-gray-600 hover:text-gray-800">
                            View Data
                          </summary>
                          <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-primary-50 border-primary-200">
          <h4 className="font-medium text-primary-900 mb-2">How to Use This Debugger</h4>
          <div className="text-sm text-primary-700 space-y-2">
            <p><strong>Debug Flow:</strong> Traces the complete referral process for a specific user</p>
            <p><strong>Run Tests:</strong> Performs comprehensive system checks</p>
            <p><strong>Console Output:</strong> Check browser console for detailed logs</p>
            <p><strong>Tip:</strong> Use 'marshallepie' as referral code and any existing user email for testing</p>
          </div>
        </Card>
      </div>
    </Modal>
  );
};