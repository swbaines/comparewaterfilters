import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import PageMeta from "@/components/PageMeta";
import { Search, Droplets, Thermometer, FlaskConical, AlertTriangle, CheckCircle2, ArrowRight, Info, Building2, MapPin } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { findUtilityProfile, getSuburbSuggestions, type WaterUtilityProfile, type SuburbSuggestion } from "@/data/waterUtilities";

function getHardnessLabel(h: number) {
  if (h < 60) return { label: "Soft", color: "text-green-800", bg: "bg-green-100" };
  if (h < 120) return { label: "Moderate", color: "text-yellow-800", bg: "bg-yellow-100" };
  if (h < 180) return { label: "Hard", color: "text-orange-800", bg: "bg-orange-100" };
  return { label: "Very hard", color: "text-red-800", bg: "bg-red-100" };
}

function getChlorineLabel(c: number) {
  if (c < 0.6) return { label: "Low", color: "text-green-800", bg: "bg-green-100" };
  if (c < 1.0) return { label: "Moderate", color: "text-yellow-800", bg: "bg-yellow-100" };
  return { label: "High", color: "text-orange-800", bg: "bg-orange-100" };
}

function getFluorideLabel(f: number) {
  if (f === 0) return { label: "Not added", color: "text-blue-800", bg: "bg-blue-100" };
  if (f < 0.7) return { label: "Low", color: "text-green-800", bg: "bg-green-100" };
  return { label: "Standard", color: "text-yellow-800", bg: "bg-yellow-100" };
}

function getPfasLabel(risk: string) {
  if (risk === "elevated") return { label: "Elevated — monitor", color: "text-red-800", bg: "bg-red-100" };
  if (risk === "moderate") return { label: "Being monitored", color: "text-yellow-800", bg: "bg-yellow-100" };
  return { label: "Within guidelines", color: "text-green-800", bg: "bg-green-100" };
}

function getFilterRecommendations(profile: WaterUtilityProfile) {
  const recs: { primary: string; reason: string; cta: string }[] = [];

  if (profile.hardness >= 180) {
    recs.push({ primary: "Water softener", reason: "Your area has very hard water — a softener eliminates the scale damaging your appliances, shower screens, and hot water system.", cta: "Get quotes" });
  }
  if (profile.hardness >= 120) {
    recs.push({ primary: "Whole house carbon + scale-reduction filter", reason: "Moderately hard water combined with higher chlorine means a whole house system with scale-reduction is the most impactful upgrade.", cta: "Get quotes" });
  }
  if (profile.chlorine >= 1.0 || profile.hardness < 120) {
    recs.push({ primary: "Whole house carbon filter", reason: `${profile.state === "SA" ? "Adelaide has Australia's highest chlorine levels" : profile.state === "VIC" ? "Melbourne's chlorine is notably higher than most cities" : "Chlorine removal"} — a whole house carbon filter improves taste, skin, and hair from every tap and shower.`, cta: "Get quotes" });
  }
  if (profile.pfasRisk === "elevated" || profile.pfasRisk === "moderate") {
    recs.push({ primary: "Reverse osmosis", reason: "PFAS monitoring is active in your area. RO is the most effective household technology for removing PFAS and other contaminants from drinking water.", cta: "Get quotes" });
  }
  recs.push({ primary: "Reverse osmosis", reason: "For the purest possible drinking water — removes fluoride, PFAS, heavy metals, and virtually all dissolved contaminants.", cta: "Get quotes" });

  return recs.slice(0, 3);
}

export default function WaterQualityPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<(WaterUtilityProfile & { matchedSuburb?: string }) | null>(null);
  const [searched, setSearched] = useState(false);
  const [suggestions, setSuggestions] = useState<SuburbSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectSuggestion = useCallback((suggestion: SuburbSuggestion) => {
    setQuery(suggestion.suburb);
    setShowSuggestions(false);
    setSuggestions([]);
    const found = findUtilityProfile(suggestion.suburb);
    setResult(found);
    setSearched(true);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setActiveIndex(-1);
    if (val.trim().length >= 2) {
      const s = getSuburbSuggestions(val);
      setSuggestions(s);
      setShowSuggestions(s.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    const found = findUtilityProfile(query);
    setResult(found);
    setSearched(true);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const hardness = result ? getHardnessLabel(result.hardness) : null;
  const chlorine = result ? getChlorineLabel(result.chlorine) : null;
  const fluoride = result ? getFluorideLabel(result.fluoride) : null;
  const pfas = result ? getPfasLabel(result.pfasRisk) : null;
  const recs = result ? getFilterRecommendations(result) : [];

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Water Quality by Suburb — Check Your Local Water"
        description="Free water quality lookup for Australian suburbs. Check hardness, chlorine, fluoride, and PFAS levels in your area and get filter recommendations."
        path="/water-quality"
      />

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-12 md:py-16">
        <div className="container max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">Free water quality lookup</Badge>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">What's in my water?</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Australian tap water meets safety standards — but "safe" doesn't mean "ideal." Chlorine, chloramine, and trace contaminants are present in every supply, and there's no health benefit to consuming them. Enter your suburb below to see exactly what's in your water and what you can do about it.
          </p>
          <form onSubmit={handleSearch} className="mt-8 flex gap-2">
            <div className="relative flex-1" ref={wrapperRef}>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
              <Input
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                placeholder="Suburb or postcode — e.g. Wanneroo or 3000"
                className="pl-9"
                autoComplete="off"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-auto rounded-md border bg-popover shadow-lg">
                  {suggestions.map((s, i) => (
                    <button
                      key={`${s.suburb}-${s.utilityName}`}
                      type="button"
                      className={`flex w-full items-start gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent ${i === activeIndex ? "bg-accent" : ""}`}
                      onMouseDown={() => selectSuggestion(s)}
                      onMouseEnter={() => setActiveIndex(i)}
                    >
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <span className="font-medium">{s.suburb}</span>
                        <span className="ml-1.5 text-muted-foreground">{s.state}</span>
                        <p className="truncate text-xs text-muted-foreground">{s.utilityName} · {s.region}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button type="submit">Check water</Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            Data sourced from Yarra Valley Water, South East Water, Greater Western Water, Sydney Water, Hunter Water, Urban Utilities, SA Water, Water Corporation WA, TasWater, Icon Water and Power and Water Corporation annual reports 2023–24
          </p>
        </div>
      </section>

      <div className="container max-w-4xl pb-16">
        {/* Results */}
        {searched && result && (
          <div className="mt-8 space-y-8">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-bold">
                {result.matchedSuburb || result.region}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground">
                <span>{result.state}</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {result.utilityName}
                </span>
                <span>·</span>
                <span>{result.region}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Source: {result.source}</p>
              <p className="mt-3 text-sm text-muted-foreground">
                Your water meets Australian safety standards
                {(() => {
                  const concerns: string[] = [];
                  const hardnessInfo = getHardnessLabel(result.hardness);
                  const chlorineInfo = getChlorineLabel(result.chlorine);
                  if (hardnessInfo.label === "Moderate" || hardnessInfo.label === "Hard" || hardnessInfo.label === "Very hard") {
                    concerns.push(`${hardnessInfo.label.toLowerCase()} hardness`);
                  }
                  if (chlorineInfo.label === "Moderate" || chlorineInfo.label === "High") {
                    concerns.push(`${chlorineInfo.label.toLowerCase()} chlorine levels`);
                  }
                  if (result.pfasRisk === "elevated" || result.pfasRisk === "moderate") {
                    concerns.push("PFAS levels being monitored");
                  }
                  if (concerns.length > 0) {
                    return `, however your area has ${concerns.join(" and ")}. A quality filtration system removes what the treatment plant leaves behind, giving you noticeably better water for drinking, cooking, showering, and protecting your appliances.`;
                  }
                  return ". A quality filtration system removes what the treatment plant leaves behind, and whatever it picks up on the way to your home, giving you noticeably better water for drinking, cooking, showering, and protecting your appliances.";
                })()}
              </p>
            </div>

            {/* Metric cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Droplets className="h-4 w-4" />
                    Hardness
                  </div>
                  <p className="mt-2 text-3xl font-bold">{result.hardness}</p>
                  <p className="text-sm text-muted-foreground">mg/L CaCO₃</p>
                  <Badge className={`mt-2 ${hardness?.bg} ${hardness?.color} border-0`}>{hardness?.label}</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Thermometer className="h-4 w-4" />
                    Chlorine
                  </div>
                  <p className="mt-2 text-3xl font-bold">{result.chlorine}</p>
                  <p className="text-sm text-muted-foreground">mg/L typical</p>
                  <Badge className={`mt-2 ${chlorine?.bg} ${chlorine?.color} border-0`}>{chlorine?.label}</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <FlaskConical className="h-4 w-4" />
                    Fluoride
                  </div>
                  <p className="mt-2 text-3xl font-bold">{result.fluoride}</p>
                  <p className="text-sm text-muted-foreground">mg/L</p>
                  <Badge className={`mt-2 ${fluoride?.bg} ${fluoride?.color} border-0`}>{fluoride?.label}</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <AlertTriangle className="h-4 w-4" />
                    PFAS
                  </div>
                  <p className="mt-2 text-3xl font-bold">{result.ph}</p>
                  <p className="text-sm text-muted-foreground">pH level</p>
                  <Badge className={`mt-2 ${pfas?.bg} ${pfas?.color} border-0`}>{pfas?.label}</Badge>
                </CardContent>
              </Card>
            </div>

            {/* Utility info card */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex gap-3 pt-6">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium">Water supplied by {result.utilityName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{result.notes}</p>
                  <p className="mt-2 text-xs text-muted-foreground/70 italic">Note: Water quality levels are sourced from official utility reports and may vary over time. Figures represent typical reported values and may not reflect exact current conditions at your tap.</p>
                </div>
              </CardContent>
            </Card>

            {/* What this means */}
            <Card>
              <CardHeader>
                <CardTitle>What this means for your home</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-3">
                  {result.hardness >= 120 ? (
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                  )}
                  <div>
                    <h4 className="font-semibold">Hard water &amp; scale</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {result.hardness >= 180
                        ? `At ${result.hardness} mg/L, your water is quite hard — you've probably noticed white scale building up in the kettle, on taps, and on shower screens. Over time, this can reduce the lifespan of your hot water system and dishwasher. A water softener or scale-reduction filter pays for itself in appliance savings.`
                        : result.hardness >= 120
                        ? `At ${result.hardness} mg/L, you may notice some scale on taps and in the kettle. A scale-reduction filter helps protect your appliances and keeps things looking cleaner for longer.`
                        : `At ${result.hardness} mg/L, your water is soft — great news for your appliances. No softener needed here.`}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  {result.chlorine >= 1.0 ? (
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                  )}
                  <div>
                    <h4 className="font-semibold">Chlorine &amp; taste</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {result.chlorine >= 1.0
                        ? `At ${result.chlorine} mg/L, chlorine is above the taste threshold — most people in your area will notice the smell when filling a glass or running a shower. Many families find that removing chlorine is the single biggest improvement to their water. It also helps with dry skin, eczema-prone kids, and hair that feels stripped after washing.`
                        : `At ${result.chlorine} mg/L, chlorine is within normal range — but most people can still smell and taste it, especially first thing in the morning or after the water has been sitting in pipes. A simple carbon filter removes it completely and is the most popular upgrade Australian families make.`}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  {result.fluoride > 0 ? (
                    <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                  )}
                  <div>
                    <h4 className="font-semibold">Fluoride</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {result.fluoride === 0
                        ? `${result.state} does not add fluoride to its water supply. If fluoride-free water is important to you, your tap water already is — though a reverse osmosis system still provides the highest purity drinking water overall.`
                        : `Fluoride is added at ${result.fluoride} mg/L for dental health, well within the 1.5 mg/L Australian guideline. Some families prefer to remove it and choose their own fluoride sources — if that's you, a reverse osmosis system is the only household filter that effectively removes it.`}
                    </p>
                  </div>
                </div>

                {result.pfasRisk !== "low" && (
                  <div className="flex gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                    <div>
                      <h4 className="font-semibold">PFAS</h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        PFAS monitoring is active in your area. Current levels meet Australian Drinking Water Guidelines, so there's no immediate concern — but many families prefer the peace of mind that comes with a reverse osmosis system, which is the most effective household technology for PFAS removal.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Filter recommendations */}
            <div>
              <h3 className="mb-4 text-xl font-semibold">Recommended for your area</h3>
              <div className="space-y-3">
                {recs.map((rec, i) => (
                  <Card key={i}>
                    <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        {i === 0 && <Badge className="shrink-0">Best match</Badge>}
                        <div>
                          <h4 className="font-semibold">{rec.primary}</h4>
                          <p className="mt-1 text-sm text-muted-foreground">{rec.reason}</p>
                        </div>
                      </div>
                      <Link to="/quiz" className="shrink-0">
                        <Button variant="outline" size="sm">
                          Get quotes <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* CTA */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="flex flex-col items-center justify-between gap-4 pt-6 sm:flex-row">
                <div>
                  <h3 className="font-semibold">Ready to improve your water?</h3>
                  <p className="text-sm text-muted-foreground">Take our 2-minute quiz and we'll match you with trusted local installers who understand your area's water.</p>
                </div>
                <Link to="/quiz" className="shrink-0">
                  <Button>
                    Start quiz <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        {/* No result */}
        {searched && !result && (
          <div className="mt-8 text-center">
            <Card className="inline-block p-8">
              <h2 className="text-xl font-semibold">We don't have specific data for that location yet</h2>
              <p className="mt-2 text-muted-foreground">Try searching by suburb name (e.g. "Wanneroo") or postcode (e.g. "3000"). We're adding more suburbs regularly.</p>
              <Link to="/quiz" className="mt-4 inline-block">
                <Button variant="outline">
                  Take the quiz for personalised advice <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </Card>
          </div>
        )}

        {/* Browse by state */}
        <div className="mt-12">
          <h2 className="mb-6 text-xl font-semibold">Browse by city</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Melbourne", sub: "3 water utilities, soft water", query: "Melbourne CBD" },
              { label: "Sydney", sub: "Soft water, chloramine zones", query: "Sydney CBD" },
              { label: "Brisbane", sub: "Moderate hardness, seasonal taste", query: "Brisbane CBD" },
              { label: "Perth", sub: "Hard water, varies north to south", query: "Perth CBD" },
              { label: "Adelaide", sub: "Hardest capital, high chlorine", query: "Adelaide CBD" },
              { label: "Hobart", sub: "Excellent soft water", query: "Hobart" },
              { label: "Canberra", sub: "Soft, PFAS monitored", query: "Canberra" },
              { label: "Darwin", sub: "No fluoride added", query: "Darwin" },
            ].map(s => (
              <Card
                key={s.label}
                className="cursor-pointer transition-colors hover:bg-accent"
                onClick={() => { setQuery(s.query); setResult(findUtilityProfile(s.query)); setSearched(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              >
                <CardContent className="pt-6">
                  <h3 className="font-semibold">{s.label}</h3>
                  <p className="text-sm text-muted-foreground">{s.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 rounded-lg border bg-muted/50 p-6">
          <div className="text-sm text-muted-foreground">
            <h3 className="mb-2 font-semibold text-foreground">Data sources &amp; disclaimer</h3>
            <p>Water quality data is sourced from annual drinking water quality reports (2023–24) published by Yarra Valley Water, South East Water, Greater Western Water, Barwon Water, Sydney Water, Hunter Water, Urban Utilities, Unitywater, Gold Coast Water, Water Corporation WA, SA Water, TasWater, Icon Water, and Power and Water Corporation. Data represents typical averages for each utility's supply zone and may vary by exact address, season, and current treatment conditions. For the most precise data for your address, contact your local water utility. This information is provided for general guidance only and does not constitute professional advice.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
