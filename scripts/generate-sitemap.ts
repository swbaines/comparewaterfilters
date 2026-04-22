import { articles } from "../src/data/articles";
import { writeFileSync } from "fs";

const BASE = "https://www.comparewaterfilters.com.au";

const staticPages = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/quiz", changefreq: "monthly", priority: "0.9" },
  { path: "/results", changefreq: "monthly", priority: "0.8" },
  { path: "/system-types", changefreq: "monthly", priority: "0.8" },
  { path: "/pricing-guide", changefreq: "monthly", priority: "0.8" },
  { path: "/how-it-works", changefreq: "monthly", priority: "0.7" },
  { path: "/learn", changefreq: "weekly", priority: "0.7" },
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/provider-match", changefreq: "monthly", priority: "0.6" },
  { path: "/water-quality", changefreq: "weekly", priority: "0.8" },
  { path: "/disclaimer", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
];

const articleEntries = articles.map((a) => ({
  path: `/learn/${a.slug}`,
  changefreq: "monthly",
  priority: "0.6",
  lastmod: a.publishedAt,
}));

const allPages = [...staticPages, ...articleEntries];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (p) => `  <url>
    <loc>${BASE}${p.path}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>${
      "lastmod" in p ? `\n    <lastmod>${p.lastmod}</lastmod>` : ""
    }
  </url>`
  )
  .join("\n")}
</urlset>
`;

writeFileSync("public/sitemap.xml", xml);
console.log(`✅ Sitemap generated with ${allPages.length} URLs`);
