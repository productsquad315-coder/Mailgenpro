import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LayoutDashboard, CreditCard, HelpCircle, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import mailgenproIcon from "@/assets/mailgenpro-icon.png";

const DashboardSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [credits, setCredits] = useState<number | null>(null);

  const fetchCredits = async () => {
    const { data, error } = await supabase.rpc("get_my_credits");
    if (!error && data && data.length > 0) {
      const row = data[0] as any;
      setCredits((row.credits_free || 0) + (row.credits_paid || 0));
    }
  };

  useEffect(() => {
    fetchCredits();

    const channel = supabase
      .channel("sidebar_credits")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_usage" },
        () => fetchCredits()
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Campaigns", path: "/dashboard" },
    { icon: CreditCard, label: "Billing", path: "/billing" },
    { icon: User, label: "Profile", path: "/profile" },
    { icon: HelpCircle, label: "Help", path: "/help" },
  ];

  // Hide sidebar on desktop - user prefers minimized look
  // Sidebar content is available via MobileSidebar component
  return null;
};

export default DashboardSidebar;