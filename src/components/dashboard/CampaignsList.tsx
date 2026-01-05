import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, Trash2, ExternalLink, Loader2, RefreshCcw, Plus, Zap, ArrowUpRight, BarChart3 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { JewelIcon } from "@/components/ui/JewelIcon";

interface CampaignsListProps {
  userId: string;
}

const CampaignsList = ({ userId }: CampaignsListProps) => {
  const navigate = useNavigate();
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching campaigns:", error);
        toast.error("Failed to load campaigns");
      } else {
        setCampaigns(data || []);
      }
      setLoading(false);
    };

    fetchCampaigns();

    const channel = supabase
      .channel("campaigns_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "campaigns",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchCampaigns();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    setDeletingIds(prev => new Set(prev).add(id));

    const { error } = await supabase.from("campaigns").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete campaign");
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      setCampaigns(prev => prev.filter(c => c.id !== id));
      toast.success("Campaign deleted");
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <SpotlightCard key={i} className="p-6 h-64 flex flex-col justify-between border-white/5 bg-card/20">
            <div className="space-y-4">
              <div className="flex justify-between">
                <div className="h-4 bg-white/5 rounded w-20 animate-pulse" />
                <div className="h-4 bg-white/5 rounded w-24 animate-pulse" />
              </div>
              <div className="h-10 bg-white/5 rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-white/5 rounded w-1/2 animate-pulse" />
            </div>
            <div className="h-12 bg-white/5 rounded w-full animate-pulse" />
          </SpotlightCard>
        ))}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <SpotlightCard className="p-16 text-center flex flex-col items-center justify-center min-h-[400px]">
        <JewelIcon icon={Zap} size="xl" color="amber" className="mb-8" />
        <h3 className="text-3xl font-heading font-bold mb-2">Initialize Protocol</h3>
        <p className="text-muted-foreground mb-8 text-lg max-w-lg mx-auto">
          No active campaigns detected in the system. Launch your first sequence to begin.
        </p>
        <Button onClick={() => navigate("/create-campaign")} className="btn-premium px-8 py-6 text-lg rounded-xl">
          <Plus className="w-5 h-5 mr-2" />
          Create First Campaign
        </Button>
      </SpotlightCard>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed": return { color: "text-emerald-400", dot: "bg-emerald-400", label: "Active" };
      case "pending": return { color: "text-amber-400", dot: "bg-amber-400", label: "Pending" };
      case "analyzing": return { color: "text-blue-400", dot: "bg-blue-400", label: "Processing" };
      default: return { color: "text-zinc-400", dot: "bg-zinc-400", label: "Draft" };
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight">Campaign Index</h2>
          <p className="text-muted-foreground mt-1 text-lg">
            Active sequences and performance data.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="gap-2 border-white/10 hover:bg-white/5"
        >
          <RefreshCcw className="w-4 h-4" />
          <span>Sync</span>
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {campaigns.map((campaign, i) => {
          const status = getStatusConfig(campaign.status);

          return (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <SpotlightCard className="group h-full flex flex-col relative overflow-hidden hover:border-primary/30 transition-colors">
                {/* Tech Header */}
                <div className="flex items-center justify-between border-b border-white/5 bg-white/2 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${status.dot} shadow-[0_0_8px] shadow-${status.dot.split('-')[1]}-400/50`} />
                    <span className={`text-xs font-mono font-medium uppercase tracking-widest ${status.color}`}>
                      {campaign.status === 'analyzing' ? 'Processing Data...' : status.label}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-muted-foreground/50">
                    ID: {campaign.id.slice(0, 8)}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  {/* Date Stamp */}
                  <div className="mb-4">
                    <span className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-widest border border-white/10 px-2 py-1 rounded-sm">
                      {format(new Date(campaign.created_at), "dd MMM yyyy • HH:mm")}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-heading font-bold text-2xl mb-2 group-hover:text-primary transition-colors leading-tight">
                    {campaign.name}
                  </h3>

                  {/* URL / Meta */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8 bg-white/5 w-fit px-3 py-1.5 rounded-lg border border-white/5 group-hover:border-white/10 transition-colors">
                    <ExternalLink className="w-3 h-3 text-primary/50" />
                    <span className="truncate max-w-[200px] font-mono text-xs text-primary/80">{campaign.url}</span>
                  </div>

                  {/* Footer Actions */}
                  <div className="mt-auto pt-6 flex items-center justify-between gap-4">
                    <Button
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-primary/30 transition-all duration-300 group/btn"
                      onClick={() => navigate(`/campaign/${campaign.id}`)}
                      disabled={campaign.status !== "completed"}
                    >
                      <span className="mr-2">View Data</span>
                      <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="p-3 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors border border-transparent hover:border-red-500/20"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Campaign Sequence?</AlertDialogTitle>
                          <AlertDialogDescription>This protocol cannot be reversed. All data will be purged.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Abort</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(campaign.id)} className="bg-destructive hover:bg-destructive/90">Confirm Deletion</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default CampaignsList;