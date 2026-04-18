import { Info, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type WarningCalloutVariant = "info" | "risk";

interface WarningCalloutProps {
  message: string;
  variant?: WarningCalloutVariant;
  className?: string;
}

/**
 * Reusable warning callout used across pages (e.g. results page).
 * - `info` → teal/primary tint with Info icon (e.g. renter notices, advisories).
 * - `risk` → destructive/red tint with Shield icon (e.g. water hardness, contaminant risks).
 */
export function WarningCallout({ message, variant = "info", className }: WarningCalloutProps) {
  const isInfo = variant === "info";

  return (
    <Card
      className={cn(
        isInfo ? "border-primary/30 bg-primary/5" : "border-destructive/20 bg-destructive/5",
        className,
      )}
    >
      <CardContent className="flex items-start gap-3 p-4">
        {isInfo ? (
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        ) : (
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-destructive/70" />
        )}
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

/**
 * Heuristic to classify a free-text warning string as informational or risk.
 * Keeps backwards-compatibility with engines that return plain strings.
 */
export function inferWarningVariant(message: string): WarningCalloutVariant {
  const lower = message.toLowerCase();
  if (
    lower.includes("rent") ||
    lower.includes("landlord") ||
    lower.includes("tenant") ||
    lower.includes("portable")
  ) {
    return "info";
  }
  return "risk";
}
