import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowRight, DollarSign, Wrench, Home, Clock } from "lucide-react";
import { generateRecommendations, type QuizAnswers, type RecommendationResult } from "@/lib/recommendationEngine";
import type { Recommendation } from "@/data/recommendations";

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

        <Link to="/provider-match">
          <Button className="mt-2 w-full gap-2">
            Request matched providers <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function ResultsPage() {
  const navigate = useNavigate();
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [answers, setAnswers] = useState<QuizAnswers | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("quizAnswers");
    if (!stored) { navigate("/quiz"); return; }
    const parsed = JSON.parse(stored) as QuizAnswers;
    setAnswers(parsed);
    setResult(generateRecommendations(parsed));
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
            Based on your household, water source, concerns, and budget, we've matched you with the most suitable system types.
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
        <div className="grid gap-6 md:grid-cols-3">
          <RecCard rec={result.primary} label="Best value" reason={result.primaryReason} variant="value" />
          <RecCard rec={result.secondary} label="Best all-rounder" reason={result.secondaryReason} variant="allrounder" />
          <RecCard rec={result.premium} label="Premium option" reason={result.premiumReason} variant="premium" />
        </div>

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
          <Link to="/provider-match">
            <Button size="lg" className="gap-2">
              Request matched providers <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/quiz">
            <Button variant="outline" size="lg">Retake quiz</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
