import { useEffect } from "react";
import { Link } from "react-router-dom";
import PageMeta from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SectionHeading from "@/components/SectionHeading";
import {
  Droplets, ShieldCheck, Sparkles, DollarSign, ArrowRight, CheckCircle2,
  Waves, Zap, Home, FlaskConical, ShowerHead, HardDrive, MapPin, Search,
  Star, Users, Award, ChevronRight
} from "lucide-react";

const trustPoints = [
  { icon: ShieldCheck, text: "Independent — no brand bias" },
  { icon: Sparkles, text: "Filter advice made simple" },
  { icon: DollarSign, text: "Budget considered recommendations" },
  { icon: Droplets, text: "Trusted suppliers only" },
];

const stats = [
  { number: "10+", label: "System types compared" },
  { number: "8", label: "States & territories covered" },
  { number: "100%", label: "Free for homeowners" },
  { number: "Licensed", label: "Vendors only" },
];

const steps = [
  {
    num: "1",
    title: "Tell us about your home",
    desc: "Answer a few quick questions about your property, water source, and what's bothering you about your current water.",
  },
  {
    num: "2",
    title: "Get matched to the right system",
    desc: "We use your answers — including your state's water quality data — to recommend the filtration system that actually fits your situation.",
  },
  {
    num: "3",
    title: "Compare quotes from local vendors",
    desc: "Request free quotes from licensed installers in your area. No obligation, no pushy sales — just real information.",
  },
];

const concerns = [
  { icon: Droplets, label: "Chlorine taste & smell", href: "/water-quality", desc: "Common in VIC, SA & WA" },
  { icon: Waves, label: "Hard water & scale", href: "/water-quality", desc: "Serious issue in Perth & Adelaide" },
  { icon: FlaskConical, label: "Fluoride removal", href: "/quiz", desc: "Only RO effectively removes it" },
  { icon: ShieldCheck, label: "PFAS / forever chemicals", href: "/quiz", desc: "Growing concern across Australia" },
  { icon: Zap, label: "Heavy metals", href: "/quiz", desc: "Lead, arsenic, and more" },
  { icon: Home, label: "Whole house filtration", href: "/system-types", desc: "Every tap, shower & appliance" },
  { icon: ShowerHead, label: "Skin & hair irritation", href: "/quiz", desc: "Chlorine is the main cause" },
  { icon: HardDrive, label: "Appliance protection", href: "/quiz", desc: "Extend life of your hot water system" },
];

const testimonials = [
  {
    quote: "I had no idea Perth water was so hard until I used the postcode lookup. Explains why our kettle was always scaled up. Got a whole house system installed — huge difference.",
    name: "Sarah M.",
    location: "Wanneroo, WA",
    rating: 5,
  },
  {
    quote: "My daughter had eczema for years and we tried everything. Turns out Melbourne's chlorine levels were the problem. The quiz pointed us straight to a whole house carbon filter. Her skin is so much better now.",
    name: "David K.",
    location: "Preston, VIC",
    rating: 5,
  },
  {
    quote: "Adelaide water is genuinely terrible. The platform was the first place that actually explained why — Murray River minerals and high chlorine. We got three quotes and chose the best one. Couldn't be happier.",
    name: "Michelle T.",
    location: "Norwood, SA",
    rating: 5,
  },
];

const articles = [
  {
    title: "Is Australian tap water getting worse? What the data says",
    href: "/learn/is-australian-tap-water-getting-worse",
    tag: "Water quality",
    desc: "Chlorine levels, algal blooms, PFAS and climate change — the evidence is clear.",
  },
  {
    title: "Reverse osmosis vs carbon filter — which do you actually need?",
    href: "/learn/reverse-osmosis-vs-carbon-filter",
    tag: "System guide",
    desc: "The most common question we get, answered with real data.",
  },
  {
    title: "Hard water in Perth — suburb by suburb guide",
    href: "/water-quality",
    tag: "Water quality",
    desc: "Two Rocks hits 228 mg/L. Find out where your suburb sits.",
  },
];

const vendors = [
  { state: "VIC", count: "Melbourne & surrounds" },
  { state: "NSW", count: "Sydney & Central Coast" },
  { state: "QLD", count: "Brisbane & Gold Coast" },
  { state: "WA", count: "Perth metro & regional" },
  { state: "SA", count: "Adelaide & surrounds" },
  { state: "TAS", count: "Hobart & Launceston" },
];

const jsonLdData = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Compare Water Filters",
    url: "https://www.comparewaterfilters.com.au",
    description: "Australia's independent water filter comparison platform. Compare the best water filtration systems — whole house water filters, reverse osmosis, under-sink — and get free quotes from licensed installers in Sydney, Melbourne, Brisbane, Perth and Adelaide.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://www.comparewaterfilters.com.au/water-quality?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Compare Water Filters",
    url: "https://www.comparewaterfilters.com.au",
    logo: "https://www.comparewaterfilters.com.au/logo-droplets.svg",
    description: "Independent water filtration comparison and recommendation platform for Australian homeowners. Compare the best water filtration systems and get free quotes from licensed installers.",
    areaServed: [
      { "@type": "Country", name: "Australia" },
      { "@type": "City", name: "Sydney" },
      { "@type": "City", name: "Melbourne" },
      { "@type": "City", name: "Brisbane" },
      { "@type": "City", name: "Perth" },
      { "@type": "City", name: "Adelaide" },
    ],
    sameAs: [],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How much does a water filter system cost in Australia?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The best water filtration system depends on your water source and concerns. Whole house water filters cost $3,000–$5,000 installed. Reverse osmosis systems cost $800–$3,000. Under-sink carbon filters start from $300. Prices include professional installation by a licensed plumber.",
        },
      },
      {
        "@type": "Question",
        name: "Is Compare Water Filters free for homeowners?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, Compare Water Filters is 100% free for homeowners. We provide independent recommendations, real Australian pricing, and connect you with licensed vendors — with no obligation or sales calls.",
        },
      },
      {
        "@type": "Question",
        name: "What contaminants does a water filter remove?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Depending on the system type, water filters can remove chlorine, sediment, heavy metals, fluoride, PFAS (forever chemicals), and more.",
        },
      },
    ],
  },
];

export default function HomePage() {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(jsonLdData);
    script.id = "homepage-jsonld";
    document.head.appendChild(script);
    return () => {
      document.getElementById("homepage-jsonld")?.remove();
    };
  }, []);

  return (
    <div>
      <PageMeta
        title="Best Water Filtration System Australia — Compare & Get Free Quotes"
        description="Compare the best water filtration systems in Australia. Whole house water filters, reverse osmosis, under-sink — independent recommendations and free quotes from licensed installers in Sydney, Melbourne, Brisbane, Perth & Adelaide."
        path="/"
      />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-accent/50 to-background py-20 sm:py-28">
        <div className="container relative z-10 text-center">
          <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
            Australia's independent water filter comparison
          </span>
          <h1 className="mx-auto max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-5xl">
            Tired of chlorine smell, scale buildup, or skin irritation from your tap?
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Compare Water Filters matches you to the right filtration system for your home, your water source, and your budget — then connects you with licensed local vendors for real quotes.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <Link to="/quiz">
              <Button size="lg" className="gap-2 px-10 py-6 text-lg font-bold shadow-lg">
                Find My System <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/water-quality">
              <Button variant="outline" size="sm" className="gap-2 text-sm">
                <Search className="h-3 w-3" /> Check my water quality
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section className="border-b bg-card py-8">
        <div className="container">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {trustPoints.map((t) => (
              <div key={t.text} className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                <t.icon className="h-5 w-5 shrink-0 text-primary" />
                {t.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Water quality lookup callout ── */}
      <section className="py-16 sm:py-20">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-8 md:grid-cols-2 items-center">
              <div>
                <span className="mb-3 inline-block rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                  Free water quality lookup
                </span>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">What's actually in your water?</h2>
                <p className="mt-3 text-muted-foreground">
                  Enter your suburb or postcode to see a breakdown of your local water — hardness, chlorine, fluoride, PFAS risk, and personalised filter recommendations.
                </p>
                <Link to="/water-quality">
                  <Button className="mt-6 gap-2">
                    <MapPin className="h-4 w-4" /> Look up my suburb
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {[
                  { suburb: "Wanneroo, WA", detail: "Hardness 195 mg/L — very hard" },
                  { suburb: "Adelaide CBD, SA", detail: "Chlorine up to 1.3 mg/L" },
                  { suburb: "Brisbane CBD, QLD", detail: "Moderate hardness, seasonal taste" },
                  { suburb: "Melbourne CBD, VIC", detail: "Soft water, higher chlorine" },
                ].map((ex) => (
                  <div key={ex.suburb} className="flex items-start gap-3 rounded-lg border p-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{ex.suburb}</p>
                      <p className="text-xs text-muted-foreground">{ex.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y bg-muted/30 py-12">
        <div className="container">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-extrabold text-primary">{s.number}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-16 sm:py-20">
        <div className="container">
          <SectionHeading badge="How it works" title="Three simple steps to clearer choices" />
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <Card key={s.num} className="relative border-0 bg-muted/50 shadow-none">
                <CardContent className="p-6">
                  <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {s.num}
                  </span>
                  <h3 className="text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/quiz">
              <Button size="lg" className="gap-2">
                Start the quiz <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Common concerns ── */}
      <section className="bg-card py-16 sm:py-20">
        <div className="container">
          <SectionHeading
            badge="Common concerns"
            title="What's really in your water?"
            subtitle="Chlorine, chloramine, fluoride, sediment — even 'safe' water carries things your family doesn't need to consume. Select a concern or take the quiz."
          />
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {concerns.map((c) => (
              <Link to={c.href} key={c.label}>
                <Card className="h-full cursor-pointer border transition-all hover:border-primary/30 hover:shadow-md">
                  <CardContent className="flex flex-col items-center gap-2 p-5 text-center">
                    <c.icon className="h-7 w-7 text-primary" />
                    <span className="text-sm font-medium">{c.label}</span>
                    <span className="text-xs text-muted-foreground">{c.desc}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Australian water is getting worse ── */}
      <section className="py-16 sm:py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <SectionHeading badge="The evidence" title="Why Australian water quality is declining" />
            <div className="mt-10 space-y-6">
              {[
                {
                  heading: "Chlorine levels are rising",
                  body: "As cities grow and pipe networks get longer, utilities must dose more chlorine to maintain safe levels at your tap. SA Water has recorded levels up to 1.8 mg/L in Adelaide — three times the taste threshold.",
                },
                {
                  heading: "Algal blooms are getting worse",
                  body: "Seqwater issued a public notice in late 2024 about earthy and grassy taste in Brisbane water from algal blooms triggered by hot, wet conditions — a pattern confirmed to be worsening with climate change.",
                },
                {
                  heading: "PFAS is in more water supplies than we thought",
                  body: "Elevated PFAS was detected at Sydney's Blue Mountains Cascade WFP in 2024. Australia updated its drinking water guidelines in June 2025 to set lower PFAS limits — acknowledging the problem is real.",
                },
                {
                  heading: "Bushfires contaminated major catchments",
                  body: "The 2019-20 fires burned 30% of Warragamba Dam's catchment and 39% of Canberra's Corin Dam catchment — raising turbidity, nutrient loads, and treatment chemical requirements for years after.",
                },
              ].map((item) => (
                <div key={item.heading} className="flex gap-4">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <h3 className="font-semibold">{item.heading}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link to="/learn">
                <Button variant="outline" className="gap-2">
                  Read the full research <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-card py-16 sm:py-20">
        <div className="container">
          <SectionHeading badge="Real results" title="What homeowners are saying" />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name} className="h-full">
                <CardContent className="p-6">
                  <div className="mb-3 flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">"{t.quote}"</p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {t.location}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Vendor coverage ── */}
      <section className="py-16 sm:py-20">
        <div className="container">
          <SectionHeading badge="Vendor network" title="Licensed installers across Australia" subtitle="We only work with licensed, insured water filtration professionals." />
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {vendors.map((v) => (
              <div key={v.state} className="rounded-lg border p-4 text-center transition-all hover:border-primary/30 hover:shadow-sm">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-sm font-bold text-primary">{v.state}</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{v.state}</p>
                  <p className="text-xs text-muted-foreground">{v.count}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <p className="mb-3 text-sm text-muted-foreground">Are you a water filtration business?</p>
            <Link to="/vendor/register">
              <Button variant="outline" className="gap-2">
                Join as a vendor <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Pricing teaser ── */}
      <section className="bg-card py-16 sm:py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl rounded-2xl bg-muted/50 p-8 text-center sm:p-12">
            <DollarSign className="mx-auto mb-4 h-10 w-10 text-primary" />
            <h2 className="text-2xl font-bold">Why are water filter quotes so different?</h2>
            <p className="mt-3 text-muted-foreground">
              Prices range from $300 to $8,000+. System type, installation complexity, certifications, and ongoing filter costs all play a role. Here's what you actually need to know.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-4">
              {[
                { range: "$300–$800", type: "Under-sink carbon" },
                { range: "$800–$1,500", type: "Reverse osmosis" },
                { range: "$2,500–$7,000", type: "Whole house" },
              ].map((p) => (
                <div key={p.type} className="rounded-lg bg-background p-3">
                  <p className="text-lg font-bold text-primary">{p.range}</p>
                  <p className="text-xs text-muted-foreground">{p.type}</p>
                </div>
              ))}
            </div>
            <Link to="/pricing-guide">
              <Button variant="outline" className="mt-6">Read our full pricing guide</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Learn section ── */}
      <section className="py-16 sm:py-20">
        <div className="container">
          <SectionHeading badge="Learn" title="Make a more informed decision" subtitle="Practical guides to help you understand your options." />
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {articles.map((a) => (
              <Link to={a.href} key={a.title}>
                <Card className="h-full transition-all hover:shadow-md">
                  <CardContent className="p-5">
                    <span className="mb-2 inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                      {a.tag}
                    </span>
                    <h3 className="text-sm font-semibold">{a.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{a.desc}</p>
                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                      Read more <ArrowRight className="h-3 w-3" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-16 sm:py-20">
        <div className="container text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Ready to find out what your water actually needs?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Answer a few questions about your home. We'll match you to the right system, explain what it does, show real pricing, and connect you with licensed vendors in your area.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link to="/quiz">
              <Button size="lg" className="gap-2">
                Find My System <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/water-quality">
              <Button variant="outline" size="lg" className="gap-2">
                <Search className="h-4 w-4" /> Check my water quality
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Free for homeowners · No obligation · Takes 2 minutes
          </p>
        </div>
      </section>
    </div>
  );
}
