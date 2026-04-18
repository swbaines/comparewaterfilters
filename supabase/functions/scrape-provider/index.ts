const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl connector not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log("Scraping provider URL:", formattedUrl);

    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: [
          {
            type: "json",
            schema: {
              type: "object",
              properties: {
                company_name: { type: "string" },
                description: { type: "string" },
                phone: { type: "string" },
                email: { type: "string" },
                services: {
                  type: "array",
                  items: { type: "string" },
                },
                service_areas: {
                  type: "array",
                  items: { type: "string" },
                },
                certifications: {
                  type: "array",
                  items: { type: "string" },
                },
                brands: {
                  type: "array",
                  items: { type: "string" },
                },
                highlights: {
                  type: "array",
                  items: { type: "string" },
                },
                years_in_business: { type: "number" },
                warranty_info: { type: "string" },
              },
            },
            prompt:
              "Extract water filtration/plumbing business details. For services, list the types of water filtration systems they install (e.g. reverse osmosis, whole house carbon, UV system, water softener, under-sink carbon). For service_areas, list Australian states they serve (NSW, VIC, QLD, SA, WA, TAS, NT, ACT). For brands, list water filtration brands they work with.",
          },
        ],
        onlyMainContent: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Firecrawl API error:", data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Request failed with status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map scraped data to our provider schema
    const extracted = data.data?.json || data.json || {};
    const systemTypeMap: Record<string, string> = {
      "reverse osmosis": "reverse-osmosis",
      "whole house carbon": "whole-house-filtration",
      "whole house": "whole-house-filtration",
      "uv system": "uv-system",
      "uv filter": "uv-system",
      "water softener": "water-softener",
      "under sink": "under-sink-carbon",
      "under-sink": "under-sink-carbon",
      "whole house combo": "whole-house-combo",
    };

    const mapServices = (services: string[] = []): string[] => {
      const mapped: Set<string> = new Set();
      for (const s of services) {
        const lower = s.toLowerCase();
        for (const [key, val] of Object.entries(systemTypeMap)) {
          if (lower.includes(key)) mapped.add(val);
        }
      }
      return Array.from(mapped);
    };

    const providerData = {
      name: extracted.company_name || "",
      description: extracted.description || "",
      phone: extracted.phone || "",
      states: extracted.service_areas || [],
      system_types: mapServices(extracted.services),
      brands: extracted.brands || [],
      certifications: extracted.certifications || [],
      highlights: extracted.highlights || [],
      years_in_business: extracted.years_in_business || 0,
      warranty: extracted.warranty_info || "",
      website: formattedUrl,
    };

    return new Response(
      JSON.stringify({ success: true, data: providerData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error scraping provider:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to scrape";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
