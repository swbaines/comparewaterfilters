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
    <div className="fixed inset-x-2 bottom-2 z-50 rounded-xl border bg-card p-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] sm:inset-x-0 sm:bottom-0 sm:rounded-none sm:border-t sm:border-x-0 sm:p-4">
      <div className="container max-w-4xl px-0 sm:px-4">
        {/* Compact row — always visible */}
        <div className="flex flex-row items-center gap-2 sm:gap-4">
          <Cookie className="hidden h-5 w-5 shrink-0 text-primary sm:block" />
          <p className="flex-1 min-w-0 text-[11px] leading-snug text-muted-foreground sm:text-sm sm:leading-relaxed">
              <span className="font-semibold text-foreground">Cookies:</span> we use them to improve your experience.{" "}
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline"
                aria-expanded={expanded}
              >
                {expanded ? "Hide" : "Details"}
                {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
              </button>
            </p>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Button size="sm" className="h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm" onClick={() => handleConsent("all")}>
              Accept all
            </Button>
            <Button size="sm" variant="outline" className="h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm" onClick={() => handleConsent("essential")}>
              <span className="sm:hidden">Essential</span>
              <span className="hidden sm:inline">Essential only</span>
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
