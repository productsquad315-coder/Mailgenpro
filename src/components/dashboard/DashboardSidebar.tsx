import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LayoutDashboard, CreditCard, HelpCircle, User, LogOut, Gem } from "lucide-react";
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

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-card border-r">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b">
          <img src={mailgenproIcon} alt="MailGenPro" className="w-8 h-8" />
          <span className="font-bold text-lg tracking-tight">Mailgenpro</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Credits & Sign Out */}
        <div className="p-4 border-t space-y-3">
          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center gap-2">
              <Gem className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Credits</span>
            </div>
            <span className="text-sm font-bold">{credits ?? "--"}</span>
          </div>

          <Button
            variant="ghost"
            onClick={() => navigate("/billing")}
            className="w-full justify-start gap-2 text-sm"
          >
            Top Up
          </Button>

          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar;