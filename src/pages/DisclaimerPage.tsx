import PageMeta from "@/components/PageMeta";
import { Card, CardContent } from "@/components/ui/card";

export default function DisclaimerPage() {
  return (
    <div className="container max-w-3xl py-12">
      <PageMeta
        title="Disclaimer | Compare Water Filters"
        description="Platform disclaimer, limitations of liability, and important information about Compare Water Filters."
      />

      <h1 className="text-3xl font-bold sm:text-4xl">Platform Disclaimer</h1>
      <p className="mt-3 text-muted-foreground">
        Last updated: April 2025
      </p>

      <Card className="mt-8 border-0 bg-muted/50 shadow-none">
        <CardContent className="space-y-6 p-5 text-sm leading-relaxed text-muted-foreground sm:p-8">
          <p>
            Compare Water Filters is an independent comparison and referral platform. We connect Australian homeowners with licensed water filtration providers. We are not a water filtration installer, supplier, or manufacturer.
          </p>

          <div>
            <p className="mb-1 font-semibold text-foreground">Recommendations</p>
            <p>
              System recommendations provided through our quiz are generated based on information supplied by users and general water quality data. They are for general guidance only and do not constitute professional advice. Individual circumstances vary and a licensed professional assessment is always recommended before installation.
            </p>
          </div>

          <div>
            <p className="mb-1 font-semibold text-foreground">Provider listings</p>
            <p>
              Providers listed on this platform have completed our registration process, including ABN verification and licence number collection. However, Compare Water Filters does not independently verify all provider claims, does not conduct on-site assessments of provider quality, and does not guarantee the standard of any provider's workmanship or products.
            </p>
          </div>

          <div>
            <p className="mb-1 font-semibold text-foreground">Water quality data</p>
            <p>
              Information about local water quality is sourced from publicly available government reports and is provided for general informational purposes only. It may not reflect current conditions at your specific property.
            </p>
          </div>

          <div>
            <p className="mb-1 font-semibold text-foreground">No liability</p>
            <p>
              To the maximum extent permitted by Australian law, Compare Water Filters excludes all liability for any loss, damage, or expense (whether direct, indirect, or consequential) arising from your use of this platform, reliance on any recommendation, or any dealings with providers found through this platform.
            </p>
          </div>

          <div>
            <p className="mb-1 font-semibold text-foreground">Australian Consumer Law</p>
            <p>
              Nothing in these disclaimers limits your rights under the Australian Consumer Law.
            </p>
          </div>

          <div>
            <p className="mb-1 font-semibold text-foreground">Complaints</p>
            <p>
              If you have a complaint about a provider found through this platform, contact us at{" "}
              <a href="mailto:hello@comparewaterfilters.com.au" className="font-medium text-primary hover:underline">
                hello@comparewaterfilters.com.au
              </a>
              . We will endeavour to assist in resolving disputes but cannot guarantee outcomes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
