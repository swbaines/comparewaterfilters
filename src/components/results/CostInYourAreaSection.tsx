import { ShieldCheck, TrendingUp, TrendingDown } from "lucide-react";
import type { RecommendationResult, QuizAnswers } from "@/lib/recommendationEngine";
import { getSystemPricing, getSystemPricingMeta } from "@/lib/systemPricing";

export default function CostInYourAreaSection({
  result,
  answers,
}: {
  result: RecommendationResult;
  answers: QuizAnswers;
}) {
  const meta = getSystemPricingMeta(result.primary.id);
  if (!meta || !meta.showPriceRange) return null;

  const pricing = getSystemPricing(result.primary.id);
  if (!pricing) return null;
  const { installMin, installMax } = pricing;
  // Hide if the spread is too wide to be informative (>3×).
  if (installMin <= 0 || installMax / installMax === 0 || installMax / installMin > 3) {
    return null;
  }

  const mid = Math.round((installMin + installMax) / 2 / 50) * 50;
  const lowPct = 18;
  const highPct = 82;

  const sourceLabel =
    answers.waterSource === "tank-water"
      ? "tank-water"
      : answers.waterSource === "rainwater"
        ? "rainwater"
        : answers.waterSource === "bore-water"
          ? "bore-water"
          : "town-water";

  return (
    <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <h2 className="text-xl font-bold sm:text-2xl">
        What this typically costs in {answers.suburb || "your area"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Based on recent installs for similar {sourceLabel} homes nearby.
      </p>

      <p className="mt-5 text-2xl font-bold sm:text-3xl">
        ${installMin.toLocaleString()}–${installMax.toLocaleString()}{" "}
        <span className="text-base font-normal text-muted-foreground">
          installed · most homes land near ${mid.toLocaleString()}
        </span>
      </p>

      <div className="mt-4">
        <div className="relative h-2 w-full rounded-full bg-muted">
          <div
            className="absolute inset-y-0 rounded-full bg-primary"
            style={{ left: `${lowPct}%`, right: `${100 - highPct}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
          <span>Lower</span>
          <span className="font-medium text-foreground">Typical range</span>
          <span>Higher</span>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-warm/40 bg-warm-light/30 p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <TrendingUp className="h-4 w-4" /> Pushes it up
          </p>
          <p className="mt-1 text-muted-foreground">
            Hard-to-reach mains, extra outlets, older plumbing.
          </p>
        </div>
        <div className="rounded-lg border border-sage/40 bg-sage-light/40 p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold text-sage-dark">
            <TrendingDown className="h-4 w-4" /> Brings it down
          </p>
          <p className="mt-1 text-muted-foreground">
            Easy under-sink access, single wet area, recent plumbing.
          </p>
        </div>
      </div>

      <p className="mt-5 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span>
          The exact price depends on a quick look at your plumbing — which is precisely what
          your free quotes give you. No guessing, no obligation.
        </span>
      </p>
    </section>
  );
}