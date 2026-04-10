const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
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

    if (!res.ok) {
      console.error("Postcode API error:", res.status, await res.text());
      return new Response(JSON.stringify({ error: "Suburb lookup service unavailable" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();

    const qLower = q.toLowerCase();
    const slim = (data as any[]).slice(0, 30).map((s: any) => ({
      name: s.name as string,
      postcode: s.postcode as number,
      state: (s.state?.abbreviation || "") as string,
    }));

    slim.sort((a, b) => {
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
  } catch (err: unknown) {
    console.error("Error fetching suburbs:", err);
    return new Response(JSON.stringify({ error: "Failed to fetch suburbs" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
