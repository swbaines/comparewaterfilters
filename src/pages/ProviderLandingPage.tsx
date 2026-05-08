import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  Target,
  DollarSign,
  ShieldCheck,
  Bell,
  MapPin,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import PageMeta from "@/components/PageMeta";

const benefits = [
  {
    icon: Target,
    title: "Pre-qualified leads",
    body: "Every lead has completed our 8-step quiz. You only see customers who already know what system they want and are ready to buy.",
  },
  {
    icon: DollarSign,
    title: "Pay per lead, not per click",
    body: "$85 for owner-occupier leads, $50 for rentals. No subscriptions, no monthly minimums, no wasted ad spend.",
  },
  {
    icon: MapPin,
    title: "Your service area only",
    body: "Set the suburbs and postcodes you cover. We never send you a lead outside your zone.",
  },
  {
    icon: Bell,
    title: "Instant notifications",
    body: "New leads ping you by email the moment a customer is matched. Be the first to call and you'll win the job.",
  },
  {
    icon: ShieldCheck,
    title: "Trusted, verified network",
    body: "We verify every provider's ABN and credentials. Customers trust the platform — and that trust transfers to you.",
  },
  {
    icon: Sparkles,
    title: "No lock-in contracts",
    body: "Pause, change your service area, or leave anytime. We earn your business one lead at a time.",
  },
];

const steps = [
  {
    n: "1",
    title: "Register your business",
    body: "Takes about 5 minutes. Add your ABN, service areas, and the system types you install.",
  },
  {
    n: "2",
    title: "Get matched to customers",
    body: "Our recommendation engine matches your profile to homeowners and renters actively shopping in your area.",
  },
  {
    n: "3",
    title: "Quote, win, and grow",
    body: "Contact the customer directly. You're only billed for leads you accept — never for browsers or tyre-kickers.",
  },
];

export default function ProviderLandingPage() {
  return (
    <>
      <PageMeta
        title="Grow Your Water Filter Business — Become a Trusted Provider"
        description="Get pre-qualified water filter leads in your service area. Pay per lead, no subscriptions. Join Australia's trusted provider network."
        path="/providers"
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-accent/40 via-background to-background">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              For Water Filter Providers
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
              Stop chasing leads. Start closing them.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Join Australia's only platform built specifically for water filter installers.
              Get pre-qualified customers in your service area — pay only for the leads you want.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/vendor/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Become a Provider
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/vendor/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Already registered? Sign in
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Free to join · No subscriptions · Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
              Why providers choose us
            </h2>
            <p className="mt-3 text-muted-foreground">
              Built by people who understand the trade — designed to send you customers ready to install.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <Card key={b.title} className="border-border/60">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <b.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-secondary/40 py-16 md:py-20">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
              How it works
            </h2>
            <p className="mt-3 text-muted-foreground">
              Three simple steps to start receiving leads in your inbox.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="relative rounded-xl border bg-card p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {s.n}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing transparency */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-8 md:p-12">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Simple, honest pricing
              </h2>
              <p className="mt-3 text-muted-foreground">
                No setup fees. No subscriptions. Just pay per qualified lead.
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border bg-background p-6 text-center">
                <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Owner-occupier
                </p>
                <p className="mt-2 text-4xl font-bold text-foreground">
                  $85<span className="text-base font-normal text-muted-foreground">/lead</span>
                </p>
                <p className="mt-2 text-sm text-muted-foreground">Higher intent, full install jobs</p>
              </div>
              <div className="rounded-xl border bg-background p-6 text-center">
                <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Rental
                </p>
                <p className="mt-2 text-4xl font-bold text-foreground">
                  $50<span className="text-base font-normal text-muted-foreground">/lead</span>
                </p>
                <p className="mt-2 text-sm text-muted-foreground">Tenant-friendly portable systems</p>
              </div>
            </div>
            <ul className="mt-8 space-y-3 text-sm">
              {[
                "You only pay for leads matching your service area & system types",
                "Detailed customer brief: water concerns, budget, property type",
                "Direct contact details — no middleman, no commissions on the sale",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-primary py-16 text-primary-foreground md:py-20">
        <div className="container text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            Ready to grow your water filter business?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base opacity-90 md:text-lg">
            Register in 5 minutes and start receiving qualified leads in your area.
          </p>
          <div className="mt-8">
            <Link to="/vendor/register">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Become a Provider
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm opacity-80">
            Free to join · No credit card required
          </p>
        </div>
      </section>
    </>
  );
}