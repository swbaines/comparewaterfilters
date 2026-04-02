import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import PageMeta from "@/components/PageMeta";
import { articles } from "@/data/articles";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

const BASE_URL = "https://www.comparewaterfilters.com.au";

export default function ArticlePage() {
  const { slug } = useParams();
  const article = articles.find((a) => a.slug === slug);

  useEffect(() => {
    if (!article) return;
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.seoDescription || article.summary,
      datePublished: article.publishedAt,
      url: `${BASE_URL}/learn/${article.slug}`,
      publisher: {
        "@type": "Organization",
        name: "Compare Water Filters",
        url: BASE_URL,
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${BASE_URL}/learn/${article.slug}`,
      },
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [article]);

  if (!article) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold">Article not found</h1>
        <Link to="/learn" className="mt-4 inline-block text-primary hover:underline">← Back to articles</Link>
      </div>
    );
  }

  return (
    <div className="py-12 sm:py-16">
      <PageMeta
        title={article.title}
        description={article.seoDescription || article.summary}
        path={`/learn/${article.slug}`}
      />
      <div className="container max-w-3xl">
        <Link to="/learn" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Back to articles
        </Link>
        <Badge variant="secondary" className="mb-3">{article.category}</Badge>
        <h1 className="text-2xl font-bold sm:text-3xl">{article.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Published {new Date(article.publishedAt).toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" })}
          {article.readTime && <> · {article.readTime}</>}
        </p>
        <div className="prose prose-sm mt-8 max-w-none text-muted-foreground">
          {article.body.split("\n\n").map((para, i) => {
            if (para.startsWith("**") && para.endsWith("**")) {
              return <h2 key={i} className="mt-6 text-lg font-semibold text-foreground">{para.replace(/\*\*/g, "")}</h2>;
            }
            if (para.startsWith("- ")) {
              return (
                <ul key={i} className="my-3 list-disc space-y-1 pl-5">
                  {para.split("\n").map((li, j) => (
                    <li key={j}>{li.replace(/^- /, "").replace(/\*\*/g, "")}</li>
                  ))}
                </ul>
              );
            }
            return <p key={i} className="my-3" dangerouslySetInnerHTML={{ __html: para.replace(/\*\*(.*?)\*\*/g, "<strong class='text-foreground'>$1</strong>") }} />;
          })}
        </div>
      </div>
    </div>
  );
}