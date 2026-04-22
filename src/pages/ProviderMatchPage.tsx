import { useState } from "react";
import PageMeta from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SectionHeading from "@/components/SectionHeading";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function ProviderMatchPage() {
  const [form, setForm] = useState({
    contactMethod: "email",
    timeframe: "",
    haveQuotes: "",
    suburb: "",
    notes: "",
    name: "",
    email: "",
    phone: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error("Please fill in your name and email.");
      return;
    }
    setSubmitted(true);
    toast.success("Request submitted! We'll be in touch with matched providers.");
  };

  if (submitted) {
    return (
      <div className="py-20 text-center">
        <div className="container max-w-md">
          <h1 className="text-2xl font-bold">Request received!</h1>
          <p className="mt-3 text-muted-foreground">We'll review your details and connect you with suitable providers in your area.</p>
          <Link to="/">
            <Button className="mt-6 gap-2">Back to home <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 sm:py-16">
      <PageMeta
        title="Get Matched With Whole House Water Filter Providers"
        description="Request free quotes from vetted whole house water filter providers in your area. Independent, no-obligation matching across Australia."
        path="/provider-match"
      />
      <div className="container max-w-2xl">
        <SectionHeading badge="Provider match" title="Request matched providers" subtitle="Tell us a bit more so we can connect you with the right providers in your area." />

        <Card className="mt-10">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Name *</label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Email *</label>
                  <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Phone</label>
                  <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Installation suburb</label>
                  <Input value={form.suburb} onChange={(e) => setForm((f) => ({ ...f, suburb: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Preferred contact method</label>
                <div className="flex gap-2">
                  {["email", "phone", "either"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, contactMethod: m }))}
                      className={`rounded-lg border-2 px-4 py-2 text-sm font-medium capitalize transition-all ${form.contactMethod === m ? "border-primary bg-accent" : "border-border"}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Timeframe</label>
                <div className="flex flex-wrap gap-2">
                  {["ASAP", "1–2 weeks", "1 month", "Just researching"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, timeframe: t }))}
                      className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${form.timeframe === t ? "border-primary bg-accent" : "border-border"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Already have quotes?</label>
                <div className="flex gap-2">
                  {["Yes", "No"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, haveQuotes: v }))}
                      className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${form.haveQuotes === v ? "border-primary bg-accent" : "border-border"}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Notes</label>
                <Textarea placeholder="Any additional details..." value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
              <Button type="submit" className="w-full">Submit request</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
