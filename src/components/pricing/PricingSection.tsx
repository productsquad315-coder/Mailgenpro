import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackPlanUpgrade, trackButtonClick } from "@/lib/analytics";
import { openPaddleCheckout } from "@/lib/paddle";
import { PADDLE_PRICES } from "@/lib/paddlePrices";

const PricingSection = () => {
  const [isLifetime, setIsLifetime] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  const handleCheckout = async (priceId: string, planName: string, price: number) => {
    trackPlanUpgrade(planName, price);

    try {
      if (userId) {
        await openPaddleCheckout(priceId, userId);
      } else {
        await openPaddleCheckout(priceId);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to open checkout. Please try again.');
    }
  };

  const plans = [
    {
      name: "Starter",
      price: isLifetime ? "$59" : "$11",
      period: isLifetime ? "one-time" : "per month",
      description: "For growing businesses",
      features: [
        isLifetime ? "150 credits per month" : "150 credits per month",
        "Remove watermark",
        "Priority AI speed",
        "Email support"
      ],
      cta: "Get Started",
      popular: true,
      showToggle: true,
      priceId: isLifetime ? PADDLE_PRICES.STARTER_LIFETIME : PADDLE_PRICES.STARTER_MONTHLY,
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
      cta: "Go Pro",
      popular: false,
      priceId: PADDLE_PRICES.PRO_MONTHLY,
      priceValue: 29
    }
  ];

  return (
    <div className="container mx-auto max-w-5xl px-4">
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold mb-4 tracking-tight">Simple, transparent pricing</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your needs. Upgrade or downgrade anytime.
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            viewport={{ once: true }}
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
            <Card className={`p-6 md:p-8 h-full glass-card hover-lift ${plan.popular ? 'border-primary/50 shadow-lg shadow-primary/10 ring-1 ring-primary/50' : ''}`}>
              <div className="mb-4 md:mb-6">
                <h3 className="text-xl md:text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl md:text-5xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-sm md:text-base text-muted-foreground">/ {plan.period}</span>}
                </div>
              </div>

              {plan.showToggle && (
                <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-xl bg-secondary/50 mb-4 md:mb-6">
                  <span className={!isLifetime ? 'font-medium text-xs md:text-sm' : 'text-muted-foreground text-xs md:text-sm'}>Monthly</span>
                  <Switch checked={isLifetime} onCheckedChange={setIsLifetime} />
                  <span className={isLifetime ? 'font-medium text-xs md:text-sm' : 'text-muted-foreground text-xs md:text-sm'}>Lifetime</span>
                </div>
              )}

              <Button
                className={`w-full mb-4 md:mb-6 h-10 md:h-auto text-sm md:text-base ${plan.popular ? 'btn-premium' : 'hover:bg-primary/10 border-primary/20'}`}
                variant={plan.popular ? "default" : "outline"}
                onClick={() => {
                  handleCheckout(plan.priceId, plan.name, plan.priceValue);
                }}
              >
                {plan.cta}
              </Button>

              <div className="space-y-2 md:space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2 md:gap-3">
                    <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-primary" />
                    </div>
                    <span className="text-xs md:text-sm leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PricingSection;