import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdminNav from "@/components/AdminNav";
import PageMeta from "@/components/PageMeta";
import {
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Info,
} from "lucide-react";
import {
  ROUTES,
  BASE_URL,
  SITE_NAME,
  diffRouteAgainstSource,
  type DriftIssue,
  type RouteMeta,
} from "@/lib/seoSnapshot";

const TITLE_MIN = 30;
const TITLE_MAX = 60;
const TITLE_HARD_MAX = 65;
const DESC_MIN = 70;
const DESC_MAX = 160;
const DESC_HARD_MAX = 165;

interface MetaIssue {
  level: "info" | "warn" | "error";
  message: string;
}

function audit(meta: RouteMeta): MetaIssue[] {
  const issues: MetaIssue[] = [];
  if (meta.dynamic) return issues;
  const fullTitle = meta.title.includes(SITE_NAME)
    ? meta.title
    : `${meta.title} | ${SITE_NAME}`;

  // Title length
  if (fullTitle.length > TITLE_HARD_MAX) {
    issues.push({
      level: "error",
      message: `Title is ${fullTitle.length} chars — Google will truncate (target ${TITLE_MIN}–${TITLE_MAX}).`,
    });
  } else if (fullTitle.length > TITLE_MAX) {
    issues.push({
      level: "warn",
      message: `Title is ${fullTitle.length} chars (target ≤ ${TITLE_MAX}).`,
    });
  } else if (fullTitle.length < TITLE_MIN) {
    issues.push({
      level: "warn",
      message: `Title is ${fullTitle.length} chars — under ${TITLE_MIN} wastes SERP real estate.`,
    });
  }

  // Description length
  if (meta.description.length > DESC_HARD_MAX) {
    issues.push({
      level: "error",
      message: `Description is ${meta.description.length} chars — Google will truncate (target ${DESC_MIN}–${DESC_MAX}).`,
    });
  } else if (meta.description.length > DESC_MAX) {
    issues.push({
      level: "warn",
      message: `Description is ${meta.description.length} chars (target ≤ ${DESC_MAX}).`,
    });
  } else if (meta.description.length < DESC_MIN) {
    issues.push({
      level: "warn",
      message: `Description is ${meta.description.length} chars — under ${DESC_MIN} is too thin for SERP snippets.`,
    });
  }

  // Description sanity
  if (!meta.description.trim()) {
    issues.push({ level: "error", message: "Description is empty." });
  }

  // Canonical URL format
  try {
    const url = new URL(meta.canonical);
    if (url.protocol !== "https:") {
      issues.push({
        level: "error",
        message: `Canonical must use https:// (got ${url.protocol}).`,
      });
    }
    if (`${url.protocol}//${url.host}` !== BASE_URL) {
      issues.push({
        level: "error",
        message: `Canonical host is ${url.host} — must be ${new URL(BASE_URL).host}.`,
      });
    }
    if (url.search || url.hash) {
      issues.push({
        level: "warn",
        message: "Canonical contains query or hash — should be the bare URL.",
      });
    }
    if (url.pathname !== "/" && url.pathname.endsWith("/")) {
      issues.push({
        level: "warn",
        message: "Canonical has a trailing slash — site convention is no trailing slash.",
      });
    }
  } catch {
    issues.push({
      level: "error",
      message: `Canonical is not a valid URL: ${meta.canonical}`,
    });
  }

  // Open Graph tag inputs (PageMeta derives og:title/description/url/image
  // from these; if the inputs are good, the OG tags are good).
  if (!fullTitle.includes(SITE_NAME)) {
    issues.push({
      level: "warn",
      message: "og:title will not include the site name (PageMeta auto-appends it only when missing).",
    });
  }

  // OG image
  if (!meta.ogImage) {
    issues.push({
      level: "error",
      message: "Missing og:image — social cards will fall back to a generic preview.",
    });
  } else {
    try {
      const ogUrl = new URL(meta.ogImage);
      if (ogUrl.protocol !== "https:") {
        issues.push({
          level: "error",
          message: `og:image must be served over https:// (got ${ogUrl.protocol}).`,
        });
      }
      if (!/\.(jpe?g|png|webp)$/i.test(ogUrl.pathname)) {
        issues.push({
          level: "warn",
          message: `og:image extension ${ogUrl.pathname.split(".").pop()} is unusual — Facebook/Twitter prefer .jpg, .png or .webp.`,
        });
      }
    } catch {
      issues.push({
        level: "error",
        message: `og:image is not a valid URL: ${meta.ogImage}`,
      });
    }
  }

  // Keyword rules (existing)
  if (/whole[\s-]home/i.test(meta.title)) {
    issues.push({
      level: "error",
      message: "Title contains 'whole home' (must use 'whole house').",
    });
  }
  if (
    /whole[\s-]home/i.test(meta.description) &&
    !/whole[\s-]house/i.test(meta.description)
  ) {
    issues.push({
      level: "error",
      message:
        "Description mentions 'whole home' without 'whole house' as primary.",
    });
  }
  return issues;
}

// Eagerly load every page source as a raw string so we can diff against the
// snapshot at runtime. Vite resolves this at build time — bundle cost is
// limited to admin users who actually open this route via lazy chunking, and
// these are plain text strings (not re-evaluated as code).
const PAGE_SOURCES = import.meta.glob("/src/pages/*.tsx", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function getPageSource(snapshotPath: string): string | undefined {
  // snapshotPath is e.g. "src/pages/HomePage.tsx" — glob keys are absolute.
  const key = `/${snapshotPath}`;
  return PAGE_SOURCES[key];
}

export default function AdminSeoPreviewPage() {
  const [filter, setFilter] = useState("");
  const [liveTitle, setLiveTitle] = useState("");
  const [liveCanonical, setLiveCanonical] = useState("");

  useEffect(() => {
    setLiveTitle(document.title);
    const link = document.querySelector(
      'link[rel="canonical"]',
    ) as HTMLLinkElement | null;
    setLiveCanonical(link?.href ?? "");
  }, []);

  const driftByRoute = useMemo(() => {
    const map = new Map<string, DriftIssue[]>();
    for (const meta of ROUTES) {
      const source = getPageSource(meta.source);
      map.set(meta.route, diffRouteAgainstSource(meta, source));
    }
    return map;
  }, []);

  const allDrift = useMemo(
    () => Array.from(driftByRoute.values()).flat(),
    [driftByRoute],
  );

  const filtered = ROUTES.filter(
    (r) =>
      filter === "" ||
      r.route.toLowerCase().includes(filter.toLowerCase()) ||
      r.title.toLowerCase().includes(filter.toLowerCase()) ||
      r.description.toLowerCase().includes(filter.toLowerCase()),
  );

  const totalIssues = ROUTES.reduce((n, r) => n + audit(r).length, 0);

  return (
    <div className="container max-w-6xl py-8">
      <PageMeta
        title="SEO Preview — Admin"
        description="Internal SEO snapshot."
        path="/admin/seo-preview"
      />
      <AdminNav />

      <div className="mb-6 mt-6">
        <h1 className="text-3xl font-bold tracking-tight">SEO Preview</h1>
        <p className="mt-2 text-muted-foreground">
          Computed title, description, canonical and OG image for every public
          route. Use this to spot-check metadata before publishing.
        </p>
      </div>

      {allDrift.length > 0 && (
        <Card className="mb-6 border-destructive/50 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-destructive">
                Snapshot drift detected ({allDrift.length}{" "}
                {allDrift.length === 1 ? "field" : "fields"})
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                One or more page sources have changed since this snapshot was
                last updated. Update{" "}
                <code className="rounded bg-muted px-1">
                  src/lib/seoSnapshot.ts
                </code>{" "}
                to match. The{" "}
                <code className="rounded bg-muted px-1">
                  seoSnapshotDrift
                </code>{" "}
                vitest will fail in CI until they re-align.
              </p>
              <ul className="mt-3 space-y-2 text-xs">
                {allDrift.map((d, i) => (
                  <li
                    key={i}
                    className="rounded border border-destructive/30 bg-background p-2"
                  >
                    <div className="font-medium">
                      <code>{d.route}</code> · {d.field}
                    </div>
                    <div className="mt-1 text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        snapshot:
                      </span>{" "}
                      {d.expected}
                    </div>
                    <div className="text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        source:
                      </span>{" "}
                      {d.actual}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      <Card className="mb-6 p-4">
        <div className="grid gap-3 text-sm md:grid-cols-4">
          <div>
            <div className="text-muted-foreground">Routes tracked</div>
            <div className="text-2xl font-semibold">{ROUTES.length}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Audit issues</div>
            <div
              className={`text-2xl font-semibold ${
                totalIssues > 0 ? "text-destructive" : "text-primary"
              }`}
            >
              {totalIssues}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Source drift</div>
            <div
              className={`text-2xl font-semibold ${
                allDrift.length > 0 ? "text-destructive" : "text-primary"
              }`}
            >
              {allDrift.length}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Live page (this tab)</div>
            <div className="truncate font-medium" title={liveTitle}>
              {liveTitle}
            </div>
            <div
              className="truncate text-xs text-muted-foreground"
              title={liveCanonical}
            >
              {liveCanonical || "—"}
            </div>
          </div>
        </div>
      </Card>

      <div className="mb-4">
        <Input
          placeholder="Filter by route, title or description…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filtered.map((meta) => {
          const issues = audit(meta);
          const drift = driftByRoute.get(meta.route) ?? [];
          const fullTitle = meta.title.includes(SITE_NAME)
            ? meta.title
            : `${meta.title} | ${SITE_NAME}`;
          return (
            <Card key={meta.route} className="overflow-hidden">
              <div className="flex items-start justify-between gap-4 border-b p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="rounded bg-muted px-2 py-0.5 text-sm font-medium">
                      {meta.route}
                    </code>
                    {meta.dynamic && (
                      <Badge variant="secondary">Dynamic</Badge>
                    )}
                    {drift.length > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <ShieldAlert className="h-3 w-3" />
                        Drift ({drift.length})
                      </Badge>
                    )}
                    {issues.length === 0 ? (
                      <Badge
                        variant="outline"
                        className="gap-1 text-primary"
                      >
                        <CheckCircle2 className="h-3 w-3" /> OK
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {issues.length} issue{issues.length === 1 ? "" : "s"}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {meta.source}
                  </div>
                </div>
                {!meta.dynamic && (
                  <Button asChild variant="outline" size="sm">
                    <Link to={meta.route} target="_blank">
                      Open <ExternalLink className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                )}
              </div>

              <div className="grid gap-4 p-4 md:grid-cols-[160px_1fr]">
                <img
                  src={meta.ogImage}
                  alt=""
                  className="h-20 w-40 rounded border bg-muted object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.visibility = "hidden";
                  }}
                />
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      Title{" "}
                      <span className="ml-1 normal-case">
                        ({fullTitle.length} chars)
                      </span>
                    </div>
                    <div className="font-medium text-primary">{fullTitle}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      Description{" "}
                      <span className="ml-1 normal-case">
                        ({meta.description.length} chars)
                      </span>
                    </div>
                    <div>{meta.description}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      Canonical
                    </div>
                    <code className="break-all text-xs">{meta.canonical}</code>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      OG Image
                    </div>
                    <code className="break-all text-xs">{meta.ogImage}</code>
                  </div>
                  {drift.length > 0 && (
                    <ul className="mt-2 space-y-1 rounded border border-destructive/40 bg-destructive/5 p-2 text-xs">
                      {drift.map((d, idx) => (
                        <li key={idx} className="text-destructive">
                          • <strong>{d.field}</strong> drift — snapshot:{" "}
                          <em>{d.expected}</em> · source:{" "}
                          <em>{d.actual}</em>
                        </li>
                      ))}
                    </ul>
                  )}
                  {issues.length > 0 && (
                    <ul className="mt-2 space-y-1 rounded border border-destructive/40 bg-destructive/5 p-2 text-xs">
                      {issues.map((i, idx) => (
                        <li
                          key={idx}
                          className={
                            i.level === "error"
                              ? "text-destructive"
                              : "text-amber-700 dark:text-amber-400"
                          }
                        >
                          • {i.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            No routes match “{filter}”.
          </p>
        )}
      </div>
    </div>
  );
}
