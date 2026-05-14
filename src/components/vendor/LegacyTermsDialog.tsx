import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LegacyTermsDialogProps {
  vendorAccountId: string;
  onAccepted: () => void;
}

/**
 * Non-blocking re-acceptance prompt for vendors who registered before the
 * four-checkbox flow. They can dismiss the dialog (we keep the legacy_terms
 * flag set), or accept all four to clear it.
 */
export default function LegacyTermsDialog({
  vendorAccountId,
  onAccepted,
}: LegacyTermsDialogProps) {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [acc, setAcc] = useState({
    pricing: null as string | null,
    terms: null as string | null,
    installation: null as string | null,
    marketing: null as string | null,
  });

  const tick = (
    key: "pricing" | "terms" | "installation" | "marketing",
    checked: boolean,
  ) =>
    setAcc((p) => ({ ...p, [key]: checked ? new Date().toISOString() : null }));

  const allChecked =
    !!acc.pricing && !!acc.terms && !!acc.installation && !!acc.marketing;

  const handleAccept = async () => {
    if (!allChecked) return;
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("accept-vendor-terms", {
        body: { vendor_account_id: vendorAccountId },
      });
      if (error) throw error;
      toast.success("Thanks — your acceptance has been recorded.");
      setOpen(false);
      onAccepted();
    } catch (err: any) {
      toast.error(err.message || "Failed to record acceptance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Updated terms — please review</DialogTitle>
          <DialogDescription>
            We've updated our vendor agreements. Please review and accept the
            four items below. You can also dismiss this and continue to your
            dashboard — we'll prompt you again next time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <label className="flex items-start gap-3 cursor-pointer rounded-lg border bg-muted/30 p-3">
            <Checkbox
              checked={!!acc.pricing}
              onCheckedChange={(c) => tick("pricing", c === true)}
              className="mt-0.5"
            />
            <span className="text-sm leading-relaxed">
              I acknowledge the lead pricing of <strong>$85 per owner-occupier lead</strong> and <strong>$25 per rental lead</strong>. I understand that invoices are issued monthly on the 1st of each month for leads received in the previous month, with payment due within 14 days. <span className="text-destructive">*</span>
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer rounded-lg border bg-muted/30 p-3">
            <Checkbox
              checked={!!acc.terms}
              onCheckedChange={(c) => tick("terms", c === true)}
              className="mt-0.5"
            />
            <span className="text-sm leading-relaxed">
              I have read, understood, and agree to the Compare Water Filters{" "}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary underline">Terms and Conditions</a>{" "}
              and{" "}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">Privacy Policy</a>. I confirm I have legal authority to bind my business to these terms. <span className="text-destructive">*</span>
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer rounded-lg border bg-muted/30 p-3">
            <Checkbox
              checked={!!acc.installation}
              onCheckedChange={(c) => tick("installation", c === true)}
              className="mt-0.5"
            />
            <span className="text-sm leading-relaxed">
              I confirm that all water filtration installations performed via this platform will be carried out by appropriately licensed plumbers in compliance with relevant state plumbing regulations. I take full legal responsibility for ensuring my installation partners hold current licences and insurance. <span className="text-destructive">*</span>
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer rounded-lg border bg-muted/30 p-3">
            <Checkbox
              checked={!!acc.marketing}
              onCheckedChange={(c) => tick("marketing", c === true)}
              className="mt-0.5"
            />
            <span className="text-sm leading-relaxed">
              I agree to receive operational emails from Compare Water Filters including lead notifications, billing notices, and platform updates. <span className="text-destructive">*</span>
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Remind me later
          </Button>
          <Button onClick={handleAccept} disabled={!allChecked || loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Accept all
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
