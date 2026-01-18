// Geo-IP detection utility using Cloudflare + Supabase Edge Function

interface CountryDetectionResponse {
  countryCode: string;
  isFrenchSpeaking: boolean;
  suggestedLanguage: 'en' | 'fr';
  detectionMethod: 'cloudflare' | 'fallback';
}

const GEO_DETECTION_CACHE_KEY = 'tagmything-geo-country';
const GEO_DETECTION_TIMESTAMP_KEY = 'tagmything-geo-timestamp';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Detect user's country via Cloudflare's geo-IP headers
 * Uses Supabase Edge Function that reads CF-IPCountry header
 *
 * @returns Country code and suggested language, or null if detection fails
 */
export async function detectUserCountry(): Promise<CountryDetectionResponse | null> {
  try {
    // Check cache first
    const cachedCountry = localStorage.getItem(GEO_DETECTION_CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(GEO_DETECTION_TIMESTAMP_KEY);

    if (cachedCountry && cachedTimestamp) {
      const cacheAge = Date.now() - parseInt(cachedTimestamp, 10);
      if (cacheAge < CACHE_DURATION_MS) {
        console.log('Using cached geo-detection:', cachedCountry);
        return JSON.parse(cachedCountry) as CountryDetectionResponse;
      }
    }

    // Call Supabase Edge Function
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('Missing VITE_SUPABASE_URL');
      return null;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/detect-country`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Geo-detection failed:', response.status, response.statusText);
      return null;
    }

    const result = (await response.json()) as CountryDetectionResponse;

    // Cache the result
    localStorage.setItem(GEO_DETECTION_CACHE_KEY, JSON.stringify(result));
    localStorage.setItem(GEO_DETECTION_TIMESTAMP_KEY, Date.now().toString());

    console.log('Geo-detection result:', result);
    return result;
  } catch (error) {
    console.error('Error detecting country:', error);
    return null;
  }
}

/**
 * Get the cached country detection result without making a new request
 */
export function getCachedCountryDetection(): CountryDetectionResponse | null {
  try {
    const cachedCountry = localStorage.getItem(GEO_DETECTION_CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(GEO_DETECTION_TIMESTAMP_KEY);

    if (cachedCountry && cachedTimestamp) {
      const cacheAge = Date.now() - parseInt(cachedTimestamp, 10);
      if (cacheAge < CACHE_DURATION_MS) {
        return JSON.parse(cachedCountry) as CountryDetectionResponse;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Clear the geo-detection cache
 */
export function clearGeoDetectionCache(): void {
  localStorage.removeItem(GEO_DETECTION_CACHE_KEY);
  localStorage.removeItem(GEO_DETECTION_TIMESTAMP_KEY);
}
