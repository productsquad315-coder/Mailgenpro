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

  // ✅ FINAL: fetch credits via RPC (no RLS issues)
  const fetchCredits = async () => {
    const { data, error } = await supabase.rpc("get_my_credits");

    if (error || !data || data.length === 0) {
      console.error("Failed to fetch credits:", error);
      setCreditsRemaining(0);
      return;
    }

    const row = data[0] as any;
    setCreditsRemaining(
      (row.credits_free || 0) + (row.credits_paid || 0)
    );
  };

  useEffect(() => {
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (!session) {
          navigate("/auth");
        }
      });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (!session) {
        navigate("/auth");
        return;
      }

      // 🔥 Initialize + fetch credits
      // The trigger handles initialization now
      await fetchCredits();
      setLoading(false);
    });

    // Set up realtime subscription for credit updates
    const channel = supabase
      .channel("credits_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "email_credits",
        },
        () => {
          fetchCredits();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      channel.unsubscribe();
    };
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

        <div className="p-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <CampaignsList userId={user.id} />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
