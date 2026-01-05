import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

      <div className="grid md:grid-cols-2 gap-6">
        {campaigns.map((campaign, i) => (
          <motion.div
            key={campaign.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <SpotlightCard className="group h-full flex flex-col relative overflow-hidden p-8 hover:bg-card/50 transition-colors">

              {/* Top Row: Date & ID (Minimal) */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                  {format(new Date(campaign.created_at), "MMM d, yyyy")}
                </span>
                {/* Only show loader if processing, otherwise clean */}
                {campaign.status === 'analyzing' && (
                  <div className="flex items-center gap-2 text-blue-400 text-xs font-medium bg-blue-500/10 px-2 py-1 rounded-full">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Processing
                  </div>
                )}
              </div>

              {/* Main Content: Title */}
              <div className="flex-1 mb-6">
                <h3 className="font-heading font-bold text-2xl mb-3 text-foreground group-hover:text-primary transition-colors leading-tight">
                  {campaign.name}
                </h3>

                {/* URL - Subtle */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[250px]">{campaign.url}</span>
                </div>
              </div>

              {/* Footer: Actions (Floating, Clean) */}
              <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
                <div className="text-xs text-muted-foreground font-mono opacity-50">
                  #{campaign.id.slice(0, 6)}
                </div>

                <div className="flex items-center gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className="p-2.5 rounded-xl hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all duration-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(campaign.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Button
                    className="bg-white/5 hover:bg-white/10 text-foreground border border-white/10 hover:border-white/20 rounded-xl px-5"
                    onClick={() => navigate(`/campaign/${campaign.id}`)}
                    disabled={campaign.status !== "completed"}
                  >
                    <span>Details</span>
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