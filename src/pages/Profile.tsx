import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { User, Mail, Calendar, Shield, Trash2, Save, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { JewelIcon } from "@/components/ui/JewelIcon";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setEmail(user?.email || "");
      setDisplayName(user?.user_metadata?.display_name || user?.user_metadata?.full_name || "");
      setLoading(false);
    };

    checkUser();
  }, [navigate]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName }
      });

      if (error) throw error;

      toast.success("Profile updated successfully");
      setUser((prev: any) => ({
        ...prev,
        user_metadata: { ...prev.user_metadata, display_name: displayName }
      }));
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      toast.error("Account deletion requires contacting support. Please reach out to us.");
    } catch (error: any) {
      toast.error(error.message || "Failed to process request");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const createdAt = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';

  return (
    <DashboardLayout
      headerTitle="My Profile"
      headerDescription="Manage your personal information and account settings"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        {/* Profile Information Card */}
        <SpotlightCard className="p-8 border-primary/20">
          <div className="flex items-start gap-4 mb-8">
            <JewelIcon icon={User} size="lg" color="blue" />
            <div>
              <h2 className="text-xl font-heading font-semibold">Profile Information</h2>
              <p className="text-sm text-muted-foreground">Update your personal details</p>
            </div>
          </div>

          <div className="space-y-6 max-w-xl">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                className="bg-white/5 border-white/10 focus:border-primary/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted/50 border-white/5"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Shield className="w-3 h-3" />
                Email cannot be changed for security reasons
              </p>
            </div>

            <Button onClick={handleSaveProfile} disabled={saving} className="btn-premium">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </SpotlightCard>

        {/* Account Information Card */}
        <SpotlightCard className="p-8 border-primary/20">
          <div className="flex items-start gap-4 mb-8">
            <JewelIcon icon={Shield} size="lg" color="purple" />
            <div>
              <h2 className="text-xl font-heading font-semibold">Account Status</h2>
              <p className="text-sm text-muted-foreground">Your account details and verification</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Email Status</p>
                  <p className="text-sm font-medium text-white">Verified</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Member Since</p>
                  <p className="text-sm font-medium text-white">{createdAt}</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">User ID</p>
                  <p className="text-sm font-mono text-muted-foreground truncate">{user?.id}</p>
                </div>
              </div>
            </div>
          </div>
        </SpotlightCard>

        {/* Danger Zone Card */}
        <SpotlightCard className="p-8 border-red-500/20 bg-red-500/5" spotlightColor="rgba(239, 68, 68, 0.1)">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-semibold text-red-400">Danger Zone</h2>
              <p className="text-sm text-red-400/60">Irreversible account actions</p>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
            <h3 className="font-semibold text-red-200 mb-2">Delete Account</h3>
            <p className="text-sm text-red-300/70 mb-6 max-w-xl">
              Once you delete your account, there is no going back. All your campaigns, email sequences, and data will be permanently deleted. This action cannot be undone.
            </p>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="bg-red-500 hover:bg-red-600 border-none shadow-lg shadow-red-500/20">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete My Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
                    Yes, Delete My Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </SpotlightCard>
      </motion.div>
    </DashboardLayout>
  );
};

export default Profile;
