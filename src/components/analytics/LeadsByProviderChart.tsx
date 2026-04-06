import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Props {
  byProvider: Record<string, { total: number; won: number; revenue: number }>;
}

export default function LeadsByProviderChart({ byProvider }: Props) {
  const data = Object.entries(byProvider)
    .map(([name, v]) => ({ name, total: v.total, won: v.won }))
    .sort((a, b) => b.total - a.total);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Leads by Provider</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">No data</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Leads by Provider</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 15%, 90%)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
            <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(40, 15%, 90%)", fontSize: "13px" }} />
            <Legend wrapperStyle={{ fontSize: "13px" }} />
            <Bar dataKey="total" name="Total Leads" fill="hsl(168, 42%, 40%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="won" name="Won" fill="hsl(142, 60%, 45%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
