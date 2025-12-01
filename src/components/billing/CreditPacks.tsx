import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { openPaddleCheckout } from "@/lib/paddle";
import { PADDLE_PRICES } from "@/lib/paddlePrices";
import { toast } from "sonner";

interface CreditPack {
  id: string;
  name: string;
  price: number;
  credits: number;
  priceId: string;
  popular?: boolean;
}

const creditPacks: CreditPack[] = [
  {
    id: "starter",
    name: "Starter Pack",
    price: 5,
    credits: 40,
    priceId: PADDLE_PRICES.PACK_STARTER,
  },
  {
    id: "growth",
    name: "Growth Pack",
    price: 12,
    credits: 120,
    priceId: PADDLE_PRICES.PACK_GROWTH,
    popular: true,
  },
  {
    id: "pro",
    name: "Pro Pack",
    price: 25,
    credits: 300,
    priceId: PADDLE_PRICES.PACK_PRO,
  },
  {
    id: "agency",
    name: "Agency Pack",
    price: 60,
    credits: 800,
    priceId: PADDLE_PRICES.PACK_AGENCY,
  },
];

interface CreditPacksProps {
  userId: string;
}

const CreditPacks = ({ userId }: CreditPacksProps) => {
  const handleBuyNow = async (pack: CreditPack) => {
    try {
      await openPaddleCheckout(pack.priceId, userId);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to open checkout. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Buy Credit Packs</h2>
        <p className="text-muted-foreground">
          One-time credit packs that never expire. 1 credit = 1 generated email.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {creditPacks.map((pack, index) => (
          <motion.div
            key={pack.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass-card p-6 hover-lift relative h-full flex flex-col">
              {pack.popular && (
                <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-none shadow-lg">
                  Most Popular
                </Badge>
              )}

              <div className="flex-1">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>

                <h3 className="font-semibold text-lg mb-1">{pack.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold">${pack.price}</span>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground mb-6">
                  <p className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    {pack.credits} credits
                  </p>
                  <p className="text-xs">Credits never expire</p>
                </div>
              </div>

              <Button
                onClick={() => handleBuyNow(pack)}
                variant={pack.popular ? "default" : "outline"}
                className={`w-full ${pack.popular ? 'btn-premium' : ''}`}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Buy Now
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="text-xs text-muted-foreground">
        <p>• Credits are deducted when generating email sequences (1 credit per email)</p>
        <p>• One-time packs do not roll over monthly - they're yours to keep</p>
        <p>• Credits are used in addition to your subscription plan's monthly credits</p>
      </div>
    </div>
  );
};

export default CreditPacks;
