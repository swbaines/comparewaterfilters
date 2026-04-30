import { useEffect } from "react";

interface PageMetaProps {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
  appendSiteName?: boolean;
}

const SITE_NAME = "Compare Water Filters";
const BASE_URL = "https://www.comparewaterfilters.com.au";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-default.jpg`;

export default function PageMeta({
  title,
  description,
  path = "",
  ogImage,
  appendSiteName = true,
}: PageMetaProps) {
  useEffect(() => {
    const fullTitle =
      appendSiteName || title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("name", "description", description);
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", `${BASE_URL}${path}`);
    setMeta("property", "og:image", ogImage || DEFAULT_OG_IMAGE);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:site_name", SITE_NAME);
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", ogImage || DEFAULT_OG_IMAGE);

    // Set canonical
    let link = document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.href = `${BASE_URL}${path}`;
  }, [title, description, path, ogImage, appendSiteName]);

  return null;
}
