import { useEffect } from "react";

/**
 * Marks the current page as noindex,nofollow.
 * Use on login pages, admin pages, and any internal/credential-collecting screens
 * to avoid Google Safe Browsing classifying them as deceptive.
 */
export default function NoIndex() {
  useEffect(() => {
    let el = document.querySelector('meta[name="robots"]');
    const previous = el?.getAttribute("content") ?? null;
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", "robots");
      document.head.appendChild(el);
    }
    el.setAttribute("content", "noindex,nofollow");

    return () => {
      // Restore previous value or remove if we created it
      if (previous !== null) {
        el!.setAttribute("content", previous);
      } else {
        el!.parentNode?.removeChild(el!);
      }
    };
  }, []);

  return null;
}
