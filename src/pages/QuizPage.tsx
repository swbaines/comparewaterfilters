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
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { QuizAnswers } from "@/lib/recommendationEngine";

const TOTAL_STEPS = 8;

// State is auto-filled by suburb/postcode autocomplete
const propertyOptions = ["House", "Apartment", "Townhouse"];
const ownershipOptions = ["Own", "Rent"];
const householdSizes = ["1", "2", "3", "4", "5+"];
const bathroomCounts = ["1", "2", "3", "4+"];

const waterSources = [
  { value: "town-water", label: "Town water (mains)" },
  { value: "rainwater", label: "Rainwater tank" },
  { value: "tank-water", label: "Tank water" },
  { value: "bore-water", label: "Bore water" },
  { value: "not-sure", label: "Not sure" },
];

const concernOptions = [
  { value: "taste", label: "Taste or smell from tap water" },
  { value: "chlorine", label: "Chlorine smell or taste" },
  { value: "skin-hair", label: "Skin irritation, eczema, hair loss or dandruff" },
  { value: "drinking-quality", label: "Drinking water quality" },
  { value: "fluoride", label: "Fluoride removal" },
  { value: "heavy-metals", label: "Heavy metals (lead, arsenic etc.)" },
  { value: "pfas", label: "PFAS / forever chemicals" },
  { value: "microplastics", label: "Microplastics" },
  { value: "hard-water", label: "Hard water / scale buildup" },
  { value: "whole-home", label: "Whole home protection" },
  { value: "appliance", label: "Appliance & hot water system protection" },
  { value: "bacteria", label: "Bacteria / microbiological safety" },
  { value: "not-sure", label: "Not sure, just want better water" },
];

const coverageOptions = [
  { value: "drinking-water", label: "Drinking water only" },
  { value: "kitchen", label: "Kitchen only" },
  { value: "whole-house", label: "Whole house" },
  { value: "whole-house-plus", label: "Whole house + drinking water" },
];

const budgetOptions = [
  { value: "under-1000", label: "Under $1,000" },
  { value: "1000-3000", label: "$1,000 – $3,000" },
  { value: "3000-5000", label: "$3,000 – $5,000" },
  { value: "5000-plus", label: "$5,000+" },
  { value: "not-sure", label: "Not sure" },
];

const priorityOptions = [
  { value: "lowest-cost", label: "Lowest upfront cost" },
  { value: "lowest-maintenance", label: "Lowest maintenance" },
  { value: "strongest-filtration", label: "Strongest filtration" },
  { value: "premium-appearance", label: "Premium appearance" },
  { value: "best-warranty", label: "Best warranty / servicing" },
  { value: "local-support", label: "Local / Australian support" },
  { value: "easy-install", label: "Easiest installation" },
];

function OptionButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
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

function MultiSelectButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
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
      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected ? "border-primary bg-primary" : "border-muted-foreground"}`}>
        {selected && <span className="text-[10px] text-primary-foreground">✓</span>}
      </span>
      {children}
    </button>
  );
}

export default function QuizPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);
  const [answers, setAnswers] = useState<QuizAnswers>({
    postcode: "", suburb: "", state: "", propertyType: "", ownershipStatus: "",
    householdSize: "", bathrooms: "", waterSource: "", concerns: [],
    coverage: "", budget: "", priorities: [], notes: "",
    firstName: "", email: "", mobile: "", consent: false, disclaimerAck: false,
  });

  const set = (field: keyof QuizAnswers, value: string | string[] | boolean) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  };

  const toggleMulti = (field: "concerns" | "priorities", value: string) => {
    setAnswers((prev) => {
      const arr = prev[field];
      return { ...prev, [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  };

  const canNext = (): boolean => {
    switch (step) {
      case 1: return !!(answers.postcode && answers.state && answers.propertyType && answers.ownershipStatus && answers.householdSize && answers.bathrooms);
      case 2: return !!answers.waterSource;
      case 3: return answers.concerns.length > 0;
      case 4: return !!answers.coverage;
      case 5: return !!answers.budget;
      case 6: return true; // optional
      case 7: return true; // optional
      case 8: return !!(answers.firstName && answers.email && answers.mobile && answers.consent && answers.disclaimerAck);
      default: return true;
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
        water_source: answers.waterSource || null,
        concerns: answers.concerns,
        coverage: answers.coverage || null,
        budget: answers.budget || null,
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
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'CompleteRegistration', {
        content_name: 'Water Filter Quiz',
        status: 'complete',
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
        title="Water Filter Quiz"
        description="Answer a few quick questions about your home and water concerns to get personalised water filter recommendations."
        path="/quiz"
      />
      <div className="container max-w-2xl">
        {/* Progress */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
            <span>Step {step} of {TOTAL_STEPS}</span>
            <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
          </div>
          <Progress value={(step / TOTAL_STEPS) * 100} className="h-2" />
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <h2 className="mb-6 text-xl font-bold">{stepTitles[step - 1]}</h2>

            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-4">
                <SuburbPostcodeAutocomplete
                  postcode={answers.postcode}
                  suburb={answers.suburb}
                  onSelect={(postcode, suburb, state) => {
                    setAnswers((prev) => ({ ...prev, postcode, suburb, state }));
                  }}
                />
                <div>
                  <label className="mb-2 block text-sm font-medium">Property type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {propertyOptions.map((p) => (
                      <OptionButton key={p} selected={answers.propertyType === p} onClick={() => set("propertyType", p)}>{p}</OptionButton>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Do you own or rent?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ownershipOptions.map((o) => (
                      <OptionButton key={o} selected={answers.ownershipStatus === o} onClick={() => set("ownershipStatus", o)}>{o}</OptionButton>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">People in home</label>
                    <div className="flex gap-2">
                      {householdSizes.map((s) => (
                        <OptionButton key={s} selected={answers.householdSize === s} onClick={() => set("householdSize", s)}>{s}</OptionButton>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Bathrooms</label>
                    <div className="flex gap-2">
                      {bathroomCounts.map((b) => (
                        <OptionButton key={b} selected={answers.bathrooms === b} onClick={() => set("bathrooms", b)}>{b}</OptionButton>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {waterSources.map((w) => (
                  <OptionButton key={w.value} selected={answers.waterSource === w.value} onClick={() => set("waterSource", w.value)}>
                    {w.label}
                  </OptionButton>
                ))}
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-1">
                <p className="mb-3 text-sm text-muted-foreground">Select all that apply.</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {concernOptions.map((c) => (
                    <MultiSelectButton key={c.value} selected={answers.concerns.includes(c.value)} onClick={() => toggleMulti("concerns", c.value)}>
                      {c.label}
                    </MultiSelectButton>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4 */}
            {step === 4 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {coverageOptions.map((c) => (
                  <OptionButton key={c.value} selected={answers.coverage === c.value} onClick={() => set("coverage", c.value)}>
                    {c.label}
                  </OptionButton>
                ))}
              </div>
            )}

            {/* Step 5 */}
            {step === 5 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {budgetOptions.map((b) => (
                  <OptionButton key={b.value} selected={answers.budget === b.value} onClick={() => set("budget", b.value)}>
                    {b.label}
                  </OptionButton>
                ))}
              </div>
            )}

            {/* Step 6 */}
            {step === 6 && (
              <div className="space-y-1">
                <p className="mb-3 text-sm text-muted-foreground">Select any priorities that matter most to you.</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {priorityOptions.map((p) => (
                    <MultiSelectButton key={p.value} selected={answers.priorities.includes(p.value)} onClick={() => toggleMulti("priorities", p.value)}>
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
                  <Textarea placeholder="Any specific concerns, existing systems, or questions..." value={answers.notes} onChange={(e) => set("notes", e.target.value)} />
                </div>
              </div>
            )}

            {/* Step 8 */}
            {step === 8 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Enter your details to see your personalised recommendations.</p>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">First name *</label>
                  <Input placeholder="Your first name" value={answers.firstName} onChange={(e) => set("firstName", e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Email *</label>
                  <Input type="email" placeholder="you@email.com" value={answers.email} onChange={(e) => set("email", e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Mobile *</label>
                  <Input placeholder="04XX XXX XXX" value={answers.mobile} onChange={(e) => set("mobile", e.target.value)} required />
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="consent"
                    checked={answers.consent}
                    onCheckedChange={(checked) => set("consent", !!checked)}
                  />
                  <label htmlFor="consent" className="text-sm text-muted-foreground">
                    I agree to receive my recommendations via email and understand my information is used to provide personalised guidance. I can unsubscribe at any time.
                  </label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="disclaimerAck"
                    checked={answers.disclaimerAck}
                    onCheckedChange={(checked) => set("disclaimerAck", !!checked)}
                  />
                  <label htmlFor="disclaimerAck" className="text-sm text-muted-foreground">
                    I acknowledge that recommendations are for general guidance only and do not constitute professional advice. I have read and accept the{" "}
                    <a href="/disclaimer" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                      platform disclaimer
                    </a>.
                  </label>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between gap-2">
              <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 1} className="gap-1 shrink-0">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              {step < TOTAL_STEPS ? (
                <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()} className="gap-1">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={!canNext()} className="gap-1 whitespace-nowrap text-sm sm:text-base">
                  See My Recommendations <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
