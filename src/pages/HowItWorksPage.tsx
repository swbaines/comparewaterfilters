import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import PageMeta from "@/components/PageMeta";
import SectionHeading from "@/components/SectionHeading";
import { ShieldCheck, BarChart3, MapPin, BookOpen } from "lucide-react";

const points = [
  { icon: BarChart3, title: "Based on your inputs", desc: "Recommendations are generated from your household profile, water source, main concerns, coverage needs, budget, and preferences." },
  { icon: ShieldCheck, title: "System categories, not brands", desc: "We recommend the right type of system first. This keeps recommendations independent and focused on what suits you." },
  { icon: MapPin, title: "Location-aware guidance", desc: "Your state and postcode help us consider regional water quality factors. Provider availability may vary by area." },
  { icon: BookOpen, title: "Educational, not prescriptive", desc: "Our recommendations are guidance to help you understand your options. They are not a substitute for professional water testing or trade advice." },
];

export default function HowItWorksPage() {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "howitworks-jsonld";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "How to find the right water filter for your home",
      description: "Three simple steps to compare water filtration systems and get matched with licensed local vendors in Australia.",
      step: [
        { "@type": "HowToStep", position: 1, name: "Tell us about your home", text: "Answer a few quick questions about your property, water source, and what's bothering you about your current water." },
        { "@type": "HowToStep", position: 2, name: "Get matched to the right system", text: "We use your answers — including your state's water quality data — to recommend the filtration system that fits your situation." },
        { "@type": "HowToStep", position: 3, name: "Compare quotes from local vendors", text: "Request free quotes from licensed installers in your area. No obligation, no pushy sales — just real information." },
      ],
    });
    document.head.appendChild(script);
    return () => { document.getElementById("howitworks-jsonld")?.remove(); };
  }, []);

  return (
    <div className="py-12 sm:py-16">
      <PageMeta
        title="How It Works"
        description="Learn how Compare Water Filters helps you find the right water filtration system — from quiz to personalised recommendations."
        path="/how-it-works"
      />
      <div className="container max-w-3xl">
        <SectionHeading
          badge="How it works"
          title="How our recommendations work"
          subtitle="We believe every Australian household deserves filtered water. There's no benefit to consuming chlorine, chloramine, or trace contaminants — and the right system makes it easy to stop."
        />

        <div className="mt-12 space-y-6">
          {points.map((p) => (
            <Card key={p.title} className="border-0 bg-muted/50 shadow-none">
              <CardContent className="flex gap-4 p-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                  <p.icon className="h-5 w-5 text-primary" />
                </span>
                <div>
                  <h3 className="font-semibold">{p.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-10">
          <CardContent className="p-6">
            <h3 className="font-semibold">Important disclaimers</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>• Pricing ranges are indicative guides only and may vary by location, provider, and installation requirements.</li>
              <li>• Provider availability may vary by area.</li>
              <li>• Recommendations are educational and not a substitute for formal water testing, plumbing assessment, or licensed trade advice.</li>
              <li>• Final system suitability depends on your specific water quality and home setup.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
