import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";

/**
 * BreadcrumbList coverage regression.
 *
 * Rather than maintaining a hardcoded list of "pages with breadcrumbs",
 * this test discovers them dynamically:
 *   1. Parse `src/App.tsx` for every <Route path=… element=<Component /> />
 *      and resolve the imported component to its source file.
 *   2. For each route's source file (and any sub-components it imports
 *      from `src/`), check whether it renders the visible <Breadcrumbs />
 *      component.
 *   3. Every such page MUST also emit a JSON-LD BreadcrumbList block.
 *
 * This guarantees that any newly added route which renders breadcrumbs
 * also ships the structured-data counterpart — including dynamic /
 * parameterised routes like `/learn/:slug`.
 */

const APP_FILE = "src/App.tsx";
const SRC_ROOT = resolve(process.cwd(), "src");

function read(absOrRel: string): string {
  const path = absOrRel.startsWith("/") ? absOrRel : resolve(process.cwd(), absOrRel);
  return readFileSync(path, "utf8");
}

interface DiscoveredRoute {
  path: string;
  componentName: string;
  /** Absolute path to the resolved source file, or null if not resolvable. */
  sourceFile: string | null;
}

/** Parse <Route path="…" element={<Component … />} /> entries from App.tsx. */
function discoverRoutes(appSrc: string): DiscoveredRoute[] {
  const routes: DiscoveredRoute[] = [];
  const re = /<Route\s+path="([^"]+)"\s+element=\{([\s\S]*?)\}\s*\/>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(appSrc)) !== null) {
    const path = m[1];
    const element = m[2];
    // Element may be wrapped in guards: <AdminRoute><Foo /></AdminRoute>.
    // Find the LAST self-closing component name (the actual page).
    const compMatches = [...element.matchAll(/<([A-Z][A-Za-z0-9_]*)\b/g)].map((c) => c[1]);
    if (compMatches.length === 0) continue;
    const componentName = compMatches[compMatches.length - 1];
    routes.push({ path, componentName, sourceFile: null });
  }
  return routes;
}

/**
 * Resolve an import specifier from App.tsx for `componentName`.
 * Returns absolute file path or null.
 */
function resolveComponentSource(appSrc: string, componentName: string): string | null {
  const importRe = new RegExp(
    `import\\s+${componentName}\\s+from\\s+["']([^"']+)["']`,
  );
  const m = appSrc.match(importRe);
  if (!m) return null;
  let spec = m[1];
  // Resolve alias `@/` -> `src/`.
  if (spec.startsWith("@/")) {
    spec = spec.replace(/^@\//, `${SRC_ROOT}/`);
  } else if (spec.startsWith(".")) {
    spec = resolve(dirname(resolve(process.cwd(), APP_FILE)), spec);
  } else {
    return null;
  }
  for (const ext of [".tsx", ".ts", ".jsx", ".js", "/index.tsx", "/index.ts"]) {
    const candidate = spec.endsWith(ext) ? spec : `${spec}${ext}`;
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Recursively walk a source file's local imports (under `src/`) and return
 * the union of source text. We only follow alias / relative imports; bail on
 * cycles and node_modules. Bounded depth keeps this cheap.
 */
function collectComponentTree(entryFile: string, maxDepth = 3): string {
  const seen = new Set<string>();
  const chunks: string[] = [];

  function visit(file: string, depth: number) {
    if (depth > maxDepth || seen.has(file)) return;
    seen.add(file);
    let src: string;
    try {
      src = readFileSync(file, "utf8");
    } catch {
      return;
    }
    chunks.push(src);
    const importRe = /import\s+(?:[^"']+from\s+)?["']([^"']+)["']/g;
    let m: RegExpExecArray | null;
    while ((m = importRe.exec(src)) !== null) {
      const spec = m[1];
      let resolved: string | null = null;
      if (spec.startsWith("@/")) {
        resolved = spec.replace(/^@\//, `${SRC_ROOT}/`);
      } else if (spec.startsWith(".")) {
        resolved = resolve(dirname(file), spec);
      } else {
        continue;
      }
      for (const ext of [".tsx", ".ts", "/index.tsx", "/index.ts"]) {
        const candidate = resolved.endsWith(ext) ? resolved : `${resolved}${ext}`;
        if (existsSync(candidate)) {
          visit(candidate, depth + 1);
          break;
        }
      }
    }
  }

  visit(entryFile, 0);
  return chunks.join("\n/* ===== */\n");
}

/** True if the source tree renders <Breadcrumbs … /> visibly. */
function rendersBreadcrumbs(tree: string): boolean {
  return /<Breadcrumbs\b/.test(tree);
}

/** True if the source tree emits a JSON-LD BreadcrumbList. */
function emitsBreadcrumbList(tree: string): boolean {
  return /"@type"\s*:\s*"BreadcrumbList"/.test(tree);
}

const appSrc = read(APP_FILE);
const routes = discoverRoutes(appSrc).map((r) => ({
  ...r,
  sourceFile: resolveComponentSource(appSrc, r.componentName),
}));

describe("BreadcrumbList JSON-LD coverage (router-derived)", () => {
  it("discovered at least one route from App.tsx", () => {
    expect(routes.length).toBeGreaterThan(0);
  });

  it("every <Route> resolves to a source file on disk", () => {
    const unresolved = routes.filter((r) => !r.sourceFile);
    expect(
      unresolved,
      `Could not resolve source files for: ${unresolved
        .map((r) => `${r.path} -> ${r.componentName}`)
        .join(", ")}`,
    ).toEqual([]);
  });

  // Compute classification once.
  const classified = routes
    .filter((r) => r.sourceFile)
    .map((r) => {
      const tree = collectComponentTree(r.sourceFile!);
      return {
        ...r,
        rendersCrumbs: rendersBreadcrumbs(tree),
        emitsJsonLd: emitsBreadcrumbList(tree),
      };
    });

  const breadcrumbRoutes = classified.filter((r) => r.rendersCrumbs);

  it("discovered at least one route that renders <Breadcrumbs />", () => {
    expect(
      breadcrumbRoutes.length,
      "No routes detected as rendering <Breadcrumbs /> — discovery is broken",
    ).toBeGreaterThan(0);
  });

  describe("each breadcrumb-rendering route emits a BreadcrumbList", () => {
    for (const route of breadcrumbRoutes) {
      it(`${route.path} (${route.componentName}) emits JSON-LD BreadcrumbList`, () => {
        expect(
          route.emitsJsonLd,
          `Route ${route.path} renders <Breadcrumbs /> but is missing a JSON-LD BreadcrumbList in ${route.sourceFile}`,
        ).toBe(true);
      });
    }
  });

  describe("dynamic / parameterised routes are covered", () => {
    const dynamic = breadcrumbRoutes.filter((r) => r.path.includes(":"));

    it("at least one parameterised breadcrumb route exists (e.g. /learn/:slug)", () => {
      expect(
        dynamic.length,
        "No parameterised breadcrumb routes detected — coverage gap risk",
      ).toBeGreaterThan(0);
    });

    for (const route of dynamic) {
      it(`${route.path} emits BreadcrumbList with dynamic segment(s)`, () => {
        expect(route.emitsJsonLd).toBe(true);
        const src = read(route.sourceFile!);
        // A dynamic route's BreadcrumbList must include at least one
        // template / identifier expression in its `item:` field, since
        // the URL varies per render.
        const dynItem = /\bitem\s*:\s*(`[^`]*\$\{[^}]+\}[^`]*`|[A-Za-z_][A-Za-z0-9_.]*)/.test(
          src,
        );
        expect(
          dynItem,
          `Parameterised route ${route.path} should use a dynamic 'item:' expression in ${route.sourceFile}`,
        ).toBe(true);
      });
    }
  });

  // Surface the inverse for visibility (informational; not failing).
  it("does not silently emit BreadcrumbList without a visible <Breadcrumbs /> (parity)", () => {
    const orphans = classified.filter((r) => r.emitsJsonLd && !r.rendersCrumbs);
    expect(
      orphans,
      `These routes emit JSON-LD BreadcrumbList but render no visible <Breadcrumbs />: ${orphans
        .map((o) => o.path)
        .join(", ")}`,
    ).toEqual([]);
  });
});

// Re-export resolved imports list for completeness — silences tsc unused warnings.
export const __discoveredRoutes = routes;
export const __unused = { join };