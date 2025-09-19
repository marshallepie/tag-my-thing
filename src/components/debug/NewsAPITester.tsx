import React from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useAuth } from '../../hooks/useAuth';
import { testNewsAPI, testAdminFunctions, testErrorHandling, runAllNewsTests } from '../../utils/testNewsApi';
import { Bug, Play, Shield, AlertTriangle } from 'lucide-react';


export const NewsAPITester: React.FC = () => {
  const { user, isAdmin, isAuthenticated } = useAuth();

  const handleRunReadTests = () => {
    console.clear();
    testNewsAPI();
  };

  const handleRunAdminTests = () => {
    if (user && isAdmin) {
      console.clear();
      testAdminFunctions(user.id);
    } else {
      console.log('❌ Admin tests require admin role');
      alert('Admin tests require admin role');
    }
  };

  const handleRunErrorTests = () => {
    console.clear();
    testErrorHandling();
  };

  const handleRunAllTests = () => {
    console.clear();
    runAllNewsTests(user?.id);
  };

  if (!isAuthenticated) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">News API Tester</h3>
        <p className="text-gray-600">Please log in to test the News API.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Bug className="h-5 w-5 text-primary-600" />
        <h3 className="text-lg font-semibold">News API Tester</h3>
      </div>
      
      <div className="space-y-3">
        <Button onClick={handleRunReadTests} className="w-full">
          <Play className="h-4 w-4 mr-2" />
          🧪 Run Read Tests
        </Button>
        
        <Button onClick={handleRunErrorTests} variant="outline" className="w-full">
          <AlertTriangle className="h-4 w-4 mr-2" />
          🚨 Test Error Handling
        </Button>
        
        {isAdmin && (
          <Button onClick={handleRunAdminTests} variant="secondary" className="w-full">
            <Shield className="h-4 w-4 mr-2" />
            👑 Run Admin Tests
          </Button>
        )}
        
        <Button onClick={handleRunAllTests} variant="outline" className="w-full border-dashed">
          🚀 Run All Tests
        </Button>
        
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
          <p className="text-sm text-primary-700">
            <strong>Instructions:</strong>
          </p>
          <ul className="list-disc list-inside text-xs text-primary-600 mt-1 space-y-1">
            <li>Open browser console (F12) to see detailed results</li>
            <li>Read tests work for all authenticated users</li>
            <li>Admin tests require admin role</li>
            <li>Tests use real database but clean up after themselves</li>
          </ul>
        </div>
        
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>User:</strong> {user?.email}</p>
          <p><strong>Role:</strong> {isAdmin ? 'Admin' : 'User'}</p>
          <p><strong>Can run admin tests:</strong> {isAdmin ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </Card>
  );
};
export default NewsAPITester;