import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, Building2, CreditCard, User, ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import AccountCredentials from "@/components/AccountCredentials";

interface PaymentDetails {
  id?: string;
  provider_id: string;
  user_id: string;
  business_name: string;
  abn: string;
  business_address: string;
  business_suburb: string;
  business_state: string;
  business_postcode: string;
  bank_name: string;
  bsb: string;
  account_number: string;
  account_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
}

export default function VendorSettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: vendorAccount, isLoading: loadingAccount } = useQuery({
    queryKey: ["vendor-account", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_accounts")
        .select("*, providers(*)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!user,
  });

  const providerId = vendorAccount?.provider_id;

  const { data: existingDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ["vendor-payment-details", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_payment_details")
        .select("*")
        .eq("provider_id", providerId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!providerId,
  });

  const [form, setForm] = useState<Omit<PaymentDetails, "id" | "provider_id" | "user_id">>({
    business_name: "",
    abn: "",
    business_address: "",
    business_suburb: "",
    business_state: "",
    business_postcode: "",
    bank_name: "",
    bsb: "",
    account_number: "",
    account_name: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
  });

  useEffect(() => {
    if (existingDetails) {
      setForm({
        business_name: existingDetails.business_name || "",
        abn: existingDetails.abn || "",
        business_address: existingDetails.business_address || "",
        business_suburb: existingDetails.business_suburb || "",
        business_state: existingDetails.business_state || "",
        business_postcode: existingDetails.business_postcode || "",
        bank_name: existingDetails.bank_name || "",
        bsb: existingDetails.bsb || "",
        account_number: existingDetails.account_number || "",
        account_name: existingDetails.account_name || "",
        contact_name: existingDetails.contact_name || "",
        contact_email: existingDetails.contact_email || "",
        contact_phone: existingDetails.contact_phone || "",
      });
    }
  }, [existingDetails]);

  const saveDetails = useMutation({
    mutationFn: async () => {
      const payload = {
        provider_id: providerId!,
        user_id: user!.id,
        ...form,
      };

      if (existingDetails?.id) {
        const { error } = await supabase
          .from("vendor_payment_details")
          .update(payload)
          .eq("id", existingDetails.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("vendor_payment_details")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-payment-details"] });
      toast.success("Settings saved successfully");
    },
    onError: (err: any) => {
      toast.error("Failed to save: " + err.message);
    },
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (loadingAccount || loadingDetails) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!vendorAccount) {
    return (
      <div className="container max-w-3xl mx-auto py-12 px-4 text-center">
        <p className="text-muted-foreground">No vendor account found.</p>
      </div>
    );
  }

  const providerName = (vendorAccount.providers as any)?.name || "Vendor";

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{providerName} Settings</h1>
          <p className="text-muted-foreground">Manage your business and payment details</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/vendor/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveDetails.mutate();
        }}
        className="space-y-6"
      >
        {/* Business Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              Business Details
            </CardTitle>
            <CardDescription>Your registered business information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_name">Business Name</Label>
                <Input
                  id="business_name"
                  value={form.business_name}
                  onChange={(e) => updateField("business_name", e.target.value)}
                  placeholder="Sam's Water Filtration Pty Ltd"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="abn">ABN</Label>
                <Input
                  id="abn"
                  value={form.abn}
                  onChange={(e) => updateField("abn", e.target.value)}
                  placeholder="12 345 678 901"
                  maxLength={14}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="business_address">Street Address</Label>
              <Input
                id="business_address"
                value={form.business_address}
                onChange={(e) => updateField("business_address", e.target.value)}
                placeholder="123 Main Street"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_suburb">Suburb</Label>
                <Input
                  id="business_suburb"
                  value={form.business_suburb}
                  onChange={(e) => updateField("business_suburb", e.target.value)}
                  placeholder="Richmond"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_state">State</Label>
                <Input
                  id="business_state"
                  value={form.business_state}
                  onChange={(e) => updateField("business_state", e.target.value)}
                  placeholder="VIC"
                  maxLength={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_postcode">Postcode</Label>
                <Input
                  id="business_postcode"
                  value={form.business_postcode}
                  onChange={(e) => updateField("business_postcode", e.target.value)}
                  placeholder="3121"
                  maxLength={4}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Primary Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Primary Contact
            </CardTitle>
            <CardDescription>Main point of contact for account queries</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Contact Name</Label>
                <Input
                  id="contact_name"
                  value={form.contact_name}
                  onChange={(e) => updateField("contact_name", e.target.value)}
                  placeholder="Sam Baines"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Phone</Label>
                <Input
                  id="contact_phone"
                  value={form.contact_phone}
                  onChange={(e) => updateField("contact_phone", e.target.value)}
                  placeholder="0412 345 678"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_email">Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={form.contact_email}
                onChange={(e) => updateField("contact_email", e.target.value)}
                placeholder="sam@example.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bank / Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5" />
              Bank &amp; Payment Details
            </CardTitle>
            <CardDescription>Used for direct debit billing of lead fees</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bank_name">Bank Name</Label>
              <Input
                id="bank_name"
                value={form.bank_name}
                onChange={(e) => updateField("bank_name", e.target.value)}
                placeholder="Commonwealth Bank"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bsb">BSB</Label>
                <Input
                  id="bsb"
                  value={form.bsb}
                  onChange={(e) => updateField("bsb", e.target.value)}
                  placeholder="063-123"
                  maxLength={7}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  value={form.account_number}
                  onChange={(e) => updateField("account_number", e.target.value)}
                  placeholder="1234 5678"
                  maxLength={10}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_name">Account Name</Label>
              <Input
                id="account_name"
                value={form.account_name}
                onChange={(e) => updateField("account_name", e.target.value)}
                placeholder="Sam's Water Filtration Pty Ltd"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saveDetails.isPending} size="lg">
            {saveDetails.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Settings
          </Button>
        </div>
      </form>

      {/* Account Credentials (login email & password) */}
      <Separator />
      <div className="space-y-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Login &amp; Security
        </h2>
        <p className="text-sm text-muted-foreground">
          Update the email and password you use to sign in to your vendor account.
        </p>
      </div>
      <AccountCredentials />
    </div>
  );
}
