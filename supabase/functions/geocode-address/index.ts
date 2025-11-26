import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address } = await req.json();

    if (!address || typeof address !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid address" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Sanitize and prepare address for geocoding
    const cleanedAddress = address.trim();
    
    console.log('Geocoding address:', cleanedAddress);

    // Helper function to try geocoding
    const tryGeocode = async (searchAddress: string) => {
      const encodedAddress = encodeURIComponent(searchAddress);
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=3&countrycodes=th&accept-language=th`;
      
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'ThaiFloodHelp/1.0 (Disaster Relief Application)',
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const data = await response.json();
      return data && data.length > 0 ? data[0] : null;
    };

    // Strategy 1: Try exact address
    let result = await tryGeocode(cleanedAddress);

    // Strategy 2: If no results and address contains formal terms (ตำบล, อำเภอ, จังหวัด), 
    // try simplified version without postal code
    if (!result && /\d{5}/.test(cleanedAddress)) {
      const withoutPostal = cleanedAddress.replace(/\s*\d{5}\s*$/, '');
      console.log('Trying without postal code:', withoutPostal);
      result = await tryGeocode(withoutPostal);
    }

    // Strategy 3: Try replacing formal terms with abbreviations
    if (!result) {
      const abbreviated = cleanedAddress
        .replace(/ตำบล/g, 'ต.')
        .replace(/อำเภอ/g, 'อ.')
        .replace(/จังหวัด/g, 'จ.')
        .replace(/ถนน/g, 'ถ.')
        .replace(/\s*\d{5}\s*$/, ''); // Also remove postal code
      
      if (abbreviated !== cleanedAddress) {
        console.log('Trying abbreviated:', abbreviated);
        result = await tryGeocode(abbreviated);
      }
    }

    // Strategy 4: Extract street/road + district/city only
    if (!result) {
      const streetMatch = cleanedAddress.match(/^[\d\/\-]+\s*(?:ถ\.|ถนน)?\s*([^\s]+)/);
      const districtMatch = cleanedAddress.match(/(?:อ\.|อำเภอ)([^\s]+)/);
      
      if (streetMatch && districtMatch) {
        const simplified = `${streetMatch[0]} อ.${districtMatch[1]}`;
        console.log('Trying street + district:', simplified);
        result = await tryGeocode(simplified);
      }
    }

    // Strategy 5: Try just district/city name
    if (!result) {
      const cityMatch = cleanedAddress.match(/(?:อ\.|อำเภอ|ต\.|ตำบล)([^\s]+)/);
      if (cityMatch) {
        const cityOnly = cityMatch[0].replace(/ตำบล|อำเภอ/, '').replace(/^(อ\.|ต\.)/, '') + ' ' + cityMatch[1];
        console.log('Trying city only:', cityOnly);
        result = await tryGeocode(cityOnly);
      }
    }

    // If we found a result from any strategy
    if (result) {
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      const mapLink = `https://maps.google.com/?q=${lat},${lng}`;

      console.log('Geocoding successful:', { lat, lng, mapLink });

      return new Response(
        JSON.stringify({
          lat,
          lng,
          map_link: mapLink,
          display_name: result.display_name,
          success: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('No geocoding results found for address:', cleanedAddress);

    // Return success: false instead of error - this is a normal case
    return new Response(
      JSON.stringify({
        lat: null,
        lng: null,
        map_link: null,
        success: false,
        message: "Address could not be geocoded"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (err) {
    console.error("Error geocoding address:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
