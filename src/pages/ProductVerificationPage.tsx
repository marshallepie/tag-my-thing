import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, History, MapPin, Globe, Smartphone, RefreshCw, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface ScanResult {
  authentic: boolean;
  message: string;
  scan_count?: number;
  scan_history?: Array<{
    scanned_at: string;
    location: string | null;
    ip_address: string | null;
    device_info: string | null;
  }>;
  flagged_for_review?: boolean;
}

export const ProductVerificationPage: React.FC = () => {
  const { serialNumber } = useParams<{ serialNumber: string }>();
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<string | null>(null);

  useEffect(() => {
    // Get client IP and device info
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setIpAddress(data.ip))
      .catch(err => console.error('Error fetching IP:', err));

    // Get rough location (using a public API)
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => setLocation(`${data.city}, ${data.country_name}`))
      .catch(err => console.error('Error fetching location:', err));

    setDeviceInfo(navigator.userAgent);
  }, []);

  useEffect(() => {
    if (serialNumber && ipAddress) {
      verifyProduct();
    }
  }, [serialNumber, ipAddress]);

  const verifyProduct = async () => {
    if (!serialNumber || !ipAddress) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setScanResult(null);
    try {
      const { data, error } = await supabase.rpc('verify_product_scan', {
        p_serial_number: serialNumber,
        p_ip_address: ipAddress,
        p_location: location,
        p_device_info: deviceInfo
      });

      if (error) throw error;
      setScanResult(data as ScanResult);
    } catch (error: any) {
      console.error('Error verifying product:', error);
      setScanResult({
        authentic: false,
        message: 'Verification failed. Please try again later.'
      });
      toast.error('Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying product authenticity...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Shield className="h-16 w-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Verification</h1>
          <p className="text-gray-600">Check the authenticity of your item</p>
          <p className="text-sm text-gray-500 mt-2">Serial Number: <span className="font-mono">{serialNumber}</span></p>
        </motion.div>

        <Card>
          {scanResult ? (
            <div className="space-y-6">
              <div className={`p-6 rounded-lg text-center ${
                scanResult.authentic ? 'bg-success-50 text-success-800' : 'bg-error-50 text-error-800'
              }`}>
                {scanResult.authentic ? (
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 text-success-600" />
                ) : (
                  <XCircle className="h-16 w-16 mx-auto mb-4 text-error-600" />
                )}
                <h2 className="text-2xl font-bold mb-2">{scanResult.message}</h2>
                {scanResult.authentic && (
                  <p className="text-lg">This product is registered and verified authentic.</p>
                )}
              </div>

              {scanResult.flagged_for_review && (
                <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-warning-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-warning-800">
                    <p className="font-medium mb-1">Flagged for Review</p>
                    <p>This item has been scanned an unusual number of times or from multiple locations. While it is currently authentic, this pattern may indicate potential misuse or counterfeiting. Please contact the manufacturer if you have concerns.</p>
                  </div>
                </div>
              )}

              {scanResult.scan_history && scanResult.scan_history.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <History className="h-5 w-5 mr-2" />
                    Scan History ({scanResult.scan_history.length} total scans)
                  </h3>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Scan Summary</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total Scans:</span>
                        <span className="ml-2 font-semibold">{scanResult.scan_history.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Unique Locations:</span>
                        <span className="ml-2 font-semibold">
                          {new Set(scanResult.scan_history.filter(s => s.location).map(s => s.location)).size}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Latest Scan:</span>
                        <span className="ml-2 font-semibold">
                          {format(new Date(scanResult.scan_history[0].scanned_at), 'MMM d')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {scanResult.scan_history.slice(0, 10).map((scan, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">Scan #{scanResult.scan_history!.length - index}</span>
                          <span className="text-sm text-gray-600">
                            {format(new Date(scan.scanned_at), 'MMM d, yyyy HH:mm:ss')}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" /> 
                            Location: {scan.location || 'N/A'}
                          </div>
                          <div className="flex items-center">
                            <Globe className="h-4 w-4 mr-2" /> 
                            IP: {scan.ip_address || 'N/A'}
                          </div>
                          <div className="flex items-center sm:col-span-2">
                            <Smartphone className="h-4 w-4 mr-2" /> 
                            Device: {scan.device_info ? scan.device_info.substring(0, 50) + '...' : 'N/A'}
                          </div>
                        </div>
                      </div>
                    ))}
                    {scanResult.scan_history.length > 10 && (
                      <div className="text-center py-2">
                        <p className="text-sm text-gray-500">
                          Showing latest 10 scans of {scanResult.scan_history.length} total
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-center mt-6">
                <Button onClick={verifyProduct} loading={loading}>
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Scan Again
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-16 w-16 text-warning-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">No Scan Result</h2>
              <p className="text-gray-600">Please ensure the serial number is correct and try again.</p>
            </div>
          )}
        </Card>

        {/* Information Section */}
        <Card className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How Product Verification Works</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-success-600 mt-0.5 flex-shrink-0" />
              <p>Each product is assigned a unique serial number when registered by the manufacturer.</p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-success-600 mt-0.5 flex-shrink-0" />
              <p>When you scan the QR code, we verify the serial number exists in our database.</p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-success-600 mt-0.5 flex-shrink-0" />
              <p>We track scan history to identify unusual patterns that might indicate counterfeiting.</p>
            </div>
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-warning-600 mt-0.5 flex-shrink-0" />
              <p>Products flagged for review have been scanned unusually frequently or from many different locations.</p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};