import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { TokenPackage, getTokenPackagesByCurrency } from '../../hooks/usePaystack';

interface TokenPackageSelectorProps {
  onSelectPackage: (pkg: TokenPackage) => void;
  loading?: boolean;
  currency?: string;
}

export const TokenPackageSelector: React.FC<TokenPackageSelectorProps> = ({
  onSelectPackage,
  loading = false,
  currency = 'USD',
}) => {
  const { t } = useTranslation();
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const packages = getTokenPackagesByCurrency(selectedCurrency);

  const supportedCurrencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
    { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
    { code: 'XOF', name: 'West African CFA', symbol: 'CFA' },
  ];

  const getCurrencySymbol = (currencyCode: string): string => {
    return supportedCurrencies.find(c => c.code === currencyCode)?.symbol || currencyCode;
  };

  const formatPrice = (price: number, currencyCode: string): string => {
    const symbol = getCurrencySymbol(currencyCode);
    if (['NGN', 'GHS', 'KES', 'XOF', 'ZAR'].includes(currencyCode)) {
      return `${symbol}${price.toLocaleString()}`;
    }
    return `${symbol}${price.toFixed(2)}`;
  };

  const getPackageIcon = (packageId: string) => {
    switch (packageId) {
      case 'starter':
        return <Zap className="h-6 w-6" />;
      case 'popular':
        return <Sparkles className="h-6 w-6" />;
      case 'value':
        return <TrendingUp className="h-6 w-6" />;
      case 'premium':
        return <Sparkles className="h-6 w-6" />;
      default:
        return <Zap className="h-6 w-6" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Currency Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('payments.selectCurrency')}
        </label>
        <select
          value={selectedCurrency}
          onChange={(e) => setSelectedCurrency(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          disabled={loading}
        >
          {supportedCurrencies.map((curr) => (
            <option key={curr.code} value={curr.code}>
              {curr.name} ({curr.symbol})
            </option>
          ))}
        </select>
      </div>

      {/* Token Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {packages.map((pkg) => (
          <Card
            key={pkg.id}
            className={`relative p-6 cursor-pointer transition-all hover:shadow-lg ${
              pkg.popular
                ? 'border-2 border-primary-500 shadow-lg'
                : 'border border-gray-200'
            }`}
            onClick={() => !loading && onSelectPackage(pkg)}
          >
            {/* Popular Badge */}
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {t('payments.mostPopular')}
                </span>
              </div>
            )}

            {/* Package Icon */}
            <div
              className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${
                pkg.popular ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {getPackageIcon(pkg.id)}
            </div>

            {/* Token Amount */}
            <div className="mb-2">
              <div className="text-3xl font-bold text-gray-900">{pkg.tokens}</div>
              <div className="text-sm text-gray-600">{t('payments.tmtTokens')}</div>
            </div>

            {/* Price */}
            <div className="mb-4">
              <div className="text-2xl font-bold text-primary-600">
                {formatPrice(pkg.price, pkg.currency)}
              </div>
              {pkg.savings && (
                <div className="text-xs text-green-600 font-semibold mt-1">
                  {pkg.savings}
                </div>
              )}
            </div>

            {/* Features */}
            <ul className="space-y-2 mb-4">
              <li className="flex items-start text-sm text-gray-600">
                <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>{t('payments.featureTagging', { count: pkg.tokens })}</span>
              </li>
              <li className="flex items-start text-sm text-gray-600">
                <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>{t('payments.featurePermanentStorage')}</span>
              </li>
              <li className="flex items-start text-sm text-gray-600">
                <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>{t('payments.featureNoExpiry')}</span>
              </li>
            </ul>

            {/* Select Button */}
            <Button
              variant={pkg.popular ? 'primary' : 'outline'}
              className="w-full"
              disabled={loading}
            >
              {loading ? t('payments.processing') : t('payments.selectPackage')}
            </Button>
          </Card>
        ))}
      </div>

      {/* Payment Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Check className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-900">
              {t('payments.securePayment')}
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              {t('payments.securePaymentDescription')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
