import { ShieldCheck } from "lucide-react";

const POINTS = [
  "Every installer is VBA-licensed and fully insured",
  "Systems are WaterMark & NSF-ANSI certified",
  "Reviews are from verified, completed jobs",
  "We only pass your details to installers you pick",
];

export default function TrustStrip() {
  return (
    <section className="rounded-2xl bg-foreground p-6 text-background sm:p-8">
      <h3 className="text-lg font-bold sm:text-xl">
        Why these aren't just any plumber off Google
      </h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {POINTS.map((p) => (
          <p key={p} className="flex items-start gap-2 text-sm text-background/90">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{p}</span>
          </p>
        ))}
      </div>
    </section>
  );
}