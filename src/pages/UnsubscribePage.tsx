import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import PageMeta from "@/components/PageMeta";

type Status = "loading" | "valid" | "already_unsubscribed" | "invalid" | "success" | "error";

export default function UnsubscribePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    const validate = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(
          `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: anonKey } }
        );
        const data = await res.json();
        if (res.ok && data.valid) {
          setStatus("valid");
        } else if (data.reason === "already_unsubscribed") {
          setStatus("already_unsubscribed");
        } else {
          setStatus("invalid");
        }
      } catch {
        setStatus("invalid");
      }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) {
        setStatus("success");
      } else if (data?.reason === "already_unsubscribed") {
        setStatus("already_unsubscribed");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center py-12 px-4">
      <PageMeta title="Unsubscribe" description="Manage your email preferences." path="/unsubscribe" />
      <Card className="w-full max-w-md shadow-sm">
        <CardContent className="p-8 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Validating your request…</p>
            </>
          )}

          {status === "valid" && (
            <>
              <h1 className="text-xl font-bold mb-2">Unsubscribe from emails</h1>
              <p className="text-muted-foreground mb-6">
                Click the button below to stop receiving app emails from Compare Water Filters.
              </p>
              <Button onClick={handleUnsubscribe} disabled={processing} className="gap-2">
                {processing ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</> : "Confirm Unsubscribe"}
              </Button>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="mx-auto h-12 w-12 text-primary mb-4" />
              <h1 className="text-xl font-bold mb-2">You've been unsubscribed</h1>
              <p className="text-muted-foreground">
                You won't receive any more app emails from us. You can always visit our site if you change your mind.
              </p>
            </>
          )}

          {status === "already_unsubscribed" && (
            <>
              <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h1 className="text-xl font-bold mb-2">Already unsubscribed</h1>
              <p className="text-muted-foreground">
                You've already unsubscribed from our emails. No further action needed.
              </p>
            </>
          )}

          {(status === "invalid" || status === "error") && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
              <h1 className="text-xl font-bold mb-2">
                {status === "invalid" ? "Invalid link" : "Something went wrong"}
              </h1>
              <p className="text-muted-foreground">
                {status === "invalid"
                  ? "This unsubscribe link is invalid or has expired."
                  : "We couldn't process your request. Please try again later."}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
