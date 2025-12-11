import React, { useState, useEffect } from 'react';
import { X, Smartphone, CheckCircle, XCircle, Loader } from 'lucide-react';
import { useMTNMomo, TokenPackage, MTNMomoTransaction } from '@/hooks/useMTNMomo';
import { useTranslation } from 'react-i18next';

interface MTNMomoPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage: TokenPackage | null;
  onSuccess?: () => void;
}

export function MTNMomoPaymentModal({
  isOpen,
  onClose,
  selectedPackage,
  onSuccess,
}: MTNMomoPaymentModalProps) {
  const { t } = useTranslation();
  const {
    isLoading,
    requestPayment,
    verifyPayment,
    validatePhoneNumber,
    formatPhoneNumber,
  } = useMTNMomo();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [currentStep, setCurrentStep] = useState<'input' | 'processing' | 'success' | 'error'>('input');
  const [transaction, setTransaction] = useState<MTNMomoTransaction | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Handle phone number input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only digits and basic formatting characters
    const cleaned = value.replace(/[^\d\s\-()]/g, '');
    setPhoneNumber(cleaned);
  };

  // Start payment process
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPackage) {
      return;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!validatePhoneNumber(formattedPhone)) {
      return;
    }

    setCurrentStep('processing');

    // Request payment
    const txn = await requestPayment(formattedPhone, selectedPackage.id);

    if (!txn) {
      setCurrentStep('error');
      return;
    }

    setTransaction(txn);

    // Start polling for payment status
    const interval = setInterval(async () => {
      if (!txn.reference_id) return;

      const updatedTxn = await verifyPayment(txn.reference_id);

      if (updatedTxn) {
        setTransaction(updatedTxn);

        if (updatedTxn.status === 'successful') {
          setCurrentStep('success');
          clearInterval(interval);
          setPollingInterval(null);

          // Call success callback after a short delay
          setTimeout(() => {
            onSuccess?.();
            handleClose();
          }, 2000);
        } else if (updatedTxn.status === 'failed' || updatedTxn.status === 'cancelled') {
          setCurrentStep('error');
          clearInterval(interval);
          setPollingInterval(null);
        }
      }
    }, 3000); // Poll every 3 seconds

    setPollingInterval(interval);

    // Stop polling after 5 minutes
    setTimeout(() => {
      if (interval) {
        clearInterval(interval);
        setPollingInterval(null);
      }
    }, 5 * 60 * 1000);
  };

  // Reset and close modal
  const handleClose = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setPhoneNumber('');
    setCurrentStep('input');
    setTransaction(null);
    onClose();
  };

  if (!isOpen || !selectedPackage) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {t('payments.mtnMomo.title', 'MTN Mobile Money')}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Package Summary */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">{t('payments.package', 'Package')}:</span>
              <span className="font-semibold text-gray-900">{selectedPackage.name}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">{t('payments.tokens', 'Tokens')}:</span>
              <span className="font-semibold text-gray-900">{selectedPackage.tmtTokens} TMT</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t('payments.amount', 'Amount')}:</span>
              <span className="font-bold text-lg text-gray-900">
                {selectedPackage.priceXAF.toLocaleString()} XAF
              </span>
            </div>
            {selectedPackage.savingsPercent && (
              <div className="mt-2 text-sm text-green-600 font-medium">
                {t('payments.save', 'Save')} {selectedPackage.savingsPercent}%
              </div>
            )}
          </div>

          {/* Step: Input Phone Number */}
          {currentStep === 'input' && (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('payments.mtnMomo.phoneNumber', 'MTN Mobile Money Number')}
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="237 6XX XXX XXX"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  required
                />
                <p className="mt-2 text-sm text-gray-500">
                  {t('payments.mtnMomo.phoneHint', 'Enter your MTN Cameroon mobile number')}
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !phoneNumber}
                className="w-full bg-yellow-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    {t('payments.processing', 'Processing...')}
                  </>
                ) : (
                  t('payments.mtnMomo.continue', 'Continue with MTN MOMO')
                )}
              </button>
            </form>
          )}

          {/* Step: Processing Payment */}
          {currentStep === 'processing' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader className="w-8 h-8 text-yellow-500 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('payments.mtnMomo.waitingApproval', 'Waiting for approval')}
              </h3>
              <p className="text-gray-600 mb-4">
                {t(
                  'payments.mtnMomo.checkPhone',
                  'Check your phone and approve the payment request'
                )}
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                <p className="mb-1">
                  {t('payments.mtnMomo.dialPrompt', 'Dial *126# on your MTN phone')}
                </p>
                <p>{t('payments.mtnMomo.approveTransaction', 'and approve the transaction')}</p>
              </div>
            </div>
          )}

          {/* Step: Success */}
          {currentStep === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('payments.mtnMomo.success', 'Payment successful!')}
              </h3>
              <p className="text-gray-600">
                {t('payments.mtnMomo.tokensCredit', 'Your tokens have been credited to your account')}
              </p>
            </div>
          )}

          {/* Step: Error */}
          {currentStep === 'error' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('payments.mtnMomo.failed', 'Payment failed')}
              </h3>
              <p className="text-gray-600 mb-4">
                {transaction?.error_message ||
                  t('payments.mtnMomo.failedMessage', 'The payment could not be processed')}
              </p>
              <button
                onClick={() => setCurrentStep('input')}
                className="text-yellow-600 hover:text-yellow-700 font-medium"
              >
                {t('payments.mtnMomo.tryAgain', 'Try again')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
