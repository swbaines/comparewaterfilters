import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, DollarSign, Wrench, Clock, Lightbulb } from "lucide-react";
import type { RecommendationResult, QuizAnswers } from "@/lib/recommendationEngine";
import {
  getSystemPricing,
  getSystemPricingMeta,
  formatPriceRange,
} from "@/lib/systemPricing";

const CONCERN_SHORT: Record<string, string> = {
  taste: "chlorine & taste",
  "skin-hair": "skin irritation",
  "skin-shower": "shower-water concerns",
  fluoride: "fluoride",
  "heavy-metals": "heavy metals",
  pfas: "PFAS",
  microplastics: "microplastics",
  "whole-home": "chlorine",
  appliance: "appliance protection",
  "hard-water": "hard water",
};

const COVERAGE_SHORT: Record<string, string> = {
  "whole-house": "whole-house coverage",
  "whole-house-plus": "whole-house plus a kitchen RO tap",
  "drinking-water": "drinking water only",
  kitchen: "single-tap kitchen coverage",
  "showers-bathrooms": "filtered showers & bathrooms",
};

function buildPersonalisedLede(result: RecommendationResult, answers: QuizAnswers): string {
  const concerns = (answers.concerns || [])
    .map((c) => CONCERN_SHORT[c])
    .filter(Boolean) as string[];
  const coverage = COVERAGE_SHORT[answers.coverage || ""] || "the coverage you asked for";
  const concernsPart =
    concerns.length === 0
      ? "Your answers"
      : concerns.length === 1
        ? `Your focus on ${concerns[0]}`
        : `Your focus on ${concerns[0]} and ${concerns[1]}`;
  return `${concernsPart}, combined with ${coverage}, points to the ${result.primary.title}. ${result.primaryReason}`;
}

export default function RecommendedSystemCard({
  result,
  answers,
}: {
  result: RecommendationResult;
  answers: QuizAnswers;
}) {
  const pricing = getSystemPricing(result.primary.id) ?? {
    installMin: result.primary.priceMin,
    installMax: result.primary.priceMax,
    annualMin: result.primary.annualMaintenanceMin,
    annualMax: result.primary.annualMaintenanceMax,
  };
  const meta = getSystemPricingMeta(result.primary.id);
  const lede = buildPersonalisedLede(result, answers);

  const altDifferent = result.secondary.id !== result.primary.id;
  const altPricing = altDifferent ? getSystemPricing(result.secondary.id) : null;

  return (
    <Card className="overflow-hidden border-2 border-primary/30 shadow-sm">
      <CardContent className="p-0">
        <div className="grid gap-0 md:grid-cols-[1fr_280px]">
          <div className="space-y-5 p-6 sm:p-8">
            <Badge className="bg-primary text-primary-foreground">Recommended for you</Badge>
            <div>
              <h3 className="text-xl font-bold sm:text-2xl">{result.primary.title}</h3>
              <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                {result.primary.category}
              </p>
            </div>
            <p className="text-sm leading-relaxed text-foreground/80">{lede}</p>

            {meta && meta.removes.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  What it removes
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {meta.removes.map((r) => (
                    <span
                      key={r}
                      className="inline-flex items-center gap-1 rounded-full bg-sage-light/60 px-2.5 py-1 text-xs font-medium text-sage-dark"
                    >
                      <CheckCircle2 className="h-3 w-3" /> {r}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {altDifferent && altPricing && (
              <div className="rounded-lg border border-warm/40 bg-warm-light/40 p-4 text-sm">
                <p className="flex items-start gap-2">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warm-foreground" />
                  <span>
                    <span className="font-semibold">On a tighter budget?</span>{" "}
                    The {result.secondary.title} covers the essentials from around{" "}
                    <span className="font-semibold">
                      ${altPricing.installMin.toLocaleString()}
                    </span>{" "}
                    installed — you can always add a stronger system later.
                  </span>
                </p>
              </div>
            )}
          </div>

          <aside className="space-y-3 border-t border-border bg-muted/40 p-6 text-sm md:border-l md:border-t-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              At a glance
            </p>
            <div className="flex items-start gap-2">
              <DollarSign className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="font-medium">Typical installed</p>
                <p className="text-muted-foreground">
                  {formatPriceRange(pricing.installMin, pricing.installMax)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="font-medium">Filter changes / yr</p>
                <p className="text-muted-foreground">
                  {meta?.filterChangesPerYear || result.primary.filterFrequency}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="font-medium">System lifespan</p>
                <p className="text-muted-foreground">{meta?.lifespan || "10+ years"}</p>
              </div>
            </div>
            <p className="pt-1 text-[11px] leading-relaxed text-muted-foreground">
              Annual maintenance{" "}
              {formatPriceRange(pricing.annualMin, pricing.annualMax)} for filter changes
              & servicing.
            </p>
          </aside>
        </div>
      </CardContent>
    </Card>
  );
}