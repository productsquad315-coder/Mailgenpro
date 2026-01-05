import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, Trash2, ExternalLink, Loader2, RefreshCcw, Plus, Zap } from "lucide-react";
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
          <SpotlightCard key={i} className="p-8 h-64 flex flex-col justify-between">
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-white/5 rounded w-16" />
              <div className="h-8 bg-white/5 rounded w-3/4" />
              <div className="h-4 bg-white/5 rounded w-1/2" />
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
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 animate-float">
          <Zap className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-3xl font-heading font-bold mb-2">Start your engine</h3>
        <p className="text-muted-foreground mb-8 text-lg max-w-lg mx-auto">
          You haven't generated any campaigns yet. Launch your first one to see the power of MailGenPro.
        </p>
        <Button onClick={() => navigate("/create-campaign")} className="btn-premium px-8 py-6 text-lg rounded-xl">
          <Plus className="w-5 h-5 mr-2" />
          Create First Campaign
        </Button>
      </SpotlightCard>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "pending": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "analyzing": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight">Campaigns</h2>
          <p className="text-muted-foreground mt-1 text-lg">
            Manage your high-performance email sequences.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="gap-2 border-white/10 hover:bg-white/5"
        >
          <RefreshCcw className="w-4 h-4" />
          <span>Refresh</span>
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
            <SpotlightCard className="group h-full flex flex-col relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full opacity-60 transition-colors duration-300 ${campaign.status === 'completed' ? 'bg-emerald-500' :
                  campaign.status === 'analyzing' ? 'bg-blue-500' :
                    campaign.status === 'pending' ? 'bg-amber-500' : 'bg-zinc-500'
                }`} />

              <div className="p-8 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-6">
                  <Badge variant="outline" className={`${getStatusColor(campaign.status)} backdrop-blur-md px-3 py-1 text-xs uppercase tracking-widest`}>
                    {campaign.status === 'analyzing' && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
                    {campaign.status}
                  </Badge>
                  <span className="text-xs font-mono text-muted-foreground/60">{format(new Date(campaign.created_at), "MMM d")}</span>
                </div>

                <h3 className="font-heading font-bold text-2xl mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {campaign.name}
                </h3>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
                  <ExternalLink className="w-3 h-3 text-primary/50" />
                  <span className="truncate max-w-[200px]">{campaign.url}</span>
                </div>

                <div className="mt-auto pt-6 border-t border-white/5 flex gap-3">
                  <Button
                    className="flex-1 bg-white/5 hover:bg-primary hover:text-white border border-white/10 hover:border-primary/20 transition-all duration-300"
                    onClick={() => navigate(`/campaign/${campaign.id}`)}
                    disabled={campaign.status !== "completed"}
                  >
                    View Details
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="hover:bg-red-500/10 hover:text-red-400" onClick={(e) => e.stopPropagation()}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(campaign.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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