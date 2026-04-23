import { Info } from "lucide-react";

/**
 * Shared pricing-assumptions footnote used wherever installed price ranges
 * or maintenance costs appear (Pricing Guide, Results page, system pages).
 *
 * Keeping a single source of truth ensures the assumptions and caveats are
 * worded identically across the site.
 */

export const PRICING_ASSUMPTIONS = {
  installed:
    "Installed estimate: typical Australian residential install by a licensed plumber, including the system, standard fittings, and labour.",
  exclusions:
    "Excludes: travel surcharges for regional/remote areas, non-standard plumbing modifications (slab penetration, long pipe runs, electrical work) and council/permit fees where applicable.",
  maintenance:
    "Maintenance estimate: average annual cost of replacement filters, cartridges, UV lamps or salt — assuming standard household usage and on-schedule servicing.",
  variance:
    "Actual quotes vary by location, plumbing complexity, brand, warranty length and included servicing. Always request an itemised quote so you can compare like-for-like.",
};

interface PricingFootnoteProps {
  /** Optional compact variant (Results page) hides the icon + heading. */
  variant?: "default" | "compact";
  className?: string;
}

export function PricingFootnote({ variant = "default", className = "" }: PricingFootnoteProps) {
  if (variant === "compact") {
    return (
      <p className={`text-xs text-muted-foreground ${className}`}>
        <span className="font-medium text-foreground/80">Pricing assumptions:</span>{" "}
        {PRICING_ASSUMPTIONS.installed} {PRICING_ASSUMPTIONS.exclusions}{" "}
        {PRICING_ASSUMPTIONS.maintenance} {PRICING_ASSUMPTIONS.variance}
      </p>
    );
  }

  return (
    <aside
      className={`mt-4 rounded-lg border border-border/60 bg-muted/40 p-4 text-xs text-muted-foreground ${className}`}
      aria-label="Pricing assumptions"
    >
      <div className="mb-2 flex items-center gap-2 text-foreground/80">
        <Info className="h-3.5 w-3.5" aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-wide">Pricing assumptions</span>
      </div>
      <ul className="space-y-1.5">
        <li>
          <span className="font-medium text-foreground/80">Installed estimate —</span>{" "}
          {PRICING_ASSUMPTIONS.installed.replace(/^Installed estimate:\s*/, "")}
        </li>
        <li>
          <span className="font-medium text-foreground/80">Exclusions —</span>{" "}
          {PRICING_ASSUMPTIONS.exclusions.replace(/^Excludes:\s*/, "")}
        </li>
        <li>
          <span className="font-medium text-foreground/80">Maintenance estimate —</span>{" "}
          {PRICING_ASSUMPTIONS.maintenance.replace(/^Maintenance estimate:\s*/, "")}
        </li>
        <li>
          <span className="font-medium text-foreground/80">Why quotes vary —</span>{" "}
          {PRICING_ASSUMPTIONS.variance}
        </li>
      </ul>
    </aside>
  );
}