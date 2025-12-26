import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { User, Session } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { Plus, Gem } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import MobileSidebar from "@/components/dashboard/MobileSidebar";
import CampaignsList from "@/components/dashboard/CampaignsList";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [creditsRemaining, setCreditsRemaining] = useState(0);

  // ✅ Fetch credits from email_credits
  const fetchCredits = async (userId: string) => {
    const { data, error } = await supabase
      .from("email_credits")
      .select("credits_free, credits_paid")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Failed to fetch credits:", error);
      return;
    }

    setCreditsRemaining(
      (data.credits_free || 0) + (data.credits_paid || 0)
    );
  };

  useEffect(() => {
    // 🔐 Listen only for logout
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (!session) {
          navigate("/auth");
        }
      });

    // ✅ Single source of truth for init
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (!session) {
        navigate("/auth");
        return;
      }

      // 🔥 One-time, safe initialization
      await supabase.rpc("initialize_free_trial");

      await fetchCredits(session.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const initials =
    user.user_metadata?.full_name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() ||
    user.email?.[0].toUpperCase() ||
    "U";

  return (
    <div className="min-h-screen flex bg-background">
      <DashboardSidebar />

      <div className="flex-1 lg:ml-64">
        {/* Top Bar */}
        <div className="sticky top-0 bg-card border-b">
          <div className="px-6 py-4 flex justify-between items-center">
            <MobileSidebar />

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10">
                <Gem className="w-4 h-4 text-primary" />
                <span className="font-semibold">{creditsRemaining}</span>
              </div>

              <Button onClick={() => navigate("/create-campaign")}>
                <Plus className="w-4 h-4 mr-2" />
                New
              </Button>

              <Avatar onClick={() => navigate("/profile")}>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <CampaignsList userId={user.id} />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
