import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, KeyRound, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AccountCredentials() {
  const { user } = useAuth();
  const currentEmail = user?.email ?? "";

  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const passwordValid = PASSWORD_REGEX.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword;
  const newEmailValid = EMAIL_REGEX.test(newEmail) && newEmail.toLowerCase() !== currentEmail.toLowerCase();

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmailValid) {
      toast.error("Enter a valid new email different from your current one.");
      return;
    }
    setEmailLoading(true);
    const { error } = await supabase.auth.updateUser(
      { email: newEmail.trim() },
      { emailRedirectTo: `${window.location.origin}/vendor/settings` }
    );
    setEmailLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      "Confirmation links sent to both your current and new email. Both must be confirmed to complete the change."
    );
    setNewEmail("");
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValid) {
      toast.error("Password does not meet requirements.");
      return;
    }
    if (!passwordsMatch) {
      toast.error("Passwords do not match.");
      return;
    }
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated successfully.");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="space-y-6">
      {/* Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5" />
            Login Email
          </CardTitle>
          <CardDescription>
            Current: <span className="font-medium text-foreground">{currentEmail}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-email">New Email Address</Label>
              <Input
                id="new-email"
                type="email"
                autoComplete="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="you@example.com"
                maxLength={255}
              />
              <p className="text-xs text-muted-foreground">
                A confirmation link will be sent to both your current and new email. Both must be confirmed before the change takes effect.
              </p>
            </div>
            <Button type="submit" disabled={emailLoading || !newEmailValid}>
              {emailLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Confirmation Links
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="h-5 w-5" />
            Password
          </CardTitle>
          <CardDescription>Set a new password for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters and include uppercase, lowercase, a number, and a special character.
              </p>
              {newPassword && (
                <div className="flex items-center gap-1">
                  {passwordValid ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <span className="h-4 w-4 text-destructive text-xs">✗</span>
                  )}
                  <span className={`text-xs ${passwordValid ? "text-emerald-600" : "text-destructive"}`}>
                    {passwordValid ? "Password meets requirements" : "Password does not meet requirements"}
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={passwordLoading || !passwordValid || !passwordsMatch}
            >
              {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
