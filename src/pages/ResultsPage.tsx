import { useEffect, useMemo, useState, useCallback } from "react";
import PageMeta from "@/components/PageMeta";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, ArrowRight, DollarSign, Wrench, Home, Clock, Star, Shield, Phone, MapPin, Award, Users, Send, SlidersHorizontal, ImageIcon, Share2, Check, Copy, ChevronDown, Info } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { generateRecommendations, type QuizAnswers, type RecommendationResult } from "@/lib/recommendationEngine";
import { matchProviders, type ProviderMatch } from "@/lib/providerMatchEngine";
import { lookupPostcodeCoords } from "@/lib/geo";
import { formatCoverageLabel } from "@/lib/serviceArea";
import type { Recommendation } from "@/data/recommendations";
import type { Provider } from "@/data/providers";
import { useProviders } from "@/hooks/useProviders";
import RequestQuoteDialog from "@/components/RequestQuoteDialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { WarningCallout, inferWarningVariant } from "@/components/WarningCallout";

function RecCard({ rec, label, reason, variant, badge }: { rec: Recommendation; label: string; reason: string; variant: "value" | "allrounder" | "premium"; badge?: string }) {
  const colors = {
    value: "bg-sage-light text-sage-dark border-primary/20",
    allrounder: "bg-accent text-accent-foreground border-primary/30",
    premium: "bg-warm-light text-foreground border-warm/30",
  };

  return (
    <Card className={`overflow-hidden border-2 ${variant === "allrounder" ? "border-primary shadow-lg" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={`w-fit ${colors[variant]}`}>{label}</Badge>
          {badge && <Badge variant="outline" className="w-fit text-xs font-normal">{badge}</Badge>}
        </div>
        <CardTitle className="text-lg">{rec.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{rec.category}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{reason}</p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <DollarSign className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="font-medium">Installed price</p>
              <p className="text-muted-foreground">${rec.priceMin.toLocaleString()} – ${rec.priceMax.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="font-medium">Annual maintenance</p>
              <p className="text-muted-foreground">${rec.annualMaintenanceMin} – ${rec.annualMaintenanceMax}/yr</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Home className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="font-medium">Ideal for</p>
              <p className="text-muted-foreground">{rec.idealHomeType}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="font-medium">Filter frequency</p>
              <p className="text-muted-foreground">{rec.filterFrequency}</p>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">What it helps with</p>
          <ul className="space-y-1">
            {rec.bestFor.slice(0, 4).map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {b}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">What it may not solve</p>
          <ul className="space-y-1">
            {rec.notFor.slice(0, 3).map((n) => (
              <li key={n} className="flex items-start gap-2 text-sm text-muted-foreground">
                <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive/60" /> {n}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function MatchScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "bg-primary text-primary-foreground" : score >= 60 ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground";
  return <Badge className={`${color} text-xs`}>{score}% match</Badge>;
}

function ProviderCard({ match, rank, onRequestQuote }: { match: ProviderMatch; rank: number; onRequestQuote: (provider: Provider) => void }) {
  const { provider, matchScore, matchReasons, systemsTheyInstall } = match;
  const rankLabels: Record<number, string> = { 0: "Top match", 1: "Strong match", 2: "Good match" };
  const rankColors: Record<number, string> = { 0: "border-primary shadow-lg", 1: "border-primary/40" };

  return (
    <Card className={`overflow-hidden border-2 ${rankColors[rank] || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border">
              {provider.logo ? (
                <AvatarImage src={provider.logo} alt={provider.name} />
              ) : null}
              <AvatarFallback className="text-xs">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div>
              {rankLabels[rank] && (
                <Badge className={rank === 0 ? "mb-1 bg-primary text-primary-foreground" : "mb-1 bg-accent text-accent-foreground"}>
                  {rankLabels[rank]}
                </Badge>
              )}
              <CardTitle className="text-lg">{provider.name}</CardTitle>
            </div>
          </div>
          <MatchScoreBadge score={matchScore} />
        </div>
        <p className="text-sm text-muted-foreground">{provider.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key stats */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 shrink-0 text-primary" />
            <span className="font-medium">{provider.rating}/5</span>
            <span className="text-muted-foreground">({provider.reviewCount} reviews)</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 shrink-0 text-primary" />
            <span className="text-muted-foreground">{provider.yearsInBusiness} years experience</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <span className="text-muted-foreground">
              {formatCoverageLabel(provider.location.regions, provider.location.states) ||
                provider.location.states.join(", ")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-primary" />
            <span className="text-muted-foreground">{provider.responseTime}</span>
          </div>
        </div>

        {/* Why they match */}
        <div>
          <p className="mb-2 text-sm font-medium">Why we matched you</p>
          <ul className="space-y-1">
            {matchReasons.slice(0, 4).map((r) => (
              <li key={r} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {r}
              </li>
            ))}
          </ul>
        </div>

        {/* Certifications */}
        <div className="flex flex-wrap gap-1.5">
          {provider.certifications.slice(0, 3).map((c) => (
            <Badge key={c} variant="outline" className="text-xs font-normal">
              <Award className="mr-1 h-3 w-3" /> {c}
            </Badge>
          ))}
        </div>

        {/* Highlights */}
        <div className="flex flex-wrap gap-1.5">
          {provider.highlights.slice(0, 3).map((h) => (
            <Badge key={h} variant="secondary" className="text-xs font-normal">
              {h}
            </Badge>
          ))}
        </div>

        {/* Warranty */}
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Warranty:</span> {provider.warranty}
        </p>

        {/* Brands */}
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Brands:</span> {provider.brands.join(", ")}
        </p>

        {/* CTAs */}
        <div className="mt-2 flex flex-col gap-2">
          <Button className="w-full gap-2" onClick={() => onRequestQuote(provider)}>
            <Send className="h-4 w-4" /> Request a quote
          </Button>
          {provider.phone && (
            <a href={`tel:${provider.phone.replace(/\s/g, "")}`}>
              <Button className="w-full gap-2" variant="outline">
                <Phone className="h-4 w-4" /> Call {provider.phone}
              </Button>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Human-readable labels for the concern IDs used by the recommendation engine.
// Kept in sync with concernOptions in src/pages/QuizPage.tsx.
const CONCERN_LABELS: Record<string, string> = {
  taste: "Taste or smell",
  chlorine: "Chlorine smell or taste",
  "skin-hair": "Skin irritation, eczema, hair issues",
  "skin-shower": "Skin / shower water concerns",
  "drinking-quality": "Drinking water quality",
  fluoride: "Fluoride removal",
  "heavy-metals": "Heavy metals (lead, arsenic etc.)",
  pfas: "PFAS / forever chemicals",
  microplastics: "Microplastics",
  "hard-water": "Hard water / scale buildup",
  "whole-home": "Whole home protection",
  appliance: "Appliance & hot water system protection",
  bacteria: "Bacteria / microbiological safety",
  "not-sure": "Not sure — just want better water",
};

function WhyThisRecommendation({ result, answers }: { result: RecommendationResult; answers: QuizAnswers }) {
  const [open, setOpen] = useState(false);
  const { explanation, secondary } = result;
  const labelledConcerns = explanation.triggeringConcerns.map((c) => CONCERN_LABELS[c] ?? c);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-8">
      <div className="mx-auto max-w-3xl rounded-xl border border-primary/20 bg-accent/30">
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Info className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold sm:text-base">Why this recommendation?</p>
              <p className="text-xs text-muted-foreground">
                See which rule fired and the trade-off behind the Good tier.
              </p>
            </div>
          </div>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-5 border-t border-primary/10 px-5 pb-5 pt-4 text-sm">
            {/* Rule fired */}
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Rule fired
              </p>
              <p className="font-medium">{explanation.ruleLabel}</p>
              {explanation.appliedRules.length > 1 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Also applied:{" "}
                  {explanation.appliedRules
                    .slice(0, -1)
                    .map((r) => r.label.split(" — ")[0])
                    .join(", ")}
                </p>
              )}
            </div>

            {/* Triggering concerns */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Your concerns that triggered this rule
              </p>
              {labelledConcerns.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {labelledConcerns.map((label) => (
                    <Badge key={label} variant="secondary" className="font-normal">
                      {label}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  {explanation.rule === "rule-5-renter-apartment"
                    ? `This rule fired because you ${answers.propertyType === "Apartment" ? "live in an apartment" : "rent your home"} — whole-house and softener systems aren't practical, so we picked the best installable option for your concerns.`
                    : "No specific concerns triggered this — we used the default drinking-water improvement path."}
                </p>
              )}
            </div>

            {/* Good tier trade-off */}
            <div className="rounded-lg border border-warm/30 bg-warm-light/40 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-warm-foreground/80">
                Honest trade-off — Good tier ({secondary.title})
              </p>
              <p className="text-foreground/90">{explanation.goodTierTradeoff}</p>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default function ResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [answers, setAnswers] = useState<QuizAnswers | null>(null);
  const [providerMatches, setProviderMatches] = useState<ProviderMatch[]>([]);
  const [quoteProvider, setQuoteProvider] = useState<Provider | null>(null);
  const [sortBy, setSortBy] = useState<string>("match");
  const [filterPrice, setFilterPrice] = useState<string>("all");
  const [copied, setCopied] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const { data: dbProviders = [] } = useProviders();

  useEffect(() => {
    // Try URL param first (shared link), then sessionStorage
    let parsed: QuizAnswers | null = null;
    const urlData = searchParams.get("d");
    if (urlData) {
      try {
        parsed = JSON.parse(atob(urlData)) as QuizAnswers;
        sessionStorage.setItem("quizAnswers", JSON.stringify(parsed));
      } catch { /* invalid data, fall through */ }
    }
    if (!parsed) {
      const stored = sessionStorage.getItem("quizAnswers");
      if (!stored) { navigate("/quiz"); return; }
      parsed = JSON.parse(stored) as QuizAnswers;
    }
    setAnswers(parsed);
    const rec = generateRecommendations(parsed);
    setResult(rec);

    if (dbProviders.length > 0) {
      // Look up customer coords for radius matching, then match
      let cancelled = false;
      (async () => {
        const coords = await lookupPostcodeCoords(parsed!.postcode || parsed!.suburb);
        if (cancelled) return;
        setProviderMatches(
          matchProviders(parsed!, rec, dbProviders, 3, {
            customerCoords: coords ? { lat: coords.lat, lng: coords.lng } : undefined,
          })
        );
      })();
      return () => { cancelled = true; };
    }
  }, [navigate, dbProviders, searchParams]);

  // Show sticky bar on mobile when provider section is below viewport
  useEffect(() => {
    const providerEl = document.getElementById("matched-providers");
    if (!providerEl) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(providerEl);
    return () => observer.disconnect();
  }, [result]);

  const filteredAndSorted = useMemo(() => {
    let list = [...providerMatches];
    if (filterPrice !== "all") {
      list = list.filter((m) => m.provider.priceRange === filterPrice);
    }
    switch (sortBy) {
      case "rating":
        list.sort((a, b) => b.provider.rating - a.provider.rating);
        break;
      case "experience":
        list.sort((a, b) => b.provider.yearsInBusiness - a.provider.yearsInBusiness);
        break;
      case "reviews":
        list.sort((a, b) => b.provider.reviewCount - a.provider.reviewCount);
        break;
      default:
        list.sort((a, b) => b.matchScore - a.matchScore);
    }
    return list;
  }, [providerMatches, sortBy, filterPrice]);

  if (!result || !answers) return null;

  return (
    <div className="min-h-screen bg-muted/30 py-8 sm:py-12">
      <PageMeta
        title="Your Recommendations"
        description="Your personalised water filter recommendations based on your home profile and water concerns."
        path="/results"
      />
      <div className="container max-w-5xl">
        {/* Summary */}
        <div className="mb-10 text-center">
          <Badge className="mb-3">Your personalised results</Badge>
          <h1 className="text-2xl font-bold sm:text-3xl">
            Hi {answers.firstName}, here's what we recommend
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Your tap water is treated to meet safety standards — but there's no upside to drinking chlorine, chloramine, and trace contaminants when you don't have to. Based on your home and water profile, here's how to upgrade.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 gap-2"
            onClick={async () => {
              const encoded = btoa(JSON.stringify(answers));
              const url = `${window.location.origin}/results?d=${encoded}`;

              // Use native share on mobile if available
              if (navigator.share) {
                try {
                  await navigator.share({
                    title: "My Water Filter Recommendations",
                    text: `Hi, check out my personalised water filter recommendations from Compare Water Filters!`,
                    url,
                  });
                  return;
                } catch {
                  // User cancelled or share failed — fall through to clipboard
                }
              }

              navigator.clipboard.writeText(url).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
              }).catch(() => {
                const textarea = document.createElement("textarea");
                textarea.value = url;
                textarea.style.position = "fixed";
                textarea.style.opacity = "0";
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand("copy");
                document.body.removeChild(textarea);
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
              });
            }}
          >
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {copied ? "Link copied!" : "Share these results"}
          </Button>
        </div>

        {/* Warnings */}
        {result.warnings && result.warnings.length > 0 && (
          <div className="mb-8 space-y-3">
            {result.warnings.map((warning, i) => (
              <WarningCallout key={i} message={warning} variant={inferWarningVariant(warning)} />
            ))}
          </div>
        )}

        {/* Top recommendation */}
        <Card className="mb-8 border-primary/20 bg-accent/50">
          <CardContent className="p-6 sm:p-8">
            <Badge className="mb-3">Top recommendation</Badge>
            <h2 className="text-xl font-bold">{result.primary.title}</h2>
            <p className="mt-2 text-muted-foreground">{result.primaryReason}</p>
          </CardContent>
        </Card>

        {/* Jump to providers box – mobile only */}
        <a
          href="#matched-providers"
          className="mb-6 flex items-center justify-between rounded-lg border-2 border-primary/20 bg-primary/5 px-4 py-3 text-sm font-medium text-primary transition hover:bg-primary/10 sm:hidden"
        >
          <span>View matched providers in your area</span>
          <ArrowRight className="h-4 w-4 shrink-0" />
        </a>

        {/* 3 Recommendation cards (or 2 if budget = recommendation or premium = recommendation) */}
        <h2 className="mb-4 text-lg font-bold">Recommended system types</h2>
        {result.primary.id === result.premium.id ? (
          /* Primary IS the premium (e.g. WH+RO combo) — show 2 cards: recommendation + budget */
          <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
            <RecCard rec={result.primary} label="Our recommendation" reason={result.primaryReason} variant="allrounder" badge="Complete solution" />
            <RecCard rec={result.secondary} label="Budget alternative" reason={result.secondaryReason} variant="value" />
          </div>
        ) : result.secondary.id === result.primary.id ? (
          <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
            <RecCard rec={result.primary} label="Our recommendation" reason={result.primaryReason} variant="allrounder" badge="Also the most affordable option" />
            <RecCard rec={result.premium} label="Premium option" reason={result.premiumReason} variant="premium" />
          </div>
        ) : (
          <>
            {/* Mobile: recommendation first, then budget & premium */}
            <div className="flex flex-col gap-6 sm:hidden">
              <RecCard rec={result.primary} label="Our recommendation" reason={result.primaryReason} variant="allrounder" />
              <RecCard rec={result.secondary} label="Budget alternative" reason={result.secondaryReason} variant="value" />
              <RecCard rec={result.premium} label="Premium option" reason={result.premiumReason} variant="premium" />
            </div>
            {/* Desktop: standard 3-column order */}
            <div className="hidden sm:grid gap-6 md:grid-cols-3">
              <RecCard rec={result.secondary} label="Budget alternative" reason={result.secondaryReason} variant="value" />
              <RecCard rec={result.primary} label="Our recommendation" reason={result.primaryReason} variant="allrounder" />
              <RecCard rec={result.premium} label="Premium option" reason={result.premiumReason} variant="premium" />
            </div>
          </>
        )}

        {/* ── Why this recommendation? (rule-fired explainer) ── */}
        <WhyThisRecommendation result={result} answers={answers} />

        {/* ── Now choose who installs it ── */}
        <div className="mt-16 mb-2">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Next step</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </div>
          <div className="mt-8 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-accent/30 to-primary/5 px-6 py-10 text-center sm:px-12">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold sm:text-3xl">Now choose who installs it</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Select a trusted local provider to receive a free quote. Your details are already saved.
            </p>
            <a href="#matched-providers" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              See matched providers <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="mt-10" id="matched-providers">
          <div className="mb-6 text-center">
            <Badge className="mb-3" variant="secondary">
              <Users className="mr-1 h-3 w-3" /> Matched providers
            </Badge>
            <h2 className="text-xl font-bold sm:text-2xl">Providers matched to your needs</h2>
            {providerMatches.length > 0 ? (
              <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
                We've found {providerMatches.length} qualified provider{providerMatches.length > 1 ? "s" : ""} in your area who install your recommended systems. Compare them side by side.
              </p>
            ) : (
              <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
                We're still growing our network in your area.
              </p>
            )}
          </div>

          {providerMatches.length > 0 ? (
            <>
              {/* Sort & filter controls */}
              <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border bg-background p-3">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="match">Best match</SelectItem>
                    <SelectItem value="rating">Highest rated</SelectItem>
                    <SelectItem value="reviews">Most reviews</SelectItem>
                    <SelectItem value="experience">Most experience</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterPrice} onValueChange={setFilterPrice}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Price range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All price ranges</SelectItem>
                    <SelectItem value="budget">Budget</SelectItem>
                    <SelectItem value="mid">Mid-range</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
                {(filterPrice !== "all" || sortBy !== "match") && (
                  <Button variant="ghost" size="sm" onClick={() => { setSortBy("match"); setFilterPrice("all"); }}>
                    Reset
                  </Button>
                )}
              </div>

              {filteredAndSorted.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-3">
                  {filteredAndSorted.map((match, i) => (
                    <ProviderCard key={match.provider.id} match={match} rank={sortBy === "match" ? i : -1} onRequestQuote={setQuoteProvider} />
                  ))}
                </div>
              ) : (
                <Card className="border-0 bg-muted/50 shadow-none">
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">No providers match your current filters.</p>
                    <Button className="mt-4" variant="outline" onClick={() => { setFilterPrice("all"); }}>
                      Clear filters
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="border border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-10 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Users className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">No providers in your area yet</h3>
                <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">
                  We don't have any matched providers in your area right now, but we're expanding fast. Your recommendations above are still tailored to your home — use them as a guide when shopping locally or requesting quotes.
                </p>
                <Button variant="outline" onClick={() => window.location.href = "/contact"}>
                  Get in touch for help
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Comparison table */}
        <div className="mt-12">
          <h2 className="mb-4 text-lg font-bold">Quick comparison</h2>
          {(() => {
            const collapsed = result.secondary.id === result.primary.id || result.primary.id === result.premium.id;
            const recs = result.primary.id === result.premium.id
              ? [{ label: "Our recommendation", rec: result.primary, variant: "allrounder" as const }, { label: "Budget alternative", rec: result.secondary, variant: "value" as const }]
              : result.secondary.id === result.primary.id
              ? [{ label: "Our recommendation", rec: result.primary, variant: "allrounder" as const }, { label: "Premium", rec: result.premium, variant: "premium" as const }]
              : [{ label: "Budget alternative", rec: result.secondary, variant: "value" as const }, { label: "Our recommendation", rec: result.primary, variant: "allrounder" as const }, { label: "Premium", rec: result.premium, variant: "premium" as const }];

            const chlorineIds = ["under-sink-carbon", "reverse-osmosis", "whole-house-filtration", "whole-house-combo"];
            const roIds = ["reverse-osmosis", "whole-house-combo"];
            const wholeHomeIds = ["whole-house-filtration", "whole-house-combo"];

            const rows: { label: string; render: (rec: Recommendation) => React.ReactNode }[] = [
              { label: "System type", render: (r) => <span className="font-medium">{r.title}</span> },
              { label: "Price range", render: (r) => `$${r.priceMin.toLocaleString()} – $${r.priceMax.toLocaleString()}` },
              { label: "Annual maintenance", render: (r) => `$${r.annualMaintenanceMin} – $${r.annualMaintenanceMax}/yr` },
              { label: "Filter changes", render: (r) => r.filterFrequency },
              { label: "Coverage", render: (r) => r.idealHomeType },
              {
                label: "Removes chlorine",
                render: (r) => chlorineIds.includes(r.id)
                  ? <Check className="h-4 w-4 text-primary" />
                  : <XCircle className="h-4 w-4 text-muted-foreground/50" />,
              },
              {
                label: "Removes fluoride & PFAS",
                render: (r) => roIds.includes(r.id)
                  ? <Check className="h-4 w-4 text-primary" />
                  : <XCircle className="h-4 w-4 text-muted-foreground/50" />,
              },
              {
                label: "Whole home protection",
                render: (r) => wholeHomeIds.includes(r.id)
                  ? <Check className="h-4 w-4 text-primary" />
                  : <XCircle className="h-4 w-4 text-muted-foreground/50" />,
              },
              { label: "Key tradeoff", render: (r) => r.tradeoffs[0] || "—" },
            ];

            const variantColors = {
              value: "border-primary/20 bg-sage-light/30",
              allrounder: "border-primary bg-accent/40",
              premium: "border-warm/30 bg-warm-light/40",
            };

            return (
              <>
                {/* Desktop: horizontal table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className={`w-full text-sm ${collapsed ? "min-w-[400px]" : "min-w-[600px]"}`}>
                    <thead>
                      <tr className="border-b">
                        <th className="pb-3 pr-4 text-left font-medium text-muted-foreground"></th>
                        {recs.map((col) => (
                          <th key={col.label} className="pb-3 pr-4 text-left font-medium">{col.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {rows.map((row) => (
                        <tr key={row.label}>
                          <td className="py-3 pr-4 font-medium text-muted-foreground whitespace-nowrap">{row.label}</td>
                          {recs.map((col) => (
                            <td key={col.label} className="py-3 pr-4">{row.render(col.rec)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile: stacked cards */}
                <div className="flex flex-col gap-4 sm:hidden">
                  {recs.map((col) => (
                    <Card key={col.label} className={`border-2 ${variantColors[col.variant]}`}>
                      <CardHeader className="pb-2">
                        <Badge className="w-fit text-xs">{col.label}</Badge>
                        <CardTitle className="text-base">{col.rec.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <dl className="divide-y text-sm">
                          {rows.slice(1).map((row) => (
                            <div key={row.label} className="flex items-start justify-between gap-3 py-2.5">
                              <dt className="text-muted-foreground shrink-0">{row.label}</dt>
                              <dd className="text-right">{row.render(col.rec)}</dd>
                            </div>
                          ))}
                        </dl>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            );
          })()}
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link to="/contact">
            <Button size="lg" className="gap-2">
              Need help choosing? Contact us <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/quiz">
            <Button variant="outline" size="lg">Retake quiz</Button>
          </Link>
        </div>

        {/* Disclaimer */}
        <Card className="mt-10 border-0 bg-muted/50 shadow-none">
          <CardContent className="p-5 text-xs leading-relaxed text-muted-foreground sm:p-6 sm:text-sm">
            <p className="mb-2 font-semibold text-foreground">Important note</p>
            <p className="mb-2">
              The system recommendations provided on this page are based on general information you have supplied and are intended as a starting point for your research only. They do not constitute professional advice.
            </p>
            <p className="mb-2">
              Water filtration suitability depends on your specific water quality, plumbing configuration, property type, and individual circumstances — factors that can only be properly assessed by a licensed professional conducting an in-home inspection.
            </p>
            <p className="mb-2">
              Compare Water Filters is an independent comparison platform. We do not install, manufacture, or supply water filtration systems. We do not endorse or guarantee the quality, workmanship, or suitability of any provider listed on this platform.
            </p>
            <p>
              Before purchasing or installing any water filtration system, we strongly recommend obtaining at least two quotes from licensed plumbers and requesting a site assessment.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quote dialog */}
      {quoteProvider && answers && result && (
        <RequestQuoteDialog
          open={!!quoteProvider}
          onOpenChange={(open) => { if (!open) setQuoteProvider(null); }}
          provider={quoteProvider}
          answers={answers}
          recommendedSystems={[result.primary, result.secondary, result.premium]
            .map((r) => toCanonicalSystemType(r.id))
            .filter((id): id is NonNullable<typeof id> => !!id)}
        />
      )}

      {/* Sticky mobile bar */}
      {showStickyBar && providerMatches.length > 0 && (
        <a
          href="#matched-providers"
          className="fixed bottom-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_-4px_20px_rgba(0,0,0,0.15)] sm:hidden"
        >
          View matched providers ↓
        </a>
      )}
    </div>
  );
}