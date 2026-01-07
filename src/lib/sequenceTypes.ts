export const ecommerceSequenceTypes = [
  {
    value: "abandoned-cart",
    label: "Abandoned Cart Recovery",
    description: "Uses 'Loss Aversion' and PAS framework to recover 15-20% of lost revenue."
  },
  {
    value: "welcome-vip",
    label: "Welcome / VIP Series",
    description: "Multi-stage intro that builds trust and uses 'First-Time' hooks to drive instant ROI."
  },
  {
    value: "browse-abandonment",
    label: "Browse Abandonment",
    description: "Soft-touch 'Product Education' sequences for visitors who looked but didn't buy."
  },
  {
    value: "checkout-abandonment",
    label: "Checkout Recovery",
    description: "High-urgency triggers to overcome last-minute friction at the payment stage."
  },
  {
    value: "post-purchase-loyalty",
    label: "Post-Purchase & Loyalty",
    description: "Maximizes LTV (Lifetime Value) through 'Surprise & Delight' and automated cross-sells."
  },
  {
    value: "win-back",
    label: "Customer Win-Back",
    description: "Re-ignites interest for lapsed buyers using 'FOMO' and historical relevance hooks."
  },
  {
    value: "review-referral",
    label: "Social Proof & Referral",
    description: "Systematic review collection to build public trust and lower acquisition costs."
  },
  {
    value: "flash-sale",
    label: "Flash Sale / Promotion",
    description: "High-intensity bursts with scarcity-driven copy for inventory clearance or launches."
  },
];

export const saasSequenceTypes = [
  {
    value: "welcome-onboarding",
    label: "Product Onboarding",
    description: "The 'AHA Moment' sequence: focused on rapid user activation and platform habit-building."
  },
  {
    value: "trial-upgrade",
    label: "Trial → Paid Upgrade",
    description: "A conversion-focused drip that maps value milestones to upgrade incentives."
  },
  {
    value: "feature-activation",
    label: "Feature Adoption",
    description: "Deep-dives into under-utilized features to reduce churn and increase stickiness."
  },
  {
    value: "educational-nurture",
    label: "Authority / Nurture Drip",
    description: "Position yourself as an industry expert using value-first, non-salesy educational copy."
  },
  {
    value: "churn-recovery",
    label: "SaaS Win-Back",
    description: "Hard-hitting logic to recover churned users before they settle with a competitor."
  },
  {
    value: "founder-story",
    label: "Founder Story / Brand Audit",
    description: "Humanize the scale through a vulnerability-led origin story to build long-term trust."
  },
  {
    value: "expansion-upsell",
    label: "Expansion / Seat Upgrade",
    description: "Targeted nudges for power users to move into higher tiers or add teammates."
  },
];

export const getSequenceTypes = (userPlatform?: string | null) => {
  // We prioritize E-commerce (seller) but maintain SaaS (founder) as a powerful alternative.
  if (userPlatform === "saas" || userPlatform === "founder") return saasSequenceTypes;
  return ecommerceSequenceTypes;
};
