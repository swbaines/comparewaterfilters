// One-shot setup: creates the cwf_* custom contact properties in HubSpot.
// Safe to call multiple times — existing properties are skipped (409 / 400).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/hubspot";
const GROUP_NAME = "contactinformation";

type PropDef = {
  name: string;
  label: string;
  type: "string" | "enumeration" | "number";
  fieldType: "text" | "textarea" | "select" | "number";
  options?: { label: string; value: string }[];
};

const props: PropDef[] = [
  { name: "cwf_lead_type", label: "CWF Lead Type", type: "string", fieldType: "text" },
  { name: "cwf_recommended_systems", label: "CWF Recommended Systems", type: "string", fieldType: "textarea" },
  { name: "cwf_lead_temperature", label: "CWF Lead Temperature", type: "string", fieldType: "text" },
  { name: "cwf_installation_timeline", label: "CWF Installation Timeline", type: "string", fieldType: "text" },
  { name: "cwf_budget", label: "CWF Budget", type: "string", fieldType: "text" },
  { name: "cwf_ownership_status", label: "CWF Ownership Status", type: "string", fieldType: "text" },
  { name: "cwf_property_type", label: "CWF Property Type", type: "string", fieldType: "text" },
  { name: "cwf_water_source", label: "CWF Water Source", type: "string", fieldType: "text" },
  { name: "cwf_household_size", label: "CWF Household Size", type: "string", fieldType: "text" },
  { name: "cwf_concerns", label: "CWF Concerns", type: "string", fieldType: "textarea" },
  { name: "cwf_matched_provider", label: "CWF Matched Provider", type: "string", fieldType: "text" },
  { name: "cwf_coverage", label: "CWF Coverage", type: "string", fieldType: "text" },
];

function headers() {
  const lov = Deno.env.get("LOVABLE_API_KEY");
  const hub = Deno.env.get("HUBSPOT_API_KEY");
  if (!lov) throw new Error("LOVABLE_API_KEY missing");
  if (!hub) throw new Error("HUBSPOT_API_KEY missing");
  return {
    Authorization: `Bearer ${lov}`,
    "X-Connection-Api-Key": hub,
    "Content-Type": "application/json",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const results: Array<{ name: string; status: number; ok: boolean; body?: unknown }> = [];
  try {
    for (const p of props) {
      const res = await fetch(`${GATEWAY_URL}/crm/v3/properties/contacts`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          name: p.name,
          label: p.label,
          type: p.type,
          fieldType: p.fieldType,
          groupName: GROUP_NAME,
          options: p.options,
        }),
      });
      const body = await res.json().catch(() => ({}));
      results.push({ name: p.name, status: res.status, ok: res.ok || res.status === 409, body });
    }
    // Extend hs_lead_status with custom CWF options. Fetch existing options
    // first so we preserve HubSpot's defaults and any other user-added values.
    const cur = await fetch(
      `${GATEWAY_URL}/crm/v3/properties/contacts/hs_lead_status`,
      { method: "GET", headers: headers() },
    );
    const curBody = await cur.json().catch(() => ({}));
    const existing: Array<{ label: string; value: string; displayOrder?: number; hidden?: boolean }> =
      Array.isArray(curBody?.options) ? curBody.options : [];
    const want = [
      { label: "Quiz Submitted", value: "QUIZ_SUBMITTED" },
      { label: "Quote Requested", value: "QUOTE_REQUESTED" },
    ];
    const merged = [...existing];
    let maxOrder = existing.reduce((m, o) => Math.max(m, o.displayOrder ?? 0), 0);
    for (const w of want) {
      if (!merged.some((o) => o.value === w.value)) {
        maxOrder += 1;
        merged.push({ ...w, displayOrder: maxOrder, hidden: false });
      }
    }
    const patchRes = await fetch(
      `${GATEWAY_URL}/crm/v3/properties/contacts/hs_lead_status`,
      {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ options: merged }),
      },
    );
    const patchBody = await patchRes.json().catch(() => ({}));
    results.push({
      name: "hs_lead_status (options)",
      status: patchRes.status,
      ok: patchRes.ok,
      body: patchBody,
    });
    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : String(e), results }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});