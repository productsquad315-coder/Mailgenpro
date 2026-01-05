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
          table: "user_usage",
        },
        () => {
          console.log("Credit update received, refetching...");
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

      <div className="flex-1 lg:ml-80">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-b">
          <div className="px-6 lg:px-8">
            <div className="py-4 flex justify-between items-center">
              {/* Sidebar Toggle - Mobile Only */}
              <div className="lg:hidden">
                <MobileSidebar />
              </div>

              {/* Desktop: Empty space */}
              <div className="hidden lg:block" />

              {/* Right Side Actions */}
              <div className="flex items-center gap-3">
                {/* Credits Display */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                  <Gem className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm">{creditsRemaining}</span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">credits</span>
                </div>

                {/* New Campaign Button */}
                <Button
                  onClick={() => navigate("/create-campaign")}
                  className="gap-2"
                  size="default"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">New Campaign</span>
                  <span className="sm:hidden">New</span>
                </Button>

                {/* User Avatar */}
                <Avatar
                  onClick={() => navigate("/profile")}
                  className="cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
                >
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Full Width */}
        <div className="px-6 lg:px-8 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <CampaignsList userId={user.id} />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
