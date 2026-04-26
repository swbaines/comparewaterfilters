import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, ExternalLink, AlertTriangle, ShieldCheck } from "lucide-react";
import { differenceInCalendarDays, format } from "date-fns";

interface Props {
  provider: any;
}

/**
 * Renders the insurance details (coverage, insurer, expiry) and a clickable
 * certificate thumbnail/preview that opens full-screen in a dialog.
 * Used in the admin review/edit flow for a single provider.
 */
export default function InsuranceCertificateBlock({ provider }: Props) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const path: string | null = provider?.insurance_certificate_url ?? null;
  const expiry: string | null = provider?.insurance_expiry_date ?? null;
  const amount: number | null = provider?.public_liability_insurance_amount ?? null;
  const insurer: string | null = provider?.insurer_name ?? null;
  const isPdf = !!path && /\.pdf$/i.test(path);

  // Generate a short-lived signed URL when we have a certificate path.
  useEffect(() => {
    let cancelled = false;
    if (!path) {
      setSignedUrl(null);
      return;
    }
    setLoading(true);
    supabase.storage
      .from("vendor-insurance-certificates")
      .createSignedUrl(path, 600)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Failed to sign cert url", error);
          setSignedUrl(null);
        } else {
          setSignedUrl(data?.signedUrl ?? null);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  const daysUntilExpiry = expiry
    ? differenceInCalendarDays(new Date(expiry), new Date())
    : null;

  const expiryBadge = (() => {
    if (!expiry) return null;
    if (daysUntilExpiry === null) return null;
    if (daysUntilExpiry < 0)
      return <Badge variant="destructive" className="text-xs">Expired {Math.abs(daysUntilExpiry)}d ago</Badge>;
    if (daysUntilExpiry <= 30)
      return (
        <Badge variant="outline" className="text-xs border-amber-400 text-amber-700">
          Expires in {daysUntilExpiry}d
        </Badge>
      );
    return (
      <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700">
        Valid
      </Badge>
    );
  })();

  return (
    <div className="mt-4 rounded-md border border-border bg-muted/30 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" /> Insurance details
        </h4>
        {expiryBadge}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3">
        <div>
          <span className="text-muted-foreground">Coverage:</span>{" "}
          <span className="font-semibold">
            {amount ? `A$${Number(amount).toLocaleString()}` : "—"}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Expiry:</span>{" "}
          <span className="font-semibold">
            {expiry ? format(new Date(expiry), "d MMM yyyy") : "—"}
          </span>
        </div>
        <div className="col-span-2">
          <span className="text-muted-foreground">Insurer:</span>{" "}
          <span className="font-medium">{insurer || "—"}</span>
        </div>
      </div>

      {path ? (
        <div>
          <div className="text-xs text-muted-foreground mb-1.5">Certificate of Currency</div>
          <button
            type="button"
            className="group relative flex h-32 w-48 items-center justify-center overflow-hidden rounded-md border border-border bg-background hover:border-primary"
            onClick={() => setOpen(true)}
            disabled={loading || !signedUrl}
          >
            {isPdf || !signedUrl ? (
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <FileText className="h-8 w-8" />
                <span className="text-xs">{loading ? "Loading..." : "Click to view"}</span>
              </div>
            ) : (
              <img
                src={signedUrl}
                alt="Insurance certificate thumbnail"
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            )}
            <div className="pointer-events-none absolute inset-0 flex items-end justify-end p-1 opacity-0 group-hover:opacity-100">
              <Badge variant="secondary" className="text-[10px]">
                <ExternalLink className="h-2.5 w-2.5 mr-1" /> Open
              </Badge>
            </div>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800">
          <AlertTriangle className="h-3.5 w-3.5" />
          No Certificate of Currency on file.
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Certificate of Currency</DialogTitle>
          </DialogHeader>
          {signedUrl ? (
            isPdf ? (
              <iframe
                src={signedUrl}
                title="Insurance certificate"
                className="h-[80vh] w-full rounded border"
              />
            ) : (
              <img
                src={signedUrl}
                alt="Insurance certificate"
                className="max-h-[80vh] w-full object-contain"
              />
            )
          ) : (
            <div className="p-8 text-center text-muted-foreground">Loading…</div>
          )}
          {signedUrl && (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" asChild>
                <a href={signedUrl} target="_blank" rel="noreferrer noopener">
                  <ExternalLink className="h-4 w-4 mr-1" /> Open in new tab
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
