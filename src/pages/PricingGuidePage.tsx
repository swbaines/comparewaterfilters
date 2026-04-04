import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import PageMeta from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import SectionHeading from "@/components/SectionHeading";
import { DollarSign, ArrowRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const priceTable = [
  { system: "Under sink carbon filter", installed: "$300 – $1,200", maintenance: "$80 – $200/yr" },
  { system: "Reverse osmosis", installed: "$800 – $3,000", maintenance: "$150 – $350/yr" },
  { system: "Whole house carbon filter", installed: "$3,000 – $5,000", maintenance: "$200 – $500/yr" },
  { system: "UV disinfection", installed: "$800 – $2,500", maintenance: "$100 – $250/yr" },
  { system: "Water softener", installed: "$2,000 – $6,000", maintenance: "$150 – $400/yr" },
  { system: "Whole house + drinking water combo", installed: "$4,000 – $6,500+", maintenance: "$350 – $700/yr" },
];

const factors = [
  { title: "System type and technology", desc: "A simple carbon filter costs far less than a multi-stage reverse osmosis system or a whole-house setup." },
  { title: "Installation complexity", desc: "Under-sink systems can be simple. Whole-house systems require a licensed plumber and may need plumbing modifications." },
  { title: "Number of filtration stages", desc: "More stages means more thorough filtration but also higher cost for the system and replacement filters." },
  { title: "Certifications and standards", desc: "Systems tested and certified to Australian standards (WaterMark, NSF) cost more to produce." },
  { title: "Brand and warranty", desc: "Premium brands with longer warranties, local support, and Australian-based servicing charge more." },
  { title: "Ongoing filter costs", desc: "A cheaper system with expensive replacement filters may cost more over 5 years than a mid-range system with affordable consumables." },
];

const pricingFaqs = [
  { q: "How much does a water filter cost in Australia?", a: "Water filter prices in Australia range from $300 for a basic under-sink carbon filter to $6,500+ for a whole house combo system, fully installed. Ongoing maintenance adds $80–$700 per year depending on the system type." },
  { q: "What affects the price of a water filter?", a: "Key factors include system type and technology, installation complexity, number of filtration stages, certifications (WaterMark, NSF), brand and warranty, and ongoing replacement filter costs." },
  { q: "Is a cheap water filter worth it?", a: "A budget under-sink carbon filter (under $1,000) is effective for chlorine and sediment removal and suits renters or apartments. However, it won't remove fluoride, heavy metals, or bacteria. For broader protection, a mid-range system ($1,000–$4,000) offers better filtration and longer warranties." },
  { q: "How much does it cost to maintain a water filter?", a: "Annual maintenance costs range from $80–$200 for under-sink carbon filters, $150–$350 for reverse osmosis systems, and $350–$700 for whole house combo systems. Costs cover replacement filters, UV lamps, or salt for softeners." },
];

export default function PricingGuidePage() {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: pricingFaqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);
  return (
    <div className="py-12 sm:py-16">
      <PageMeta
        title="Water Filter Pricing Guide"
        description="Understand Australian water filter costs — installation prices, annual maintenance, and what affects the total cost of ownership."
        path="/pricing-guide"
      />
      <div className="container max-w-4xl">
        <SectionHeading
          badge="Pricing guide"
          title="Understanding water filter pricing in Australia"
          subtitle="A water filter isn't a luxury — it's the simplest upgrade you can make for your family's health. Here's what to expect on cost."
        />

        {/* Why quotes vary */}
        <section className="mt-12">
          <h2 className="mb-6 text-xl font-bold">What affects water filter pricing?</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {factors.map((f) => (
              <Card key={f.title} className="border-0 bg-muted/50 shadow-none">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Price table */}
        <section className="mt-12">
          <h2 className="mb-6 text-xl font-bold">Installed price ranges by system type</h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-4 text-left font-medium">System type</th>
                      <th className="p-4 text-left font-medium">Typical installed price</th>
                      <th className="p-4 text-left font-medium">Annual maintenance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {priceTable.map((r) => (
                      <tr key={r.system}>
                        <td className="p-4 font-medium">{r.system}</td>
                        <td className="p-4 text-muted-foreground">{r.installed}</td>
                        <td className="p-4 text-muted-foreground">{r.maintenance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          <p className="mt-3 text-xs text-muted-foreground">
            Prices are indicative ranges based on typical Australian residential installations. Actual costs may vary by location, plumbing requirements, and provider.
          </p>
        </section>

        {/* Budget vs Premium */}
        <section className="mt-12">
          <h2 className="mb-6 text-xl font-bold">Budget vs mid-range vs premium</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { tier: "Budget", price: "Under $1,000", desc: "Basic under-sink carbon filter. Good for renters, apartments, or anyone wanting improved drinking water taste without a large investment. Effective for chlorine and sediment." },
              { tier: "Mid-range", price: "$1,000 – $4,000", desc: "Quality under-sink RO, or a whole-house carbon filter. Better filtration, longer warranties, and certified performance. Suits most Australian households." },
              { tier: "Premium", price: "$4,000+", desc: "Whole house combo systems, premium brands, and comprehensive coverage. Best warranties, top-tier components, and complete peace of mind." },
            ].map((t) => (
              <Card key={t.tier}>
                <CardContent className="p-5">
                  <DollarSign className="mb-2 h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{t.tier}</h3>
                  <p className="text-sm font-medium text-primary">{t.price}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-12">
          <h2 className="mb-6 text-xl font-bold">Frequently asked questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {pricingFaqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-sm font-medium">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <div className="mt-12 text-center">
          <Link to="/quiz">
            <Button size="lg" className="gap-2">
              Find out what suits your budget <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
