import { useEffect } from "react";

/**
 * On non-canonical hosts (Lovable preview/staging, lovable.app, lovableproject.com),
 * inject <meta name="robots" content="noindex,nofollow"> so search engines don't
 * index duplicates, and 301-style client redirect to the canonical custom domain.
 *
 * This is the single biggest lever for resolving Google Safe Browsing
 * "deceptive site" flags — it consolidates reputation onto one trusted domain.
 */
const CANONICAL_HOST = "www.comparewaterfilters.com.au";
const CANONICAL_ORIGIN = `https://${CANONICAL_HOST}`;

const NON_CANONICAL_PATTERNS = [
  /\.lovable\.app$/i,
  /\.lovableproject\.com$/i,
];

// Don't redirect the in-editor preview iframe — only the public published staging URL.
const isPublishedStagingHost = (host: string) =>
  NON_CANONICAL_PATTERNS.some((p) => p.test(host)) &&
  !host.startsWith("id-preview--");

export default function CanonicalDomainGuard() {
  useEffect(() => {
    const host = window.location.host;

    if (NON_CANONICAL_PATTERNS.some((p) => p.test(host))) {
      // Always set noindex on non-canonical hosts
      let robots = document.querySelector('meta[name="robots"]');
      if (!robots) {
        robots = document.createElement("meta");
        robots.setAttribute("name", "robots");
        document.head.appendChild(robots);
      }
      robots.setAttribute("content", "noindex,nofollow");

      // Force canonical to the custom domain
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.setAttribute("rel", "canonical");
        document.head.appendChild(canonical);
      }
      canonical.href = `${CANONICAL_ORIGIN}${window.location.pathname}${window.location.search}`;

      // Redirect to the canonical domain (skip in-editor preview)
      if (isPublishedStagingHost(host)) {
        window.location.replace(
          `${CANONICAL_ORIGIN}${window.location.pathname}${window.location.search}${window.location.hash}`
        );
      }
    }
  }, []);

  return null;
}
