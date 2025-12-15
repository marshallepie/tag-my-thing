import React, { useState } from 'react';
import { Coins, CreditCard, Smartphone, Check } from 'lucide-react';
import { useMTNMomo, TokenPackage } from '@/hooks/useMTNMomo';
import { usePaystackPayment } from '@/hooks/usePaystack';
import { MTNMomoPaymentModal } from './MTNMomoPaymentModal';
import { useTranslation } from 'react-i18next';
import { useTokens } from '@/hooks/useTokens';

export function TokenPurchasePage() {
  const { t } = useTranslation();
  const { tokenPackages } = useMTNMomo();
  const { balance, refreshBalance } = useTokens();
  const { initiatePayment: initiatePaystackPayment, loading: paystackLoading } = usePaystackPayment();

  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'mtn_momo' | 'paystack' | 'stripe' | null>(null);
  const [showMTNMomoModal, setShowMTNMomoModal] = useState(false);

  const handlePackageSelect = (pkg: TokenPackage) => {
    setSelectedPackage(pkg);
    setSelectedPaymentMethod(null);
  };

  const handlePaymentMethodSelect = (method: 'mtn_momo' | 'paystack' | 'stripe') => {
    setSelectedPaymentMethod(method);

    if (method === 'mtn_momo') {
      setShowMTNMomoModal(true);
    } else if (method === 'paystack') {
      // Convert MTN MOMO package format to Paystack package format
      if (selectedPackage) {
        const paystackPackage = {
          id: selectedPackage.id,
          tokens: selectedPackage.tmtTokens,
          price: selectedPackage.priceGBP * 1500, // Convert GBP to NGN (approximate rate)
          currency: 'NGN',
        };
        initiatePaystackPayment(paystackPackage);
      }
    } else if (method === 'stripe') {
      // Handle Stripe payment link redirect
      if (selectedPackage?.stripePaymentLink) {
        const baseUrl = window.location.origin;
        const successUrl = `${baseUrl}/wallet?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${baseUrl}/buy-tokens?canceled=true`;

        const paymentUrl = `${selectedPackage.stripePaymentLink}?success_url=${encodeURIComponent(successUrl)}&cancel_url=${encodeURIComponent(cancelUrl)}`;
        window.location.href = paymentUrl;
      }
    }
  };

  const handlePaymentSuccess = () => {
    // Refresh token balance
    refreshBalance();

    // Reset selection
    setSelectedPackage(null);
    setSelectedPaymentMethod(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
            <Coins className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('payments.purchaseTokens', 'Purchase TMT Tokens')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t(
              'payments.tokenDescription',
              'Use TMT tokens to tag photos, videos, and protect your valuable assets'
            )}
          </p>

          {/* Current Balance */}
          <div className="mt-6 inline-block bg-white rounded-lg shadow-md px-6 py-3">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-blue-600" />
              <span className="text-gray-600">{t('payments.currentBalance', 'Current Balance')}:</span>
              <span className="font-bold text-xl text-gray-900">{balance} TMT</span>
            </div>
          </div>
        </div>

        {/* Token Packages */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {t('payments.selectPackage', 'Select a Package')}
          </h2>
          <div className="flex flex-wrap justify-center gap-6 max-w-6xl mx-auto">
            {tokenPackages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => handlePackageSelect(pkg)}
                className={`relative bg-white rounded-xl shadow-lg p-6 transition-all transform hover:scale-105 w-full sm:w-64 ${
                  selectedPackage?.id === pkg.id
                    ? 'ring-4 ring-blue-500 shadow-2xl'
                    : 'hover:shadow-xl'
                } ${pkg.popular ? 'border-2 border-blue-500' : 'border border-gray-200'}`}
              >
                {/* Popular Badge */}
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {t('payments.popular', 'Popular')}
                  </div>
                )}

                {/* Selected Indicator */}
                {selectedPackage?.id === pkg.id && (
                  <div className="absolute top-4 right-4 bg-blue-500 rounded-full p-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{pkg.name}</h3>
                  <div className="mb-4">
                    <div className="text-3xl font-bold text-gray-900">{pkg.tmtTokens}</div>
                    <div className="text-sm text-gray-500">TMT Tokens</div>
                  </div>
                  <div className="mb-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {pkg.priceXAF.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">XAF</div>
                  </div>
                  {pkg.savingsPercent && (
                    <div className="bg-green-50 text-green-600 text-sm font-semibold py-1 px-3 rounded-full inline-block">
                      {t('payments.save', 'Save')} {pkg.savingsPercent}%
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        {selectedPackage && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              {t('payments.selectPaymentMethod', 'Select Payment Method')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* MTN Mobile Money */}
              <button
                onClick={() => handlePaymentMethodSelect('mtn_momo')}
                className={`bg-white rounded-xl shadow-lg p-6 transition-all transform hover:scale-105 ${
                  selectedPaymentMethod === 'mtn_momo'
                    ? 'ring-4 ring-yellow-500 shadow-2xl'
                    : 'hover:shadow-xl border border-gray-200'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mb-4">
                    <Smartphone className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {t('payments.mtnMomo.title', 'MTN Mobile Money')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t('payments.mtnMomo.description', 'Pay with MTN MOMO (Cameroon)')}
                  </p>
                </div>
              </button>

              {/* Stripe */}
              <button
                onClick={() => handlePaymentMethodSelect('stripe')}
                className={`bg-white rounded-xl shadow-lg p-6 transition-all transform hover:scale-105 ${
                  selectedPaymentMethod === 'stripe'
                    ? 'ring-4 ring-purple-500 shadow-2xl'
                    : 'hover:shadow-xl border border-gray-200'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-4">
                    <CreditCard className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {t('payments.stripe.title', 'Stripe Checkout')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t('payments.stripe.description', 'Pay with card via Stripe')}
                  </p>
                </div>
              </button>

              {/* Paystack */}
              <button
                onClick={() => handlePaymentMethodSelect('paystack')}
                disabled={paystackLoading}
                className={`bg-white rounded-xl shadow-lg p-6 transition-all transform hover:scale-105 ${
                  selectedPaymentMethod === 'paystack'
                    ? 'ring-4 ring-blue-500 shadow-2xl'
                    : 'hover:shadow-xl border border-gray-200'
                } ${paystackLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                    <CreditCard className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {t('payments.paystack.title', 'Paystack')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {paystackLoading
                      ? t('payments.processing', 'Processing...')
                      : t('payments.paystack.description', 'Pay with card via Paystack')
                    }
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Usage Information */}
        <div className="mt-12 max-w-3xl mx-auto bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
            {t('payments.howTokensWork', 'How TMT Tokens Work')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
            <div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white font-bold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">
                    {t('payments.photoTagging', 'Photo Tagging')}
                  </h4>
                  <p className="text-sm">{t('payments.photoTaggingCost', '25 TMT per photo')}</p>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white font-bold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">
                    {t('payments.videoTagging', 'Video Tagging')}
                  </h4>
                  <p className="text-sm">{t('payments.videoTaggingCost', '60 TMT per video')}</p>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white font-bold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">
                    {t('payments.blockchainStorage', 'Blockchain Storage')}
                  </h4>
                  <p className="text-sm">
                    {t('payments.blockchainDescription', 'Permanent archiving on Arweave')}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white font-bold text-sm">4</span>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">
                    {t('payments.referralRewards', 'Referral Rewards')}
                  </h4>
                  <p className="text-sm">
                    {t('payments.referralDescription', 'Earn tokens by inviting friends')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MTN MOMO Payment Modal */}
      <MTNMomoPaymentModal
        isOpen={showMTNMomoModal}
        onClose={() => setShowMTNMomoModal(false)}
        selectedPackage={selectedPackage}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
