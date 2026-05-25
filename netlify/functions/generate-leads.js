import { createClient } from "@supabase/supabase-js";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const categoryMap = {
  "Food / Restaurant": ["catering.restaurant", "catering.fast_food", "catering.food_court"],
  Fashion: ["commercial.clothing", "commercial.clothing.shoes", "commercial.bag"],
  "Beauty / Spa": ["service.beauty", "service.beauty.hairdresser", "service.beauty.spa"],
  "Cakes / Pastry": ["commercial.food_and_drink.bakery", "catering.cafe"],
  "Real Estate": ["service.estate_agent"],
  Tailoring: ["service.tailor"],
  Retail: ["commercial"],
  "Event Vendor": ["activity.events_venue", "commercial.wedding", "service.photographer"],
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

function getApiKey() {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) throw new Error("Missing GEOAPIFY_API_KEY.");
  return apiKey;
}

function geoapifyCategories(category) {
  return categoryMap[category] || categoryMap.Retail;
}

function scorePlace(place) {
  const reasons = [];
  let score = 35;
  const phone = place.contact?.phone || place.datasource?.raw?.phone || "";
  const website = place.website || place.contact?.website || place.datasource?.raw?.website || "";

  if (phone) {
    score += 26;
    reasons.push("Phone available for manual WhatsApp check");
  } else {
    reasons.push("No public phone listed");
  }

  if (!website) {
    score += 24;
    reasons.push("No website found, strong website opportunity");
  } else {
    score += 10;
    reasons.push("Has website, review its commerce experience");
  }

  if ((place.categories || []).some((type) => type.startsWith("commercial") || type.startsWith("catering") || type.startsWith("service"))) {
    score += 15;
    reasons.push("Fits a GlyGold selling category");
  }

  return {
    phone,
    website,
    score: Math.max(0, Math.min(100, score)),
    reasons,
  };
}

async function getCityBoundary(location) {
  const apiKey = getApiKey();
  const params = new URLSearchParams({
    text: location,
    type: "city",
    format: "json",
    limit: "1",
    apiKey,
  });
  const response = await fetch(`https://api.geoapify.com/v1/geocode/search?${params}`);
  const payload = await response.json();
  const city = payload.results?.[0];

  if (!response.ok || !city?.place_id) {
    throw new Error(`Could not identify the search city: ${location}.`);
  }

  return city;
}

async function fetchPlaces({ category, cityPlaceId, limit, offset = 0 }) {
  const apiKey = getApiKey();
  const params = new URLSearchParams({
    categories: geoapifyCategories(category).join(","),
    filter: `place:${cityPlaceId}`,
    limit: String(Math.min(Math.max(limit, 1), 100)),
    offset: String(Math.max(Number(offset || 0), 0)),
    apiKey,
  });
  const response = await fetch(`https://api.geoapify.com/v2/places?${params}`);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || "Geoapify Places request failed.");
  }

  return payload.features || [];
}

async function enrichPlace(properties) {
  try {
    const apiKey = getApiKey();
    const params = new URLSearchParams({
      id: properties.place_id,
      features: "details",
      apiKey,
    });
    const response = await fetch(`https://api.geoapify.com/v2/place-details?${params}`);
    const payload = await response.json();

    if (!response.ok) return properties;

    const details = payload.features?.find((feature) => feature.properties.feature_type === "details")?.properties;
    return details || properties;
  } catch (error) {
    console.info("Geoapify details unavailable for one candidate.", properties.place_id, error.message);
    return properties;
  }
}

async function enrichPlaces(placeFeatures) {
  const chunkSize = 20;
  const enriched = [];

  for (let index = 0; index < placeFeatures.length; index += chunkSize) {
    const chunk = placeFeatures.slice(index, index + chunkSize);
    const details = await Promise.all(
      chunk.map((feature) => enrichPlace(feature.properties || {}))
    );
    enriched.push(...details);
  }

  return enriched;
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const location = String(body.location || "Lagos, Nigeria").trim();
    const category = String(body.category || "Food / Restaurant").trim();
    const batchSize = Math.min(Math.max(Number(body.batchSize || 50), 1), 100);
    const offset = Math.max(Number(body.offset || 0), 0);
    const phoneOnly = body.phoneOnly !== false;
    const withoutWebsiteOnly = body.withoutWebsiteOnly !== false;
    const supabase = getSupabase();
    const city = await getCityBoundary(location);
    const discoveryLimit = phoneOnly ? Math.min(Math.max(batchSize * 3, 20), 100) : batchSize;
    const placeFeatures = await fetchPlaces({ category, cityPlaceId: city.place_id, limit: discoveryLimit, offset });
    const places = await enrichPlaces(placeFeatures);

    const discoveredCandidates = places
      .filter((place) => place.place_id && place.name)
      .map((place) => {
      const scoring = scorePlace(place);
      const mapsUrl = `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lon}#map=17/${place.lat}/${place.lon}`;

      return {
        source: "geoapify",
        source_id: place.place_id,
        business_name: place.name,
        category,
        phone: scoring.phone,
        website_url: scoring.website,
        maps_url: mapsUrl,
        address: place.formatted || "",
        rating: null,
        review_count: 0,
        types: place.categories || [],
        score: scoring.score,
        score_reasons: scoring.reasons,
        search_query: category,
        search_location: location,
        status: "new",
        raw: place,
      };
    });
    const skippedWithoutPhone = phoneOnly
      ? discoveredCandidates.filter((candidate) => !candidate.phone).length
      : 0;
    const skippedWithWebsite = withoutWebsiteOnly
      ? discoveredCandidates.filter((candidate) => candidate.website_url).length
      : 0;
    const candidates = discoveredCandidates.filter((candidate) => {
      if (phoneOnly && !candidate.phone) return false;
      if (withoutWebsiteOnly && candidate.website_url) return false;
      return true;
    });

    const rankedCandidates = candidates.sort((a, b) => b.score - a.score).slice(0, batchSize);

    if (!rankedCandidates.length) {
      return json(200, { inserted: 0, duplicates: 0, skippedWithoutPhone, skippedWithWebsite, candidates: [], provider: "Geoapify" });
    }

    const { data, error } = await supabase
      .from("lead_candidates")
      .upsert(rankedCandidates, {
        onConflict: "source,source_id",
        ignoreDuplicates: true,
      })
      .select("*")
      .order("score", { ascending: false });

    if (error) throw error;

    return json(200, {
      inserted: data?.length || 0,
      duplicates: Math.max(0, rankedCandidates.length - (data?.length || 0)),
      skippedWithoutPhone,
      skippedWithWebsite,
      candidates: data || [],
      provider: "Geoapify",
      offset,
    });
  } catch (error) {
    console.error(error);
    return json(500, { error: error.message || "Lead Radar failed." });
  }
}
