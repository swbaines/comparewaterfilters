import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/hubspot";

type Payload = {
  quote_request_id?: string;
  quiz_submission_id?: string;
  source?: string;
};

function gatewayHeaders() {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
  const HUBSPOT_API_KEY = Deno.env.get("HUBSPOT_API_KEY");
  if (!HUBSPOT_API_KEY) throw new Error("HUBSPOT_API_KEY is not configured");
  return {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": HUBSPOT_API_KEY,
    "Content-Type": "application/json",
  };
}

/**
 * Upsert a HubSpot contact by email. Customer leads only — never vendors.
 * Uses lead_source="comparewaterfilters_customer" so these can be isolated
 * from any plumber/vendor contacts in HubSpot via list filters.
 */
async function upsertContact(props: Record<string, string | undefined | null>) {
  const email = (props.email || "").trim().toLowerCase();
  if (!email) throw new Error("email is required to upsert contact");

  const cleaned: Record<string, string> = {};
  for (const [k, v] of Object.entries(props)) {
    if (v !== undefined && v !== null && String(v).length > 0) {
      cleaned[k] = String(v);
    }
  }
  cleaned.email = email;
  cleaned.lead_source = "comparewaterfilters_customer";

  // 1) Try to find existing contact by email
  const searchRes = await fetch(
    `${GATEWAY_URL}/crm/v3/objects/contacts/search`,
    {
      method: "POST",
      headers: gatewayHeaders(),
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [
              { propertyName: "email", operator: "EQ", value: email },
            ],
          },
        ],
        properties: ["email", "lead_source"],
        limit: 1,
      }),
    },
  );
  const searchData = await searchRes.json();
  if (!searchRes.ok) {
    throw new Error(
      `HubSpot search failed [${searchRes.status}]: ${JSON.stringify(searchData)}`,
    );
  }

  const existingId: string | undefined = searchData?.results?.[0]?.id;

  if (existingId) {
    const updateRes = await fetch(
      `${GATEWAY_URL}/crm/v3/objects/contacts/${existingId}`,
      {
        method: "PATCH",
        headers: gatewayHeaders(),
        body: JSON.stringify({ properties: cleaned }),
      },
    );
    const updateData = await updateRes.json();
    if (!updateRes.ok) {
      throw new Error(
        `HubSpot update failed [${updateRes.status}]: ${JSON.stringify(updateData)}`,
      );
    }
    return { id: existingId, action: "updated" };
  }

  const createRes = await fetch(`${GATEWAY_URL}/crm/v3/objects/contacts`, {
    method: "POST",
    headers: gatewayHeaders(),
    body: JSON.stringify({ properties: cleaned }),
  });
  const createData = await createRes.json();
  if (!createRes.ok) {
    throw new Error(
      `HubSpot create failed [${createRes.status}]: ${JSON.stringify(createData)}`,
    );
  }
  return { id: createData.id as string, action: "created" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as Payload;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    let contactProps: Record<string, string | undefined | null> = {};

    if (payload.quote_request_id) {
      const { data: qr, error } = await supabase
        .from("quote_requests")
        .select(
          "id, customer_name, customer_email, customer_mobile, customer_suburb, customer_state, customer_postcode, recommended_systems, lead_temperature, installation_timeline, budget, ownership_status, property_type, water_source, household_size, concerns, provider_name, is_test, created_at",
        )
        .eq("id", payload.quote_request_id)
        .maybeSingle();
      if (error) throw error;
      if (!qr) throw new Error("quote_request not found");
      if (qr.is_test) {
        return new Response(
          JSON.stringify({ skipped: true, reason: "test lead" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const [firstName, ...rest] = (qr.customer_name || "").trim().split(/\s+/);
      contactProps = {
        email: qr.customer_email,
        firstname: firstName,
        lastname: rest.join(" ") || undefined,
        phone: qr.customer_mobile,
        city: qr.customer_suburb,
        state: qr.customer_state,
        zip: qr.customer_postcode,
        cwf_lead_type: "quote_request",
        cwf_recommended_systems: (qr.recommended_systems || []).join(", "),
        cwf_lead_temperature: qr.lead_temperature || undefined,
        cwf_installation_timeline: qr.installation_timeline || undefined,
        cwf_budget: qr.budget || undefined,
        cwf_ownership_status: qr.ownership_status || undefined,
        cwf_property_type: qr.property_type || undefined,
        cwf_water_source: qr.water_source || undefined,
        cwf_household_size: qr.household_size || undefined,
        cwf_concerns: (qr.concerns || []).join(", "),
        cwf_matched_provider: qr.provider_name || undefined,
        lifecyclestage: "lead",
        // HubSpot lead status — quote requested = OPEN_DEAL
        hs_lead_status: "OPEN_DEAL",
      };
    } else if (payload.quiz_submission_id) {
      const { data: qs, error } = await supabase
        .from("quiz_submissions")
        .select(
          "id, first_name, email, mobile, suburb, state, postcode, budget, coverage, concerns, water_source, household_size, ownership_status, property_type, installation_timeline, lead_temperature, consent, created_at",
        )
        .eq("id", payload.quiz_submission_id)
        .maybeSingle();
      if (error) throw error;
      if (!qs) throw new Error("quiz_submission not found");
      if (qs.consent !== true) {
        return new Response(
          JSON.stringify({ skipped: true, reason: "no consent" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      contactProps = {
        email: qs.email,
        firstname: qs.first_name,
        phone: qs.mobile,
        city: qs.suburb,
        state: qs.state,
        zip: qs.postcode,
        cwf_lead_type: "quiz_submission",
        cwf_budget: qs.budget || undefined,
        cwf_coverage: qs.coverage || undefined,
        cwf_concerns: (qs.concerns || []).join(", "),
        cwf_water_source: qs.water_source || undefined,
        cwf_household_size: qs.household_size || undefined,
        cwf_ownership_status: qs.ownership_status || undefined,
        cwf_property_type: qs.property_type || undefined,
        cwf_installation_timeline: qs.installation_timeline || undefined,
        cwf_lead_temperature: qs.lead_temperature || undefined,
        lifecyclestage: "subscriber",
        hs_lead_status: "NEW",
      };
    } else {
      return new Response(
        JSON.stringify({
          error: "quote_request_id or quiz_submission_id required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const result = await upsertContact(contactProps);
    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("sync-to-hubspot error:", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});