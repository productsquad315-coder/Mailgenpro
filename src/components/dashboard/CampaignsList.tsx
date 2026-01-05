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

      <div className="grid md:grid-cols-2 gap-8">
        {campaigns.map((campaign, i) => (
          <motion.div
            key={campaign.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: i * 0.1, ease: [0.21, 0.45, 0.32, 0.9] }}
            whileHover={{ y: -8, scale: 1.01 }}
            className="flex h-full"
          >
            <SpotlightCard className="group flex-1 flex flex-col relative overflow-hidden transition-all duration-500">

              {/* Stage 3: Prismatic Accent (Very Thin) */}
              <div className={`absolute top-0 left-0 right-0 h-[2px] opacity-40 group-hover:opacity-100 transition-opacity duration-700 ${campaign.status === 'completed' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                campaign.status === 'analyzing' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                  'bg-gradient-to-r from-zinc-500 to-slate-500'
                }`} />

              <div className="p-8 flex-1 flex flex-col">

                {/* Asymmetric Header */}
                <div className="flex items-start justify-between mb-8">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/60 leading-none">
                      Protocol Initialized
                    </span>
                    <span className="text-xs font-mono text-muted-foreground/40">
                      {format(new Date(campaign.created_at), "yyyy.MM.dd")}
                    </span>
                  </div>

                  <JewelIcon
                    icon={campaign.status === 'analyzing' ? Loader2 : Zap}
                    color={campaign.status === 'completed' ? 'green' : campaign.status === 'analyzing' ? 'blue' : 'primary'}
                    size="sm"
                    className={campaign.status === 'analyzing' ? 'animate-spin' : ''}
                  />
                </div>

                {/* Hero Title (Editorial) */}
                <div className="mb-8">
                  <motion.h3
                    className="font-heading font-black text-3xl tracking-tighter text-foreground group-hover:text-primary transition-colors duration-500 leading-[0.9]"
                    whileHover={{ x: 4 }}
                  >
                    {campaign.name}
                  </motion.h3>
                </div>

                {/* Technical Insets (Asymmetric) */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mb-1">Target URL</div>
                    <div className="text-[11px] font-mono text-primary/70 truncate">{campaign.url.replace('https://', '')}</div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mb-1">System ID</div>
                    <div className="text-[11px] font-mono text-muted-foreground/60 truncate">{campaign.id.split('-')[0].toUpperCase()}</div>
                  </div>
                </div>

                {/* Minimalist Action Bar */}
                <div className="mt-auto pt-6 flex items-center justify-between border-t border-white/5">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors shadow-[0_0_8px_rgba(124,58,237,0.3)]" />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-bold group-hover:text-muted-foreground/60 transition-colors">
                      Online
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground/40 hover:text-red-400 transition-all"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="glass-card border-white/10">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-2xl font-heading font-bold">Purge System Data?</AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground">This operation is destructive and cannot be rollbacked.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-white/5 border-white/10">Abort</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(campaign.id)} className="bg-red-500 hover:bg-red-600">Execute Purge</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <Button
                      className="bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 hover:border-primary px-6 rounded-full transition-all duration-500 group/btn"
                      onClick={() => navigate(`/campaign/${campaign.id}`)}
                      disabled={campaign.status !== "completed"}
                    >
                      <span className="text-xs font-bold uppercase tracking-widest">Interface</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </div>
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