import { Link } from "react-router-dom";
import PageMeta from "@/components/PageMeta";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { articles } from "@/data/articles";
import SectionHeading from "@/components/SectionHeading";

export default function LearnPage() {
  return (
    <div className="py-12 sm:py-16">
      <PageMeta
        title="Learn About Water Filtration"
        description="Guides and articles on water quality, filtration methods, and choosing the right system for Australian homes."
        path="/learn"
      />
      <div className="container max-w-4xl">
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
                  <Badge variant="secondary" className="mb-3">{article.category}</Badge>
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
          <div className="grid gap-4 sm:grid-cols-3">
            <Link to="/water-quality">
              <Card className="h-full transition-all hover:shadow-md">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold">Water Quality Lookup</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Check hardness, chlorine, and PFAS levels for your suburb.</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/system-types">
              <Card className="h-full transition-all hover:shadow-md">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold">System Types</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Compare under-sink, whole house, RO, UV, and softener systems.</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/pricing-guide">
              <Card className="h-full transition-all hover:shadow-md">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold">Pricing Guide</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Understand installed prices and annual maintenance costs.</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
