import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUserPlan = () => {
  const [plan, setPlan] = useState<string>("trial");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const { data: creditsResponse } = await supabase.rpc('get_my_credits');
        const currentData = (creditsResponse?.[0] || {}) as any;
        if (currentData.plan) {
          setPlan(currentData.plan);
        }
      } catch (error) {
        console.error("Error fetching plan in hook:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, []);

  const isTrial = plan === "trial";
  const isStarter = plan === "starter";
  const isPro = plan === "pro";
  const isLifetime = plan === "lifetime";

  return { plan, isTrial, isStarter, isPro, isLifetime, loading };
};
