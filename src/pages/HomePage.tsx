import { Link } from "react-router-dom";
import PageMeta from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SectionHeading from "@/components/SectionHeading";
import {
  Droplets, ShieldCheck, Sparkles, DollarSign, ArrowRight, CheckCircle2,
  Waves, Zap, Home, FlaskConical, ShowerHead, HardDrive
} from "lucide-react";

const trustPoints = [
  { icon: Sparkles, text: "Plain-English recommendations" },
  { icon: DollarSign, text: "Transparent pricing ranges" },
  { icon: ShieldCheck, text: "Match systems to your needs" },
  { icon: Droplets, text: "Australia-focused guidance" },
];

const steps = [
  { num: "1", title: "Answer a few simple questions", desc: "Tell us about your home, water source, and what matters most to you." },
  { num: "2", title: "See what system suits your home", desc: "We'll match your needs to the right type of filtration system." },
  { num: "3", title: "Compare best-fit options", desc: "Review recommendations, pricing ranges, and next steps." },
];

const concerns = [
  { icon: Droplets, label: "Chlorine taste & smell", slug: "chlorine" },
  { icon: Waves, label: "Hard water / scale", slug: "hard-water" },
  { icon: FlaskConical, label: "Better drinking water", slug: "drinking-water" },
  { icon: ShieldCheck, label: "Fluoride removal", slug: "fluoride" },
  { icon: Zap, label: "Heavy metals", slug: "heavy-metals" },
  { icon: Home, label: "Whole house filtration", slug: "whole-house" },
  { icon: ShowerHead, label: "Skin & shower concerns", slug: "skin-shower" },
  { icon: HardDrive, label: "Appliance protection", slug: "appliances" },
];

export default function HomePage() {
  return (
    <div>
      <PageMeta
        title="Compare Water Filters — Find the Right System for Your Home"
        description="Compare water filtration systems, understand pricing, and get matched to the best option for your Australian home. Independent, free guidance."
        path="/"
      />
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-accent/50 to-background py-20 sm:py-28">
        <div className="container relative z-10 text-center">
          <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
            Australia's independent water filter comparison
          </span>
          <h1 className="mx-auto max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Your family deserves better than straight-from-the-tap
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Australian tap water is safe — but "safe" isn't the same as "clean." There's no benefit to drinking chlorine, chloramine, or trace contaminants when affordable filtration can remove them. We help you find the right system for your home in minutes.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link to="/quiz">
              <Button size="lg" className="gap-2 text-base">
                Find My System <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/system-types">
              <Button variant="outline" size="lg" className="text-base">
                Browse system types
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust strip */}
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

      {/* How it works */}
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
        </div>
      </section>

      {/* Common concerns */}
      <section className="bg-card py-16 sm:py-20">
        <div className="container">
          <SectionHeading
            badge="Common concerns"
            title="What's really in your water?"
            subtitle="Chlorine, chloramine, fluoride, sediment — even 'safe' water carries things your family doesn't need to be consuming. Select a concern or take the quiz."
          />
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {concerns.map((c) => (
              <Link to="/quiz" key={c.slug}>
                <Card className="h-full cursor-pointer border transition-all hover:border-primary/30 hover:shadow-md">
                  <CardContent className="flex flex-col items-center gap-3 p-5 text-center">
                    <c.icon className="h-7 w-7 text-primary" />
                    <span className="text-sm font-medium">{c.label}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-16 sm:py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl rounded-2xl bg-muted/50 p-8 text-center sm:p-12">
            <DollarSign className="mx-auto mb-4 h-10 w-10 text-primary" />
            <h2 className="text-2xl font-bold">Why are water filter quotes so different?</h2>
            <p className="mt-3 text-muted-foreground">
              Prices range from $300 to $8,000+. But the real cost is doing nothing — chlorine drying your skin and hair, scale destroying your appliances, and contaminants your family doesn't need to be drinking. A good filter pays for itself.
            </p>
            <Link to="/pricing-guide">
              <Button variant="outline" className="mt-6">Read our pricing guide</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Education teaser */}
      <section className="bg-card py-16 sm:py-20">
        <div className="container">
          <SectionHeading badge="Learn" title="Make a more informed decision" subtitle="Practical guides to help you understand your options." />
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {["Do I need reverse osmosis or whole house filtration?", "Does carbon remove fluoride?", "Questions to ask before buying a water filter"].map((t) => (
              <Link to="/learn" key={t}>
                <Card className="h-full transition-all hover:shadow-md">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-semibold">{t}</h3>
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

      {/* Final CTA */}
      <section className="py-16 sm:py-20">
        <div className="container text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Every Australian home deserves filtered water</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            There's simply no upside to drinking chlorine, chloramine, and trace contaminants when you don't have to. Answer a few questions and we'll match you with the right system — it's faster and easier than you think.
          </p>
          <Link to="/quiz">
            <Button size="lg" className="mt-8 gap-2">
              Find My System <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
