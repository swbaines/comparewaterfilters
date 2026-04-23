import { useEffect, useMemo, useState } from "react";
import PageMeta from "@/components/PageMeta";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowRight, DollarSign, Wrench, Home, Clock, Users, Share2, Check, ChevronDown, Info, Mail, Loader2, Pencil } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateRecommendations, explainRuleEvaluations, type QuizAnswers, type RecommendationResult } from "@/lib/recommendationEngine";
import { lookupPostcodeCoords } from "@/lib/geo";
import type { Recommendation } from "@/data/recommendations";
import MatchedVendorsSection from "@/components/MatchedVendorsSection";
import { WarningCallout, inferWarningVariant } from "@/components/WarningCallout";
import { toCanonicalSystemType } from "@/lib/canonicalSystemTypes";

const TIER_EXPLANATIONS: Record<"value" | "allrounder" | "premium", string> = {
  value: "The lowest-cost option that still tackles your top concerns. Best if you want quick wins on taste and drinking water without a big upfront spend.",
  allrounder: "Our best-fit pick for your home, water source, and concerns — the strongest balance of coverage, running cost, and install effort.",
  premium: "Maximum protection across your whole home and drinking water. Best if you want the most comprehensive solution and are happy to invest more upfront.",
};

/**
 * Fire a results-page conversion event into Meta Pixel and Google Analytics.
 * Safe no-op if either pixel is not present (e.g., dev or with consent declined).
 */
function trackResultsEmailEvent(
  event: "results_email_submitted" | "results_email_sent" | "results_email_failed",
  data: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  };
  const payload = { content_name: "Quiz Results Email", ...data };
  try {
    w.fbq?.("trackCustom", event, payload);
  } catch {
    /* ignore pixel errors */
  }
  try {
    w.gtag?.("event", event, payload);
  } catch {
    /* ignore analytics errors */
  }
}

type ConfidenceLevel = "High" | "Medium" | "Low";

const CONFIDENCE_STYLES: Record<ConfidenceLevel, string> = {
  High: "bg-sage-light text-sage-dark border-primary/30",
  Medium: "bg-warm-light text-foreground border-warm/40",
  Low: "bg-muted text-muted-foreground border-border",
};

const CONFIDENCE_TOOLTIPS: Record<ConfidenceLevel, string> = {
  High: "You answered the key questions in detail (water source, concerns, coverage and budget), so this match is well-tailored to your home.",
  Medium: "We have enough to suggest a sensible match, but a few answers were left general. Adding more detail (e.g. specific concerns or coverage) can sharpen the recommendation.",
  Low: "Several key answers were skipped or left vague, so this is a best-guess starting point. Edit your answers to get a more accurate match.",
};

/**
 * Computes a simple confidence score based on how specific the quiz answers are.
 * Looks at: water source, concerns count, coverage, budget, household size, property type.
 */
export function computeConfidence(answers: QuizAnswers | null): ConfidenceLevel {
  if (!answers) return "Low";
  let score = 0;
  if (answers.waterSource && answers.waterSource !== "unsure") score += 1;
  const concernCount = Array.isArray(answers.concerns) ? answers.concerns.length : 0;
  if (concernCount >= 3) score += 2;
  else if (concernCount >= 1) score += 1;
  if (answers.coverage) score += 1;
  if (answers.budget && answers.budget !== "unsure") score += 1;
  if (answers.householdSize) score += 1;
  if (answers.propertyType) score += 1;
  if (score >= 6) return "High";
  if (score >= 3) return "Medium";
  return "Low";
}

function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${CONFIDENCE_STYLES[level]}`}
            aria-label={`Match confidence: ${level}`}
          >
            <Info className="h-3 w-3" />
            {level} confidence
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
          {CONFIDENCE_TOOLTIPS[level]}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function RecCard({ rec, label, reason, variant, badge, confidence, labelAbove }: { rec: Recommendation; label: string; reason: string; variant: "value" | "allrounder" | "premium"; badge?: string; confidence: ConfidenceLevel; labelAbove?: boolean }) {
  const colors = {
    value: "bg-sage-light text-sage-dark border-primary/20",
    allrounder: "bg-accent text-accent-foreground border-primary/30",
    premium: "bg-warm-light text-foreground border-warm/30",
  };

  const card = (
    <Card className={`overflow-hidden border-2 ${variant === "allrounder" ? "border-primary shadow-lg" : ""}`}>
      <CardHeader className="pb-3">
        {!labelAbove && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`w-fit ${colors[variant]}`}>{label}</Badge>
            {badge && <Badge variant="outline" className="w-fit text-xs font-normal">{badge}</Badge>}
            <ConfidenceBadge level={confidence} />
          </div>
        )}
        {labelAbove && (badge || confidence) && (
          <div className="flex flex-wrap items-center gap-2">
            {badge && <Badge variant="outline" className="w-fit text-xs font-normal">{badge}</Badge>}
            <ConfidenceBadge level={confidence} />
          </div>
        )}
        <p className="text-xs leading-relaxed text-muted-foreground">{TIER_EXPLANATIONS[variant]}</p>
        <CardTitle className="text-lg">{rec.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{rec.category}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Why this fits you: </span>{reason}</p>

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

  if (!labelAbove) return card;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex h-8 items-center justify-center">
        <Badge className={`${colors[variant]} text-sm px-3 py-1`}>{label}</Badge>
      </div>
      <div className="flex-1">{card}</div>
    </div>
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
  "whole-home": "Whole house protection",
  appliance: "Appliance & hot water system protection",
  bacteria: "Bacteria / microbiological safety",
  "not-sure": "Not sure — just want better water",
};

function PricingExplainer({ result, answers }: { result: RecommendationResult; answers: QuizAnswers }) {
  const [open, setOpen] = useState(false);
  const { primary } = result;

  // Build personalised "drivers" — the things in the user's quiz that move price up or down.
  const drivers: { label: string; detail: string; effect: "up" | "down" | "neutral" }[] = [];

  const bathroomsNum = parseInt(answers.bathrooms || "", 10);
  if (!Number.isNaN(bathroomsNum)) {
    if (bathroomsNum >= 3) {
      drivers.push({
        label: `${answers.bathrooms} bathrooms`,
        detail: "Larger flow rate needed — pushes you toward the higher end of the range.",
        effect: "up",
      });
    } else if (bathroomsNum <= 1) {
      drivers.push({
        label: `${answers.bathrooms} bathroom`,
        detail: "Smaller flow demand — typically the lower end of the range.",
        effect: "down",
      });
    }
  }

  const householdNum = parseInt((answers.householdSize || "").replace("+", ""), 10);
  if (!Number.isNaN(householdNum) && householdNum >= 5) {
    drivers.push({
      label: `${answers.householdSize} people`,
      detail: "Higher daily water use means larger cartridges and more frequent service.",
      effect: "up",
    });
  }

  if (answers.propertyType === "Apartment") {
    drivers.push({
      label: "Apartment install",
      detail: "Limited plumbing access — installers may charge more for tight or shared spaces.",
      effect: "up",
    });
  }

  if (answers.coverage === "whole-house-plus") {
    drivers.push({
      label: "Whole house + drinking water",
      detail: "Two systems combined — adds to install time and parts.",
      effect: "up",
    });
  } else if (answers.coverage === "drinking-water" || answers.coverage === "kitchen") {
    drivers.push({
      label: "Single-tap coverage",
      detail: "Smaller scope keeps install short and parts minimal.",
      effect: "down",
    });
  }

  if (answers.waterSource && ["rainwater", "tank-water", "bore-water"].includes(answers.waterSource)) {
    drivers.push({
      label: "Untreated water source",
      detail: "UV disinfection and pre-filtration usually add $400–$1,200 to the install.",
      effect: "up",
    });
  }

  if (answers.concerns.includes("hard-water")) {
    drivers.push({
      label: "Hard water",
      detail: "Softening or scale-control adds parts and ongoing salt/media costs.",
      effect: "up",
    });
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-8">
      <div className="mx-auto max-w-3xl rounded-xl border border-primary/20 bg-background">
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold sm:text-base">
                Why ${primary.priceMin.toLocaleString()}–${primary.priceMax.toLocaleString()}? And why quotes vary
              </p>
              <p className="text-xs text-muted-foreground">
                See what in your answers drives the price — and what to ask installers.
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
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Your range
              </p>
              <p className="text-foreground/90">
                For <span className="font-medium">{primary.title}</span>, installed quotes in Australia
                typically fall between{" "}
                <span className="font-semibold">
                  ${primary.priceMin.toLocaleString()}–${primary.priceMax.toLocaleString()}
                </span>
                . Annual maintenance averages{" "}
                <span className="font-medium">
                  ${primary.annualMaintenanceMin}–${primary.annualMaintenanceMax}/yr
                </span>{" "}
                for filter changes and servicing.
              </p>
            </div>

            {drivers.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  What in your answers shifts the price
                </p>
                <ul className="space-y-2">
                  {drivers.map((d) => (
                    <li key={d.label} className="flex items-start gap-2.5">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                          d.effect === "up"
                            ? "bg-warm-light text-warm-foreground"
                            : d.effect === "down"
                              ? "bg-sage-light text-sage-dark"
                              : "bg-muted text-muted-foreground"
                        }`}
                        aria-hidden
                      >
                        {d.effect === "up" ? "↑" : d.effect === "down" ? "↓" : "•"}
                      </span>
                      <div>
                        <p className="font-medium">{d.label}</p>
                        <p className="text-muted-foreground">{d.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Why two quotes for the same system can differ by $1,000+
              </p>
              <ul className="space-y-1.5 text-foreground/90">
                <li className="flex gap-2"><span className="text-primary">•</span><span><span className="font-medium">Brand & build quality</span> — entry-level housings vs NSF-certified stainless components.</span></li>
                <li className="flex gap-2"><span className="text-primary">•</span><span><span className="font-medium">Plumbing complexity</span> — distance from main, pipe access, bypass loops, slab vs subfloor.</span></li>
                <li className="flex gap-2"><span className="text-primary">•</span><span><span className="font-medium">Pre-filtration & extras</span> — sediment pre-filter, UV, scale guard, pressure regulator.</span></li>
                <li className="flex gap-2"><span className="text-primary">•</span><span><span className="font-medium">Warranty & servicing</span> — 1-year vs 5–10 year warranties, included annual service visits.</span></li>
                <li className="flex gap-2"><span className="text-primary">•</span><span><span className="font-medium">Travel & region</span> — regional callouts and inner-city parking can add $100–$400.</span></li>
              </ul>
            </div>

            <div className="rounded-lg border border-primary/20 bg-accent/30 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
                Tip when comparing quotes
              </p>
              <p className="text-foreground/90">
                Always ask for an itemised quote — system, install, pre-filter, warranty length, and
                annual service cost — so you can compare like-for-like, not just the headline price.
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

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
                See the concerns behind your match and the Good tier trade-off.
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
            {/* Triggering concerns */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Your concerns behind this match
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
                    ? `Because you ${answers.propertyType === "Apartment" ? "live in an apartment" : "rent your home"} — whole-house and softener systems aren't practical, so we picked the best installable option for your concerns.`
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
  const [copied, setCopied] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [customerCoords, setCustomerCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleEmailResults = async () => {
    if (!answers || !result) return;
    const trimmed = emailInput.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed) || trimmed.length > 254) {
      toast({ title: "Please enter a valid email address", variant: "destructive" });
      return;
    }

    trackResultsEmailEvent("results_email_submitted");
    setEmailSending(true);
    try {
      const encoded = btoa(JSON.stringify(answers));
      const url = `${window.location.origin}/results?d=${encoded}`;
      const idempotencyKey = `quiz-results-${trimmed.toLowerCase()}-${encoded.slice(0, 24)}`;

      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "quiz-results-summary",
          recipientEmail: trimmed,
          idempotencyKey,
          templateData: {
            customerName: answers.firstName || "there",
            resultsUrl: url,
            topRecommendation: result.primary?.title || "",
            budgetOption: result.secondary?.title || "",
            premiumOption: result.premium?.title || "",
          },
        },
      });

      if (error) throw error;

      trackResultsEmailEvent("results_email_sent", {
        top_recommendation: result.primary?.title || "",
      });
      setEmailSent(true);
      toast({ title: "Email sent!", description: `We've sent your results to ${trimmed}.` });
      setTimeout(() => {
        setEmailDialogOpen(false);
        setEmailSent(false);
        setEmailInput("");
      }, 1800);
    } catch (err) {
      trackResultsEmailEvent("results_email_failed", {
        error_message: err instanceof Error ? err.message : "unknown",
      });
      toast({
        title: "Couldn't send email",
        description: "Please try again in a moment, or use the Share link option instead.",
        variant: "destructive",
      });
    } finally {
      setEmailSending(false);
    }
  };

  const handleShareResults = async () => {
    if (!answers) return;
    const encoded = btoa(JSON.stringify(answers));
    const url = `${window.location.origin}/results?d=${encoded}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Water Filter Recommendations",
          text: "Hi, check out my personalised water filter recommendations from Compare Water Filters!",
          url,
        });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
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
    }
  };

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

    let cancelled = false;
    (async () => {
      const coords = await lookupPostcodeCoords(parsed!.postcode || parsed!.suburb);
      if (cancelled) return;
      if (coords) setCustomerCoords({ lat: coords.lat, lng: coords.lng });
    })();
    return () => { cancelled = true; };
  }, [navigate, searchParams]);

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

  const recommendedSystemIds = useMemo(() => {
    if (!result) return [] as string[];
    return [...new Set(
      [result.primary, result.secondary, result.premium]
        .map((r) => toCanonicalSystemType(r.id))
        .filter((id): id is NonNullable<typeof id> => !!id)
    )];
  }, [result]);

  if (!result || !answers) return null;

  const confidence = computeConfidence(answers);

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
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="w-full gap-2 shadow-md sm:w-auto"
              onClick={() => {
                const el = document.getElementById("matched-providers");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                } else {
                  window.location.hash = "#matched-providers";
                }
              }}
            >
              Request a free quote <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full gap-2 sm:w-auto"
              onClick={handleShareResults}
            >
              {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              {copied ? "Link copied!" : "Save or share results"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full gap-2 sm:w-auto"
              onClick={() => {
                if (answers?.email) setEmailInput(answers.email);
                setEmailDialogOpen(true);
              }}
            >
              <Mail className="h-4 w-4" />
              Email me my results
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full gap-2 sm:w-auto"
              onClick={() => {
                if (answers) {
                  try {
                    sessionStorage.setItem("quizAnswers", JSON.stringify(answers));
                  } catch {
                    // ignore storage failures
                  }
                }
                navigate("/quiz?edit=1");
              }}
            >
              <Pencil className="h-4 w-4" />
              Edit my answers
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Free, no obligation • Your details are saved with your results link
          </p>
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
          <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto items-start">
            <RecCard rec={result.primary} label="Our recommendation" reason={result.primaryReason} variant="allrounder" badge="Complete solution" confidence={confidence} labelAbove />
            <RecCard rec={result.secondary} label="Budget alternative" reason={result.secondaryReason} variant="value" confidence={confidence} labelAbove />
          </div>
        ) : result.secondary.id === result.primary.id ? (
          <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto items-start">
            <RecCard rec={result.primary} label="Our recommendation" reason={result.primaryReason} variant="allrounder" badge="Also the most affordable option" confidence={confidence} labelAbove />
            <RecCard rec={result.premium} label="Premium option" reason={result.premiumReason} variant="premium" confidence={confidence} labelAbove />
          </div>
        ) : (
          <>
            {/* Mobile: recommendation first, then budget & premium */}
            <div className="flex flex-col gap-6 sm:hidden">
              <RecCard rec={result.primary} label="Our recommendation" reason={result.primaryReason} variant="allrounder" confidence={confidence} labelAbove />
              <RecCard rec={result.secondary} label="Budget alternative" reason={result.secondaryReason} variant="value" confidence={confidence} labelAbove />
              <RecCard rec={result.premium} label="Premium option" reason={result.premiumReason} variant="premium" confidence={confidence} labelAbove />
            </div>
            {/* Desktop: standard 3-column order */}
            <div className="hidden sm:grid gap-6 md:[grid-template-columns:0.9fr_1.1fr_0.9fr] items-start">
              <RecCard rec={result.secondary} label="Budget alternative" reason={result.secondaryReason} variant="value" confidence={confidence} labelAbove />
              <RecCard rec={result.primary} label="Our recommendation" reason={result.primaryReason} variant="allrounder" confidence={confidence} labelAbove />
              <RecCard rec={result.premium} label="Premium option" reason={result.premiumReason} variant="premium" confidence={confidence} labelAbove />
            </div>
          </>
        )}

        {/* ── Pricing explainer ── */}
        <PricingExplainer result={result} answers={answers} />

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
            <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
              Tick the providers you'd like a free quote from. They'll contact you directly — you're not committing to anything.
            </p>
          </div>

          <MatchedVendorsSection
            customerLat={customerCoords?.lat ?? null}
            customerLng={customerCoords?.lng ?? null}
            answers={answers}
            recommendedSystems={recommendedSystemIds}
          />
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
                label: "Whole house protection",
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

      {/* Sticky mobile bar */}
      {showStickyBar && (
        <a
          href="#matched-providers"
          className="fixed bottom-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_-4px_20px_rgba(0,0,0,0.15)] sm:hidden"
        >
          View matched providers ↓
        </a>
      )}

      {/* Email results dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={(open) => {
        setEmailDialogOpen(open);
        if (!open) { setEmailSent(false); }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Email me my results
            </DialogTitle>
            <DialogDescription>
              We'll send a private link so you can revisit your personalised recommendations anytime — no need to retake the quiz.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="results-email">Your email address</Label>
            <Input
              id="results-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={emailInput}
              maxLength={254}
              disabled={emailSending || emailSent}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !emailSending && !emailSent) handleEmailResults(); }}
            />
            <p className="text-xs text-muted-foreground">
              We won't add you to a marketing list. Just one summary email with your results link.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => setEmailDialogOpen(false)} disabled={emailSending}>
              Cancel
            </Button>
            <Button onClick={handleEmailResults} disabled={emailSending || emailSent} className="gap-2">
              {emailSending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
              ) : emailSent ? (
                <><Check className="h-4 w-4" /> Sent!</>
              ) : (
                <><Mail className="h-4 w-4" /> Send my results</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}