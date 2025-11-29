import React, { useState, useEffect } from 'react';
import { MapPin, Settings, RefreshCw, Clock } from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

interface LocationToggleProps {
  userId: string;
  initialEnabled?: boolean;
  onLocationChange?: (location: any) => void;
  className?: string;
}

export const LocationToggle: React.FC<LocationToggleProps> = ({
  userId,
  initialEnabled = false,
  onLocationChange,
  className = ""
}) => {
  const { t } = useTranslation();
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [showDetails, setShowDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const { 
    location, 
    loading, 
    error, 
    permission,
    getCurrentLocation,
    stopWatching,
    isWatching
  } = useGeolocation({ 
    watchPosition: isEnabled,
    updateProfile: isEnabled,
    enableHighAccuracy: true,
    maximumAge: 300000 // 5 minutes
  });

  // Update location change callback
  useEffect(() => {
    if (onLocationChange && location) {
      onLocationChange(location);
    }
  }, [location, onLocationChange]);

  // Handle toggle change
  const handleToggleChange = async (enabled: boolean) => {
    setSaving(true);
    
    try {
      // Update database
      await supabase
        .from('user_profiles')
        .update({
          location_tracking_enabled: enabled,
          current_latitude: enabled && location ? location.latitude : null,
          current_longitude: enabled && location ? location.longitude : null,
          formatted_address: enabled && location ? location.formattedAddress : null,
          location_last_updated: enabled && location ? new Date().toISOString() : null
        })
        .eq('id', userId);
      
      setIsEnabled(enabled);
      
      if (enabled) {
        // Request current location immediately
        getCurrentLocation();
      } else {
        // Stop watching if disabled
        stopWatching();
      }
    } catch (err) {
      console.error('Failed to update location preference:', err);
    } finally {
      setSaving(false);
    }
  };

  // Manual refresh location
  const handleRefreshLocation = () => {
    if (isEnabled) {
      getCurrentLocation();
    }
  };

  // Format last updated time
  const formatLastUpdated = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${isEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
            <MapPin 
              size={20} 
              className={isEnabled ? 'text-green-600' : 'text-gray-400'} 
            />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{t('locationToggle.title')}</h3>
            <p className="text-sm text-gray-500">
              {isEnabled ? t('locationToggle.gpsEnabled') : t('locationToggle.gpsDisabled')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isEnabled && (
            <button
              onClick={handleRefreshLocation}
              disabled={loading || saving}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              title="Refresh location"
            >
              <RefreshCw 
                size={16} 
                className={loading ? 'animate-spin' : ''} 
              />
            </button>
          )}
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 text-gray-400 hover:text-gray-600"
            title="Toggle details"
          >
            <Settings size={16} />
          </button>
          
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => handleToggleChange(e.target.checked)}
              disabled={saving}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {isEnabled ? (
            <>
              {location ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">Current Location</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {location.formattedAddress || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
                      </p>
                    </div>
                    <div className="flex items-center text-xs text-gray-400 ml-4">
                      <Clock size={12} className="mr-1" />
                      {formatLastUpdated(location.timestamp)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-medium text-gray-600">Accuracy:</span>
                      <span className="text-gray-500 ml-1">
                        {location.accuracy ? `±${Math.round(location.accuracy)}m` : 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Status:</span>
                      <span className="text-green-600 ml-1">
                        {isWatching ? 'Tracking' : 'Static'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    <p><strong>Lat:</strong> {location.latitude.toFixed(6)}</p>
                    <p><strong>Lng:</strong> {location.longitude.toFixed(6)}</p>
                  </div>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-4">
                  <RefreshCw size={16} className="animate-spin text-gray-400 mr-2" />
                  <span className="text-sm text-gray-500">Getting your location...</span>
                </div>
              ) : error ? (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  <p className="font-medium">Location Error</p>
                  <p className="text-xs mt-1">{error}</p>
                </div>
              ) : null}
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">
                {t('locationToggle.enableDescription')}
              </p>
            </div>
          )}
          
          {permission.denied && (
            <div className="mt-3 text-xs text-amber-600 bg-amber-50 p-3 rounded">
              <p className="font-medium">Browser Permission Required</p>
              <p>Please allow location access in your browser settings to use this feature.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};