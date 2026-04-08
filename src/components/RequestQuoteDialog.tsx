import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Send, User, Mail, Phone, MapPin, Home, Droplets, DollarSign } from "lucide-react";
import type { QuizAnswers } from "@/lib/recommendationEngine";
import type { Provider } from "@/data/providers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RequestQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: Provider;
  answers: QuizAnswers;
  recommendedSystems: string[];
}

const budgetLabels: Record<string, string> = {
  "under-1000": "Under $1,000",
  "1000-3000": "$1,000 – $3,000",
  "3000-5000": "$3,000 – $5,000",
  "5000-plus": "$5,000+",
  "not-sure": "Not sure yet",
};

const waterSourceLabels: Record<string, string> = {
  "town-water": "Town water (mains)",
  "rainwater": "Rainwater / tank",
  "tank-water": "Tank water",
  "bore-water": "Bore water",
  "mixed": "Mixed sources",
};

export default function RequestQuoteDialog({
  open,
  onOpenChange,
  provider,
  answers,
  recommendedSystems,
}: RequestQuoteDialogProps) {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [vendorAck, setVendorAck] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const quoteId = crypto.randomUUID();
      const { error } = await supabase.from("quote_requests").insert({
        id: quoteId,
        provider_id: provider.id,
        provider_name: provider.name,
        customer_name: answers.firstName,
        customer_email: answers.email,
        customer_mobile: answers.mobile || null,
        customer_suburb: answers.suburb,
        customer_state: answers.state,
        customer_postcode: answers.postcode,
        property_type: answers.propertyType,
        household_size: answers.householdSize,
        water_source: answers.waterSource,
        concerns: answers.concerns,
        budget: answers.budget,
        recommended_systems: [...new Set(recommendedSystems)],
        message: message || null,
        ownership_status: answers.ownershipStatus || null,
        lead_price: answers.ownershipStatus === "Rent" ? 50 : 85,
      });
      if (error) throw error;

      // Send vendor lead notification email
      const vendorTemplateData = {
        providerName: provider.name,
        customerName: answers.firstName,
        customerEmail: answers.email,
        customerMobile: answers.mobile || '',
        customerSuburb: answers.suburb,
        customerState: answers.state,
        customerPostcode: answers.postcode,
        propertyType: answers.propertyType,
        householdSize: answers.householdSize,
        waterSource: answers.waterSource,
        budget: answers.budget,
        concerns: answers.concerns,
        recommendedSystems,
        message: message || '',
        createdAt: new Date().toISOString(),
      };

      // Look up vendor contact email from provider record
      const { data: providerData } = await supabase
        .from("providers")
        .select("contact_email")
        .eq("id", provider.id)
        .maybeSingle();

      const vendorEmail = providerData?.contact_email;

      // Send vendor notification if contact email is set
      if (vendorEmail) {
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "vendor-lead-notification",
            recipientEmail: vendorEmail,
            idempotencyKey: `vendor-lead-${quoteId}`,
            templateData: vendorTemplateData,
          },
        }).catch((err) => console.error("Failed to send vendor notification:", err));
      } else {
        console.warn(`No contact_email set for provider ${provider.name} — vendor notification skipped.`);
      }

      // Send customer confirmation email
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "customer-quote-confirmation",
          recipientEmail: answers.email,
          idempotencyKey: `customer-confirm-${quoteId}`,
          templateData: {
            customerName: answers.firstName,
            providerName: provider.name,
            customerEmail: answers.email,
            customerMobile: answers.mobile || '',
            recommendedSystems,
          },
        },
      }).catch((err) => console.error("Failed to send customer confirmation:", err));

      setSubmitted(true);
      // Meta Pixel: track quote request as Lead event
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Lead', {
          content_name: provider.name,
          content_category: recommendedSystems.join(', '),
        });
      }
      toast.success(`Quote request sent to ${provider.name}!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send quote request");
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after close animation
    setTimeout(() => setSubmitted(false), 300);
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <DialogTitle className="text-xl">Quote request sent!</DialogTitle>
            <DialogDescription className="mt-2">
              {provider.name} will get back to you within their typical response time of{" "}
              <span className="font-medium text-foreground">{provider.responseTime.toLowerCase()}</span>.
            </DialogDescription>
            <Button className="mt-6" onClick={handleClose}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" ref={(node) => { if (node) node.scrollTop = 0; }}>
        <DialogHeader>
          <DialogTitle>Request a quote from {provider.name}</DialogTitle>
          <DialogDescription>
            We'll send your details to the provider so they can prepare a personalised quote.
          </DialogDescription>
        </DialogHeader>

        {/* Read-only customer details */}
        <div className="rounded-lg border bg-muted/50 p-4 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <p className="font-medium text-foreground">Your details</p>
            <a href="/quiz" className="text-xs text-primary hover:underline">
              Not you?
            </a>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="text-foreground font-medium">{answers.firstName}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0 text-primary" />
              {answers.email}
            </div>
            {answers.mobile && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
                {answers.mobile}
              </div>
            )}
          </div>

          <div className="border-t pt-2 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
              {answers.suburb}, {answers.state} {answers.postcode}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Home className="h-3.5 w-3.5 shrink-0 text-primary" />
              {answers.propertyType} · {answers.householdSize} people
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Droplets className="h-3.5 w-3.5 shrink-0 text-primary" />
              {waterSourceLabels[answers.waterSource] || answers.waterSource}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5 shrink-0 text-primary" />
              {budgetLabels[answers.budget] || answers.budget}
            </div>
          </div>
          {answers.concerns.length > 0 && (
            <div className="border-t pt-2">
              <span className="text-muted-foreground">Concerns: </span>
              <span className="flex flex-wrap gap-1 mt-1">
                {answers.concerns.map((c) => (
                  <Badge key={c} variant="secondary" className="text-xs font-normal">
                    {c.replace(/-/g, " ")}
                  </Badge>
                ))}
              </span>
            </div>
          )}
          {recommendedSystems.length > 0 && (
            <div className="border-t pt-2">
              <span className="text-muted-foreground">Recommended systems: </span>
              <span className="flex flex-wrap gap-1 mt-1">
                {[...new Set(recommendedSystems)].map((s) => (
                  <Badge key={s} className="bg-accent text-accent-foreground text-xs font-normal">
                    {s}
                  </Badge>
                ))}
              </span>
            </div>
          )}
        </div>

        {/* Editable form — message only */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="quote-message">Additional notes (optional)</Label>
            <Textarea
              id="quote-message"
              placeholder="Any extra details about your water situation, access, or timing preferences…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="vendor-ack"
              checked={vendorAck}
              onCheckedChange={(checked) => setVendorAck(!!checked)}
            />
            <label htmlFor="vendor-ack" className="text-xs text-muted-foreground leading-relaxed">
              I understand that Compare Water Filters is a comparison platform only. Vendors I am connected with are independent businesses. Compare Water Filters does not guarantee vendor workmanship, pricing, or availability.
            </label>
          </div>

          <Button type="submit" className="w-full gap-2" disabled={sending || !vendorAck}>
            {sending ? (
              <>Sending…</>
            ) : (
              <>
                <Send className="h-4 w-4" /> Send quote request
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Your details will be shared with {provider.name} to provide a personalised quote.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}