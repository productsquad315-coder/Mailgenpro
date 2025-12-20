import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, Trash2, ExternalLink, Loader2 } from "lucide-react";
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

    // Performance: Wait a tiny bit for the UI to breathe
    await new Promise(r => setTimeout(r, 100));

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
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Campaigns</h2>
        <span className="text-sm text-muted-foreground">{campaigns.length} total</span>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {campaigns.map((campaign, i) => (
          <motion.div
            key={campaign.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <Card className="glass-card p-8 hover-lift h-full flex flex-col border-primary/10">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-xl mb-3 truncate tracking-tight">
                    {campaign.name}
                  </h3>
                  <Badge className={getStatusColor(campaign.status)}>
                    {campaign.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 mb-6 flex-1">
                <p className="text-sm text-muted-foreground truncate font-medium">
                  {campaign.url}
                </p>
                <p className="text-xs text-muted-foreground/80">
                  Created {format(new Date(campaign.created_at), "MMM d, yyyy")}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 hover-lift"
                  onClick={() => navigate(`/campaign/${campaign.id}`)}
                  disabled={campaign.status !== "completed"}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:text-destructive"
                      disabled={deletingIds.has(campaign.id)}
                    >
                      {deletingIds.has(campaign.id) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete campaign?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this campaign and all its emails. This can't be undone.
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
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CampaignsList;