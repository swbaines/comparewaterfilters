import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { startOfDay, subDays, format } from "date-fns";
import { Loader2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AdminNav from "@/components/AdminNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

const TOTAL_STEPS = 6;

const STEP_TITLES = [
  "Concerns",
  "Property",
  "Location & water source",
  "Water quality",
  "Coverage & budget",
  "Contact details",
];

const RANGES = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "All time", days: 0 },
] as const;

type EventRow = {
  id: string;
  event_name: string;
  step_number: number | null;
  step_title: string | null;
  session_id: string | null;
  created_at: string;
};

export default function AdminQuizFunnelPage() {
  const [rangeDays, setRangeDays] = useState<number>(30);

  const since =
    rangeDays > 0
      ? startOfDay(subDays(new Date(), rangeDays)).toISOString()
      : "2000-01-01T00:00:00Z";

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["quiz-funnel-events", since],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_funnel_events")
        .select("id, event_name, step_number, step_title, session_id, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(50000);
      if (error) throw error;
      return (data ?? []) as EventRow[];
    },
  });

  // ----- Funnel: unique sessions that reached each step -----
  const funnel = useMemo(() => {
    const reachedByStep: Map<number, Set<string>> = new Map();
    const completedByStep: Map<number, Set<string>> = new Map();
    const abandonedByStep: Map<number, Set<string>> = new Map();
    for (let s = 1; s <= TOTAL_STEPS; s++) {
      reachedByStep.set(s, new Set());
      completedByStep.set(s, new Set());
      abandonedByStep.set(s, new Set());
    }
    const completedQuiz = new Set<string>();

    for (const e of events) {
      const sid = e.session_id ?? e.id;
      if (e.event_name === "quiz_step_viewed" && e.step_number) {
        reachedByStep.get(e.step_number)?.add(sid);
      } else if (e.event_name === "quiz_step_completed" && e.step_number) {
        completedByStep.get(e.step_number)?.add(sid);
      } else if (e.event_name === "quiz_abandoned" && e.step_number) {
        abandonedByStep.get(e.step_number)?.add(sid);
      } else if (e.event_name === "quiz_completed") {
        completedQuiz.add(sid);
      }
    }

    const firstStepCount = reachedByStep.get(1)?.size ?? 0;
    return Array.from({ length: TOTAL_STEPS }, (_, i) => {
      const step = i + 1;
      const reached = reachedByStep.get(step)?.size ?? 0;
      const completed = completedByStep.get(step)?.size ?? 0;
      const abandoned = abandonedByStep.get(step)?.size ?? 0;
      const dropOff = Math.max(reached - completed, 0);
      const dropOffRate = reached > 0 ? (dropOff / reached) * 100 : 0;
      const conversionFromStart =
        firstStepCount > 0 ? (reached / firstStepCount) * 100 : 0;
      return {
        step,
        title: STEP_TITLES[i] ?? `Step ${step}`,
        reached,
        completed,
        abandoned,
        dropOff,
        dropOffRate,
        conversionFromStart,
      };
    });
  }, [events]);

  const totalStarted = funnel[0]?.reached ?? 0;
  const totalCompleted = useMemo(() => {
    const sessions = new Set<string>();
    for (const e of events) {
      if (e.event_name === "quiz_completed")
        sessions.add(e.session_id ?? e.id);
    }
    return sessions.size;
  }, [events]);
  const overallConversion =
    totalStarted > 0 ? ((totalCompleted / totalStarted) * 100).toFixed(1) : "0";

  // ----- Events over time (daily counts per event type) -----
  const eventTimeline = useMemo(() => {
    const buckets: Record<string, Record<string, number>> = {};
    const days = rangeDays > 0 ? rangeDays : 90;
    const today = startOfDay(new Date());
    for (let i = days - 1; i >= 0; i--) {
      const d = format(subDays(today, i), "yyyy-MM-dd");
      buckets[d] = {
        quiz_started: 0,
        quiz_step_completed: 0,
        quiz_step_validation_failed: 0,
        quiz_abandoned: 0,
        quiz_completed: 0,
      };
    }
    for (const e of events) {
      const d = format(new Date(e.created_at), "yyyy-MM-dd");
      if (!buckets[d]) continue;
      if (e.event_name in buckets[d]) {
        buckets[d][e.event_name] = (buckets[d][e.event_name] ?? 0) + 1;
      }
    }
    return Object.entries(buckets).map(([date, counts]) => ({
      date: format(new Date(date), "MMM d"),
      ...counts,
    }));
  }, [events, rangeDays]);

  // ----- Total event counts (by name) -----
  const eventTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const e of events) {
      totals[e.event_name] = (totals[e.event_name] ?? 0) + 1;
    }
    return totals;
  }, [events]);

  return (
    <div>
      <AdminNav />
      <div className="container space-y-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Quiz Funnel</h1>
            <p className="text-muted-foreground">
              Drop-off by step and event counts over time
            </p>
          </div>
          <div className="flex gap-1">
            {RANGES.map((r) => (
              <Button
                key={r.days}
                size="sm"
                variant={rangeDays === r.days ? "default" : "outline"}
                onClick={() => setRangeDays(r.days)}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard label="Quiz starts" value={totalStarted} />
              <SummaryCard label="Completions" value={totalCompleted} />
              <SummaryCard label="Overall conversion" value={`${overallConversion}%`} />
              <SummaryCard
                label="Abandons recorded"
                value={eventTotals["quiz_abandoned"] ?? 0}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Drop-off by step</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnel}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="step"
                        tickFormatter={(v) => `Step ${v}`}
                        className="text-xs"
                      />
                      <YAxis allowDecimals={false} className="text-xs" />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                        labelFormatter={(v) => {
                          const idx = Number(v) - 1;
                          return `Step ${v} — ${STEP_TITLES[idx] ?? ""}`;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="reached" name="Reached" fill="hsl(var(--primary))" />
                      <Bar dataKey="completed" name="Completed" fill="hsl(var(--primary) / 0.55)" />
                      <Bar dataKey="dropOff" name="Dropped off" fill="hsl(var(--destructive))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Step</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead className="text-right">Reached</TableHead>
                        <TableHead className="text-right">Completed</TableHead>
                        <TableHead className="text-right">Dropped off</TableHead>
                        <TableHead className="text-right">Drop-off %</TableHead>
                        <TableHead className="text-right">Reach vs start</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {funnel.map((row) => (
                        <TableRow key={row.step}>
                          <TableCell className="font-medium">{row.step}</TableCell>
                          <TableCell>{row.title}</TableCell>
                          <TableCell className="text-right">{row.reached}</TableCell>
                          <TableCell className="text-right">{row.completed}</TableCell>
                          <TableCell className="text-right">{row.dropOff}</TableCell>
                          <TableCell className="text-right">
                            {row.dropOffRate.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right">
                            {row.conversionFromStart.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Event counts over time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={eventTimeline}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis allowDecimals={false} className="text-xs" />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="quiz_started" stroke="hsl(var(--primary))" dot={false} />
                      <Line type="monotone" dataKey="quiz_step_completed" stroke="#10b981" dot={false} />
                      <Line type="monotone" dataKey="quiz_completed" stroke="#0ea5e9" dot={false} />
                      <Line type="monotone" dataKey="quiz_abandoned" stroke="hsl(var(--destructive))" dot={false} />
                      <Line type="monotone" dataKey="quiz_step_validation_failed" stroke="#f59e0b" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Event totals</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(eventTotals)
                      .sort((a, b) => b[1] - a[1])
                      .map(([name, count]) => (
                        <TableRow key={name}>
                          <TableCell className="font-mono text-sm">{name}</TableCell>
                          <TableCell className="text-right">{count}</TableCell>
                        </TableRow>
                      ))}
                    {Object.keys(eventTotals).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                          No events recorded in this range yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
