import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Send, User, Mail, Phone, MapPin, Home, Droplets, DollarSign } from "lucide-react";
import type { QuizAnswers } from "@/lib/recommendationEngine";
import type { Provider } from "@/data/providers";
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
  "3000-6000": "$3,000 – $6,000",
  "6000-plus": "$6,000+",
  "not-sure": "Not sure yet",
};

const waterSourceLabels: Record<string, string> = {
  "mains": "Mains water",
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
  const [formData, setFormData] = useState({
    name: answers.firstName,
    email: answers.email,
    mobile: answers.mobile,
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Please fill in your name and email.");
      return;
    }
    setSending(true);
    // Simulate sending — replace with real API when backend is ready
    await new Promise((r) => setTimeout(r, 1200));
    setSending(false);
    setSubmitted(true);
    toast.success(`Quote request sent to ${provider.name}!`);
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request a quote from {provider.name}</DialogTitle>
          <DialogDescription>
            Your quiz answers are pre-filled below. Add any extra details and we'll send this to the provider.
          </DialogDescription>
        </DialogHeader>

        {/* Pre-filled summary */}
        <div className="rounded-lg border bg-muted/50 p-4 space-y-2 text-sm">
          <p className="font-medium text-foreground mb-2">Your details (from quiz)</p>
          <div className="grid grid-cols-2 gap-2">
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
            <div className="pt-1">
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
            <div className="pt-1">
              <span className="text-muted-foreground">Recommended systems: </span>
              <span className="flex flex-wrap gap-1 mt-1">
                {recommendedSystems.map((s) => (
                  <Badge key={s} className="bg-accent text-accent-foreground text-xs font-normal">
                    {s}
                  </Badge>
                ))}
              </span>
            </div>
          )}
        </div>

        {/* Editable form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="quote-name">
                <User className="mr-1 inline h-3.5 w-3.5" /> Name
              </Label>
              <Input
                id="quote-name"
                value={formData.name}
                onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quote-mobile">
                <Phone className="mr-1 inline h-3.5 w-3.5" /> Mobile
              </Label>
              <Input
                id="quote-mobile"
                value={formData.mobile}
                onChange={(e) => setFormData((d) => ({ ...d, mobile: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quote-email">
              <Mail className="mr-1 inline h-3.5 w-3.5" /> Email
            </Label>
            <Input
              id="quote-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((d) => ({ ...d, email: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quote-message">Additional notes (optional)</Label>
            <Textarea
              id="quote-message"
              placeholder="Any extra details about your water situation, access, or timing preferences…"
              value={formData.message}
              onChange={(e) => setFormData((d) => ({ ...d, message: e.target.value }))}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full gap-2" disabled={sending}>
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
