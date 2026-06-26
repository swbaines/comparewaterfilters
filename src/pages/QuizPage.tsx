import { useState, useEffect } from "react";
import PageMeta from "@/components/PageMeta";
import { useNavigate } from "react-router-dom";
import SuburbPostcodeAutocomplete from "@/components/SuburbPostcodeAutocomplete";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

const TOTAL_STEPS = 6;

// State is auto-filled by suburb/postcode autocomplete
const propertyOptions = ["House", "Apartment", "Townhouse"];
const ownershipOptions = ["Own", "Rent"];
const householdSizes = ["1", "2", "3", "4", "5+"];
const bathroomCounts = ["1", "2", "3", "4+"];


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
  { value: "whole-home", label: "Chlorine" },
  { value: "taste", label: "Taste or smell from tap water" },
  
  { value: "skin-hair", label: "Skin irritation (eczema, hair loss, dandruff)" },
  { value: "fluoride", label: "Fluoride" },
  { value: "heavy-metals", label: "Heavy metals" },
  { value: "pfas", label: "PFAS\u00a0 (forever chemicals)" },
  { value: "microplastics", label: "Microplastics" },
  { value: "appliance", label: "Appliance & hot water system protection" },
  { value: "not-sure", label: "Not sure, just want better water" },
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


const installationTimelineOptions = [
  { value: "As soon as possible — within 2 weeks", label: "As soon as possible — within 2 weeks" },
  { value: "Within 1 month", label: "Within 1 month" },
  { value: "Within 3 months", label: "Within 3 months" },
  { value: "Just researching — no specific timeframe", label: "Just researching — no specific timeframe" },
];

export const contactPreferenceOptions = [
  { value: "phone", label: "Phone call — call me anytime" },
  { value: "sms", label: "SMS first — text me before calling" },
  { value: "email", label: "Email first — email me before calling" },
  { value: "no_preference", label: "No preference — any method is fine" },
];

function OptionButton({
  selected,
  onClick,
  children,
  align = "center",
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  align?: "left" | "center";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border-2 ${align === "center" ? "px-1 text-center" : "px-4 text-left"} py-3 text-xs sm:text-sm font-medium transition-all ${
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

  useEffect(() => {
    if (typeof window !== "undefined" && typeof (window as any).clarity === "function") {
      (window as any).clarity("event", "quiz_started");
    }
  }, []);
  const [answers, setAnswers] = useState<QuizAnswers>({
    postcode: "",
    suburb: "",
    state: "",
    propertyType: "",
    ownershipStatus: "",
    householdSize: "",
    bathrooms: "",
    
    waterSource: "town-water",
    waterTestedRecently: "",
    waterUsageType: "",
    concerns: [],
    coverage: "",
    budget: "",
    installationTimeline: "",
    notes: "",
    firstName: "",
    email: "",
    mobile: "",
    contactPreference: "",
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

  const toggleMulti = (field: "concerns", value: string) => {
    setAnswers((prev) => {
      const arr = prev[field];
      return { ...prev, [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  };

  const canNext = (): boolean => {
    switch (step) {
      case 1:
        return answers.concerns.length > 0;
      case 2:
        if (!answers.waterSource) return false;
        if (NON_TOWN_SOURCES.includes(answers.waterSource)) {
          return !!(answers.waterTestedRecently && answers.waterUsageType);
        }
        return true;
      case 3:
        return !!(
          answers.postcode &&
          answers.state &&
          answers.propertyType &&
          answers.ownershipStatus &&
          answers.householdSize
        );
      case 4:
        return !!answers.coverage;
      case 5:
        return !!answers.budget;
      case 6:
        return !!answers.installationTimeline;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    // Contact details are now captured on the results page (when the user
    // requests vendor quotes). Saving of the quiz_submissions row happens
    // on ResultsPage once the recommendation is shown so we can also track
    // visitors who view recommendations without converting.
    sessionStorage.setItem("quizAnswers", JSON.stringify(answers));
    // Clear any prior "saved recommendation" flag so ResultsPage records
    // a fresh recommendation_viewed row for this run.
    sessionStorage.removeItem("quizSubmissionSaved");
    // Meta Pixel: track quiz completion as CompleteRegistration event
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "CompleteRegistration", {
        content_name: "Water Filter Quiz",
        status: "complete",
      });
    }
    if (typeof window !== "undefined" && typeof (window as any).clarity === "function") {
      (window as any).clarity("event", "quiz_completed");
    }
    navigate("/results");
  };

  const stepTitles = [
    "Your main concerns",
    "Your water source",
    "About your household",
    "Coverage needed",
    "Your budget",
    "Installation timing",
  ];

  return (
    <div className="min-h-screen bg-muted/30 py-8 sm:py-12">
      <PageMeta
        title="Whole House Water Filter Quiz — Find Your Match"
        description="Answer a few quick questions about your home and water concerns to get personalised whole house water filter recommendations and free quotes."
        path="/quiz"
        appendSiteName={false}
      />
      <div className="container max-w-2xl">
        {step === 1 && (
          <div className="mb-4 rounded-lg border bg-background px-4 py-3 shadow-sm">
            <h1 className="text-lg font-bold tracking-tight text-primary sm:text-xl">
              Find the right water filtration system for your home
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Get personalised recommendations and matched with trusted providers near you — take the quiz.
            </p>
          </div>
        )}
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
          <ol className="mt-4 flex flex-nowrap items-start justify-between gap-1 sm:gap-2" aria-label="Quiz progress checkpoints">
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
                    className={`relative flex h-9 w-9 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm sm:text-xs font-semibold tabular-nums transition touch-manipulation before:absolute before:-inset-1.5 before:content-[''] sm:before:hidden ${
                      isComplete
                        ? "border-primary bg-primary text-primary-foreground hover:opacity-80 cursor-pointer"
                        : isCurrent
                          ? "border-primary bg-background text-primary ring-2 ring-primary/20"
                          : "border-muted-foreground/30 bg-background text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    {isComplete ? <Check className="h-4 w-4 sm:h-3.5 sm:w-3.5" /> : stepNum}
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
            <h2 className="mb-6 text-lg font-bold sm:text-xl">{stepTitles[step - 1]}</h2>

            {/* Step 1 */}
            {step === 3 && (
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
                      align="left"
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
            {step === 1 && (
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

              </div>
            )}

            {/* Step 6 */}
            {step === 6 && (
              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    When are you looking to have your system installed? *
                  </label>
                  <p className="mb-3 text-xs text-muted-foreground">
                    This helps us prioritise vendors who can match your timeline.
                  </p>
                  <div
                    className={`grid gap-2 sm:grid-cols-2 ${
                      showErrors && !answers.installationTimeline
                        ? "rounded-lg ring-2 ring-destructive/40 p-1"
                        : ""
                    }`}
                  >
                    {installationTimelineOptions.map((t) => (
                      <OptionButton
                        key={t.value}
                        selected={answers.installationTimeline === t.value}
                        onClick={() => set("installationTimeline", t.value)}
                      >
                        {t.label}
                      </OptionButton>
                    ))}
                  </div>
                  {showErrors && !answers.installationTimeline && (
                    <p className="mt-2 text-xs text-destructive">
                      Please select an installation timeline to continue.
                    </p>
                  )}
                </div>
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

            {/* Navigation — inline at bottom of step */}
            <div className="mt-8 flex items-center justify-between gap-2">
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
          </CardContent>
        </Card>
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
