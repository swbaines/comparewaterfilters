import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Building2, MapPin, Wrench, Shield, ChevronsUpDown, Upload, FileCheck, ImagePlus } from "lucide-react";

const AU_STATES = [
  { value: "NSW", label: "NSW" },
  { value: "VIC", label: "VIC" },
  { value: "QLD", label: "QLD" },
  { value: "WA", label: "WA" },
  { value: "SA", label: "SA" },
  { value: "TAS", label: "TAS" },
  { value: "ACT", label: "ACT" },
  { value: "NT", label: "NT" },
];

const SYSTEM_TYPES = [
  { value: "under-sink-carbon", label: "Under-sink Carbon Filter" },
  { value: "reverse-osmosis", label: "Reverse Osmosis" },
  { value: "whole-house-filtration", label: "Whole Home Filtration" },
  { value: "uv-system", label: "UV System" },
  { value: "water-softener", label: "Water Softener" },
  { value: "single-tap-filter", label: "Single Tap Filter" },
];

const CERTIFICATIONS = [
  { value: "watermark-certified", label: "WaterMark Certified" },
  { value: "nsf-ansi", label: "NSF/ANSI" },
];

type Step = "signup" | "profile" | "success";

export default function VendorRegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("signup");
  const [loading, setLoading] = useState(false);

  // Signup fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Profile fields
  const [profile, setProfile] = useState({
    name: "",
    description: "",
    states: [] as string[],
    postcodeRanges: "",
    systemTypes: [] as string[],
    brands: "",
    priceRange: "mid" as "budget" | "mid" | "premium",
    yearsInBusiness: 0,
    certifications: [] as string[],
    highlights: "",
    responseTime: "Within 48 hours",
    warranty: "",
    website: "",
    phone: "",
    abn: "",
    plumberLicenceNumber: "",
    hasPublicLiability: false,
    insurerName: "",
    googleBusinessUrl: "",
  });

  const [certFiles, setCertFiles] = useState<Record<string, File | null>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [agreeLeadPricing, setAgreeLeadPricing] = useState(false);
  const [agreeLicensedPlumber, setAgreeLicensedPlumber] = useState(false);
  const [agreeRemovalTerms, setAgreeRemovalTerms] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      toast.error("Password must include at least one uppercase letter");
      return;
    }
    if (!/[a-z]/.test(password)) {
      toast.error("Password must include at least one lowercase letter");
      return;
    }
    if (!/[0-9]/.test(password)) {
      toast.error("Password must include at least one number");
      return;
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      toast.error("Password must include at least one special character (e.g. !@#$%)");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }
    // Auto sign-in so the user has an active session for the profile step
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signInError) {
      toast.error("Account created but could not sign in automatically. Please log in at the vendor login page.");
      return;
    }
    toast.success("Account created! Now set up your provider profile.");
    setStep("profile");
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.name.trim()) {
      toast.error("Business name is required");
      return;
    }
    // Validate ABN (11 digits)
    const abnClean = profile.abn.replace(/\s/g, "");
    if (!/^\d{11}$/.test(abnClean)) {
      toast.error("ABN must be exactly 11 digits");
      return;
    }
    // Plumber licence number is optional
    if (!agreeLeadPricing) {
      toast.error("You must agree to the lead pricing terms");
      return;
    }
    if (!agreeLicensedPlumber) {
      toast.error("You must confirm you are a licensed plumber or authorised representative");
      return;
    }
    if (!agreeRemovalTerms) {
      toast.error("You must acknowledge the listing removal terms");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const slug = profile.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const toArray = (s: string) => s.split(",").map(v => v.trim()).filter(Boolean);

      // Upload logo
      let logoUrl: string | null = null;
      if (logoFile) {
        const logoPath = `${user.id}/${Date.now()}-${logoFile.name}`;
        const { error: logoError } = await supabase.storage
          .from("vendor-logos")
          .upload(logoPath, logoFile);
        if (logoError) throw logoError;
        const { data: publicUrl } = supabase.storage
          .from("vendor-logos")
          .getPublicUrl(logoPath);
        logoUrl = publicUrl.publicUrl;
      }

      // Upload certification files
      const certFilePaths: Record<string, string> = {};
      for (const [certValue, file] of Object.entries(certFiles)) {
        if (file) {
          const filePath = `${user.id}/${certValue}-${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from("certification-files")
            .upload(filePath, file);
          if (uploadError) throw uploadError;
          certFilePaths[certValue] = filePath;
        }
      }

      const { data: provider, error: providerError } = await supabase
        .from("providers")
        .insert({
          name: profile.name,
          slug,
          description: profile.description,
          states: profile.states,
          postcode_ranges: toArray(profile.postcodeRanges),
          system_types: profile.systemTypes,
          brands: toArray(profile.brands),
          price_range: profile.priceRange,
          years_in_business: profile.yearsInBusiness,
          certifications: profile.certifications,
          highlights: toArray(profile.highlights),
          response_time: profile.responseTime,
          warranty: profile.warranty,
          website: profile.website || null,
          phone: profile.phone || null,
          available_for_quote: false,
          approval_status: "pending" as any,
          submitted_by: user.id,
          certification_files: certFilePaths,
          logo: logoUrl,
          abn: abnClean,
          plumber_licence_number: profile.plumberLicenceNumber.trim(),
          has_public_liability: profile.hasPublicLiability,
          insurer_name: profile.hasPublicLiability ? profile.insurerName.trim() : "",
          google_business_url: profile.googleBusinessUrl.trim() || "",
        } as any)
        .select("id")
        .single();

      if (providerError) throw providerError;

      // Create vendor account link
      const { error: vaError } = await supabase
        .from("vendor_accounts")
        .insert({ user_id: user.id, provider_id: provider.id });

      if (vaError) throw vaError;

      // Send vendor welcome email and admin notification in parallel
      await Promise.all([
        supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'vendor-welcome',
            recipientEmail: email,
            idempotencyKey: `vendor-welcome-${provider.id}`,
            templateData: { businessName: profile.name },
          },
        }),
        supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'admin-vendor-notification',
            recipientEmail: 'hello@comparewaterfilters.com.au',
            idempotencyKey: `admin-vendor-notify-${provider.id}`,
            templateData: {
              businessName: profile.name,
              vendorEmail: email,
              abn: profile.abn.replace(/\s/g, ""),
              states: profile.states,
              systemTypes: profile.systemTypes,
              hasPublicLiability: profile.hasPublicLiability,
              registeredAt: new Date().toISOString(),
            },
          },
        }),
      ]);

      setStep("success");
      toast.success("Application submitted for review!");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit profile");
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = <K extends keyof typeof profile>(key: K, value: (typeof profile)[K]) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLogoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
    }
  };

  if (step === "success") {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Application Submitted!</h2>
            <p className="text-muted-foreground">
              Your provider profile has been submitted for review. We'll notify you once your account is approved and you'll be able to start receiving leads.
            </p>
            <Button onClick={() => navigate("/vendor/login")} className="mt-4">
              Go to Vendor Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "profile") {
    return (
      <div className="min-h-[calc(100vh-8rem)] py-8 px-4">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">Set Up Your Provider Profile</h1>
            <p className="text-muted-foreground">Tell us about your business so we can match you with the right customers</p>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            {/* Business Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" /> Business Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Business Name *</Label>
                  <Input value={profile.name} onChange={e => updateProfile("name", e.target.value)} required placeholder="e.g. Sam's Water Filtration" />
                </div>
                <div className="space-y-1.5">
                  <Label>ABN *</Label>
                  <Input
                    value={profile.abn}
                    onChange={e => updateProfile("abn", e.target.value)}
                    required
                    placeholder="12 345 678 901"
                    maxLength={14}
                  />
                  <p className="text-xs text-muted-foreground">Australian Business Number — 11 digits</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Plumber Licence Number (optional)</Label>
                  <Input
                    value={profile.plumberLicenceNumber}
                    onChange={e => updateProfile("plumberLicenceNumber", e.target.value)}
                    placeholder="e.g. 12345C"
                  />
                  <p className="text-xs text-muted-foreground">Required only if your business performs installations directly</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea value={profile.description} onChange={e => updateProfile("description", e.target.value)} rows={3} placeholder="Tell customers about your business, experience, and what sets you apart…" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Years in Business</Label>
                    <Input type="number" min={0} value={profile.yearsInBusiness} onChange={e => updateProfile("yearsInBusiness", parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Price Range</Label>
                    <Select value={profile.priceRange} onValueChange={v => updateProfile("priceRange", v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="budget">Budget</SelectItem>
                        <SelectItem value="mid">Mid-range</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Website</Label>
                    <Input value={profile.website} onChange={e => updateProfile("website", e.target.value)} placeholder="https://..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input value={profile.phone} onChange={e => updateProfile("phone", e.target.value)} placeholder="04XX XXX XXX" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Google Business Profile URL (optional)</Label>
                  <Input
                    value={profile.googleBusinessUrl}
                    onChange={e => updateProfile("googleBusinessUrl", e.target.value)}
                    placeholder="https://g.page/your-business"
                  />
                </div>

                {/* Public Liability Insurance */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Public Liability Insurance</Label>
                    <Switch
                      checked={profile.hasPublicLiability}
                      onCheckedChange={v => updateProfile("hasPublicLiability", v)}
                    />
                  </div>
                  {profile.hasPublicLiability && (
                    <div className="space-y-1.5">
                      <Label>Insurer Name</Label>
                      <Input
                        value={profile.insurerName}
                        onChange={e => updateProfile("insurerName", e.target.value)}
                        placeholder="e.g. QBE, Allianz"
                      />
                    </div>
                  )}
                </div>

                {/* Logo Upload */}
                <div className="space-y-1.5">
                  <Label>Business Logo (optional)</Label>
                  <div className="flex items-center gap-4">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="h-16 w-16 rounded-md object-contain border border-border" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed border-border bg-muted">
                        <ImagePlus className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.webp,.svg"
                        onChange={handleLogoChange}
                      />
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors">
                        <Upload className="h-4 w-4" />
                        {logoFile ? "Replace" : "Upload Logo"}
                      </span>
                    </label>
                    {logoFile && <span className="text-xs text-muted-foreground truncate max-w-[150px]">{logoFile.name}</span>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Area */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" /> Service Area
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>States Serviced *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between font-normal">
                        {profile.states.length > 0 ? profile.states.join(", ") : "Select states…"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-2">
                      {AU_STATES.map((state) => (
                        <label key={state.value} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer text-sm">
                          <Checkbox
                            checked={profile.states.includes(state.value)}
                            onCheckedChange={(checked) => {
                              updateProfile(
                                "states",
                                checked
                                  ? [...profile.states, state.value]
                                  : profile.states.filter((s) => s !== state.value)
                              );
                            }}
                          />
                          {state.label}
                        </label>
                      ))}
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1.5">
                  <Label>Postcode Ranges (optional)</Label>
                  <Input value={profile.postcodeRanges} onChange={e => updateProfile("postcodeRanges", e.target.value)} placeholder="2000-2999, 3000-3999" />
                </div>
              </CardContent>
            </Card>

            {/* Systems & Expertise */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" /> Systems & Expertise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>System Types *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between font-normal">
                        {profile.systemTypes.length > 0
                          ? SYSTEM_TYPES.filter(st => profile.systemTypes.includes(st.value)).map(st => st.label).join(", ")
                          : "Select system types…"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-2">
                      {SYSTEM_TYPES.map((st) => (
                        <label key={st.value} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer text-sm">
                          <Checkbox
                            checked={profile.systemTypes.includes(st.value)}
                            onCheckedChange={(checked) => {
                              updateProfile(
                                "systemTypes",
                                checked
                                  ? [...profile.systemTypes, st.value]
                                  : profile.systemTypes.filter((s) => s !== st.value)
                              );
                            }}
                          />
                          {st.label}
                        </label>
                      ))}
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1.5">
                  <Label>Certifications</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between font-normal">
                        {profile.certifications.length > 0
                          ? CERTIFICATIONS.filter(c => profile.certifications.includes(c.value)).map(c => c.label).join(", ")
                          : "Select certifications…"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[240px] p-2">
                      {CERTIFICATIONS.map((cert) => (
                        <label key={cert.value} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer text-sm">
                          <Checkbox
                            checked={profile.certifications.includes(cert.value)}
                            onCheckedChange={(checked) => {
                              updateProfile(
                                "certifications",
                                checked
                                  ? [...profile.certifications, cert.value]
                                  : profile.certifications.filter((c) => c !== cert.value)
                              );
                            }}
                          />
                          {cert.label}
                        </label>
                      ))}
                    </PopoverContent>
                  </Popover>
                  {profile.certifications.length > 0 && (
                    <div className="mt-3 space-y-3">
                      <Label className="text-sm text-muted-foreground">Upload proof of certification</Label>
                      {profile.certifications.map((certValue) => {
                        const certLabel = CERTIFICATIONS.find(c => c.value === certValue)?.label || certValue;
                        const file = certFiles[certValue];
                        return (
                          <div key={certValue} className="flex items-center gap-3 rounded-md border border-input p-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{certLabel}</p>
                              {file ? (
                                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                  <FileCheck className="h-3 w-3 text-primary" />
                                  {file.name}
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground">No file selected</p>
                              )}
                            </div>
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.jpg,.jpeg,.png,.webp"
                                onChange={(e) => {
                                  const f = e.target.files?.[0] || null;
                                  setCertFiles(prev => ({ ...prev, [certValue]: f }));
                                }}
                              />
                              <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors">
                                <Upload className="h-3 w-3" />
                                {file ? "Replace" : "Upload"}
                              </span>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Additional */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" /> Additional Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Key Highlights (comma-separated)</Label>
                  <Input value={profile.highlights} onChange={e => updateProfile("highlights", e.target.value)} placeholder="Free installation, Same-day service, 24/7 support" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Response Time</Label>
                    <Input value={profile.responseTime} onChange={e => updateProfile("responseTime", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Warranty</Label>
                    <Input value={profile.warranty} onChange={e => updateProfile("warranty", e.target.value)} placeholder="5 years parts & labour" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Terms Agreement */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" /> Terms & Agreements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit for Approval
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Your profile will be reviewed by our team. Once approved, you'll start receiving leads.
            </p>
          </form>
        </div>
      </div>
    );
  }

  // Step: signup
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Become a Provider</CardTitle>
          <CardDescription>Create your vendor account to start receiving qualified leads</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reg-email">Email</Label>
              <Input id="reg-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@business.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-password">Password</Label>
              <Input id="reg-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters and include uppercase, lowercase, a number, and a special character (e.g. !@#$%).
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-confirm">Confirm Password</Label>
              <Input id="reg-confirm" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link to="/vendor/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
