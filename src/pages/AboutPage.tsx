import { Link } from "react-router-dom";
import { Mail, MapPin, ShieldCheck, Heart, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageMeta from "@/components/PageMeta";
import SectionHeading from "@/components/SectionHeading";
import Breadcrumbs from "@/components/Breadcrumbs";

const aboutSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      "@id": "https://www.comparewaterfilters.com.au/about#aboutpage",
      url: "https://www.comparewaterfilters.com.au/about",
      name: "About Compare Water Filters",
      description:
        "Compare Water Filters is an independent Australian platform helping households choose the right water filtration system and connect with trusted local providers.",
      inLanguage: "en-AU",
      isPartOf: {
        "@type": "WebSite",
        "@id": "https://www.comparewaterfilters.com.au/#website",
        name: "Compare Water Filters",
        url: "https://www.comparewaterfilters.com.au",
      },
      about: { "@id": "https://www.comparewaterfilters.com.au/#organization" },
      mainEntity: { "@id": "https://www.comparewaterfilters.com.au/#organization" },
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://www.comparewaterfilters.com.au/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "About",
            item: "https://www.comparewaterfilters.com.au/about",
          },
        ],
      },
    },
    {
      "@type": "Organization",
      "@id": "https://www.comparewaterfilters.com.au/#organization",
      name: "Compare Water Filters",
      alternateName: "Compare Water Filters Australia",
      url: "https://www.comparewaterfilters.com.au",
      logo: {
        "@type": "ImageObject",
        url: "https://www.comparewaterfilters.com.au/logo-droplets.svg",
      },
      email: "hello@comparewaterfilters.com.au",
      description:
        "Independent Australian platform that helps households compare water filtration systems and connect with trusted local providers.",
      areaServed: { "@type": "Country", name: "Australia" },
      address: {
        "@type": "PostalAddress",
        addressLocality: "Melbourne",
        addressRegion: "VIC",
        addressCountry: "AU",
      },
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: "hello@comparewaterfilters.com.au",
          availableLanguage: ["English"],
          areaServed: "AU",
        },
      ],
      knowsAbout: [
        "Whole house water filtration",
        "Reverse osmosis",
        "Under-sink water filters",
        "Water softeners",
        "Australian tap water quality",
      ],
    },
  ],
};

export default function AboutPage() {
  return (
    <div className="bg-background">
      <PageMeta
        title="About Compare Water Filters — Independent Australian Platform"
        description="Compare Water Filters is an independent Australian platform helping households choose the right whole house water filter and connect with trusted local providers."
        path="/about"
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />

      <div className="container py-6">
        <Breadcrumbs items={[{ label: "About" }]} />
      </div>

      {/* Hero */}
      <section className="container pb-10 pt-2">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Heart className="h-3.5 w-3.5" /> Australian-owned &amp; independent
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            About Compare Water Filters
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            We help Australian households cut through the marketing noise around water
            filtration — and connect them with trusted local providers they can compare
            side-by-side.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="container py-12">
        <div className="mx-auto max-w-3xl">
          <SectionHeading title="Our story" subtitle="Why Compare Water Filters exists" />
          <div className="prose prose-slate mt-6 max-w-none text-foreground/90">
            <p>
              Choosing a water filter in Australia shouldn't feel like guesswork. Most
              households have no easy way to know which contaminants are actually in
              their tap water, what type of system would fix them, or what a fair price
              looks like — and the existing market is full of high-pressure sales tactics
              and confusing jargon.
            </p>
            <p>
              We built <strong>Compare Water Filters</strong> to give Australians a
              clear, transparent platform to understand exactly what system they need to
              remove the contaminants they care about — chlorine, chloramine, sediment,
              hardness, fluoride, PFAS and more — and then to compare quotes from
              trusted, vetted local providers without pressure.
            </p>
            <p>
              We don't sell filters ourselves. We don't take a cut of the install. Our
              recommendations are based on your water source, household size, and
              priorities — not on which brand pays us the most. Providers pay a flat fee
              per qualified lead, and that's what keeps the platform free and unbiased
              for homeowners and renters alike.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-muted/30 py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <SectionHeading
              title="What we stand for"
              subtitle="Three principles that guide everything we publish"
            />
          </div>
          <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-3">
            <Card className="border-primary/10">
              <CardContent className="p-6">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">Independent &amp; transparent</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  We don't sell systems. Our recommendations are based on your water and
                  your home — not advertiser priority.
                </p>
              </CardContent>
            </Card>
            <Card className="border-primary/10">
              <CardContent className="p-6">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Heart className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">Pro-filtration, pro-truth</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Australian tap water meets safety standards, but reducing chlorine,
                  taste, sediment and emerging contaminants makes a real difference.
                </p>
              </CardContent>
            </Card>
            <Card className="border-primary/10">
              <CardContent className="p-6">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">Trusted local providers</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Every provider on the platform is vetted for ABN, public liability,
                  and our terms before they can quote on a single lead.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Business details */}
      <section className="container py-16">
        <div className="mx-auto max-w-3xl">
          <SectionHeading title="Business details" subtitle="Where to find us" />
          <Card className="mt-6">
            <CardContent className="grid gap-6 p-6 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Based in</p>
                  <p className="text-sm text-muted-foreground">
                    Melbourne, Victoria, Australia
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Servicing all states &amp; territories
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Get in touch</p>
                  <a
                    href="mailto:hello@comparewaterfilters.com.au"
                    className="text-sm text-primary hover:underline"
                  >
                    hello@comparewaterfilters.com.au
                  </a>
                  <p className="mt-1 text-xs text-muted-foreground">
                    We typically respond within 1 business day.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary/5 py-16">
        <div className="container text-center">
          <h2 className="text-2xl font-bold md:text-3xl">
            Ready to find the right system for your home?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Take the 2-minute quiz and get matched with trusted Australian providers.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/quiz">Find My System</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
