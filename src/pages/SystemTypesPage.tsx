import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import PageMeta from "@/components/PageMeta";
import SectionHeading from "@/components/SectionHeading";
import { systemTypes } from "@/data/systemTypes";
import { CheckCircle2, XCircle, Droplets, ShieldCheck, Home, Zap, Waves, Layers } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const iconMap: Record<string, React.ElementType> = {
  droplets: Droplets,
  "shield-check": ShieldCheck,
  home: Home,
  zap: Zap,
  waves: Waves,
  layers: Layers,
};

export default function SystemTypesPage() {
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'ViewContent', {
        content_name: 'Water Filter System Types',
        content_type: 'product_group',
      });
    }
  }, []);

  const systemFaqs = [
    { q: "What type of water filter is best for my home?", a: "It depends on your water concerns. Under-sink carbon filters suit most households wanting better-tasting drinking water. Reverse osmosis removes fluoride and heavy metals. Whole house systems protect all taps and appliances. Take the quiz to get a personalised recommendation." },
    { q: "Do I need a whole house water filter?", a: "A whole house filter is ideal if you want filtered water at every tap — for drinking, showering, and protecting appliances from sediment and chlorine. If you only need better drinking water, an under-sink system is more affordable." },
    { q: "Does reverse osmosis remove fluoride?", a: "Yes. Reverse osmosis is one of the most effective methods for removing fluoride, along with heavy metals, bacteria, and dissolved solids. Standard carbon filters do not remove fluoride." },
    { q: "What is a UV water filter?", a: "UV (ultraviolet) water filters use UV light to kill bacteria, viruses, and parasites without chemicals. They are essential for bore water or tank water but do not remove chemical contaminants — they are often paired with carbon or sediment filters." },
    { q: "What does a water softener do?", a: "A water softener removes calcium and magnesium (hard water minerals) using ion exchange. This prevents scale buildup in pipes and appliances, improves soap lathering, and is particularly useful in areas with hard bore or ground water." },
  ];

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: systemFaqs.map((f) => ({
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
        title="Water Filter System Types"
        description="Explore different water filtration system types — under-sink, whole house, reverse osmosis, UV, and more. Learn the pros, cons, and ideal use cases."
        path="/system-types"
      />
      <div className="container max-w-4xl">
        <SectionHeading
          badge="System types"
          title="Understanding water filtration systems"
          subtitle="Australian tap water is treated to be safe — but chlorine, chloramine, and trace contaminants remain in every supply. Here's what each system removes and why it matters for your home."
        />

        <div className="mt-12 space-y-8">
          {systemTypes.map((sys) => {
            const Icon = iconMap[sys.icon] || Droplets;
            return (
              <Card key={sys.id} id={sys.slug}>
                <CardContent className="p-6 sm:p-8">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                      <Icon className="h-5 w-5 text-primary" />
                    </span>
                    <h2 className="text-xl font-bold">{sys.name}</h2>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-primary">What it does</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{sys.whatItDoes}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-destructive/80">What it does not do</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{sys.whatItDoesNot}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">Who it suits</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{sys.whoItSuits}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-lg bg-muted/50 p-4">
                        <p className="text-xs font-medium text-muted-foreground">Typical installed price</p>
                        <p className="text-lg font-bold">{sys.priceRange}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{sys.maintenance}</p>
                      </div>
                      <div>
                        <h4 className="mb-2 text-sm font-semibold">Pros</h4>
                        <ul className="space-y-1">
                          {sys.pros.map((p) => (
                            <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="mb-2 text-sm font-semibold">Trade-offs</h4>
                        <ul className="space-y-1">
                          {sys.tradeoffs.map((t) => (
                            <li key={t} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive/60" /> {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ */}
        <section className="mt-12">
          <h2 className="mb-6 text-xl font-bold">Frequently asked questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {systemFaqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-sm font-medium">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>
    </div>
  );
}
