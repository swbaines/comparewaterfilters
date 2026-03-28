import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import PageMeta from "@/components/PageMeta";
import SectionHeading from "@/components/SectionHeading";
import { systemTypes } from "@/data/systemTypes";
import { CheckCircle2, XCircle, Droplets, ShieldCheck, Home, Zap, Waves, Layers } from "lucide-react";

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
          subtitle="A plain-English guide to the main categories of water filtration available for Australian homes."
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
      </div>
    </div>
  );
}
