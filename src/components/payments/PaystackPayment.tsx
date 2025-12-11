import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet, CreditCard, Smartphone, Building2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { TokenPackageSelector } from './TokenPackageSelector';
import { usePaystackPayment, TokenPackage } from '../../hooks/usePaystack';
import { useAuth } from '../../hooks/useAuth';

interface PaystackPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PaystackPayment: React.FC<PaystackPaymentProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { initiatePayment, loading, error, success } = usePaystackPayment();
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);
  const [step, setStep] = useState<'select' | 'payment' | 'success' | 'error'>('select');

  const handleSelectPackage = (pkg: TokenPackage) => {
    setSelectedPackage(pkg);
    setStep('payment');
  };

  const handleProceedToPayment = () => {
    if (selectedPackage) {
      initiatePayment(selectedPackage);
    }
  };

  const handleClose = () => {
    setStep('select');
    setSelectedPackage(null);
    onClose();
  };

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
    handleClose();
  };

  React.useEffect(() => {
    if (success) {
      setStep('success');
    } else if (error) {
      setStep('error');
    }
  }, [success, error]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('payments.buyTokens')}
      size="xl"
    >
      <div className="space-y-6">
        {/* Step: Package Selection */}
        {step === 'select' && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('payments.selectTokenPackage')}
              </h3>
              <p className="text-sm text-gray-600">
                {t('payments.selectPackageDescription')}
              </p>
            </div>

            <TokenPackageSelector
              onSelectPackage={handleSelectPackage}
              loading={loading}
            />
          </div>
        )}

        {/* Step: Payment Confirmation */}
        {step === 'payment' && selectedPackage && (
          <div className="space-y-6">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep('select')}
              disabled={loading}
            >
              ← {t('buttons.back')}
            </Button>

            {/* Selected Package Summary */}
            <Card className="bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">
                    {selectedPackage.tokens} {t('payments.tmtTokens')}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {selectedPackage.currency} {selectedPackage.price.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <Wallet className="h-12 w-12 text-primary-600" />
                </div>
              </div>
            </Card>

            {/* Payment Methods Info */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                {t('payments.availablePaymentMethods')}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Card className="p-4 text-center">
                  <CreditCard className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">{t('payments.card')}</p>
                </Card>
                <Card className="p-4 text-center">
                  <Building2 className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">{t('payments.bankTransfer')}</p>
                </Card>
                <Card className="p-4 text-center">
                  <Smartphone className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">{t('payments.mobileMoney')}</p>
                </Card>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                <div>
                  <h5 className="text-sm font-semibold text-green-900 mb-1">
                    {t('payments.securePayment')}
                  </h5>
                  <p className="text-xs text-green-700">
                    {t('payments.paystackSecurityDescription')}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Button */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                {t('buttons.cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={handleProceedToPayment}
                disabled={loading}
                className="min-w-[150px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    {t('payments.processing')}
                  </>
                ) : (
                  <>
                    {t('payments.proceedToPayment')}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('payments.paymentSuccessful')}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('payments.tokensAdded', { tokens: selectedPackage?.tokens || 0 })}
            </p>
            <Button variant="primary" onClick={handleSuccess}>
              {t('buttons.continue')}
            </Button>
          </div>
        )}

        {/* Step: Error */}
        {step === 'error' && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('payments.paymentFailed')}
            </h3>
            <p className="text-gray-600 mb-6">
              {error || t('payments.paymentFailedDescription')}
            </p>
            <div className="flex justify-center space-x-3">
              <Button variant="outline" onClick={handleClose}>
                {t('buttons.close')}
              </Button>
              <Button variant="primary" onClick={() => setStep('select')}>
                {t('payments.tryAgain')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
