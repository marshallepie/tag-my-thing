import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Package, QrCode, History, RefreshCw, AlertTriangle, CheckCircle, Building } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Product {
  id: string;
  product_name: string;
  serial_number: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  business_user_id: string;
}

interface ScanEvent {
  id: string;
  serial_number: string;
  scanned_at: string;
  ip_address: string | null;
  location: string | null;
  device_info: string | null;
  user_id: string | null;
}

export const BusinessDashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showScanHistoryModal, setShowScanHistoryModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    product_name: '',
    serial_number: '',
    description: ''
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanEvent[]>([]);
  const [scanHistoryLoading, setScanHistoryLoading] = useState(false);

  const { user, profile } = useAuth();

  useEffect(() => {
    if (user && profile?.is_business_user) {
      fetchProducts();
    }
  }, [user, profile]);

  const fetchProducts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_business_products');
      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);
    try {
      const { data, error } = await supabase.rpc('register_product', {
        p_product_name: newProduct.product_name,
        p_serial_number: newProduct.serial_number,
        p_description: newProduct.description || null
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast.success('Product registered successfully!');
      setShowRegisterModal(false);
      setNewProduct({ product_name: '', serial_number: '', description: '' });
      fetchProducts();
    } catch (error: any) {
      console.error('Error registering product:', error);
      toast.error(error.message || 'Failed to register product');
    } finally {
      setRegisterLoading(false);
    }
  };

  const viewScanHistory = async (product: Product) => {
    setSelectedProduct(product);
    setShowScanHistoryModal(true);
    setScanHistoryLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_product_scan_history', {
        p_serial_number: product.serial_number
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      setScanHistory(data.scan_history || []);
    } catch (error: any) {
      console.error('Error fetching scan history:', error);
      toast.error(error.message || 'Failed to load scan history');
      setScanHistory([]);
    } finally {
      setScanHistoryLoading(false);
    }
  };

  const generateQrCodeUrl = (serialNumber: string) => {
    return `${window.location.origin}/verify/${serialNumber}`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading business dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!profile?.is_business_user) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center p-8">
            <Building className="h-16 w-16 text-primary-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Not a Business User</h2>
            <p className="text-gray-600 mb-6">
              You need to be registered as a business user to access this dashboard.
              You can enable this in your profile settings.
            </p>
            <Button onClick={() => window.location.href = '/profile'}>
              Go to Profile Settings
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Dashboard</h1>
            <p className="text-gray-600">
              Manage your registered products and track scan events
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Button
              variant="outline"
              onClick={fetchProducts}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => setShowRegisterModal(true)}>
              <Plus className="h-5 w-5 mr-2" />
              Register New Product
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Total Products</h3>
                  <p className="text-2xl font-bold text-primary-600">{products.length}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <QrCode className="h-8 w-8 text-secondary-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">QR Codes Generated</h3>
                  <p className="text-2xl font-bold text-secondary-600">{products.length}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-success-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Active Products</h3>
                  <p className="text-2xl font-bold text-success-600">{products.length}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Package className="h-16 w-16 text-primary-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Products Registered Yet</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start protecting your products by registering your first batch.
            </p>
            <Button size="lg" onClick={() => setShowRegisterModal(true)}>
              <Plus className="h-5 w-5 mr-2" />
              Register Your First Product
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card hover className="h-full">
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{product.product_name}</h3>
                  <p className="text-sm text-gray-600 mb-1">
                    Serial: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{product.serial_number}</span>
                  </p>
                  {product.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mb-4">
                    Registered: {format(new Date(product.created_at), 'MMM d, yyyy')}
                  </p>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewScanHistory(product)}
                      className="flex-1"
                    >
                      <History className="h-4 w-4 mr-1" />
                      View Scans
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const qrUrl = generateQrCodeUrl(product.serial_number);
                        navigator.clipboard.writeText(qrUrl);
                        toast.success('QR Code URL copied to clipboard!');
                      }}
                      className="flex-1"
                    >
                      <QrCode className="h-4 w-4 mr-1" />
                      Copy URL
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Register Product Modal */}
        <Modal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          title="Register New Product"
        >
          <form onSubmit={handleRegisterProduct} className="space-y-4">
            <Input
              label="Product Name *"
              value={newProduct.product_name}
              onChange={(e) => setNewProduct(prev => ({ ...prev, product_name: e.target.value }))}
              placeholder="Enter product name"
              required
            />
            <Input
              label="Unique Serial Number *"
              value={newProduct.serial_number}
              onChange={(e) => setNewProduct(prev => ({ ...prev, serial_number: e.target.value }))}
              placeholder="Enter unique serial number"
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={newProduct.description}
                onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Enter product description"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <div className="flex items-start">
                <QrCode className="h-5 w-5 text-primary-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-primary-700">
                  <p className="font-medium mb-1">QR Code Generation</p>
                  <p>A unique QR code will be automatically generated for this product that customers can scan to verify authenticity.</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRegisterModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={registerLoading}
                className="flex-1"
              >
                Register Product
              </Button>
            </div>
          </form>
        </Modal>

        {/* Scan History Modal */}
        <Modal
          isOpen={showScanHistoryModal}
          onClose={() => {
            setShowScanHistoryModal(false);
            setSelectedProduct(null);
            setScanHistory([]);
          }}
          title={`Scan History for ${selectedProduct?.product_name || 'Product'}`}
          size="lg"
        >
          {scanHistoryLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : scanHistory.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No scan events recorded for this product yet.</p>
              <p className="text-sm text-gray-500 mt-2">
                Share the QR code URL with customers to start tracking scans.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Scan Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Scans:</span>
                    <span className="ml-2 font-semibold">{scanHistory.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Unique Locations:</span>
                    <span className="ml-2 font-semibold">
                      {new Set(scanHistory.filter(s => s.location).map(s => s.location)).size}
                    </span>
                  </div>
                </div>
              </div>

              {scanHistory.map((scan, index) => (
                <div key={scan.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">Scan #{scanHistory.length - index}</span>
                    <span className="text-sm text-gray-600">
                      {format(new Date(scan.scanned_at), 'MMM d, yyyy HH:mm:ss')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
                    <p><strong>Location:</strong> {scan.location || 'N/A'}</p>
                    <p><strong>IP Address:</strong> {scan.ip_address || 'N/A'}</p>
                    <p className="sm:col-span-2"><strong>Device:</strong> {scan.device_info || 'N/A'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};