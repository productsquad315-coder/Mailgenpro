import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Check, Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { trackPlanUpgrade } from "@/lib/analytics";
import { openLemonSqueezyCheckout } from "@/lib/lemonSqueezy";
import { LEMON_SQUEEZY_PRICES } from "@/lib/lemonSqueezyPrices";

const ChoosePlan = () => {
  const navigate = useNavigate();
  const [isLifetime, setIsLifetime] = useState(true); // Default to lifetime to feature it
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
      setLoading(false);
    });
  }, [navigate]);

  const handleCheckout = async (priceId: string, planName: string, price: number) => {
    trackPlanUpgrade(planName, price);

    try {
      if (userId) {
        await openLemonSqueezyCheckout(priceId, userId);
      } else {
        await openLemonSqueezyCheckout(priceId);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to open checkout. Please try again.');
    }
  };

  const handleSkipToFree = () => {
    // Check if there's a pending campaign from guest signup
    const pendingCampaignId = localStorage.getItem("pendingCampaignId");
    if (pendingCampaignId) {
      localStorage.removeItem("pendingCampaignId");
      navigate(`/campaign/${pendingCampaignId}`);
    } else {
      navigate("/dashboard");
    }
  };

  const plans = [
    {
      name: "Starter",
      price: isLifetime ? "$59" : "$11",
      period: isLifetime ? "one-time" : "per month",
      description: "For growing businesses",
      features: [
        "150 credits per month",
        "Remove watermark",
        "Priority AI speed",
        "Email support"
      ],
      popular: !isLifetime,
      showToggle: true,
      priceId: isLifetime ? LEMON_SQUEEZY_PRICES.STARTER_LIFETIME : LEMON_SQUEEZY_PRICES.STARTER_MONTHLY,
      priceValue: isLifetime ? 59 : 11
    },
    {
      name: "Pro",
      price: "$29",
      period: "per month",
      description: "For power users",
      features: [
        "500 credits per month",
        "Everything in Starter",
        "Auto-Translate",
        "Priority AI & early access"
      ],
      popular: false,
      priceId: LEMON_SQUEEZY_PRICES.PRO_MONTHLY,
      priceValue: 29
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">Choose Your Plan to Continue</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Unlock the full power of AI-driven email campaigns
          </p>
        </motion.div>

        {/* Lifetime Deal Banner */}
        {isLifetime && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-violet-500/10 border border-violet-500/30"
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <Zap className="w-6 h-6 text-primary animate-pulse" />
              <h3 className="text-2xl font-bold">🎉 Limited Time: Lifetime Deal Available!</h3>
              <Zap className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <p className="text-center text-muted-foreground">
              Get lifetime access for a one-time payment. No recurring fees. Ever.
            </p>
          </motion.div>
        )}

        {/* Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center justify-center gap-4 mb-8"
        >
          <span className={!isLifetime ? 'font-medium' : 'text-muted-foreground'}>Monthly</span>
          <Switch
            checked={isLifetime}
            onCheckedChange={setIsLifetime}
            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-violet-600 data-[state=checked]:to-indigo-600"
          />
          <span className={isLifetime ? 'font-medium flex items-center gap-2' : 'text-muted-foreground'}>
            Lifetime
            {isLifetime && <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">Save 85%</span>}
          </span>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <span className="inline-flex items-center gap-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-lg border border-white/10">
                    <Sparkles className="w-3 h-3" />
                    Most Popular
                  </span>
                </div>
              )}
              {isLifetime && plan.name === "Starter" && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <span className="inline-flex items-center gap-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-lg animate-pulse border border-white/10">
                    <Zap className="w-3 h-3" />
                    Lifetime Deal
                  </span>
                </div>
              )}
              <Card className={`p-8 h-full glass-card hover-lift ${(plan.popular || (isLifetime && plan.name === "Starter")) ? 'border-primary/50 shadow-lg shadow-primary/10' : ''}`}>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/ {plan.period}</span>
                  </div>
                  {isLifetime && plan.name === "Starter" && (
                    <p className="text-sm text-primary font-medium mt-2">Pay once, use forever ✨</p>
                  )}
                </div>

                <Button
                  className={`w-full mb-6 ${(plan.popular || (isLifetime && plan.name === "Starter")) ? 'btn-premium' : ''}`}
                  variant={(plan.popular || (isLifetime && plan.name === "Starter")) ? "default" : "outline"}
                  onClick={() => {
                    handleCheckout(plan.priceId, plan.name, plan.priceValue);
                  }}
                >
                  Get Started
                </Button>

                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Skip to Free */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="text-center"
        >
          <button
            onClick={handleSkipToFree}
            className="text-muted-foreground hover:text-primary transition-colors underline text-sm"
          >
            Let me try it first with the free plan
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default ChoosePlan;
