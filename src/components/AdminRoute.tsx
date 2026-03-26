import { Navigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading, user } = useIsAdmin();

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You don't have admin permissions.</p>
      </div>
    );
  }

  return <>{children}</>;
}
