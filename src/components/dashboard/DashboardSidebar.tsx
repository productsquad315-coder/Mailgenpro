import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LayoutDashboard, FolderKanban, CreditCard, HelpCircle, User, LogOut, Users } from "lucide-react";
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
        { event: "*", schema: "public", table: "email_credits" },
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
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex flex-col flex-1 bg-card border-r border-border">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-border">
          <img src={mailgenproIcon} alt="Mailgenpro" className="w-11 h-11" />
          <span className="font-bold text-xl tracking-tight">Mailgenpro</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Credit Display & Sign Out */}
        <div className="p-3 border-t border-border space-y-3">
          <div className="px-3 py-2 rounded-lg bg-primary/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${credits === 0 ? 'bg-destructive' : 'bg-primary'}`} />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Credits</span>
                <span className="text-sm font-bold text-foreground leading-none">
                  {credits !== null ? credits : "..."}
                </span>
              </div>
            </div>
            <Link to="/usage" className="p-1.5 rounded-md hover:bg-background text-xs font-semibold transition-colors">
              Top Up
            </Link>
          </div>

          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar;