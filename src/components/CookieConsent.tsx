import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

type ConsentValue = "all" | "essential";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

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
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-card p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] sm:p-6">
      <div className="container max-w-4xl">
        <div className="flex items-start gap-3">
          <Cookie className="mt-0.5 hidden h-5 w-5 shrink-0 text-primary sm:block" />
          <div className="flex-1 space-y-3">
            <p className="text-sm font-semibold text-foreground">We use cookies</p>
            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Compare Water Filters uses cookies and similar tracking technologies to improve your experience and understand how our platform is used.
            </p>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Essential cookies</span> — required for the platform to function. Cannot be disabled.
              </p>
              <p>
                <span className="font-medium text-foreground">Analytics cookies</span> — Google Analytics helps us understand which pages are most useful so we can improve them. No personally identifiable information is collected.
              </p>
              <p>
                <span className="font-medium text-foreground">Marketing cookies</span> — Meta Pixel allows us to measure the effectiveness of our advertising and show relevant ads. This may involve sharing data with Meta (Facebook).
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              By clicking "Accept all" you consent to all cookies. Click "Essential only" to decline optional cookies.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button size="sm" onClick={() => handleConsent("all")}>
                Accept all
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleConsent("essential")}>
                Essential only
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              You can change your preferences at any time in our{" "}
              <a href="/disclaimer" className="font-medium text-primary hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
