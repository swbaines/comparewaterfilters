import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import SectionHeading from "@/components/SectionHeading";
import PageMeta from "@/components/PageMeta";
import Breadcrumbs from "@/components/Breadcrumbs";
import { ArrowRight, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all fields.");
      return;
    }
    setSending(true);
    try {
      const id = crypto.randomUUID();
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-inquiry",
          recipientEmail: "hello@comparewaterfilters.com.au",
          idempotencyKey: `contact-inquiry-${id}`,
          templateData: {
            name: form.name,
            email: form.email,
            message: form.message,
          },
        },
      });
      setSubmitted(true);
      toast.success("Message sent! We'll be in touch.");
    } catch (err) {
      console.error("Failed to send contact email:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="py-12 sm:py-16">
      <PageMeta
        title="Contact Us"
        description="Have a question about water filters? Get in touch with the Compare Water Filters team — we're here to help."
        path="/contact"
      />
      <div className="container max-w-2xl">
        <Breadcrumbs items={[{ label: "Contact" }]} />
        <SectionHeading badge="Contact" title="Get in touch" subtitle="Have a question or need help? We're here for you." />

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <Card className="border-0 bg-muted/50 shadow-none">
            <CardContent className="flex items-start gap-3 p-5">
              <Mail className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">hello@comparewaterfilters.com.au</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-muted/50 shadow-none">
            <CardContent className="flex items-start gap-3 p-5">
              <MessageSquare className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Quick help</p>
                <Link to="/quiz" className="text-sm text-primary hover:underline">Start the quiz →</Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {submitted ? (
          <Card className="mt-8">
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-bold">Thanks for reaching out!</h3>
              <p className="mt-2 text-sm text-muted-foreground">We've received your message and will get back to you soon.</p>
              <Link to="/quiz">
                <Button className="mt-6 gap-2">
                  Find My System <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="mt-8">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Name</label>
                  <Input placeholder="Your name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Email</label>
                  <Input type="email" placeholder="you@email.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Message</label>
                  <Textarea placeholder="How can we help?" rows={5} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
                </div>
                <Button type="submit" className="w-full" disabled={sending}>
                  {sending ? "Sending..." : "Send message"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="mt-10">
          <h3 className="mb-4 font-semibold">Frequently asked</h3>
          <div className="space-y-3">
            {[
              { q: "Is this service free?", a: "Yes. The quiz and recommendations are completely free. There's no obligation to purchase anything." },
              { q: "How are recommendations made?", a: "Based on your household profile, water concerns, coverage needs, and budget. We recommend system categories, not specific brands." },
              { q: "Can I get connected to a provider?", a: "Yes. After seeing your results, you can request matched providers in your area." },
            ].map((faq) => (
              <Card key={faq.q} className="border-0 bg-muted/50 shadow-none">
                <CardContent className="p-4">
                  <p className="text-sm font-medium">{faq.q}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
