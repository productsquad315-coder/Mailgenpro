import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trash2, ExternalLink, RefreshCcw, Plus, Zap, ArrowRight, Loader2 } from "lucide-react";
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
          <SpotlightCard key={i} className="p-8 h-64 flex flex-col justify-between border-white/5 bg-card/20">
            <div className="space-y-4">
              <div className="h-8 bg-white/5 rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-white/5 rounded w-1/2 animate-pulse" />
            </div>
            <div className="h-10 bg-white/5 rounded w-full animate-pulse" />
          </SpotlightCard>
        ))}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <SpotlightCard className="p-16 text-center flex flex-col items-center justify-center min-h-[400px]">
        <JewelIcon icon={Zap} size="lg" color="orange" className="mb-8" />
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

      <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-10">
        {campaigns.map((campaign, i) => (
          <motion.div
            key={campaign.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <SpotlightCard className="group h-full flex flex-col relative overflow-hidden p-10 hover:translate-y-[-8px] transition-all duration-500">

              <div className="flex items-center justify-between mb-10">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-40">
                    Protocol Launch
                  </span>
                  <span className="text-xs font-mono text-muted-foreground/60">
                    {format(new Date(campaign.created_at), "MMM d, yyyy")}
                  </span>
                </div>

                {campaign.status === 'completed' ? (
                  <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active System</span>
                  </div>
                ) : campaign.status === 'analyzing' ? (
                  <div className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
                    <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Processing Data</span>
                  </div>
                ) : (
                  <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-zinc-500" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Idle</span>
                  </div>
                )}
              </div>

              <div className="flex-1 mb-12">
                <h3 className="font-heading font-black text-4xl mb-4 text-foreground group-hover:text-primary transition-colors duration-500 tracking-tighter leading-none">
                  {campaign.name}
                </h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground/60 bg-white/5 w-fit px-4 py-2 rounded-xl border border-white/5">
                  <ExternalLink className="w-4 h-4 text-primary/50" />
                  <span className="truncate max-w-[300px] font-medium">{campaign.url.replace('https://', '')}</span>
                </div>
              </div>

              <div className="mt-auto pt-8 flex items-center justify-between border-t border-white/5">
                <div className="text-[10px] font-mono text-muted-foreground/30 flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-white/20" />
                  Ref: {campaign.id.split('-')[0].toUpperCase()}
                </div>

                <div className="flex items-center gap-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className="p-3 rounded-xl hover:bg-red-500/10 text-muted-foreground/30 hover:text-red-400 transition-all duration-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="glass-card border-white/10">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-bold font-heading">Destroy Campaign Data?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">This operation is permanent and cannot be reversed by the administrator.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-white/5">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(campaign.id)} className="bg-red-500 hover:bg-red-600 px-8">Confirm Deletion</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Button
                    className="h-12 px-8 bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded-xl transition-all duration-300 transform group-hover:scale-105"
                    onClick={() => navigate(`/campaign/${campaign.id}`)}
                    disabled={campaign.status !== "completed"}
                  >
                    <span>Analyze Details</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>

            </SpotlightCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CampaignsList;