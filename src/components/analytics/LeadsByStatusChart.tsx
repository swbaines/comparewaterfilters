import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  new: "hsl(220, 70%, 55%)",
  sent: "hsl(168, 42%, 40%)",
  won: "hsl(142, 60%, 45%)",
  lost: "hsl(0, 72%, 51%)",
  contacted: "hsl(38, 92%, 50%)",
};

const FALLBACK_COLORS = [
  "hsl(262, 52%, 55%)",
  "hsl(340, 65%, 50%)",
  "hsl(24, 80%, 50%)",
];

interface Props {
  byStatus: Record<string, number>;
}

export default function LeadsByStatusChart({ byStatus }: Props) {
  const data = Object.entries(byStatus).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    key: name,
  }));

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Leads by Status</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">No data</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Leads by Status</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              dataKey="value"
              nameKey="name"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.key}
                  fill={STATUS_COLORS[entry.key] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(40, 15%, 90%)", fontSize: "13px" }} />
            <Legend wrapperStyle={{ fontSize: "13px" }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
