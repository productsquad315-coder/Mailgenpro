import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LayoutDashboard, CreditCard, HelpCircle, User, LogOut, Gem, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import mailgenproIcon from "@/assets/mailgenpro-icon.png";
import { JewelIcon } from "@/components/ui/JewelIcon";

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
      .on("postgres_changes", { event: "*", schema: "public", table: "user_usage" }, () => fetchCredits())
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Campaigns", path: "/dashboard", color: "blue" },
    { icon: CreditCard, label: "Billing", path: "/billing", color: "purple" },
    { icon: User, label: "Profile", path: "/profile", color: "green" },
    { icon: HelpCircle, label: "Help", path: "/help", color: "orange" },
  ];

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 lg:my-4 lg:ml-4 z-50">
      <div className="flex flex-col h-full rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 pb-8">
          <div className="relative group">
            <div className="absolute -inset-2 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            <img src={mailgenproIcon} alt="MailGenPro" className="w-9 h-9 relative z-10" />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            MailGenPro
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative group flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-300",
                  isActive
                    ? "bg-primary/10 border border-primary/20 text-white shadow-lg shadow-primary/5"
                    : "hover:bg-white/5 hover:text-white text-muted-foreground border border-transparent"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 w-1 h-8 bg-primary rounded-full blur-[2px] shadow-[0_0_10px_rgba(124,58,237,0.5)]" />
                )}
                <JewelIcon
                  icon={item.icon}
                  color={item.color as any}
                  size="sm"
                  className={cn("transition-transform group-hover:scale-110", isActive && "bg-primary/20 border-primary/30")}
                />
                <span className={cn("font-medium tracking-wide text-sm", isActive && "font-semibold")}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 to-transparent opacity-50" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Credits & Utils */}
        <div className="p-4 mt-auto mb-2 space-y-4 relative z-10">
          {/* Credits Pill */}
          <div className="relative overflow-hidden group rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-4 cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate('/billing')}>
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20 text-primary">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Balance</span>
                  <span className="font-heading font-bold text-lg text-white">{credits ?? "--"}</span>
                </div>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start gap-3 pl-4 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Sign Out</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar;