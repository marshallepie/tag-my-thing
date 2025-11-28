import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  country: string;
  language: string;
  formattedAddress: string;
  timestamp: number;
}

interface LocationPermission {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
  updateProfile?: boolean;
}

export const useGeolocation = (options: UseGeolocationOptions = {}) => {
  const [location, setLocation] = useState<GeolocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<LocationPermission>({
    granted: false,
    denied: false,
    prompt: true
  });
  const [watchId, setWatchId] = useState<number | null>(null);

  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 300000, // 5 minutes
    watchPosition = false,
    updateProfile = false
  } = options;

  // Check initial permission state
  useEffect(() => {
    const checkPermission = async () => {
      if ('permissions' in navigator) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          setPermission({
            granted: result.state === 'granted',
            denied: result.state === 'denied',
            prompt: result.state === 'prompt'
          });
        } catch (err) {
          console.log('Permissions API not available');
        }
      }
    };
    checkPermission();
  }, []);

  // Reverse geocoding using Google Maps API
  const reverseGeocode = async (lat: number, lng: number): Promise<{
    formattedAddress: string;
    country: string;
    language: string;
  }> => {
    try {
      // First try with Google Maps API if available
      const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (googleMapsKey) {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleMapsKey}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            const result = data.results[0];
            const countryComponent = result.address_components.find(
              (component: any) => component.types.includes('country')
            );
            
            return {
              formattedAddress: result.formatted_address,
              country: countryComponent?.short_name || getCountryFromCoords(lat, lng),
              language: getLanguageFromCountry(countryComponent?.short_name || 'UK')
            };
          }
        }
      }
      
      // Fallback to coordinate-based detection
      return {
        formattedAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        country: getCountryFromCoords(lat, lng),
        language: getLanguageFromCountry(getCountryFromCoords(lat, lng))
      };
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
      return {
        formattedAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        country: getCountryFromCoords(lat, lng),
        language: getLanguageFromCountry(getCountryFromCoords(lat, lng))
      };
    }
  };

  // Update user profile with current location
  const updateUserLocation = async (locationData: GeolocationData) => {
    if (!updateProfile) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_profiles')
        .update({
          current_latitude: locationData.latitude,
          current_longitude: locationData.longitude,
          formatted_address: locationData.formattedAddress,
          location_last_updated: new Date().toISOString()
        })
        .eq('id', user.id);
    } catch (err) {
      console.error('Failed to update user location:', err);
    }
  };

  // Process position data
  const processPosition = useCallback(async (position: GeolocationPosition) => {
    setLoading(true);
    try {
      const { latitude, longitude, accuracy } = position.coords;
      
      const geocodeResult = await reverseGeocode(latitude, longitude);
      
      const locationData: GeolocationData = {
        latitude,
        longitude,
        accuracy,
        country: geocodeResult.country,
        language: geocodeResult.language,
        formattedAddress: geocodeResult.formattedAddress,
        timestamp: position.timestamp
      };
      
      setLocation(locationData);
      setError(null);
      
      // Update user profile if requested
      await updateUserLocation(locationData);
      
    } catch (err) {
      setError('Failed to process location data');
      console.error('Location processing error:', err);
    } finally {
      setLoading(false);
    }
  }, [updateProfile]);

  // Handle geolocation errors
  const handleError = useCallback((err: GeolocationPositionError) => {
    setLoading(false);
    
    switch (err.code) {
      case err.PERMISSION_DENIED:
        setError('Location access denied by user');
        setPermission(prev => ({ ...prev, denied: true, prompt: false }));
        break;
      case err.POSITION_UNAVAILABLE:
        setError('Location information unavailable');
        break;
      case err.TIMEOUT:
        setError('Location request timed out');
        break;
      default:
        setError('An unknown error occurred while retrieving location');
        break;
    }
    
    // Set default location as fallback
    setLocation({
      latitude: 51.5074,
      longitude: -0.1278,
      accuracy: 0,
      country: 'UK',
      language: 'en',
      formattedAddress: 'London, UK (Default)',
      timestamp: Date.now()
    });
  }, []);

  // Request location permission and get current position
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    setError(null);

    const options: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    };

    navigator.geolocation.getCurrentPosition(
      processPosition,
      handleError,
      options
    );
  }, [processPosition, handleError, enableHighAccuracy, timeout, maximumAge]);

  // Start watching position
  const startWatching = useCallback(() => {
    if (!navigator.geolocation || watchId !== null) return;

    const options: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    };

    const id = navigator.geolocation.watchPosition(
      processPosition,
      handleError,
      options
    );

    setWatchId(id);
  }, [processPosition, handleError, enableHighAccuracy, timeout, maximumAge, watchId]);

  // Stop watching position
  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  // Auto-start functionality
  useEffect(() => {
    if (watchPosition) {
      startWatching();
    } else {
      getCurrentLocation();
    }

    return () => {
      stopWatching();
    };
  }, [watchPosition, startWatching, getCurrentLocation, stopWatching]);

  // Helper functions (improved)
  const getCountryFromCoords = (lat: number, lng: number): string => {
    // Enhanced coordinate-based country detection
    if (lat >= 1 && lat <= 13 && lng >= 8 && lng <= 16) {
      return 'CM'; // Cameroon
    } else if (lat >= 4 && lat <= 14 && lng >= 2.5 && lng <= 15) {
      return 'NG'; // Nigeria
    } else if (lat >= 49 && lat <= 61 && lng >= -8 && lng <= 2) {
      return 'UK'; // United Kingdom
    } else if (lat >= 25 && lat <= 49 && lng >= -125 && lng <= -66) {
      return 'US'; // United States
    } else if (lat >= 42 && lat <= 71 && lng >= -141 && lng <= -52) {
      return 'CA'; // Canada
    } else if (lat >= 36 && lat <= 71 && lng >= -10 && lng <= 40) {
      return 'EU'; // General Europe
    }
    return 'UK'; // Default fallback
  };

  const getLanguageFromCountry = (country: string): string => {
    const languageMap: Record<string, string> = {
      'CM': 'fr', // Cameroon - French
      'NG': 'en', // Nigeria - English
      'UK': 'en', // United Kingdom - English
      'US': 'en', // United States - English
      'CA': 'en', // Canada - English
      'EU': 'en', // Europe - English default
    };
    return languageMap[country] || 'en';
  };

  return {
    location,
    loading,
    error,
    permission,
    getCurrentLocation,
    startWatching,
    stopWatching,
    isWatching: watchId !== null,
    clearError: () => setError(null)
  };
};