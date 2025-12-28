import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, Trash2, ExternalLink, Loader2, RefreshCcw } from "lucide-react";
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

    // Set up realtime subscription
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
      // Optimistically remove from UI
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
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="glass-card p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="h-20 bg-muted rounded" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card className="glass-card p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Nothing here yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first campaign to get started
          </p>
          <Button onClick={() => navigate("/create-campaign")} className="btn-premium">
            Create campaign
          </Button>
        </div>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      case "analyzing":
        return "bg-blue-500/20 text-blue-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Campaigns</h2>
          <p className="text-muted-foreground mt-1">
            {campaigns.length} {campaigns.length === 1 ? 'campaign' : 'campaigns'} created
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.reload()}
          className="gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Campaign Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign, i) => (
          <motion.div
            key={campaign.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <Card className="group relative overflow-hidden border-2 border-border/50 hover:border-primary/50 transition-all duration-300 h-full flex flex-col">
              {/* Status Indicator Bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${campaign.status === 'completed' ? 'bg-green-500' :
                  campaign.status === 'analyzing' ? 'bg-blue-500' :
                    campaign.status === 'pending' ? 'bg-yellow-500' :
                      'bg-muted'
                }`} />

              <div className="p-6 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg mb-2 truncate group-hover:text-primary transition-colors">
                      {campaign.name}
                    </h3>
                    <Badge
                      variant="secondary"
                      className={`${getStatusColor(campaign.status)} font-medium text-xs px-2.5 py-0.5`}
                    >
                      {campaign.status === 'analyzing' && (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      )}
                      {campaign.status}
                    </Badge>
                  </div>
                </div>

                {/* URL */}
                <div className="mb-4 flex-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate font-medium">{campaign.url}</span>
                  </div>
                </div>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 pb-4 border-b border-border/50">
                  <span>Created {format(new Date(campaign.created_at), "MMM d, yyyy")}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => navigate(`/campaign/${campaign.id}`)}
                    disabled={campaign.status !== "completed"}
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-destructive/10 hover:text-destructive"
                          disabled={deletingIds.has(campaign.id)}
                        >
                          {deletingIds.has(campaign.id) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete campaign?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{campaign.name}" and all its emails. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(campaign.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CampaignsList;