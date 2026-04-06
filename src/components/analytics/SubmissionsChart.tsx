import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO, startOfDay } from "date-fns";

interface Props {
  quizSubmissions: { id: string; created_at: string }[];
  quoteRequests: { id: string; created_at: string }[];
}

export default function SubmissionsChart({ quizSubmissions, quoteRequests }: Props) {
  // Group by day
  const dayMap: Record<string, { quizzes: number; leads: number }> = {};

  quizSubmissions.forEach((q) => {
    const day = format(startOfDay(parseISO(q.created_at)), "yyyy-MM-dd");
    if (!dayMap[day]) dayMap[day] = { quizzes: 0, leads: 0 };
    dayMap[day].quizzes++;
  });

  quoteRequests.forEach((q) => {
    const day = format(startOfDay(parseISO(q.created_at)), "yyyy-MM-dd");
    if (!dayMap[day]) dayMap[day] = { quizzes: 0, leads: 0 };
    dayMap[day].leads++;
  });

  const data = Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({
      date,
      label: format(parseISO(date), "dd MMM"),
      ...counts,
    }));

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Activity Over Time</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">No data</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Activity Over Time</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="quizGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(168, 42%, 40%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(168, 42%, 40%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(220, 70%, 55%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(220, 70%, 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 15%, 90%)" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(40, 15%, 90%)",
                fontSize: "13px",
              }}
            />
            <Area type="monotone" dataKey="quizzes" name="Quizzes" stroke="hsl(168, 42%, 40%)" fill="url(#quizGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="leads" name="Leads" stroke="hsl(220, 70%, 55%)" fill="url(#leadGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
