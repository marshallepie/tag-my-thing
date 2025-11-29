import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Shield, X, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useGeolocation } from '../../hooks/useGeolocation';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useTranslatedToast } from '../../hooks/useTranslatedToast';

interface LocationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionSet: (enabled: boolean) => void;
  showOnSignup?: boolean;
}

export const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({
  isOpen,
  onClose,
  onPermissionSet,
  showOnSignup = false
}) => {
  const { t } = useTranslation();
  const toast = useTranslatedToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'intro' | 'requesting' | 'success' | 'denied'>('intro');

  const handleEnableLocation = async () => {
    setLoading(true);
    setStep('requesting');

    try {
      // Request geolocation permission
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });
      });

      // Update user profile to enable location tracking
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_profiles')
          .update({
            location_tracking_enabled: true,
            current_latitude: position.coords.latitude,
            current_longitude: position.coords.longitude,
            location_last_updated: new Date().toISOString()
          })
          .eq('id', user.id);
      }

      setStep('success');
      onPermissionSet(true);
      
      // Auto-close after showing success
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Location permission error:', error);
      setStep('denied');
      onPermissionSet(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableLocation = async () => {
    setLoading(true);

    try {
      // Update user profile to disable location tracking
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_profiles')
          .update({
            location_tracking_enabled: false,
            current_latitude: null,
            current_longitude: null,
            formatted_address: null,
            location_last_updated: null
          })
          .eq('id', user.id);
      }

      onPermissionSet(false);
      onClose();
    } catch (error) {
      console.error('Error disabling location:', error);
      onPermissionSet(false);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onPermissionSet(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        {step !== 'requesting' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        )}

        {step === 'intro' && (
          <>
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <MapPin size={32} className="text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                {t('gps.permissionTitle')}
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                {t('gps.permissionMessage')}
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start space-x-3">
                <Shield size={16} className="text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">{t('gps.benefitPrivacyTitle')}</p>
                  <p className="text-xs text-gray-600">
                    {t('gps.benefitPrivacyDescription')}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin size={16} className="text-blue-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">{t('gps.benefitContextTitle')}</p>
                  <p className="text-xs text-gray-600">
                    {t('gps.benefitContextDescription')}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle size={16} className="text-purple-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">{t('gps.benefitChoiceTitle')}</p>
                  <p className="text-xs text-gray-600">
                    {t('gps.benefitChoiceDescription')}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleEnableLocation}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('gps.enableButton')}
              </button>
              <button
                onClick={showOnSignup ? handleSkip : handleDisableLocation}
                disabled={loading}
                className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showOnSignup ? t('gps.skipButton') : t('gps.disableButton')}
              </button>
            </div>
          </>
        )}

        {step === 'requesting' && (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <MapPin size={32} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('gps.requestingTitle')}</h3>
            <p className="text-gray-600 text-sm">
              {t('gps.requestingMessage')}
            </p>
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-green-800">{t('gps.successTitle')}</h3>
            <p className="text-gray-600 text-sm">
              {t('gps.successMessage')}
            </p>
          </div>
        )}

        {step === 'denied' && (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={32} className="text-red-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-red-800">{t('gps.deniedTitle')}</h3>
            <p className="text-gray-600 text-sm mb-4">
              {t('gps.deniedMessage')}
            </p>
            <button
              onClick={handleSkip}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700"
            >
              {t('gps.continueButton')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};