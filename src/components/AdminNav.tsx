import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Building2, ClipboardList, BarChart3, FileText, LogOut, UserCog, Search, ShieldCheck, Flag, Filter, FlaskConical } from "lucide-react";
import { isTestMode, setTestMode } from "@/lib/testMode";

const navItems = [
  { to: "/admin/providers", label: "Providers", icon: Building2 },
  { to: "/admin/leads", label: "Lead Tracking", icon: ClipboardList },
  { to: "/admin/flagged-leads", label: "Flagged Leads", icon: Flag },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/quiz-funnel", label: "Quiz Funnel", icon: Filter },
  { to: "/admin/invoices", label: "Invoices", icon: FileText },
  { to: "/admin/account", label: "Account", icon: UserCog },
  { to: "/admin/seo-preview", label: "SEO Preview", icon: Search },
  { to: "/admin/abr-lookups", label: "ABR Lookups", icon: ShieldCheck },
];

export default function AdminNav() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [testMode, setTestModeState] = useState(false);

  useEffect(() => {
    setTestModeState(isTestMode());
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  return (
    <div className="border-b bg-card/95 backdrop-blur">
      <div className="container flex h-12 items-center justify-between">
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                  active ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs ${
              testMode ? "border-amber-400 bg-amber-50 text-amber-900" : "border-transparent text-muted-foreground"
            }`}
            title="When on, any quiz submissions or quote requests you make from this browser are flagged is_test=true and excluded from Analytics."
          >
            <FlaskConical className="h-3.5 w-3.5" />
            <Label htmlFor="admin-test-mode" className="cursor-pointer text-xs font-medium">
              Test mode
            </Label>
            <Switch
              id="admin-test-mode"
              checked={testMode}
              onCheckedChange={(v) => {
                setTestMode(v);
                setTestModeState(v);
              }}
            />
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5 text-muted-foreground">
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
