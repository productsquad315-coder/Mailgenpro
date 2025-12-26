import { useState, useEffect } from "react";

export const useUserPlan = () => {
  // TEMP: user_usage deprecated
  const [plan] = useState<string>("free");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  const isTrial = plan === "trial";
  const isStarter = plan === "starter";
  const isPro = plan === "pro";
  const isLifetime = plan === "lifetime";

  return { plan, isTrial, isStarter, isPro, isLifetime, loading };
};
