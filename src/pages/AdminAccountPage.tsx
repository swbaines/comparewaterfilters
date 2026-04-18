import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AccountCredentials from "@/components/AccountCredentials";
import AdminNav from "@/components/AdminNav";

export default function AdminAccountPage() {
  const navigate = useNavigate();
  return (
    <>
      <AdminNav />
      <div className="container max-w-3xl mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Account</h1>
            <p className="text-muted-foreground">Update your login email and password</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/admin/providers")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <AccountCredentials />
      </div>
    </>
  );
}
