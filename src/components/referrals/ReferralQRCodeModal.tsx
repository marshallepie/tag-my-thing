// src/components/referrals/ReferralQRCodeModal.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Copy, 
  Check, 
  QrCode, 
  AlertCircle, 
  RefreshCw,
  Users,
  Gift,
  Crown
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { generateBrandedQRCode, downloadQRCode } from '../../utils/qrCode';
import toast from 'react-hot-toast';

interface ReferralQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralUrl: string;
  referralCode?: string;
  landingPageName?: string;
}

export const ReferralQRCodeModal: React.FC<ReferralQRCodeModalProps> = ({
  isOpen,
  onClose,
  referralUrl,
  referralCode,
  landingPageName = 'Landing Page'
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && referralUrl) {
      generateQRCodeImage();
    }
  }, [isOpen, referralUrl]);

  useEffect(() => {
    if (!isOpen) {
      setError('');
      setCopied(false);
    }
  }, [isOpen]);

  const generateQRCodeImage = async () => {
    setLoading(true);
    setError('');
    
    try {
      const qrCode = await generateBrandedQRCode(referralUrl);
      setQrCodeDataUrl(qrCode);
      toast.success('QR code generated successfully!');
    } catch (error) {
      console.error('Error generating QR code:', error);
      setError('Failed to generate QR code. Please try again.');
      toast.error('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (qrCodeDataUrl) {
      const filename = `tagmything-referral-${referralCode || 'qr'}-${Date.now()}.png`;
      downloadQRCode(qrCodeDataUrl, filename);
      toast.success('QR code downloaded!');
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success('Referral URL copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  const handleRetry = () => {
    generateQRCodeImage();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Referral QR Code" 
      size="md"
    >
      <div className="space-y-6">
        {/* Header with referral info */}
        <div className="text-center bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-4">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Crown className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Your Referral QR Code</h3>
          </div>
          <p className="text-sm text-gray-600">
            Destination: <span className="font-medium">{landingPageName}</span>
          </p>
          {referralCode && (
            <p className="text-xs text-gray-500 mt-1">
              Code: <span className="font-mono bg-white px-2 py-1 rounded">{referralCode}</span>
            </p>
          )}
        </div>

        {/* QR Code Display */}
        <div className="flex justify-center">
          <div className="bg-white p-6 rounded-xl border-2 border-gray-100 shadow-sm">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center justify-center w-72 h-72"
                >
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
                    <QrCode className="h-6 w-6 text-primary-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-gray-600 text-sm mt-4">Generating your QR code...</p>
                </motion.div>
              ) : error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center justify-center w-72 h-72 text-center"
                >
                  <AlertCircle className="h-16 w-16 text-error-500 mb-4" />
                  <h4 className="font-semibold text-gray-900 mb-2">Generation Failed</h4>
                  <p className="text-error-600 text-sm mb-6 max-w-xs">{error}</p>
                  <Button size="sm" onClick={handleRetry}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </motion.div>
              ) : qrCodeDataUrl ? (
                <motion.div
                  key="qrcode"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative group">
                    <img
                      src={qrCodeDataUrl}
                      alt="Referral QR Code"
                      className="w-72 h-72 rounded-lg shadow-sm transition-transform group-hover:scale-105"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 rounded-lg transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="text-white text-center">
                        <QrCode className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">Click to download</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        {/* URL Preview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Referral URL
            </label>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyUrl}
              className="text-xs"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <div className="bg-white border rounded-md p-3 text-sm font-mono text-gray-800 break-all">
            {referralUrl}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleDownload}
            disabled={!qrCodeDataUrl || loading}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Download QR
          </Button>
          
          <Button
            onClick={handleCopyUrl}
            variant="outline"
            disabled={loading}
            className="w-full"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </>
            )}
          </Button>
        </div>

        {/* Usage Instructions */}
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 p-1 bg-primary-100 rounded-full mr-3">
              <Users className="h-4 w-4 text-primary-600" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-primary-900 mb-2">How to use your QR code:</p>
              <ul className="list-disc list-inside space-y-1 text-primary-700 text-xs">
                <li>Share the QR code image on social media or print materials</li>
                <li>People can scan it with their phone camera</li>
                <li>They'll be directed to your referral link automatically</li>
                <li>Earn tokens for every successful signup!</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Rewards reminder */}
        <div className="bg-success-50 border border-success-200 rounded-lg p-4">
          <div className="flex items-center">
            <Gift className="h-5 w-5 text-success-600 mr-3" />
            <div className="text-sm text-success-700">
              <p className="font-medium">Earn up to 5 levels of rewards!</p>
              <p className="text-xs mt-1">Each person who uses this QR code could earn you tokens across multiple referral levels.</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};