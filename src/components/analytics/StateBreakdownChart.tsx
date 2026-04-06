import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  byState: Record<string, number>;
}

export default function StateBreakdownChart({ byState }: Props) {
  const data = Object.entries(byState)
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Quiz Submissions by State</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">No data</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Quiz Submissions by State</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(200, data.length * 44)}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 15%, 90%)" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
            <YAxis type="category" dataKey="state" tick={{ fontSize: 13 }} stroke="hsl(220, 10%, 46%)" width={50} />
            <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(40, 15%, 90%)", fontSize: "13px" }} />
            <Bar dataKey="count" name="Submissions" fill="hsl(168, 42%, 40%)" radius={[0, 4, 4, 0]} barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
