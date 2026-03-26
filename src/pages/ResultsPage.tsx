import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowRight, DollarSign, Wrench, Home, Clock, Star, Shield, Phone, MapPin, Award, Users, Send } from "lucide-react";
import { generateRecommendations, type QuizAnswers, type RecommendationResult } from "@/lib/recommendationEngine";
import { matchProviders, type ProviderMatch } from "@/lib/providerMatchEngine";
import type { Recommendation } from "@/data/recommendations";
import type { Provider } from "@/data/providers";
import RequestQuoteDialog from "@/components/RequestQuoteDialog";

function RecCard({ rec, label, reason, variant }: { rec: Recommendation; label: string; reason: string; variant: "value" | "allrounder" | "premium" }) {
  const colors = {
    value: "bg-sage-light text-sage-dark border-primary/20",
    allrounder: "bg-accent text-accent-foreground border-primary/30",
    premium: "bg-warm-light text-foreground border-warm/30",
  };

  return (
    <Card className={`overflow-hidden border-2 ${variant === "allrounder" ? "border-primary shadow-lg" : ""}`}>
      <CardHeader className="pb-3">
        <Badge className={`mb-2 w-fit ${colors[variant]}`}>{label}</Badge>
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
  const rankLabels = ["Top match", "Strong match", "Good match"];
  const rankColors = [
    "border-primary shadow-lg",
    "border-primary/40",
    "",
  ];

  return (
    <Card className={`overflow-hidden border-2 ${rankColors[rank] || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <Badge className={rank === 0 ? "mb-2 bg-primary text-primary-foreground" : "mb-2 bg-accent text-accent-foreground"}>
              {rankLabels[rank] || "Match"}
            </Badge>
            <CardTitle className="text-lg">{provider.name}</CardTitle>
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
            <span className="text-muted-foreground">{provider.location.states.join(", ")}</span>
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

export default function ResultsPage() {
  const navigate = useNavigate();
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [answers, setAnswers] = useState<QuizAnswers | null>(null);
  const [providerMatches, setProviderMatches] = useState<ProviderMatch[]>([]);
  const [quoteProvider, setQuoteProvider] = useState<Provider | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("quizAnswers");
    if (!stored) { navigate("/quiz"); return; }
    const parsed = JSON.parse(stored) as QuizAnswers;
    setAnswers(parsed);
    const rec = generateRecommendations(parsed);
    setResult(rec);
    setProviderMatches(matchProviders(parsed, rec));
  }, [navigate]);

  if (!result || !answers) return null;

  return (
    <div className="min-h-screen bg-muted/30 py-8 sm:py-12">
      <div className="container max-w-5xl">
        {/* Summary */}
        <div className="mb-10 text-center">
          <Badge className="mb-3">Your personalised results</Badge>
          <h1 className="text-2xl font-bold sm:text-3xl">
            Hi {answers.firstName}, here's what we recommend
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Based on your household, water source, concerns, and budget, we've matched you with the most suitable system types and local providers.
          </p>
        </div>

        {/* Top recommendation */}
        <Card className="mb-8 border-primary/20 bg-accent/50">
          <CardContent className="p-6 sm:p-8">
            <Badge className="mb-3">Top recommendation</Badge>
            <h2 className="text-xl font-bold">{result.primary.title}</h2>
            <p className="mt-2 text-muted-foreground">{result.primaryReason}</p>
          </CardContent>
        </Card>

        {/* 3 Recommendation cards */}
        <h2 className="mb-4 text-lg font-bold">Recommended system types</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <RecCard rec={result.primary} label="Best value" reason={result.primaryReason} variant="value" />
          <RecCard rec={result.secondary} label="Best all-rounder" reason={result.secondaryReason} variant="allrounder" />
          <RecCard rec={result.premium} label="Premium option" reason={result.premiumReason} variant="premium" />
        </div>

        {/* Provider matches */}
        {providerMatches.length > 0 && (
          <div className="mt-14">
            <div className="mb-6 text-center">
              <Badge className="mb-3" variant="secondary">
                <Users className="mr-1 h-3 w-3" /> Matched providers
              </Badge>
              <h2 className="text-xl font-bold sm:text-2xl">Providers matched to your needs</h2>
              <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
                We've found {providerMatches.length} qualified provider{providerMatches.length > 1 ? "s" : ""} in your area who install your recommended systems. Compare them side by side.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {providerMatches.map((match, i) => (
                <ProviderCard key={match.provider.id} match={match} rank={i} onRequestQuote={setQuoteProvider} />
              ))}
            </div>

            {providerMatches.length === 0 && (
              <Card className="border-0 bg-muted/50 shadow-none">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">
                    We don't have matched providers in your area yet. Contact us and we'll find one for you.
                  </p>
                  <Link to="/contact">
                    <Button className="mt-4">Contact us</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Comparison table */}
        <div className="mt-12 overflow-x-auto">
          <h2 className="mb-4 text-lg font-bold">Quick comparison</h2>
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b">
                <th className="pb-3 text-left font-medium text-muted-foreground"></th>
                <th className="pb-3 text-left font-medium">Best value</th>
                <th className="pb-3 text-left font-medium">All-rounder</th>
                <th className="pb-3 text-left font-medium">Premium</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-3 font-medium text-muted-foreground">System type</td>
                <td className="py-3">{result.primary.title}</td>
                <td className="py-3">{result.secondary.title}</td>
                <td className="py-3">{result.premium.title}</td>
              </tr>
              <tr>
                <td className="py-3 font-medium text-muted-foreground">Price range</td>
                <td className="py-3">${result.primary.priceMin.toLocaleString()} – ${result.primary.priceMax.toLocaleString()}</td>
                <td className="py-3">${result.secondary.priceMin.toLocaleString()} – ${result.secondary.priceMax.toLocaleString()}</td>
                <td className="py-3">${result.premium.priceMin.toLocaleString()} – ${result.premium.priceMax.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="py-3 font-medium text-muted-foreground">Annual maintenance</td>
                <td className="py-3">${result.primary.annualMaintenanceMin} – ${result.primary.annualMaintenanceMax}/yr</td>
                <td className="py-3">${result.secondary.annualMaintenanceMin} – ${result.secondary.annualMaintenanceMax}/yr</td>
                <td className="py-3">${result.premium.annualMaintenanceMin} – ${result.premium.annualMaintenanceMax}/yr</td>
              </tr>
              <tr>
                <td className="py-3 font-medium text-muted-foreground">Category</td>
                <td className="py-3">{result.primary.category}</td>
                <td className="py-3">{result.secondary.category}</td>
                <td className="py-3">{result.premium.category}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Disclaimer */}
        <Card className="mt-8 border-0 bg-muted/50 shadow-none">
          <CardContent className="p-5 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Important note</p>
            <p className="mt-1">
              These recommendations are based on the information you provided and are intended as general guidance. Final suitability depends on your specific water quality, plumbing setup, and professional assessment. We recommend getting a qualified assessment before making a purchase decision.
            </p>
          </CardContent>
        </Card>

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
      </div>

      {/* Quote dialog */}
      {quoteProvider && answers && result && (
        <RequestQuoteDialog
          open={!!quoteProvider}
          onOpenChange={(open) => { if (!open) setQuoteProvider(null); }}
          provider={quoteProvider}
          answers={answers}
          recommendedSystems={[result.primary.title, result.secondary.title, result.premium.title]}
        />
      )}
    </div>
  );
}