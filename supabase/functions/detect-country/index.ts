// supabase/functions/detect-country/index.ts
// Detects user's country via Cloudflare's CF-IPCountry header
// Returns country code and suggested language based on French-speaking countries

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, cf-ipcountry",
};

// List of French-speaking countries (ISO 3166-1 alpha-2 codes)
// Source: https://en.wikipedia.org/wiki/List_of_territorial_entities_where_French_is_an_official_language
const FRENCH_SPEAKING_COUNTRIES = new Set([
  "FR", // France
  "BE", // Belgium
  "CH", // Switzerland
  "CA", // Canada
  "LU", // Luxembourg
  "MC", // Monaco

  // Africa
  "CM", // Cameroon
  "CI", // Côte d'Ivoire (Ivory Coast)
  "CD", // Democratic Republic of the Congo
  "CG", // Republic of the Congo
  "BJ", // Benin
  "BF", // Burkina Faso
  "BI", // Burundi
  "CF", // Central African Republic
  "TD", // Chad
  "KM", // Comoros
  "DJ", // Djibouti
  "GQ", // Equatorial Guinea
  "GA", // Gabon
  "GN", // Guinea
  "MG", // Madagascar
  "ML", // Mali
  "NE", // Niger
  "RW", // Rwanda
  "SN", // Senegal
  "SC", // Seychelles
  "TG", // Togo

  // Caribbean & Americas
  "HT", // Haiti
  "GF", // French Guiana
  "GP", // Guadeloupe
  "MQ", // Martinique
  "PM", // Saint Pierre and Miquelon
  "BL", // Saint Barthélemy
  "MF", // Saint Martin

  // Pacific
  "PF", // French Polynesia
  "NC", // New Caledonia
  "WF", // Wallis and Futuna
  "VU", // Vanuatu

  // Indian Ocean
  "RE", // Réunion
  "YT", // Mayotte

  // Middle East
  "LB", // Lebanon
  "DZ", // Algeria
  "MA", // Morocco
  "TN", // Tunisia
]);

interface CountryDetectionResponse {
  countryCode: string;
  isFrenchSpeaking: boolean;
  suggestedLanguage: "en" | "fr";
  detectionMethod: "cloudflare" | "fallback";
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Cloudflare automatically adds the CF-IPCountry header
    // https://developers.cloudflare.com/fundamentals/reference/http-request-headers/#cf-ipcountry
    const countryCode = req.headers.get("CF-IPCountry")?.toUpperCase() || "XX";

    console.log("Detected country from Cloudflare:", countryCode);

    // Check if it's a valid country code (not XX which is unknown/localhost)
    const isValidCountry = countryCode !== "XX" && countryCode !== "T1" && countryCode.length === 2;
    const isFrenchSpeaking = isValidCountry && FRENCH_SPEAKING_COUNTRIES.has(countryCode);

    const response: CountryDetectionResponse = {
      countryCode: isValidCountry ? countryCode : "XX",
      isFrenchSpeaking,
      suggestedLanguage: isFrenchSpeaking ? "fr" : "en",
      detectionMethod: isValidCountry ? "cloudflare" : "fallback",
    };

    console.log("Country detection result:", response);

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          // Cache for 1 hour to reduce function calls
          "Cache-Control": "public, max-age=3600",
        },
      }
    );
  } catch (error) {
    console.error("Country detection error:", error);

    // Return fallback response
    return new Response(
      JSON.stringify({
        countryCode: "XX",
        isFrenchSpeaking: false,
        suggestedLanguage: "en",
        detectionMethod: "fallback",
        error: (error as Error)?.message || "Unknown error",
      } as CountryDetectionResponse),
      {
        status: 200, // Return 200 even on error to avoid breaking the app
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
