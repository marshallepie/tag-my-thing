import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const Unauthorized: React.FC = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full"
        >
          <Card className="text-center p-8">
            <div className="flex justify-center mb-6">
              <div className="bg-error-100 rounded-full p-4">
                <Shield className="h-12 w-12 text-error-600" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Access Denied
            </h1>
            
            <div className="flex items-center justify-center space-x-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-warning-600" />
              <p className="text-gray-600">
                You don't have permission to access this page
              </p>
            </div>
            
            <p className="text-sm text-gray-500 mb-8">
              This area is restricted to authorized administrators only. 
              If you believe you should have access, please contact support.
            </p>
            
            <div className="space-y-3">
              <Link to="/dashboard">
                <Button className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Return to Dashboard
                </Button>
              </Link>
              
              <Link to="/support">
                <Button variant="outline" className="w-full">
                  Contact Support
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};