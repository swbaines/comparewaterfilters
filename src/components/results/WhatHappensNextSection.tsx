import { Send, MessageSquare, CheckCircle2 } from "lucide-react";

const STEPS = [
  {
    icon: Send,
    title: "You send the request",
    body:
      "Your details go only to the installers you ticked — no one else.",
  },
  {
    icon: MessageSquare,
    title: "They quote you direct",
    body:
      "Each one contacts you within 1 business day to confirm details and price the job.",
  },
  {
    icon: CheckCircle2,
    title: "You compare & choose",
    body:
      "Pick the quote you like — or none. There's no charge and no obligation either way.",
  },
];

export default function WhatHappensNextSection() {
  return (
    <section>
      <h2 className="text-xl font-bold sm:text-2xl">What happens after you request</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <div
            key={s.title}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                {i + 1}
              </span>
              <s.icon className="h-4 w-4" />
            </div>
            <p className="mt-3 font-semibold">{s.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Free to request</span>
        <span aria-hidden>·</span>
        <span>No obligation</span>
        <span aria-hidden>·</span>
        <span>You control who calls</span>
      </div>
    </section>
  );
}