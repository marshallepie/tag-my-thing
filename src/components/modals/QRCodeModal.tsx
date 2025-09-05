// src/components/modals/QRCodeModal.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  QrCode, 
  AlertCircle, 
  RefreshCw,
  ExternalLink,
  Share2 
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { generateBrandedQRCode, downloadQRCode, isValidQRUrl } from '../../utils/qrCode';
import toast from 'react-hot-toast';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
  description?: string;
  filename?: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  url,
  title = 'QR Code',
  description,
  filename = 'qr-code.png'
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Generate QR code when modal opens or URL changes
  useEffect(() => {
    if (isOpen && url && isValidQRUrl(url)) {
      generateQRCodeImage();
    }
  }, [isOpen, url]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQrCodeDataUrl('');
      setError('');
      setCopied(false);
    }
  }, [isOpen]);

  const generateQRCodeImage = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Generating QR code for URL:', url);
      const qrCode = await generateBrandedQRCode(url);
      setQrCodeDataUrl(qrCode);
      console.log('QR code generated successfully');
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
      downloadQRCode(qrCodeDataUrl, filename);
      toast.success('QR code downloaded successfully!');
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('URL copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description || 'Check out this link!',
          url: url,
        });
      } catch (error) {
        // User cancelled sharing or sharing failed
        console.log('Sharing cancelled or failed:', error);
      }
    } else {
      // Fallback to copy URL
      handleCopyUrl();
    }
  };

  const handleRetry = () => {
    generateQRCodeImage();
  };

  if (!isValidQRUrl(url)) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Invalid URL">
        <div className="text-center py-8">
          <AlertCircle className="h-16 w-16 text-error-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Invalid URL</h3>
          <p className="text-gray-600 mb-4">
            The provided URL is not valid for QR code generation.
          </p>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="space-y-6">
        {/* Description */}
        {description && (
          <div className="text-center">
            <p className="text-gray-600">{description}</p>
          </div>
        )}

        {/* QR Code Display Area */}
        <div className="flex justify-center">
          <Card className="p-6 bg-gray-50">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center justify-center w-64 h-64"
                >
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
                  <p className="text-gray-600 text-sm">Generating QR code...</p>
                </motion.div>
              ) : error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center justify-center w-64 h-64 text-center"
                >
                  <AlertCircle className="h-12 w-12 text-error-600 mb-4" />
                  <p className="text-error-600 text-sm mb-4">{error}</p>
                  <Button size="sm" onClick={handleRetry}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </motion.div>
              ) : qrCodeDataUrl ? (
                <motion.div
                  key="qrcode"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center"
                >
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code"
                    className="w-64 h-64 rounded-lg shadow-sm"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500 flex items-center justify-center">
                      <QrCode className="h-3 w-3 mr-1" />
                      Scan with your camera app
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center justify-center w-64 h-64"
                >
                  <QrCode className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 text-sm">QR code will appear here</p>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>

        {/* URL Display */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL
              </label>
              <p className="text-sm text-gray-900 break-all font-mono bg-white px-3 py-2 rounded border">
                {url}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleDownload}
            disabled={!qrCodeDataUrl || loading}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Download PNG
          </Button>
          
          <Button
            onClick={handleCopyUrl}
            variant="outline"
            disabled={loading}
            className="flex-1"
          >
            {copied ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            {copied ? 'Copied!' : 'Copy URL'}
          </Button>

          <Button
            onClick={handleShare}
            variant="outline"
            disabled={loading}
            className="flex-1"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>

        {/* Tips Section */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-start">
            <QrCode className="h-5 w-5 text-primary-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-primary-700">
              <p className="font-medium mb-2">How to use this QR code:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Point your phone's camera at the QR code</li>
                <li>Tap the notification that appears</li>
                <li>Or use any QR code scanner app</li>
                <li>Share the image or URL with others</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Close button */}
        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};