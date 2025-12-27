import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Zap, TrendingUp, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface UsageCardProps {
  userId: string;
}

const UsageCard = ({ userId }: UsageCardProps) => {
  const navigate = useNavigate();
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [plan, setPlan] = useState("trial");
  const [loading, setLoading] = useState(true);
  const [hasShownLowCreditWarning, setHasShownLowCreditWarning] = useState(false);

  useEffect(() => {
    const fetchUsage = async () => {
      const { data: creditsResponse } = await supabase.rpc('get_my_credits');
      const currentCredits = (creditsResponse?.[0] || {}) as any;

      setCreditsRemaining(currentCredits.credits_total || 0);
      setPlan(currentCredits.plan || 'trial');
      setLoading(false);
    };

    fetchUsage();

    // Set up realtime subscription
    const channel = supabase
      .channel("usage_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "email_credits",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === "object") {
            const newData = payload.new as any;
            setCreditsRemaining(newData.credits_total || 0);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_usage",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === "object") {
            const newData = payload.new as any;
            setPlan(newData.plan);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  // Low credit notification effect
  useEffect(() => {
    if (loading) return;

    const isLowCredits = creditsRemaining < 10;
    const isOutOfCredits = creditsRemaining <= 0;

    if (isLowCredits && !isOutOfCredits && !hasShownLowCreditWarning) {
      toast({
        title: "Low Credits Warning",
        description: `You have ${creditsRemaining} credits remaining. Consider buying more to continue creating campaigns.`,
        variant: "destructive",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/billing')}
            className="gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Buy Credits
          </Button>
        ),
      });
      setHasShownLowCreditWarning(true);
    }

    // Reset warning flag when credits are replenished above threshold
    if (creditsRemaining >= 10 && hasShownLowCreditWarning) {
      setHasShownLowCreditWarning(false);
    }
  }, [creditsRemaining, loading, hasShownLowCreditWarning, navigate]);

  if (loading) {
    return (
      <Card className="glass-card p-6">
        <div className="animate-pulse h-24" />
      </Card>
    );
  }

  const isLowCredits = creditsRemaining < 10;
  const isOutOfCredits = creditsRemaining <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="glass-card p-6 hover-lift">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg mb-1">🔋 Credit Balance</h3>
            <p className="text-sm text-muted-foreground capitalize">
              {plan === 'trial' ? 'Free Trial' : `${plan} Plan`}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>
              {creditsRemaining} credits remaining
            </span>
            {isLowCredits && !isOutOfCredits && (
              <span className="text-yellow-500 font-medium">
                Running low!
              </span>
            )}
            {isOutOfCredits && (
              <span className="text-destructive font-medium">
                Out of credits
              </span>
            )}
          </div>
          <Progress value={Math.min(100, (creditsRemaining / 50) * 100)} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {creditsRemaining} credits available
          </p>
        </div>

        {isOutOfCredits && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive font-medium mb-2">
              You're out of credits — buy a pack to continue.
            </p>
            <Button
              variant="default"
              className="w-full"
              size="sm"
              onClick={() => navigate('/billing')}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Buy Credits
            </Button>
          </div>
        )}
        {isLowCredits && !isOutOfCredits && (
          <Button
            variant="outline"
            className="w-full mt-4 hover-lift"
            size="sm"
            onClick={() => navigate('/billing')}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Buy More Credits
          </Button>
        )}
      </Card>
    </motion.div>
  );
};

export default UsageCard;