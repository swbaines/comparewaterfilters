import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  const priorityState = (url.searchParams.get("state") || "").toUpperCase();

  if (!q || q.length < 2) {
    return new Response(JSON.stringify([]), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const res = await fetch(
      `https://v0.postcodeapi.com.au/suburbs.json?q=${encodeURIComponent(q)}`
    );
    const data = await res.json();

    const qLower = q.toLowerCase();
    const slim = (data as any[]).slice(0, 30).map((s: any) => ({
      name: s.name as string,
      postcode: s.postcode as number,
      state: (s.state?.abbreviation || "") as string,
    }));

    // Sort: priority state first, then exact prefix matches, then alphabetically
    slim.sort((a, b) => {
      // Priority state comes first
      if (priorityState) {
        const aPri = a.state === priorityState ? 0 : 1;
        const bPri = b.state === priorityState ? 0 : 1;
        if (aPri !== bPri) return aPri - bPri;
      }
      const aExact = a.name.toLowerCase().startsWith(qLower) ? 0 : 1;
      const bExact = b.name.toLowerCase().startsWith(qLower) ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      return a.state.localeCompare(b.state) || a.name.localeCompare(b.name);
    });

    return new Response(JSON.stringify(slim), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to fetch suburbs" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
