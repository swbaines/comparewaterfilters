import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import SectionHeading from "@/components/SectionHeading";
import { DollarSign, ArrowRight } from "lucide-react";

const priceTable = [
  { system: "Under sink carbon filter", installed: "$300 – $1,200", maintenance: "$80 – $200/yr" },
  { system: "Reverse osmosis", installed: "$800 – $3,000", maintenance: "$150 – $350/yr" },
  { system: "Whole house carbon filter", installed: "$1,500 – $5,000", maintenance: "$200 – $500/yr" },
  { system: "UV disinfection", installed: "$800 – $2,500", maintenance: "$100 – $250/yr" },
  { system: "Water softener", installed: "$2,000 – $6,000", maintenance: "$150 – $400/yr" },
  { system: "Whole house + drinking water combo", installed: "$3,000 – $8,000+", maintenance: "$350 – $700/yr" },
];

const factors = [
  { title: "System type and technology", desc: "A simple carbon filter costs far less than a multi-stage reverse osmosis system or a whole-house setup." },
  { title: "Installation complexity", desc: "Under-sink systems can be simple. Whole-house systems require a licensed plumber and may need plumbing modifications." },
  { title: "Number of filtration stages", desc: "More stages means more thorough filtration but also higher cost for the system and replacement filters." },
  { title: "Certifications and standards", desc: "Systems tested and certified to Australian standards (WaterMark, NSF) cost more to produce." },
  { title: "Brand and warranty", desc: "Premium brands with longer warranties, local support, and Australian-based servicing charge more." },
  { title: "Ongoing filter costs", desc: "A cheaper system with expensive replacement filters may cost more over 5 years than a mid-range system with affordable consumables." },
];

export default function PricingGuidePage() {
  return (
    <div className="py-12 sm:py-16">
      <div className="container max-w-4xl">
        <SectionHeading
          badge="Pricing guide"
          title="Understanding water filter pricing in Australia"
          subtitle="Why quotes vary so much, and how to compare costs fairly."
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
