import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Zap, Crown, CreditCard, Sparkles, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useState } from "react";
import type { CarouselApi } from "@/components/ui/carousel";
import { openPaddleCheckout } from "@/lib/paddle";
import { PADDLE_PRICES } from "@/lib/paddlePrices";
import { toast } from "sonner";

interface OutOfCreditsModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

const OutOfCreditsModal = ({ open, onClose, userId }: OutOfCreditsModalProps) => {
  const [view, setView] = useState<'choice' | 'credits' | 'plans'>('choice');
  const [selectedPack, setSelectedPack] = useState(1); // Growth Pack default
  const [api, setApi] = useState<CarouselApi>();

  // Update selected pack based on carousel scroll
  useState(() => {
    if (!api) return;

    const onSelect = () => {
      const selected = api.selectedScrollSnap();
      setSelectedPack(selected);
    };

    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  });

  const creditPacks = [
    {
      id: 0,
      name: "Starter Pack",
      price: 5,
      credits: 40,
      priceId: PADDLE_PRICES.PACK_STARTER
    },
    {
      id: 1,
      name: "Growth Pack",
      price: 12,
      credits: 120,
      priceId: PADDLE_PRICES.PACK_GROWTH,
      popular: true
    },
    {
      id: 2,
      name: "Pro Pack",
      price: 25,
      credits: 300,
      priceId: PADDLE_PRICES.PACK_PRO
    },
    {
      id: 3,
      name: "Agency Pack",
      price: 60,
      credits: 800,
      priceId: PADDLE_PRICES.PACK_AGENCY
    }
  ];

  const plans = [
    {
      name: "Starter",
      price: 11,
      description: "For growing businesses",
      icon: CreditCard,
      color: "from-primary to-accent",
      priceId: PADDLE_PRICES.STARTER_MONTHLY,
      features: ["150 credits per month", "Remove watermark", "Priority AI speed", "Email support"],
      popular: true
    },
    {
      name: "Pro",
      price: 29,
      description: "For power users",
      icon: Crown,
      color: "from-accent to-primary",
      priceId: PADDLE_PRICES.PRO_MONTHLY,
      features: ["500 credits per month", "Everything in Starter", "Auto-Translate", "Priority AI & early access"]
    },
    {
      name: "Lifetime",
      price: 59,
      description: "For growing businesses",
      icon: Sparkles,
      color: "from-primary to-accent",
      priceId: PADDLE_PRICES.STARTER_LIFETIME,
      features: ["150 credits per month", "Remove watermark", "Priority AI speed", "Email support"],
      isLifetime: true
    }
  ];

  const handleCheckout = async (priceId: string) => {
    try {
      await openPaddleCheckout(priceId, userId);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to open checkout. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-0 bg-background/10 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-0 rounded-[28px] border border-white/10">
        <div className="relative overflow-hidden">
          {/* Soft animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-indigo-500/10 animate-pulse opacity-50" />

          <motion.div
            className="relative p-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <DialogHeader className="text-center space-y-3 mb-8">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex justify-center mb-2"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 backdrop-blur-sm flex items-center justify-center shadow-[0_8px_16px_rgba(0,0,0,0.2)]">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </motion.div>
              <DialogTitle className="text-3xl font-bold text-foreground drop-shadow-sm">
                Out of credits
              </DialogTitle>
              <p className="text-muted-foreground text-lg">Pick one to keep going</p>
            </DialogHeader>

            <AnimatePresence mode="wait">
              {view === 'choice' && (
                <motion.div
                  key="choice"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Buy Credits Button */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Button
                      onClick={() => setView('credits')}
                      className="w-full h-24 rounded-[24px] bg-gradient-to-r from-primary/20 to-accent/20 hover:from-primary/30 hover:to-accent/30 backdrop-blur-md border border-white/20 shadow-[0_8px_16px_rgba(0,0,0,0.1)] transition-all duration-300"
                      variant="outline"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg">
                          <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-xl font-bold text-foreground">Top-up</h3>
                          <p className="text-sm text-muted-foreground">Buy credits to keep creating</p>
                        </div>
                      </div>
                    </Button>
                  </motion.div>

                  {/* Upgrade Plan Button */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Button
                      onClick={() => setView('plans')}
                      className="w-full h-24 rounded-[24px] bg-gradient-to-r from-accent/20 to-primary/20 hover:from-accent/30 hover:to-primary/30 backdrop-blur-md border border-white/20 shadow-[0_8px_16px_rgba(0,0,0,0.1)] transition-all duration-300"
                      variant="outline"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-fuchsia-600 to-pink-600 flex items-center justify-center shadow-lg">
                          <Crown className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-xl font-bold text-foreground">Upgrade</h3>
                          <p className="text-sm text-muted-foreground">Monthly credits + features</p>
                        </div>
                      </div>
                    </Button>
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center text-sm text-muted-foreground pt-4"
                  >
                    Not sure? Start small with a top-up.
                  </motion.p>
                </motion.div>
              )}

              {view === 'credits' && (
                <motion.div
                  key="credits"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3, type: "spring", stiffness: 200, damping: 20 }}
                  className="space-y-6"
                >
                  <Button
                    onClick={() => setView('choice')}
                    variant="ghost"
                    className="mb-4 text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>

                  {/* Carousel for Credit Packs */}
                  <div className="relative px-2 md:px-16">
                    <Carousel
                      className="w-full"
                      opts={{ align: "center", loop: false, startIndex: 1 }}
                      setApi={setApi}
                    >
                      <CarouselContent className="-ml-2 md:-ml-4">
                        {creditPacks.map((pack, index) => (
                          <CarouselItem key={pack.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/2 lg:basis-1/3">
                            <motion.div
                              onClick={() => {
                                api?.scrollTo(index);
                                setSelectedPack(index);
                              }}
                              className="cursor-pointer h-full"
                              transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            >
                              <Card className={`
                                h-full p-4 md:p-6 rounded-[24px] transition-all duration-500
                                ${selectedPack === index
                                  ? 'bg-background/80 backdrop-blur-lg border-primary/50 shadow-[0_8px_32px_rgba(0,0,0,0.2)] opacity-100 scale-100'
                                  : 'bg-background/30 backdrop-blur-md border-white/10 opacity-60 scale-95 blur-[1px] md:blur-[2px]'
                                }
                              `}>
                                {pack.popular && selectedPack === index && (
                                  <motion.div
                                    className="mb-3"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                  >
                                    <span className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold shadow-md">
                                      Most Popular
                                    </span>
                                  </motion.div>
                                )}
                                <div className="text-center space-y-2 md:space-y-3">
                                  <h4 className="font-bold text-base md:text-lg text-foreground">{pack.name}</h4>
                                  <div>
                                    <span className="text-3xl md:text-4xl font-bold text-foreground">${pack.price}</span>
                                  </div>
                                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                    <Zap className="w-4 h-4 text-primary" />
                                    <span className="text-base md:text-lg font-semibold">{pack.credits} credits</span>
                                  </div>
                                </div>
                              </Card>
                            </motion.div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                    </Carousel>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Button
                      onClick={() => handleCheckout(creditPacks[selectedPack].priceId)}
                      className="w-full h-14 rounded-[24px] btn-premium text-lg font-semibold"
                      size="lg"
                    >
                      <CreditCard className="w-5 h-5 mr-2" />
                      Buy {creditPacks[selectedPack]?.name || 'Credits'}
                    </Button>
                  </motion.div>
                </motion.div>
              )}

              {view === 'plans' && (
                <motion.div
                  key="plans"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3, type: "spring", stiffness: 200, damping: 20 }}
                  className="space-y-6"
                >
                  <Button
                    onClick={() => setView('choice')}
                    variant="ghost"
                    className="mb-4 text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[60vh] md:max-h-none overflow-y-auto">
                    {plans.map((plan, index) => {
                      const Icon = plan.icon;
                      return (
                        <motion.div
                          key={plan.name}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: index * 0.1,
                            type: "spring",
                            stiffness: 400,
                            damping: 17
                          }}
                          className="h-full"
                        >
                          <Card className={`p-4 md:p-6 rounded-[24px] bg-background/40 backdrop-blur-lg border-white/20 hover:bg-background/60 transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.1)] min-h-[360px] md:h-[380px] flex flex-col relative ${(plan as any).popular ? 'border-primary/50' : ''}`}>
                            {(plan as any).popular && (
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <span className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-semibold shadow-md">
                                  Most Popular
                                </span>
                              </div>
                            )}
                            <div className="flex flex-col items-center text-center space-y-3 md:space-y-4 flex-1">
                              <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-lg`}>
                                <Icon className="w-6 h-6 md:w-8 md:h-8 text-primary-foreground" />
                              </div>
                              <div>
                                <h4 className="font-bold text-xl md:text-2xl text-foreground mb-1">{plan.name}</h4>
                                <p className="text-xs md:text-sm text-muted-foreground mb-2">{(plan as any).description}</p>
                                <p className="text-2xl md:text-3xl font-bold text-foreground">
                                  ${plan.price}
                                  <span className="text-sm font-normal text-muted-foreground">
                                    {(plan as any).isLifetime ? ' / one-time' : ' / per month'}
                                  </span>
                                </p>
                              </div>
                              <ul className="space-y-1.5 md:space-y-2 flex-1 w-full px-2 md:px-4">
                                {plan.features.map((feature, idx) => (
                                  <li key={idx} className="text-xs md:text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="text-primary mt-0.5 text-sm md:text-base">✓</span>
                                    <span>{feature}</span>
                                  </li>
                                ))}
                              </ul>
                              <Button
                                onClick={() => handleCheckout((plan as any).priceId)}
                                className="w-full h-10 md:h-12 rounded-[16px] btn-premium font-semibold mt-auto text-sm md:text-base"
                              >
                                {(plan as any).isLifetime ? 'Get Lifetime' : 'Upgrade'}
                              </Button>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OutOfCreditsModal;
