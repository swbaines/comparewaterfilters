import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie, ChevronDown, ChevronUp } from "lucide-react";

type ConsentValue = "all" | "essential";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleConsent = (value: ConsentValue) => {
    localStorage.setItem("cookie-consent", value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-card p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] sm:p-4">
      <div className="container max-w-4xl">
        {/* Compact row — always visible */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Cookie className="mt-0.5 hidden h-5 w-5 shrink-0 text-primary sm:block" />
            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
              <span className="font-semibold text-foreground">We use cookies</span> to improve your experience and measure platform performance.{" "}
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline"
                aria-expanded={expanded}
              >
                {expanded ? "Hide details" : "Learn more"}
                {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
              </button>
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => handleConsent("all")}>
              Accept all
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleConsent("essential")}>
              Essential only
            </Button>
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-3 space-y-1.5 border-t pt-3 text-xs text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Essential cookies</span> — required for the platform to function. Cannot be disabled.
            </p>
            <p>
              <span className="font-medium text-foreground">Analytics cookies</span> — Google Analytics helps us understand which pages are most useful. No personally identifiable information is collected.
            </p>
            <p>
              <span className="font-medium text-foreground">Marketing cookies</span> — Meta Pixel measures advertising effectiveness. May involve sharing data with Meta (Facebook).
            </p>
            <p className="text-[11px]">
              Change preferences anytime in our{" "}
              <a href="/disclaimer" className="font-medium text-primary hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
