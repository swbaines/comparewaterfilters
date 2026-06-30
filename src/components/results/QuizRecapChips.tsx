import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import type { QuizAnswers } from "@/lib/recommendationEngine";

const WATER_SOURCE_LABEL: Record<string, string> = {
  "town-water": "Town water",
  "tank-water": "Tank water",
  rainwater: "Rainwater",
  "bore-water": "Bore water",
  unsure: "Water source: unsure",
};

const COVERAGE_LABEL: Record<string, string> = {
  "whole-house": "Whole-house coverage",
  "whole-house-plus": "Whole-house + RO",
  "drinking-water": "Drinking water only",
  kitchen: "Under-sink only",
  "showers-bathrooms": "Filtered showers",
};

const BUDGET_LABEL: Record<string, string> = {
  "under-1000": "Budget under $1k",
  "1000-3500": "Budget up to $3.5k",
  "3500-plus": "Budget $3.5k+",
  "not-sure": "Best fit regardless of cost",
};

const CONCERN_LABEL: Record<string, string> = {
  taste: "Chlorine & taste",
  "skin-hair": "Skin / hair irritation",
  "skin-shower": "Shower water concerns",
  fluoride: "Fluoride",
  "heavy-metals": "Heavy metals",
  pfas: "PFAS",
  microplastics: "Microplastics",
  "whole-home": "Chlorine",
  appliance: "Appliance protection",
  "hard-water": "Hard water",
};

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <Badge
      variant="outline"
      className="rounded-full border-primary/30 bg-background px-3 py-1 text-xs font-normal text-foreground/80"
    >
      {children}
    </Badge>
  );
}

export default function QuizRecapChips({ answers }: { answers: QuizAnswers }) {
  const chips: string[] = [];
  if (answers.waterSource) chips.push(WATER_SOURCE_LABEL[answers.waterSource] ?? answers.waterSource);
  (answers.concerns || []).slice(0, 2).forEach((c) => {
    const l = CONCERN_LABEL[c];
    if (l) chips.push(l);
  });
  if (answers.householdSize) chips.push(`${answers.householdSize}-person home`);
  if (answers.coverage) {
    const l = COVERAGE_LABEL[answers.coverage];
    if (l) chips.push(l);
  }
  if (answers.budget) {
    const l = BUDGET_LABEL[answers.budget];
    if (l) chips.push(l);
  }
  if (answers.installationTimeline) chips.push(answers.installationTimeline);
  if (answers.suburb && answers.postcode) chips.push(`${answers.suburb} ${answers.postcode}`);
  else if (answers.suburb) chips.push(answers.suburb);

  // Cap at 7 to stay tidy on mobile.
  const visible = chips.slice(0, 7);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {visible.map((c) => (
          <Chip key={c}>{c}</Chip>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Not quite right?{" "}
        <Link
          to="/quiz?edit=1"
          className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
        >
          <Pencil className="h-3 w-3" /> Edit your answers
        </Link>
      </p>
    </div>
  );
}