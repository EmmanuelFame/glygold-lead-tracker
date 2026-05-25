import { createClient } from "@supabase/supabase-js";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

function categoryFromCandidate(candidate) {
  const haystack = [
    candidate.category,
    candidate.business_name,
    candidate.search_query,
    ...(candidate.types || []),
  ]
    .join(" ")
    .toLowerCase();

  if (haystack.includes("restaurant") || haystack.includes("food") || haystack.includes("meal")) return "Food / Restaurant";
  if (haystack.includes("cake") || haystack.includes("bakery") || haystack.includes("pastry")) return "Cakes / Pastry";
  if (haystack.includes("beauty") || haystack.includes("salon") || haystack.includes("spa")) return "Beauty / Spa";
  if (haystack.includes("fashion") || haystack.includes("boutique") || haystack.includes("clothing")) return "Fashion";
  if (haystack.includes("tailor")) return "Tailoring";
  if (haystack.includes("real estate") || haystack.includes("property")) return "Real Estate";
  if (haystack.includes("event")) return "Event Vendor";
  return "Retail";
}

function candidateOffer(candidate) {
  const category = categoryFromCandidate(candidate);
  if (category === "Food / Restaurant") return "Food ordering website + WhatsApp commerce bot";
  if (category === "Cakes / Pastry") return "Cake catalog, checkout, delivery zones, and order tracking";
  if (category === "Beauty / Spa") return "Beauty storefront, booking inquiries, products, and customer conversations";
  if (category === "Fashion") return "Fashion store with catalog, cart, checkout, wishlist, and delivery tracking";
  if (category === "Real Estate") return "Property inquiry website, lead capture, conversations, and analytics";
  if (category === "Event Vendor") return "Event service website, quote requests, WhatsApp follow-up, and promo creatives";
  return "GlyGold commerce website, dashboard, WhatsApp bot, analytics, and marketing creatives";
}

function candidateValue(candidate) {
  const score = Number(candidate.score || 0);
  if (score >= 85) return 350000;
  if (score >= 72) return 250000;
  if (score >= 60) return 175000;
  return 125000;
}

function candidateMessage(candidate) {
  const business = candidate.business_name || "your business";
  const category = categoryFromCandidate(candidate).toLowerCase();
  return `Hi ${business}, I found your ${category} business while looking for stores that could benefit from a stronger online sales flow. GlyGold can give you a website, product catalog, checkout, WhatsApp ordering, delivery tracking, customer conversations, analytics, and launch creatives. Would you like me to send a quick example?`;
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
    const candidateId = body.candidateId;

    if (!candidateId) {
      return json(400, { error: "candidateId is required." });
    }

    const supabase = getSupabase();
    const { data: candidate, error: candidateError } = await supabase
      .from("lead_candidates")
      .select("*")
      .eq("id", candidateId)
      .single();

    if (candidateError) throw candidateError;
    if (!candidate) return json(404, { error: "Candidate not found." });

    const leadPayload = {
      business_name: candidate.business_name,
      category: categoryFromCandidate(candidate),
      whatsapp_link: candidate.phone || "",
      contact_name: "",
      first_message: candidateMessage(candidate),
      status: "Message Ready",
      offer_sent: candidateOffer(candidate),
      potential_value: candidateValue(candidate),
      closed_amount: 0,
      notes: [
        `Generated from ${candidate.source || "Lead Radar"}`,
        candidate.address ? `Address: ${candidate.address}` : "",
        candidate.maps_url ? `Maps: ${candidate.maps_url}` : "",
        candidate.website_url ? `Website: ${candidate.website_url}` : "",
        candidate.score ? `Lead Radar score: ${candidate.score}` : "",
        ...(candidate.score_reasons || []),
      ]
        .filter(Boolean)
        .join("\n"),
      last_contacted_at: null,
      next_followup_at: new Date().toISOString().slice(0, 10),
    };

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert(leadPayload)
      .select()
      .single();

    if (leadError) throw leadError;

    const { error: updateError } = await supabase
      .from("lead_candidates")
      .update({
        status: "promoted",
        promoted_at: new Date().toISOString(),
      })
      .eq("id", candidateId);

    if (updateError) throw updateError;

    return json(200, { lead });
  } catch (error) {
    console.error(error);
    return json(500, { error: error.message || "Could not promote candidate." });
  }
}
