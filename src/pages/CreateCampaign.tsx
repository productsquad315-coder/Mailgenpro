import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Loader2, Link as LinkIcon, FileText, Download, Gem, ChevronDown } from "lucide-react";
import { z } from "zod";
import { trackButtonClick, trackFunnelStep } from "@/lib/analytics";
import { getSequenceTypes } from "@/lib/sequenceTypes";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import OutOfCreditsModal from "@/components/billing/OutOfCreditsModal";

const dripDurations = [
  { value: "7-day", label: "7-Day Drip (4 emails)", emails: 4 },
  { value: "14-day", label: "14-Day Drip (7 emails)", emails: 7 },
  { value: "30-day", label: "30-Day Drip (12 emails)", emails: 12 },
  { value: "custom", label: "Custom Duration", emails: 0 },
];

const getEmailCount = (dripValue: string, customEmails?: number) => {
  if (dripValue === "custom") return customEmails || 0;
  return dripDurations.find(d => d.value === dripValue)?.emails || 0;
};

const urlSchema = z.string().url();
const nameSchema = z.string().min(3);

const CreateCampaign = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(true);
  const [userPlatform, setUserPlatform] = useState<string | null>(null);

  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [sequenceType, setSequenceType] = useState("");
  const [dripDuration, setDripDuration] = useState("");
  const [wordsPerEmail, setWordsPerEmail] = useState("");
  const [includeCTA, setIncludeCTA] = useState(false);
  const [ctaLink, setCtaLink] = useState("");
  const [customDays, setCustomDays] = useState("");
  const [customEmails, setCustomEmails] = useState("");
  const [templateStyle, setTemplateStyle] = useState("minimal");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;

      setUserId(session.user.id);
      setIsGuest(false);

      const { data: profile } = await supabase
        .from("profiles")
        .select("user_platform")
        .eq("id", session.user.id)
        .single();

      if (profile) setUserPlatform(profile.user_platform);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      urlSchema.parse(url);
      nameSchema.parse(name);

      if (!sequenceType || !dripDuration) {
        toast.error("Please complete all required fields");
        setLoading(false);
        return;
      }

      const wordsNum = parseInt(wordsPerEmail);
      if (isNaN(wordsNum) || wordsNum < 50 || wordsNum > 500) {
        toast.error("Words per email must be between 50–500");
        setLoading(false);
        return;
      }

      // ✅ FINAL CREDIT CONSUMPTION (AUTHORITATIVE)
      if (userId) {
        const { data: allowed } = await supabase.rpc("consume_one_credit");

        if (!allowed) {
          setShowOutOfCreditsModal(true);
          setLoading(false);
          return;
        }
      } else {
        const used = localStorage.getItem("guestCampaignId");
        if (used) {
          toast.error("Free trial used. Please sign up.");
          navigate("/auth");
          return;
        }
      }

      const finalDrip =
        dripDuration === "custom"
          ? `custom-${customDays}-${customEmails}`
          : dripDuration;

      const { data: campaign, error } = await supabase
        .from("campaigns")
        .insert({
          user_id: userId,
          name,
          url,
          status: "analyzing",
          sequence_type: sequenceType,
          drip_duration: finalDrip,
          words_per_email: wordsNum,
          include_cta: includeCTA,
          cta_link: ctaLink || null,
          analyzed_data: { template_style: templateStyle },
        })
        .select()
        .single();

      if (error || !campaign) {
        toast.error("Failed to create campaign");
        setLoading(false);
        return;
      }

      if (!userId) {
        localStorage.setItem("guestCampaignId", campaign.id);
      }

      trackFunnelStep("generate", { campaign_id: campaign.id });
      navigate(`/campaign/${campaign.id}/analyzing`);
    } catch (err) {
      toast.error("Invalid input");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8">
        <form onSubmit={handleSubmit}>
          <Button disabled={loading} type="submit" className="btn-premium w-full">
            {loading ? <Loader2 className="animate-spin" /> : "Generate my emails"}
          </Button>
        </form>

        {userId && (
          <OutOfCreditsModal
            open={showOutOfCreditsModal}
            onClose={() => setShowOutOfCreditsModal(false)}
            userId={userId}
          />
        )}
      </div>
    </div>
  );
};

export default CreateCampaign;
