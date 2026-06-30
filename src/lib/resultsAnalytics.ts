/**
 * Lightweight wrapper that fires the same event into both Microsoft
 * Clarity (custom events) and Google Analytics (gtag). Safe no-op when
 * either is missing.
 */
export function trackResultsEvent(
  event:
    | "recommendation_viewed"
    | "vendor_card_expanded"
    | "vendor_selection_changed"
    | "contact_form_focused"
    | "quote_requested",
  data: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    clarity?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  };
  try {
    w.clarity?.("event", event);
  } catch {
    /* ignore */
  }
  try {
    w.gtag?.("event", event, data);
  } catch {
    /* ignore */
  }
}