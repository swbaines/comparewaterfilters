import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { articles } from "@/data/articles";
import SectionHeading from "@/components/SectionHeading";

export default function LearnPage() {
  return (
    <div className="py-12 sm:py-16">
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
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Read article <ArrowRight className="h-3 w-3" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
