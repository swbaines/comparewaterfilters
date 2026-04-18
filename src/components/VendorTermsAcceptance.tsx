import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getEffectiveLeadPrices } from "@/lib/leadPricing";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VendorTermsAcceptanceProps {
  providerId: string;
  onAccepted: () => void;
}

export default function VendorTermsAcceptance({ providerId, onAccepted }: VendorTermsAcceptanceProps) {
  const [agreeLeadPricing, setAgreeLeadPricing] = useState(false);
  const [agreeLicensedPlumber, setAgreeLicensedPlumber] = useState(false);
  const [agreeRemovalTerms, setAgreeRemovalTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState<{ owner_lead: number; rental_lead: number } | null>(null);

  useEffect(() => {
    getEffectiveLeadPrices().then(setPrices).catch(() => setPrices({ owner_lead: 85, rental_lead: 50 }));
  }, []);

  const allAccepted = agreeLeadPricing && agreeLicensedPlumber && agreeRemovalTerms;

  const handleAccept = async () => {
    if (!allAccepted) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("providers")
        .update({ terms_accepted_at: new Date().toISOString() } as any)
        .eq("id", providerId);
      if (error) throw error;
      toast.success("Terms accepted — your listing is now active!");
      onAccepted();
    } catch (err: any) {
      toast.error(err.message || "Failed to accept terms");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Terms & Agreements</CardTitle>
          <CardDescription className="text-base mt-2">
            Before your listing goes live, please review and accept the following terms.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          {/* Lead Pricing */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <h3 className="font-semibold mb-2">Lead Pricing</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Leads are priced based on the customer's property ownership status:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 mb-4 ml-4 list-disc">
              <li><strong>Homeowner leads:</strong> ${prices?.owner_lead ?? "—"} per qualified lead</li>
              <li><strong>Rental property leads:</strong> ${prices?.rental_lead ?? "—"} per qualified lead</li>
            </ul>
            <p className="text-sm text-muted-foreground mb-4">
              You will be invoiced monthly for all qualified leads sent to your business during the billing period.
            </p>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={agreeLeadPricing}
                onCheckedChange={(checked) => setAgreeLeadPricing(checked === true)}
                className="mt-0.5"
              />
              <span className="text-sm">
                I agree to the lead pricing terms and understand that I will be charged per qualified lead sent to my business. *
              </span>
            </label>
          </div>

          {/* Licensed Plumber Declaration */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <h3 className="font-semibold mb-2">Licensed Plumber Declaration</h3>
            <p className="text-sm text-muted-foreground mb-4">
              All water filtration installations must comply with Australian plumbing standards and be carried out by appropriately licensed professionals.
            </p>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={agreeLicensedPlumber}
                onCheckedChange={(checked) => setAgreeLicensedPlumber(checked === true)}
                className="mt-0.5"
              />
              <span className="text-sm">
                I confirm that all plumbing work will be carried out by or under the supervision of a licensed plumber, and I accept responsibility for ensuring compliance with all applicable licensing and regulatory requirements. *
              </span>
            </label>
          </div>

          {/* Listing Removal Terms */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <h3 className="font-semibold mb-2">Platform Standards</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Compare Water Filters maintains high standards for all listed providers to ensure a quality experience for homeowners.
            </p>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={agreeRemovalTerms}
                onCheckedChange={(checked) => setAgreeRemovalTerms(checked === true)}
                className="mt-0.5"
              />
              <span className="text-sm">
                I acknowledge that Compare Water Filters reserves the right to remove my listing at any time if I fail to maintain required licences, insurance, or professional standards, or if customer complaints indicate conduct unbecoming of a licensed professional. *
              </span>
            </label>
          </div>

          <Button
            onClick={handleAccept}
            disabled={!allAccepted || loading}
            className="w-full"
            size="lg"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Accept Terms & Activate Listing
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            By accepting, you agree to these terms effective immediately. You can review the full{" "}
            <a href="/disclaimer" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">platform disclaimer</a> at any time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
