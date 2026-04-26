import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertTriangle, ShieldOff, Upload } from "lucide-react";
import { differenceInCalendarDays, format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  provider: any;
}

/**
 * Warns vendors when their insurance is within 30 days of expiry (or already
 * expired). Provides a "Renew now" dialog that uploads a fresh certificate
 * and updates the expiry date in one step.
 */
export default function InsuranceExpiryBanner({ provider }: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [newExpiry, setNewExpiry] = useState<string>("");

  const expiry: string | null = provider?.insurance_expiry_date ?? null;
  if (!expiry) return null; // No expiry recorded — nothing to warn about (grandfathered)

  const days = differenceInCalendarDays(new Date(expiry), new Date());
  if (days > 30) return null; // Healthy

  const expired = days < 0;

  const renewMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Please choose your renewed Certificate of Currency");
      if (!newExpiry) throw new Error("Please pick the new expiry date");
      if (file.size > 5 * 1024 * 1024) throw new Error("File must be 5MB or smaller");
      const ext = (file.name.split(".").pop() || "pdf").toLowerCase();
      const path = `${provider.id}/certificate-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("vendor-insurance-certificates")
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { error: updErr } = await supabase
        .from("providers")
        .update({
          insurance_certificate_url: path,
          insurance_expiry_date: newExpiry,
          insurance_paused_at: null,
          available_for_quote: true,
        } as any)
        .eq("id", provider.id);
      if (updErr) throw updErr;
    },
    onSuccess: () => {
      toast.success("Insurance certificate updated — thanks!");
      setOpen(false);
      setFile(null);
      setNewExpiry("");
      queryClient.invalidateQueries({ queryKey: ["vendor-account"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to upload certificate"),
  });

  const wrapClasses = expired
    ? "border-red-300 bg-red-50 text-red-900"
    : "border-amber-300 bg-amber-50 text-amber-900";

  return (
    <>
      <div
        className={cn(
          "mb-6 -mx-4 md:mx-0 flex flex-col gap-3 rounded-none md:rounded-lg border px-4 py-3 md:flex-row md:items-center md:justify-between",
          wrapClasses,
        )}
      >
        <div className="flex items-start gap-2 text-sm">
          {expired ? (
            <ShieldOff className="h-4 w-4 mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          )}
          <div>
            <p className="font-semibold">
              {expired
                ? `Public liability insurance expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`
                : `Public liability insurance expires in ${days} day${days === 1 ? "" : "s"}`}
            </p>
            <p className="text-xs opacity-90">
              {expired
                ? "Your listing has been paused. Upload a renewed Certificate of Currency to resume receiving leads."
                : `Renew before ${format(new Date(expiry), "d MMM yyyy")} to keep receiving leads without interruption.`}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant={expired ? "destructive" : "default"}
          onClick={() => setOpen(true)}
        >
          <Upload className="h-4 w-4 mr-2" /> Renew now
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload renewed insurance certificate</DialogTitle>
            <DialogDescription>
              Upload your latest Certificate of Currency (PDF, JPG, PNG — max 5MB)
              and confirm the new expiry date.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="renewed-cert">Certificate of Currency</Label>
              <Input
                id="renewed-cert"
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>New expiry date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newExpiry && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newExpiry
                      ? format(new Date(newExpiry), "PPP")
                      : "Pick the new expiry date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newExpiry ? new Date(newExpiry) : undefined}
                    onSelect={(d) =>
                      setNewExpiry(d ? format(d, "yyyy-MM-dd") : "")
                    }
                    disabled={(d) =>
                      d < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => renewMutation.mutate()}
              disabled={!file || !newExpiry || renewMutation.isPending}
            >
              {renewMutation.isPending ? "Uploading…" : "Upload & save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
