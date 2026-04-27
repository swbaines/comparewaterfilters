import { useEffect } from "react";
import { Link } from "react-router-dom";
import PageMeta from "@/components/PageMeta";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { articles } from "@/data/articles";
import SectionHeading from "@/components/SectionHeading";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function LearnPage() {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "learn-jsonld";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://www.comparewaterfilters.com.au" },
        { "@type": "ListItem", position: 2, name: "Learn", item: "https://www.comparewaterfilters.com.au/learn" },
      ],
    });
    document.head.appendChild(script);
    return () => {
      document.getElementById("learn-jsonld")?.remove();
    };
  }, []);

  return (
    <div className="py-12 sm:py-16">
      <PageMeta
        title="Whole House Water Filter Guides for Australian Homes"
        description="Plain-English guides on whole house water filters, reverse osmosis, water quality and pricing — helping Australian homeowners pick the right filtration system."
        path="/learn"
      />
      <div className="container max-w-4xl">
        <Breadcrumbs items={[{ label: "Learn" }]} />
        <SectionHeading
          badge="Education hub"
          title="Guides, FAQs, and practical advice"
          subtitle="Clear, plain-English articles to help you make a more informed decision about water filtration."
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {articles.map((article) => (
            <Link to={`/learn/${article.slug}`} key={article.id}>
              <Card className="h-full transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <Badge variant="secondary" className="mb-3">
                    {article.category}
                  </Badge>
                  <h3 className="text-base font-semibold leading-snug">{article.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{article.summary}</p>
                  {article.readTime && <p className="mt-1 text-xs text-muted-foreground">{article.readTime}</p>}
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Read article <ArrowRight className="h-3 w-3" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Cross-links */}
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-bold">Related resources</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link to="/system-types">
              <Card className="h-full transition-all hover:shadow-md border-primary/20">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold">Compare System Types</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Whole house, RO, under-sink, UV, and softener — pros, cons and pricing side by side.
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                    Compare now <ArrowRight className="h-3 w-3" />
                  </span>
                </CardContent>
              </Card>
            </Link>
            <Link to="/water-quality">
              <Card className="h-full transition-all hover:shadow-md">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold">Water Quality Lookup</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Check hardness, chlorine, and PFAS levels for your suburb.
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/pricing-guide">
              <Card className="h-full transition-all hover:shadow-md">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold">Pricing Guide</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Understand installed prices and annual maintenance costs.
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/quiz">
              <Card className="h-full transition-all hover:shadow-md">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold">Find My System</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Answer a few questions and get a personalised recommendation.
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                    Take the quiz <ArrowRight className="h-3 w-3" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
