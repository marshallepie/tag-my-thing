import { useState, useEffect } from 'react';

interface GeolocationData {
  latitude: number;
  longitude: number;
  country: string;
  language: string;
}

export const useGeolocation = () => {
  const [location, setLocation] = useState<GeolocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Mock reverse geocoding - in production, use Google Maps API
          const country = await getCountryFromCoords(latitude, longitude);
          const language = getLanguageFromCountry(country);
          
          setLocation({
            latitude,
            longitude,
            country,
            language,
          });
        } catch (err) {
          setError('Failed to get location data');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError(err.message);
        setLoading(false);
        // Set default to UK/English if geolocation fails
        setLocation({
          latitude: 51.5074,
          longitude: -0.1278,
          country: 'UK',
          language: 'en',
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000, // 10 minutes
      }
    );
  }, []);

  const getCountryFromCoords = async (lat: number, lng: number): Promise<string> => {
    // Mock implementation - in production, use Google Maps Geocoding API
    // This is a simplified mapping based on rough coordinates
    if (lat >= 1 && lat <= 13 && lng >= 8 && lng <= 16) {
      return 'CM'; // Cameroon
    } else if (lat >= 4 && lat <= 14 && lng >= 2.5 && lng <= 15) {
      return 'NG'; // Nigeria
    } else if (lat >= 49 && lat <= 61 && lng >= -8 && lng <= 2) {
      return 'UK'; // United Kingdom
    }
    return 'UK'; // Default to UK
  };

  const getLanguageFromCountry = (country: string): string => {
    const languageMap: Record<string, string> = {
      'CM': 'fr', // Cameroon - French
      'NG': 'en', // Nigeria - English
      'UK': 'en', // United Kingdom - English
    };
    return languageMap[country] || 'en';
  };

  return { location, loading, error };
};