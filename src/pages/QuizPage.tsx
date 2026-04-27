import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageMeta from "@/components/PageMeta";
import { useNavigate } from "react-router-dom";
import SuburbPostcodeAutocomplete from "@/components/SuburbPostcodeAutocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check, RefreshCw } from "lucide-react";
import type { QuizAnswers } from "@/lib/recommendationEngine";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TOTAL_STEPS = 8;

// State is auto-filled by suburb/postcode autocomplete
const propertyOptions = ["House", "Apartment", "Townhouse"];
const ownershipOptions = ["Own", "Rent"];
const householdSizes = ["1", "2", "3", "4", "5+"];
const bathroomCounts = ["1", "2", "3", "4+"];
const propertyAges = ["Less than 5 years", "5 to 20 years", "20 to 50 years", "Over 50 years", "Not sure"];

const waterTestedOptions = ["Yes, recently tested", "No, not tested", "Not sure"];
const waterUsageOptions = [
  "Drinking and cooking only",
  "Showering and bathing only",
  "Drinking, cooking, showering and bathing",
  "Garden and outdoor use only",
];
const NON_TOWN_SOURCES = ["rainwater", "tank-water", "bore-water"];

const waterSources = [
  {
    value: "town-water",
    label: "Town water (mains)",
    hint: "Chlorinated/chloraminated supply from your local utility — most Aussie homes.",
  },
  {
    value: "rainwater",
    label: "Rainwater tank",
    hint: "Roof-collected rainwater. Untreated — UV disinfection will be recommended.",
  },
  {
    value: "tank-water",
    label: "Stored tank water (non-rain)",
    hint: "Carted, dam or stored water (not rainwater). Untreated — UV will be recommended.",
  },
  {
    value: "bore-water",
    label: "Bore / well water",
    hint: "Groundwater from a bore. Untreated — UV and sediment pre-filtration recommended.",
  },
  {
    value: "not-sure",
    label: "Not sure",
    hint: "We'll assume town water (mains) — the most common setup in Australia.",
  },
];

const concernOptions = [
  { value: "whole-home", label: "Whole house protection (every tap & shower)" },
  { value: "taste", label: "Taste or smell from tap water" },
  { value: "chlorine", label: "Chlorine smell or taste" },
  { value: "skin-hair", label: "Skin irritation, eczema, hair loss or dandruff" },
  { value: "drinking-quality", label: "Drinking water quality" },
  { value: "fluoride", label: "Fluoride removal" },
  { value: "heavy-metals", label: "Heavy metals (lead, arsenic etc.)" },
  { value: "pfas", label: "PFAS / forever chemicals" },
  { value: "microplastics", label: "Microplastics" },
  { value: "appliance", label: "Appliance & hot water system protection" },
  { value: "bacteria", label: "Bacteria / microbiological safety" },
  { value: "not-sure", label: "Not sure, just want better water" },
  { value: "hard-water", label: "Hard water / scale buildup" },
  { value: "replacement", label: "Existing system needs replacement" },
];

const coverageOptions = [
  { value: "drinking-water", label: "Drinking water only" },
  { value: "kitchen", label: "Kitchen only" },
  { value: "whole-house", label: "Whole house" },
  { value: "whole-house-plus", label: "Whole house + drinking water" },
  { value: "showers-bathrooms", label: "Filtered showers and bathrooms" },
];

const budgetOptions = [
  { value: "under-1000", label: "Under $1,000" },
  { value: "1000-3000", label: "$1,000 – $3,000" },
  { value: "3000-5000", label: "$3,000 – $5,000" },
  { value: "5000-plus", label: "$5,000+" },
  { value: "not-sure", label: "Not sure" },
];

const maintenanceToleranceOptions = [
  { value: "Critical — under $200 per year preferred", label: "Critical — under $200 per year preferred" },
  { value: "Important — under $400 per year preferred", label: "Important — under $400 per year preferred" },
  { value: "Manageable — up to $700 per year is fine", label: "Manageable — up to $700 per year is fine" },
  { value: "Not a concern — I want the best filtration regardless", label: "Not a concern — I want the best filtration regardless" },
];

const priorityOptions = [
  { value: "lowest-cost", label: "Lowest upfront cost" },
  { value: "lowest-maintenance", label: "Lowest maintenance" },
  { value: "strongest-filtration", label: "Strongest filtration" },
  { value: "premium-appearance", label: "Premium appearance" },
  { value: "best-warranty", label: "Best warranty / servicing" },
  { value: "local-support", label: "Local / Australian support" },
];

function OptionButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border-2 px-4 py-3 text-left text-sm font-medium transition-all ${
        selected
          ? "border-primary bg-accent text-accent-foreground"
          : "border-border bg-card text-foreground hover:border-primary/30"
      }`}
    >
      {children}
    </button>
  );
}

function MultiSelectButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg border-2 px-4 py-3 text-left text-sm font-medium transition-all ${
        selected
          ? "border-primary bg-accent text-accent-foreground"
          : "border-border bg-card text-foreground hover:border-primary/30"
      }`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected ? "border-primary bg-primary" : "border-muted-foreground"}`}
      >
        {selected && <span className="text-[10px] text-primary-foreground">✓</span>}
      </span>
      {children}
    </button>
  );
}

export default function QuizPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showErrors, setShowErrors] = useState(false);
  const [pendingWaterSource, setPendingWaterSource] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setShowErrors(false);
  }, [step]);
  const [answers, setAnswers] = useState<QuizAnswers>({
    postcode: "",
    suburb: "",
    state: "",
    propertyType: "",
    ownershipStatus: "",
    householdSize: "",
    bathrooms: "",
    propertyAge: "",
    waterSource: "",
    waterTestedRecently: "",
    waterUsageType: "",
    concerns: [],
    coverage: "",
    budget: "",
    maintenanceTolerance: "",
    priorities: [],
    notes: "",
    firstName: "",
    email: "",
    mobile: "",
    consent: false,
    disclaimerAck: false,
  });

  // Prefill from sessionStorage when user clicks "Edit my answers" on results page
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!new URLSearchParams(window.location.search).has("edit")) return;
    try {
      const saved = sessionStorage.getItem("quizAnswers");
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<QuizAnswers>;
        setAnswers((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  const set = (field: keyof QuizAnswers, value: string | string[] | boolean) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  };

  const applyWaterSource = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      waterSource: value,
      ...(NON_TOWN_SOURCES.includes(value)
        ? {}
        : { waterTestedRecently: "", waterUsageType: "" }),
    }));
  };

  const handleWaterSourceChange = (value: string) => {
    if (value === answers.waterSource) return;
    const wasNonTown = NON_TOWN_SOURCES.includes(answers.waterSource);
    const hasFollowUps = !!(answers.waterTestedRecently || answers.waterUsageType);
    // Only confirm when switching AWAY from a non-town source that has follow-up answers.
    if (wasNonTown && hasFollowUps && answers.waterSource !== value) {
      setPendingWaterSource(value);
      return;
    }
    applyWaterSource(value);
  };

  const handleNext = () => {
    if (!canNext()) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setStep((s) => s + 1);
  };

  const toggleMulti = (field: "concerns" | "priorities", value: string) => {
    setAnswers((prev) => {
      const arr = prev[field];
      return { ...prev, [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  };

  const canNext = (): boolean => {
    switch (step) {
      case 1:
        return !!(
          answers.postcode &&
          answers.state &&
          answers.propertyType &&
          answers.ownershipStatus &&
          answers.householdSize &&
          answers.bathrooms &&
          answers.propertyAge
        );
      case 2:
        if (!answers.waterSource) return false;
        if (NON_TOWN_SOURCES.includes(answers.waterSource)) {
          return !!(answers.waterTestedRecently && answers.waterUsageType);
        }
        return true;
      case 3:
        return answers.concerns.length > 0;
      case 4:
        return !!answers.coverage;
      case 5:
        return !!answers.budget && !!answers.maintenanceTolerance;
      case 6:
        return true; // optional
      case 7:
        return true; // optional
      case 8:
        return !!(answers.firstName && answers.email && answers.mobile && answers.consent && answers.disclaimerAck);
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    // Save to database so the lead is never lost
    try {
      await supabase.from("quiz_submissions").insert({
        first_name: answers.firstName,
        email: answers.email,
        mobile: answers.mobile || null,
        postcode: answers.postcode || null,
        suburb: answers.suburb || null,
        state: answers.state || null,
        property_type: answers.propertyType || null,
        ownership_status: answers.ownershipStatus || null,
        household_size: answers.householdSize || null,
        bathrooms: answers.bathrooms || null,
        property_age: answers.propertyAge || null,
        water_source: answers.waterSource || null,
        water_tested_recently: answers.waterTestedRecently || null,
        water_usage_type: answers.waterUsageType || null,
        concerns: answers.concerns,
        coverage: answers.coverage || null,
        budget: answers.budget || null,
        maintenance_tolerance: answers.maintenanceTolerance || null,
        priorities: answers.priorities || [],
        notes: answers.notes || null,
        consent: answers.consent,
      });
    } catch (err) {
      console.error("Failed to save quiz submission:", err);
    }

    // Store answers in sessionStorage for results page
    sessionStorage.setItem("quizAnswers", JSON.stringify(answers));
    // Meta Pixel: track quiz completion as CompleteRegistration event
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "CompleteRegistration", {
        content_name: "Water Filter Quiz",
        status: "complete",
      });
    }
    navigate("/results");
  };

  const stepTitles = [
    "About your household",
    "Your water source",
    "Your main concerns",
    "Coverage needed",
    "Your budget",
    "Your priorities",
    "Any other details",
    "Get your results",
  ];

  return (
    <div className="min-h-screen bg-muted/30 py-8 sm:py-12">
      <PageMeta
        title="Whole House Water Filter Quiz — Find Your Match"
        description="Answer a few quick questions about your home and water concerns to get personalised whole house water filter recommendations and free quotes."
        path="/quiz"
      />
      <div className="container max-w-2xl">
        {/* Progress */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              Step {step} of {TOTAL_STEPS}:{" "}
              <span className="text-muted-foreground font-normal">{stepTitles[step - 1]}</span>
            </span>
            <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
          </div>
          <Progress value={(step / TOTAL_STEPS) * 100} className="h-2" />

          {/* Step checkpoints */}
          <ol className="mt-4 flex items-center justify-between gap-1 sm:gap-2" aria-label="Quiz progress checkpoints">
            {stepTitles.map((title, idx) => {
              const stepNum = idx + 1;
              const isComplete = stepNum < step;
              const isCurrent = stepNum === step;
              const canJump = isComplete; // only jump back to completed steps
              return (
                <li key={title} className="flex flex-1 flex-col items-center gap-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => canJump && setStep(stepNum)}
                    disabled={!canJump}
                    aria-label={`${title} — ${isComplete ? "complete" : isCurrent ? "current step" : "upcoming"}`}
                    aria-current={isCurrent ? "step" : undefined}
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition ${
                      isComplete
                        ? "border-primary bg-primary text-primary-foreground hover:opacity-80 cursor-pointer"
                        : isCurrent
                          ? "border-primary bg-background text-primary ring-2 ring-primary/20"
                          : "border-muted-foreground/30 bg-background text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    {isComplete ? <Check className="h-3.5 w-3.5" /> : stepNum}
                  </button>
                  <span
                    className={`hidden sm:block text-[10px] leading-tight text-center truncate w-full ${
                      isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {title}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <h2 className="mb-6 text-xl font-bold">{stepTitles[step - 1]}</h2>

            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <div
                    className={
                      showErrors && (!answers.postcode || !answers.state)
                        ? "rounded-lg ring-2 ring-destructive/40 ring-offset-2 ring-offset-background"
                        : ""
                    }
                  >
                    <SuburbPostcodeAutocomplete
                      postcode={answers.postcode}
                      suburb={answers.suburb}
                      onSelect={(postcode, suburb, state) => {
                        setAnswers((prev) => ({ ...prev, postcode, suburb, state }));
                      }}
                    />
                  </div>
                  {showErrors && (!answers.postcode || !answers.state) && (
                    <p className="mt-2 text-xs font-medium text-destructive" role="alert">
                      Please select your suburb or postcode to continue.
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Property type <span className="text-destructive">*</span>
                  </label>
                  <div
                    className={`grid grid-cols-3 gap-2 ${
                      showErrors && !answers.propertyType
                        ? "rounded-lg ring-2 ring-destructive/40 ring-offset-2 ring-offset-background p-2 -m-2"
                        : ""
                    }`}
                  >
                    {propertyOptions.map((p) => (
                      <OptionButton
                        key={p}
                        selected={answers.propertyType === p}
                        onClick={() => set("propertyType", p)}
                      >
                        {p}
                      </OptionButton>
                    ))}
                  </div>
                  {showErrors && !answers.propertyType && (
                    <p className="mt-2 text-xs font-medium text-destructive" role="alert">
                      Please select an option to continue.
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Do you own or rent? <span className="text-destructive">*</span>
                  </label>
                  <div
                    className={`grid grid-cols-2 gap-2 ${
                      showErrors && !answers.ownershipStatus
                        ? "rounded-lg ring-2 ring-destructive/40 ring-offset-2 ring-offset-background p-2 -m-2"
                        : ""
                    }`}
                  >
                    {ownershipOptions.map((o) => (
                      <OptionButton
                        key={o}
                        selected={answers.ownershipStatus === o}
                        onClick={() => set("ownershipStatus", o)}
                      >
                        {o}
                      </OptionButton>
                    ))}
                  </div>
                  {showErrors && !answers.ownershipStatus && (
                    <p className="mt-2 text-xs font-medium text-destructive" role="alert">
                      Please select an option to continue.
                    </p>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      People in home <span className="text-destructive">*</span>
                    </label>
                    <div
                      className={`flex gap-2 ${
                        showErrors && !answers.householdSize
                          ? "rounded-lg ring-2 ring-destructive/40 ring-offset-2 ring-offset-background p-2 -m-2"
                          : ""
                      }`}
                    >
                      {householdSizes.map((s) => (
                        <OptionButton
                          key={s}
                          selected={answers.householdSize === s}
                          onClick={() => set("householdSize", s)}
                        >
                          {s}
                        </OptionButton>
                      ))}
                    </div>
                    {showErrors && !answers.householdSize && (
                      <p className="mt-2 text-xs font-medium text-destructive" role="alert">
                        Please select an option.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Bathrooms <span className="text-destructive">*</span>
                    </label>
                    <div
                      className={`flex gap-2 ${
                        showErrors && !answers.bathrooms
                          ? "rounded-lg ring-2 ring-destructive/40 ring-offset-2 ring-offset-background p-2 -m-2"
                          : ""
                      }`}
                    >
                      {bathroomCounts.map((b) => (
                        <OptionButton key={b} selected={answers.bathrooms === b} onClick={() => set("bathrooms", b)}>
                          {b}
                        </OptionButton>
                      ))}
                    </div>
                    {showErrors && !answers.bathrooms && (
                      <p className="mt-2 text-xs font-medium text-destructive" role="alert">
                        Please select an option.
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Approximate age of property <span className="text-destructive">*</span>
                  </label>
                  <div
                    className={`flex flex-wrap gap-2 ${
                      showErrors && !answers.propertyAge
                        ? "rounded-lg ring-2 ring-destructive/40 ring-offset-2 ring-offset-background p-2 -m-2"
                        : ""
                    }`}
                  >
                    {propertyAges.map((a) => (
                      <OptionButton
                        key={a}
                        selected={answers.propertyAge === a}
                        onClick={() => set("propertyAge", a)}
                      >
                        {a}
                      </OptionButton>
                    ))}
                  </div>
                  {showErrors && !answers.propertyAge ? (
                    <p className="mt-2 text-xs font-medium text-destructive" role="alert">
                      Please select an option to continue. Choose “Not sure” if you’re unsure.
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">
                      This helps installers understand your plumbing setup and provide accurate quotes.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Tell us where your water comes from. This determines whether we recommend UV disinfection (for
                  untreated sources like rainwater, tank or bore) on top of filtration.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {waterSources.map((w) => (
                    <OptionButton
                      key={w.value}
                      selected={answers.waterSource === w.value}
                      onClick={() => handleWaterSourceChange(w.value)}
                    >
                      <span className="flex flex-col items-start gap-0.5 text-left">
                        <span className="font-medium">{w.label}</span>
                        <span className="text-xs font-normal text-muted-foreground">{w.hint}</span>
                      </span>
                    </OptionButton>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  This helps us recommend the right filtration including any disinfection systems needed for non-mains water.
                </p>

                {NON_TOWN_SOURCES.includes(answers.waterSource) && (
                  <div className="space-y-5 animate-fade-in pt-2">
                    <div
                      className={`rounded-lg border-2 p-4 transition-colors ${
                        showErrors && !answers.waterTestedRecently
                          ? "border-destructive/50 bg-destructive/5"
                          : "border-border bg-muted/30"
                      }`}
                    >
                      <p className="mb-3 text-sm font-medium text-foreground">
                        Has your water been tested in the last 2 years?
                        <span className="ml-1 text-destructive">*</span>
                      </p>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {waterTestedOptions.map((opt) => (
                          <OptionButton
                            key={opt}
                            selected={answers.waterTestedRecently === opt}
                            onClick={() => set("waterTestedRecently", opt)}
                          >
                            {opt}
                          </OptionButton>
                        ))}
                      </div>
                      {showErrors && !answers.waterTestedRecently && (
                        <p className="mt-2 text-xs font-medium text-destructive">
                          Please select an option to continue.
                        </p>
                      )}
                    </div>

                    <div
                      className={`rounded-lg border-2 p-4 transition-colors ${
                        showErrors && !answers.waterUsageType
                          ? "border-destructive/50 bg-destructive/5"
                          : "border-border bg-muted/30"
                      }`}
                    >
                      <p className="mb-3 text-sm font-medium text-foreground">
                        How is the water used in your home?
                        <span className="ml-1 text-destructive">*</span>
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {waterUsageOptions.map((opt) => (
                          <OptionButton
                            key={opt}
                            selected={answers.waterUsageType === opt}
                            onClick={() => set("waterUsageType", opt)}
                          >
                            {opt}
                          </OptionButton>
                        ))}
                      </div>
                      {showErrors && !answers.waterUsageType && (
                        <p className="mt-2 text-xs font-medium text-destructive">
                          Please select an option to continue.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-1">
                <p className="mb-3 text-sm text-muted-foreground">
                  Select all that apply. <span className="text-destructive">*</span>
                </p>
                <div
                  className={`grid gap-2 sm:grid-cols-2 ${
                    showErrors && answers.concerns.length === 0
                      ? "rounded-lg ring-2 ring-destructive/40 ring-offset-2 ring-offset-background p-2 -m-2"
                      : ""
                  }`}
                >
                  {concernOptions.map((c) => (
                    <MultiSelectButton
                      key={c.value}
                      selected={answers.concerns.includes(c.value)}
                      onClick={() => toggleMulti("concerns", c.value)}
                    >
                      <span className="flex items-center gap-2">
                        {c.value === "replacement" && (
                          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
                            <RefreshCw className="h-3.5 w-3.5 text-primary" />
                          </span>
                        )}
                        <span className="leading-snug">{c.label}</span>
                      </span>
                    </MultiSelectButton>
                  ))}
                </div>
                {showErrors && answers.concerns.length === 0 && (
                  <p className="mt-3 text-xs font-medium text-destructive" role="alert">
                    Please select at least one concern to continue.
                  </p>
                )}
                {answers.concerns.includes("replacement") && (
                  <div className="mt-4 flex items-start gap-3 rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/[0.02] px-4 py-3 shadow-sm animate-fade-in">
                    <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
                      <RefreshCw className="h-3.5 w-3.5 text-primary" />
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-foreground">Replacement & upgrade matching</p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        We'll prioritise providers who can quote on replacing or upgrading your existing system — including modern warranties and best-practice installs.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4 */}
            {step === 4 && (
              <div>
                <div
                  className={`grid gap-2 sm:grid-cols-2 ${
                    showErrors && !answers.coverage
                      ? "rounded-lg ring-2 ring-destructive/40 ring-offset-2 ring-offset-background p-2 -m-2"
                      : ""
                  }`}
                >
                  {coverageOptions.map((c) => (
                    <OptionButton
                      key={c.value}
                      selected={answers.coverage === c.value}
                      onClick={() => set("coverage", c.value)}
                    >
                      {c.label}
                    </OptionButton>
                  ))}
                </div>
                {showErrors && !answers.coverage && (
                  <p className="mt-2 text-sm text-destructive">
                    Please select a coverage option to continue.
                  </p>
                )}
                {answers.coverage === "showers-bathrooms" && (
                  <div className="mt-4 flex items-start gap-3 rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/[0.02] px-4 py-3 shadow-sm animate-fade-in">
                    <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
                      <Check className="h-3.5 w-3.5 text-primary" />
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-foreground">Honest note on shower & bath filtration</p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        For genuinely filtered shower and bath water, a whole-house filtration system is the only effective long-term solution. Standalone shower filters are limited — they typically lose effectiveness against chlorine within weeks at hot water temperatures. We'll recommend a whole-house system that delivers properly filtered water to every shower, bath, and tap.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 5 */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Upfront budget <span className="text-destructive">*</span>
                  </label>
                  <div
                    className={`grid gap-2 sm:grid-cols-2 ${
                      showErrors && !answers.budget
                        ? "rounded-lg ring-2 ring-destructive/40 ring-offset-2 ring-offset-background p-2 -m-2"
                        : ""
                    }`}
                  >
                    {budgetOptions.map((b) => (
                      <OptionButton
                        key={b.value}
                        selected={answers.budget === b.value}
                        onClick={() => set("budget", b.value)}
                      >
                        {b.label}
                      </OptionButton>
                    ))}
                  </div>
                  {showErrors && !answers.budget && (
                    <p className="mt-2 text-sm text-destructive">Please select an upfront budget to continue.</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    How important is low ongoing maintenance cost? <span className="text-destructive">*</span>
                  </label>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Different systems have different annual maintenance needs — knowing your tolerance helps us match the right one.
                  </p>
                  <div
                    className={`grid gap-2 sm:grid-cols-2 ${
                      showErrors && !answers.maintenanceTolerance
                        ? "rounded-lg ring-2 ring-destructive/40 ring-offset-2 ring-offset-background p-2 -m-2"
                        : ""
                    }`}
                  >
                    {maintenanceToleranceOptions.map((m) => (
                      <OptionButton
                        key={m.value}
                        selected={answers.maintenanceTolerance === m.value}
                        onClick={() => set("maintenanceTolerance", m.value)}
                      >
                        {m.label}
                      </OptionButton>
                    ))}
                  </div>
                  {showErrors && !answers.maintenanceTolerance && (
                    <p className="mt-2 text-sm text-destructive">Please select a maintenance preference to continue.</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 6 */}
            {step === 6 && (
              <div className="space-y-1">
                <p className="mb-3 text-sm text-muted-foreground">Select any priorities that matter most to you.</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {priorityOptions.map((p) => (
                    <MultiSelectButton
                      key={p.value}
                      selected={answers.priorities.includes(p.value)}
                      onClick={() => toggleMulti("priorities", p.value)}
                    >
                      {p.label}
                    </MultiSelectButton>
                  ))}
                </div>
              </div>
            )}

            {/* Step 7 */}
            {step === 7 && (
              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Anything else we should know?</label>
                  <Textarea
                    placeholder="Any specific concerns, existing systems, or questions..."
                    value={answers.notes}
                    onChange={(e) => set("notes", e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 8 */}
            {step === 8 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter your details to see your personalised recommendations.
                </p>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">First name *</label>
                  <Input
                    placeholder="Your first name"
                    value={answers.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Email *</label>
                  <Input
                    type="email"
                    placeholder="you@email.com"
                    value={answers.email}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Mobile *</label>
                  <Input
                    placeholder="04XX XXX XXX"
                    value={answers.mobile}
                    onChange={(e) => set("mobile", e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="consent"
                    checked={answers.consent}
                    onCheckedChange={(checked) => set("consent", !!checked)}
                  />
                  <label htmlFor="consent" className="text-sm text-muted-foreground">
                    I agree to receive my recommendations via email and understand my information is used to provide
                    personalised guidance in accordance with our{" "}
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:text-primary/80"
                    >
                      Privacy Policy
                    </a>{" "}
                    and{" "}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:text-primary/80"
                    >
                      Terms and Conditions
                    </a>
                    . I can unsubscribe at any time.
                  </label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="disclaimerAck"
                    checked={answers.disclaimerAck}
                    onCheckedChange={(checked) => set("disclaimerAck", !!checked)}
                  />
                  <label htmlFor="disclaimerAck" className="text-sm text-muted-foreground">
                    I acknowledge that recommendations are for general guidance only and do not constitute professional
                    advice. I have read and accept the{" "}
                    <a
                      href="/disclaimer"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      platform disclaimer
                    </a>
                    .
                  </label>
                </div>
              </div>
            )}

            {/* Navigation — desktop inline */}
            <div className="mt-8 hidden items-center justify-between gap-2 sm:flex">
              <Button
                variant="ghost"
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 1}
                className="gap-1 shrink-0"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              {step < TOTAL_STEPS ? (
                <Button onClick={handleNext} className="gap-1">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={!canNext()} className="gap-1 whitespace-nowrap">
                  See My Recommendations <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
            {/* Spacer to keep content above sticky bar on mobile */}
            <div className="h-20 sm:hidden" aria-hidden="true" />
          </CardContent>
        </Card>
      </div>
      {/* Sticky mobile nav */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:hidden">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
            className="shrink-0 gap-1"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {step < TOTAL_STEPS ? (
            <Button
              onClick={handleNext}
              className="flex-1 gap-1 whitespace-nowrap"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canNext()} className="flex-1 gap-1 whitespace-nowrap">
              See My Recommendations <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <AlertDialog
        open={pendingWaterSource !== null}
        onOpenChange={(open) => {
          if (!open) setPendingWaterSource(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change water source?</AlertDialogTitle>
            <AlertDialogDescription>
              Switching your water source will clear your answers to the follow-up questions
              (water testing and how the water is used). Are you sure you want to change it?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep current selection</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingWaterSource) applyWaterSource(pendingWaterSource);
                setPendingWaterSource(null);
              }}
            >
              Yes, change it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
