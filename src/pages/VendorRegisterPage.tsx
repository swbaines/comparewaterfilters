import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Building2, MapPin, Wrench, Shield, ChevronsUpDown, Upload, FileCheck, ImagePlus, Mail, ShieldCheck, ShieldAlert, RefreshCw } from "lucide-react";
import { systemTypes } from "@/data/systemTypes";
import { Badge } from "@/components/ui/badge";
import ServiceAreaPicker, { type ServiceAreaValue } from "@/components/ServiceAreaPicker";
import { computeCoverageStates } from "@/lib/serviceArea";
import InstallationModelFields, {
  emptyInstallationModelValue,
  validateInstallationModel,
  type InstallationModelValue,
} from "@/components/vendor/InstallationModelFields";

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

const SYSTEM_TYPES = systemTypes.map((s) => ({ value: s.id, label: s.name }));
const VALID_SYSTEM_TYPE_IDS = new Set(SYSTEM_TYPES.map((s) => s.value));

const CERTIFICATIONS = [
  { value: "watermark-certified", label: "WaterMark Certified" },
  { value: "nsf-ansi", label: "NSF/ANSI" },
];

type Step = "signup" | "verify-email" | "profile" | "success";

export default function VendorRegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>("signup");
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // If user is logged in (e.g. after email verification), check if they need to complete profile
  useEffect(() => {
    if (authLoading) return;

    const requestedStep = searchParams.get("step");

    if (user) {
      // Check if this user already has a vendor account (approved) or a submitted provider (pending)
      Promise.all([
        supabase.from("vendor_accounts").select("id").eq("user_id", user.id).limit(1),
        supabase.from("providers").select("id").eq("submitted_by", user.id).limit(1),
      ]).then(([vaResult, provResult]) => {
        if (vaResult.data && vaResult.data.length > 0) {
          // Approved vendor — send to dashboard
          navigate("/vendor/dashboard", { replace: true });
        } else if (provResult.data && provResult.data.length > 0) {
          // Already submitted a provider (pending approval) — show success/pending screen
          setStep("success");
        } else if (requestedStep === "profile") {
          setStep("profile");
        } else {
          setStep("profile");
        }
        setCheckingProfile(false);
      });
    } else {
      setCheckingProfile(false);
    }
  }, [user, authLoading, navigate, searchParams]);

  // Signup fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Profile fields
  const [profile, setProfile] = useState({
    name: "",
    tradingName: "",
    description: "",
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
    googleBusinessUrl: "",
  });

  const [installation, setInstallation] = useState<InstallationModelValue>(
    emptyInstallationModelValue(),
  );

  const [serviceArea, setServiceArea] = useState<ServiceAreaValue>({
    mode: "radius",
    baseSuburb: "",
    basePostcode: "",
    baseState: "",
    baseLat: null,
    baseLng: null,
    radiusKm: 50,
    statewide: false,
    regions: [],
  });

  const [certFiles, setCertFiles] = useState<Record<string, File | null>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Live ABR lookup state (pre-registration). The verify-abn edge function
  // accepts an authenticated call without a provider_id and returns the ABR
  // entity details + name-match outcome.
  type AbrPreview = {
    verified: boolean;
    status?: string;
    entityName?: string | null;
    businessNames?: string[];
    review_flag?: string | null;
    reason?: string;
    mode?: string;
    verifiedAt?: string;
  };
  const [abrChecking, setAbrChecking] = useState(false);
  const [abrPreview, setAbrPreview] = useState<AbrPreview | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Tracks names we set programmatically (from ABR) so the reset effect
  // below doesn't immediately clear the verified banner after auto-fill.
  const abrAutoFilledNameRef = useRef<string | null>(null);

  // Reset preview whenever the user edits the ABN or manually edits the
  // business name. Skip resets caused by our own ABR auto-fill.
  useEffect(() => {
    if (
      abrAutoFilledNameRef.current !== null &&
      abrAutoFilledNameRef.current === profile.name
    ) {
      return;
    }
    abrAutoFilledNameRef.current = null;
    setAbrPreview(null);
  }, [profile.abn, profile.name]);

  const runAbrLookup = async () => {
    const abnClean = profile.abn.replace(/\s/g, "");
    if (!/^\d{11}$/.test(abnClean)) {
      toast.error("ABN must be exactly 11 digits");
      return;
    }
    setAbrChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-abn", {
        // Send the current business name only if the user already typed one.
        // Otherwise we let ABR be the source of truth and auto-fill it below.
        body: {
          abn: abnClean,
          business_name: profile.name.trim() || undefined,
        },
      });
      if (error) throw error;
      const preview = data as AbrPreview;
      const verifiedAt = new Date().toISOString();
      preview.verifiedAt = verifiedAt;
      // Auto-fill business name from the ABR-registered entity name when:
      //   - the lookup succeeded and returned an entity name, AND
      //   - the user hasn't typed a business name yet, OR
      //   - the typed name didn't match (name_mismatch) — adopt ABR's canonical name.
      const shouldAutoFill =
        !!preview.entityName &&
        preview.reason !== "abn_cancelled" &&
        preview.reason !== "abr_lookup_failed" &&
        (!profile.name.trim() || preview.review_flag === "name_mismatch");
      if (shouldAutoFill && preview.entityName) {
        // If the user already typed something different, preserve it as a trading name.
        const typed = profile.name.trim();
        if (typed && typed.toLowerCase() !== preview.entityName.toLowerCase() && !profile.tradingName.trim()) {
          updateProfile("tradingName", typed);
        }
        updateProfile("name", preview.entityName);
        // Clear the name_mismatch flag locally — we just adopted ABR's name,
        // so the next verification (or submission) will treat it as a match.
        setAbrPreview({ ...preview, verified: true, review_flag: null, verifiedAt });
        toast.success("Business name set from the Australian Business Register.");
        return;
      }
      setAbrPreview(preview);
      if (data?.reason === "abn_cancelled") {
        toast.error("This ABN is marked Cancelled by the ABR.");
      } else if (data?.reason === "abr_lookup_failed") {
        toast.error(
          "We couldn't verify this ABN with the Australian Business Register. Please check the number and try again, or contact us if the issue persists.",
        );
      } else if (data?.verified) {
        toast.success("ABN verified against the Australian Business Register.");
      }
    } catch (e: any) {
      toast.error(
        "We couldn't verify this ABN with the Australian Business Register. Please check the number and try again, or contact us if the issue persists.",
      );
      console.error("verify-abn preview failed", e);
    } finally {
      setAbrChecking(false);
    }
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleResendVerification = async () => {
    if (resending || resendCooldown > 0) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin.includes('lovableproject.com') ? 'https://comparewaterfilters.com.au' : window.location.origin}/vendor/register?step=profile` },
    });
    setResending(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Verification email resent — check your inbox.");
      setResendCooldown(60);
    }
  };

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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin.includes('lovableproject.com') ? 'https://comparewaterfilters.com.au' : window.location.origin}/vendor/register?step=profile` },
    });
    setLoading(false);
    if (error) {
      if (/already|registered|exists/i.test(error.message)) {
        toast.error("This email is already registered — please sign in instead.", {
          action: { label: "Sign in", onClick: () => navigate("/vendor/login") },
        });
        return;
      }
      toast.error(error.message);
      return;
    }
    // Supabase returns a user with empty identities array when the email already exists (enumeration protection)
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      toast.error("This email is already registered — please sign in instead.", {
        action: { label: "Sign in", onClick: () => navigate("/vendor/login") },
      });
      return;
    }
    setStep("verify-email");
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
    // Verify ABN against the official ABR checksum algorithm.
    // Storing the verified flag lets us show a trust badge on the public listing.
    const { isValidAbn } = await import("@/lib/abn");
    const abnVerified = isValidAbn(abnClean);
    if (!abnVerified) {
      toast.error("That ABN doesn't pass validation. Please double-check the 11 digits.");
      return;
    }
    // Auto-prepend https:// if user omitted protocol
    const normalizeUrl = (val: string) => {
      const t = val.trim();
      if (!t) return "";
      return /^https?:\/\//i.test(t) ? t : `https://${t}`;
    };
    // Website required + must be a valid URL
    const websiteTrim = normalizeUrl(profile.website);
    if (!websiteTrim) {
      toast.error("Website is required");
      return;
    }
    try { new URL(websiteTrim); } catch {
      toast.error("Website must be a valid URL");
      return;
    }
    // Google Business Profile required + must be a valid URL
    const gbpTrim = normalizeUrl(profile.googleBusinessUrl);
    if (!gbpTrim) {
      toast.error("Google Business Profile URL is required");
      return;
    }
    try { new URL(gbpTrim); } catch {
      toast.error("Google Business Profile must be a valid URL");
      return;
    }
    // Validate installation model fieldset (licence/insurance/partners)
    const installationError = validateInstallationModel(installation);
    if (installationError) {
      toast.error(installationError);
      return;
    }

    if (serviceArea.mode === "radius") {
      if (!serviceArea.baseLat || !serviceArea.baseLng || !serviceArea.baseSuburb) {
        toast.error("Please select your base service location");
        return;
      }
    } else if (serviceArea.regions.length === 0) {
      toast.error("Please select at least one state or metro region");
      return;
    }

    // Open confirmation dialog summarising the ABR verification result
    // before performing the actual submission.
    setConfirmOpen(true);
  };

  const performProfileSubmit = async () => {
    const abnClean = profile.abn.replace(/\s/g, "");
    const normalizeUrl = (val: string) => {
      const t = val.trim();
      if (!t) return "";
      return /^https?:\/\//i.test(t) ? t : `https://${t}`;
    };
    const websiteTrim = normalizeUrl(profile.website);
    const gbpTrim = normalizeUrl(profile.googleBusinessUrl);

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

      const invalidSystemTypes = profile.systemTypes.filter((id) => !VALID_SYSTEM_TYPE_IDS.has(id));
      if (invalidSystemTypes.length > 0) {
        throw new Error(`Invalid system type(s): ${invalidSystemTypes.join(", ")}`);
      }

      const radiusToSave = serviceArea.mode === "radius"
        ? (serviceArea.statewide ? 5000 : serviceArea.radiusKm)
        : 0;
      const statesToSave =
        serviceArea.mode === "radius"
          ? computeCoverageStates({
              mode: "radius",
              baseLat: serviceArea.baseLat,
              baseLng: serviceArea.baseLng,
              baseState: serviceArea.baseState,
              radiusKm: radiusToSave,
              regionSelections: [],
            })
          : serviceArea.regions; // raw selections (states + metros) preserved for editing

      const { data: provider, error: providerError } = await supabase
        .from("providers")
        .insert({
          name: profile.name,
          trading_name: profile.tradingName.trim() || null,
          slug,
          description: profile.description,
          states: statesToSave,
          service_base_suburb: serviceArea.mode === "radius" ? serviceArea.baseSuburb : null,
          service_base_postcode: serviceArea.mode === "radius" ? serviceArea.basePostcode : null,
          service_base_state: serviceArea.mode === "radius" ? serviceArea.baseState : null,
          service_base_lat: serviceArea.mode === "radius" ? serviceArea.baseLat : null,
          service_base_lng: serviceArea.mode === "radius" ? serviceArea.baseLng : null,
          service_radius_km: radiusToSave,
          system_types: profile.systemTypes,
          brands: toArray(profile.brands),
          price_range: profile.priceRange,
          years_in_business: profile.yearsInBusiness,
          certifications: profile.certifications,
          highlights: toArray(profile.highlights),
          response_time: profile.responseTime,
          warranty: profile.warranty,
          website: websiteTrim,
          phone: profile.phone || null,
          contact_email: user.email || email || null,
          available_for_quote: false,
          approval_status: "pending" as any,
          submitted_by: user.id,
          certification_files: certFilePaths,
          logo: logoUrl,
          abn: abnClean,
          // Source of truth is the live ABR check below — start as unverified
          // and let the edge function flip these once the ABR confirms the entity.
          abn_verified: false,
          abn_verified_at: null,
          plumber_licence_number:
            installation.installation_model === "in_house_licensed"
              ? installation.plumber_licence_number.trim()
              : "",
          plumbing_licence_state:
            installation.installation_model === "in_house_licensed"
              ? installation.plumbing_licence_state || null
              : null,
          has_public_liability: installation.has_public_liability,
          insurer_name: installation.has_public_liability
            ? installation.insurer_name.trim()
            : "",
          public_liability_insurance_amount:
            installation.has_public_liability &&
            installation.public_liability_insurance_amount.trim()
              ? Number(installation.public_liability_insurance_amount)
              : null,
          installation_model: installation.installation_model,
          sub_contractor_confirmation_at:
            installation.installation_model === "sub_contracted" &&
            installation.sub_contractor_confirmed
              ? new Date().toISOString()
              : null,
          insurance_expiry_date: installation.has_public_liability
            ? installation.insurance_expiry_date || null
            : null,
          google_business_url: gbpTrim,
        } as any)
        .select("id")
        .single();

      if (providerError) throw providerError;

      // Upload insurance certificate now that we have a provider_id, then patch the row.
      if (installation.insurance_certificate_file && provider?.id) {
        const file = installation.insurance_certificate_file;
        const ext = (file.name.split(".").pop() || "pdf").toLowerCase();
        const path = `${provider.id}/certificate-${Date.now()}.${ext}`;
        const { error: insUpErr } = await supabase.storage
          .from("vendor-insurance-certificates")
          .upload(path, file, { contentType: file.type });
        if (insUpErr) throw insUpErr;
        await supabase
          .from("providers")
          .update({
            insurance_certificate_url: path,
            insurance_expiry_date: installation.insurance_expiry_date || null,
          } as any)
          .eq("id", provider.id);
      }

      // Kick off live ABN verification (checksum-only fallback if ABR_API_GUID
      // isn't configured). Non-blocking — the application is already submitted.
      supabase.functions
        .invoke('verify-abn', {
          body: { provider_id: provider.id, abn: abnClean, business_name: profile.name },
        })
        .catch((e) => console.error('verify-abn failed:', e));

      // Vendor account will be auto-linked when admin approves the provider

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
              states: statesToSave,
              systemTypes: profile.systemTypes,
              hasPublicLiability: installation.has_public_liability,
              installationModel: installation.installation_model,
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
      setConfirmOpen(false);
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

  if (authLoading || checkingProfile) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (step === "verify-email") {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Check Your Email</h2>
            <p className="text-muted-foreground">
              We've sent a verification link to{" "}
              <span className="font-medium text-foreground">{email}</span>.
              Please click the link in the email to verify your account.
            </p>
            <p className="text-sm text-muted-foreground">
              Once verified, you'll be redirected to complete your provider profile.
            </p>
            <div className="pt-2 space-y-3">
              <p className="text-xs text-muted-foreground">
                Didn't receive the email? Check your spam folder, then resend below.
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleResendVerification}
                disabled={resending || resendCooldown > 0}
              >
                {resending ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Resending…</>
                ) : resendCooldown > 0 ? (
                  `Resend confirmation email (${resendCooldown}s)`
                ) : (
                  "Resend confirmation email"
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                Already verified?{" "}
                <Link to="/vendor/login" className="text-primary hover:underline font-medium">Sign in</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                  <Label>ABN *</Label>
                  <div className="flex gap-2">
                    <Input
                      value={profile.abn}
                      onChange={e => updateProfile("abn", e.target.value)}
                      required
                      placeholder="12 345 678 901"
                      maxLength={14}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={runAbrLookup}
                      disabled={abrChecking}
                    >
                      {abrChecking ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Checking…</>
                      ) : (
                        <>Verify with ABR</>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Start here — enter your 11-digit ABN and click <span className="font-medium">Verify with ABR</span>. We'll auto-fill your registered business name below.</p>
                  {abrPreview && (
                    abrPreview.verified ? (
                      <div className="mt-3 rounded-lg border-2 border-emerald-300 bg-emerald-50 p-4 text-emerald-900 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="rounded-full bg-emerald-600 p-1.5 text-white">
                            <ShieldCheck className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">ABN Verified</span>
                              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                                {abrPreview.status || "Active"}
                              </span>
                            </div>
                            <dl className="mt-2 space-y-1 text-sm">
                              {abrPreview.entityName && (
                                <div className="flex flex-wrap gap-x-2">
                                  <dt className="text-emerald-800/80">Entity name:</dt>
                                  <dd className="font-medium">{abrPreview.entityName}</dd>
                                </div>
                              )}
                              <div className="flex flex-wrap gap-x-2">
                                <dt className="text-emerald-800/80">ABN:</dt>
                                <dd className="font-medium tabular-nums">
                                  {profile.abn.replace(/\s/g, "").replace(/^(\d{2})(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3 $4")}
                                </dd>
                              </div>
                              {abrPreview.verifiedAt && (
                                <div className="flex flex-wrap gap-x-2">
                                  <dt className="text-emerald-800/80">Verified on:</dt>
                                  <dd className="font-medium">
                                    {new Date(abrPreview.verifiedAt).toLocaleString("en-AU", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </dd>
                                </div>
                              )}
                              {abrPreview.businessNames && abrPreview.businessNames.length > 0 && (
                                <div className="flex flex-wrap gap-x-2">
                                  <dt className="text-emerald-800/80">Trading names:</dt>
                                  <dd className="font-medium">{abrPreview.businessNames.join(", ")}</dd>
                                </div>
                              )}
                            </dl>
                            <p className="mt-2 text-xs text-emerald-800/80">
                              Confirmed against the Australian Business Register.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                        <div className="flex items-center gap-2 font-medium">
                          <ShieldAlert className="h-4 w-4" />
                          {abrPreview.reason === "abn_cancelled"
                            ? "ABR lists this ABN as Cancelled"
                            : abrPreview.reason === "abr_lookup_failed"
                              ? "ABR lookup failed"
                              : abrPreview.review_flag === "name_mismatch"
                                ? "ABN found, but the registered name doesn't match"
                                : "Unverified"}
                        </div>
                        {abrPreview.entityName && (
                          <p className="mt-1 text-xs">
                            ABR entity name: <span className="font-medium">{abrPreview.entityName}</span>
                            {abrPreview.status ? ` · Status: ${abrPreview.status}` : ""}
                          </p>
                        )}
                        {abrPreview.businessNames && abrPreview.businessNames.length > 0 && (
                          <p className="mt-0.5 text-xs">
                            Trading names on record: {abrPreview.businessNames.join(", ")}
                          </p>
                        )}
                        {abrPreview.review_flag === "name_mismatch" && (
                          <p className="mt-1 text-xs">
                            We've kept your typed name. Click <span className="font-medium">Verify with ABR</span> again to replace it with the registered entity name above, or move it to the Trading Name field.
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Business Name *</Label>
                  <Input value={profile.name} onChange={e => updateProfile("name", e.target.value)} required placeholder="Auto-filled from your ABN — or type it in" />
                  <p className="text-xs text-muted-foreground">Your registered legal business name. Filled automatically when you verify your ABN above.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Trading Name (if different)</Label>
                  <Input value={profile.tradingName} onChange={e => updateProfile("tradingName", e.target.value)} placeholder="e.g. Sam's Filters" />
                  <p className="text-xs text-muted-foreground">Optional — the name customers know your business by, if different from your registered name.</p>
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
                    <Label>Website *</Label>
                    <Input value={profile.website} onChange={e => updateProfile("website", e.target.value)} required placeholder="yourbusiness.com.au" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input value={profile.phone} onChange={e => updateProfile("phone", e.target.value)} placeholder="04XX XXX XXX" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Google Business Profile URL *</Label>
                  <Input
                    value={profile.googleBusinessUrl}
                    onChange={e => updateProfile("googleBusinessUrl", e.target.value)}
                    required
                    placeholder="g.page/your-business"
                  />
                  <p className="text-xs text-muted-foreground">Used to verify your business reviews and reputation.</p>
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
              <CardContent>
                <ServiceAreaPicker value={serviceArea} onChange={setServiceArea} idPrefix="reg" />
              </CardContent>
            </Card>

            {/* Installation Model & Compliance */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" /> Installation & Compliance
                </CardTitle>
                <CardDescription>
                  How installations are performed, plus licence and insurance details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InstallationModelFields
                  value={installation}
                  onChange={setInstallation}
                />
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


            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit for Approval
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Your profile will be reviewed by our team. Once approved, you'll start receiving leads.
            </p>
          </form>

          {/* Confirmation dialog summarising ABN verification result */}
          <Dialog open={confirmOpen} onOpenChange={(o) => { if (!loading) setConfirmOpen(o); }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Confirm your application</DialogTitle>
                <DialogDescription>
                  Please review your ABN verification result before submitting.
                </DialogDescription>
              </DialogHeader>

              {(() => {
                const abnClean = profile.abn.replace(/\s/g, "");
                const abnFormatted = abnClean.replace(
                  /^(\d{2})(\d{3})(\d{3})(\d{3})$/,
                  "$1 $2 $3 $4",
                );
                let state: "verified" | "name_mismatch" | "cancelled" | "unchecked" | "failed" = "unchecked";
                if (abrPreview) {
                  if (abrPreview.reason === "abn_cancelled") state = "cancelled";
                  else if (abrPreview.reason === "abr_lookup_failed") state = "failed";
                  else if (abrPreview.review_flag === "name_mismatch") state = "name_mismatch";
                  else if (abrPreview.verified) state = "verified";
                }
                const meta = {
                  verified: {
                    cls: "border-emerald-200 bg-emerald-50 text-emerald-900",
                    icon: <ShieldCheck className="h-4 w-4" />,
                    title: "Verified with the Australian Business Register",
                    body: "Your business name matches the registered ABR entity.",
                  },
                  name_mismatch: {
                    cls: "border-amber-200 bg-amber-50 text-amber-900",
                    icon: <ShieldAlert className="h-4 w-4" />,
                    title: "Name mismatch — admin review required",
                    body: "The ABN is active but the business name doesn't match the ABR record. Your application will be reviewed manually before activation.",
                  },
                  cancelled: {
                    cls: "border-destructive/30 bg-destructive/10 text-destructive",
                    icon: <ShieldAlert className="h-4 w-4" />,
                    title: "ABN listed as Cancelled",
                    body: "The ABR shows this ABN as cancelled. We strongly recommend updating it before submitting — your application will be flagged.",
                  },
                  failed: {
                    cls: "border-amber-200 bg-amber-50 text-amber-900",
                    icon: <ShieldAlert className="h-4 w-4" />,
                    title: "ABR lookup failed",
                    body: "We couldn't reach the Australian Business Register. You can submit anyway — verification will be retried during admin review.",
                  },
                  unchecked: {
                    cls: "border-amber-200 bg-amber-50 text-amber-900",
                    icon: <ShieldAlert className="h-4 w-4" />,
                    title: "ABN not yet verified",
                    body: 'Click "Verify with ABR" on the form to check your ABN now, or submit and we\'ll verify on your behalf during review.',
                  },
                }[state];

                return (
                  <div className="space-y-3 text-sm">
                    <div className="rounded-md border bg-muted/40 p-3">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Business name</div>
                      <div className="font-medium">{profile.name || "—"}</div>
                      <div className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">ABN</div>
                      <div className="font-medium">{abnFormatted || profile.abn}</div>
                    </div>

                    <div className={"rounded-md border p-3 " + meta.cls}>
                      <div className="flex items-center gap-2 font-medium">
                        {meta.icon}
                        {meta.title}
                      </div>
                      <p className="mt-1 text-xs">{meta.body}</p>
                      {abrPreview?.entityName && (
                        <p className="mt-1 text-xs">
                          ABR entity: <span className="font-medium">{abrPreview.entityName}</span>
                          {abrPreview.status ? ` · Status: ${abrPreview.status}` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirmOpen(false)}
                  disabled={loading}
                >
                  Back to edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={runAbrLookup}
                  disabled={loading || abrChecking}
                >
                  {abrChecking ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Verify again
                </Button>
                <Button
                  type="button"
                  onClick={performProfileSubmit}
                  disabled={loading || abrChecking}
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Confirm & submit
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
              <Input id="reg-email" name="email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@business.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-password">Password</Label>
              <Input id="reg-password" name="new-password" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters and include uppercase, lowercase, a number, and a special character (e.g. !@#$%).
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-confirm">Confirm Password</Label>
              <Input id="reg-confirm" name="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} />
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
