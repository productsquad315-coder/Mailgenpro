import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const requestSchema = z.object({
  campaignId: z.string().uuid("Invalid campaign ID format"),
  url: z.string().url("Invalid URL format").max(2000, "URL too long"),
  brandGuidelines: z.string().optional().nullable(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for authentication (optional for guest campaigns)
    const authHeader = req.headers.get("Authorization");
    let user = null;

    console.log("Request received, auth header present:", !!authHeader);

    if (authHeader) {
      // Create authenticated Supabase client
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      // Try to verify user authentication
      const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser();
      if (!authError && authUser) {
        user = authUser;
        console.log("Authenticated user:", user.id);
      } else {
        console.log("Auth header present but user verification failed:", authError?.message);
      }
    } else {
      console.log("No auth header - processing as guest campaign");
    }

    // Validate input data
    const body = await req.json();
    const validationResult = requestSchema.safeParse(body);

    if (!validationResult.success) {
      console.error("Input validation failed:", validationResult.error.errors);
      return new Response(
        JSON.stringify({
          error: "Invalid input",
          details: validationResult.error.errors[0].message
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }


    const { campaignId, url, brandGuidelines } = validationResult.data;

    // Use service role for campaign operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify campaign exists and check ownership for authenticated users
    console.log("Fetching campaign:", campaignId);
    const { data: campaign, error: campaignError } = await serviceClient
      .from("campaigns")
      .select("user_id")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      console.error("Campaign not found:", campaignError?.message);
      return new Response(
        JSON.stringify({ error: "Campaign not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Campaign found, user_id:", campaign.user_id, "is_guest_campaign:", campaign.user_id === null);

    // For authenticated users, verify ownership; for guest campaigns (user_id null), allow
    if (user && campaign.user_id && campaign.user_id !== user.id) {
      console.error("Unauthorized access attempt - user does not own campaign");
      return new Response(
        JSON.stringify({ error: "Unauthorized - You don't own this campaign" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If unauthenticated, only allow processing for guest campaigns (user_id must be null)
    if (!user && campaign.user_id) {
      console.error("Unauthorized access attempt - unauthenticated user tried to generate for owned campaign");
      return new Response(
        JSON.stringify({ error: "Unauthorized - Sign in required for this campaign" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authorization check passed - proceeding with generation");

    // Check credit balance ONLY for authenticated users with owned campaigns
    if (user && campaign.user_id) {
      console.log("Checking credit balance for user:", user.id);
      const { data: usageData, error: usageError } = await serviceClient
        .from("user_usage")
        .select("generations_used, generations_limit, topup_credits")
        .eq("user_id", user.id)
        .single();

      if (usageError) {
        console.error("Error fetching user usage:", usageError);
        return new Response(
          JSON.stringify({ error: "Unable to verify credit balance" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const creditsRemaining = (usageData.generations_limit - usageData.generations_used) + usageData.topup_credits;

      if (creditsRemaining <= 0) {
        console.error("Insufficient credits for user:", user.id);
        return new Response(
          JSON.stringify({
            error: "Insufficient credits",
            details: "Not enough credits. Please buy a credit pack to continue."
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch URL content
    let pageContent = "";
    try {
      const urlResponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(15000)
      });

      if (!urlResponse.ok) {
        throw new Error(`HTTP ${urlResponse.status}: ${urlResponse.statusText}`);
      }

      const html = await urlResponse.text();
      pageContent = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (pageContent.length < 100) {
        throw new Error("Page content too short or inaccessible");
      }
    } catch (e) {
      console.error("Error fetching URL:", e);
      return new Response(
        JSON.stringify({ error: "Unable to access the website. Please check the URL." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate emails
    const { data: campaignDetails } = await serviceClient
      .from("campaigns")
      .select("name, drip_duration, words_per_email, include_cta, cta_link, analyzed_data")
      .eq("id", campaignId)
      .single();

    let numEmails = 4;
    const wordsPerEmail = campaignDetails?.words_per_email || 250;
    const dripDuration = campaignDetails?.drip_duration || "7-day";
    // Read template style from JSONB column to avoid safe schema migration issues
    const templateStyle = campaignDetails?.analyzed_data?.template_style || "minimal";

    // Style-Specific Strategy Overrides
    const styleInstructions = {
      minimal: "Tone: Pure, raw authenticity. No visual distractions. Focus 100% on the text.",
      bold: "Tone: Confident, loud, and authoritative. Use punchy short sentences.",
      tech: "Tone: Precise, data-driven, and analytical. Use bullet points and logic.",
      corporate: "Tone: Professional, polished, and respectful. Use complete sentences and 'advisory' formality."
    };

    const selectedStyleInstruction = styleInstructions[templateStyle as keyof typeof styleInstructions] || styleInstructions.minimal;

    // === GOD-TIER PSYCHOLOGY MAP (10 CORE FLOWS) ===
    interface Strategy {
      emotion: string;
      arc: string;
      instructions: string;
    }

    const sequenceStrategyMap: Record<string, Strategy> = {
      // 1. WELCOME SERIES
      "welcome": {
        emotion: "RECIPROCITY & IDENTITY",
        arc: "Identify user -> Give Value -> Soft Ask",
        instructions: `
            STRATEGY: THE "INNER CIRCLE" FRAME
            - Email 1: The "Anti-Welcome". Do not say "Thanks for signing up". Say "You're in." Establish the Brand Enemy immediately.
            - Email 2: The "Origin Story". Why was this company born? What injustice are we fighting?
            - Email 3: The "Soft Offer". Present products not as items, but as tools for the new identity.
            `
      },
      // 2. ABANDONED CART
      "abandoned-cart": {
        emotion: "LOSS AVERSION",
        arc: "Reminder -> Objection Handling -> Scarcity",
        instructions: `
            STRATEGY: THE "TAKEAWAY" FRAME
            - Never beg. Assumed the item is already theirs and they are about to LOSE it.
            - Email 1: "Did life get in the way?" (Helpful, low pressure).
            - Email 2: "Holding your items." (Implicit social pressure/scarcity).
            - Email 3: "Releasing inventory." (High pressure, fear of loss).
            `
      },
      // 3. BROWSE ABANDONMENT
      "browse-abandonment": {
        emotion: "CURIOSITY",
        arc: "Observation -> Feature Highlight -> Social Proof",
        instructions: `
            STRATEGY: THE "OBSERVANT FRIEND" FRAME
            - Do not sound like a stalker. Sound like a helpful shop assistant.
            - Email 1: "Saw you looking..." (Casual inquiry).
            - Email 2: "Did you miss this detail?" (Highlight a specific unique mechanism of the product viewed).
            - Email 3: "What others are saying." (Social proof to validate the interest).
            `
      },
      // 4. CHECKOUT ABANDONMENT
      "checkout-abandonment": {
        emotion: "URGENCY & SERVICE",
        arc: "Technical Check -> Scarcity -> Final Call",
        instructions: `
            STRATEGY: THE "ASSISTANT" FRAME
            - Assume a technical failure, not a lack of interest.
            - Email 1: "Was there a glitch?" (High service).
            - Email 2: "Your cart is expiring." (Scarcity).
            - Email 3: "Last chance before restock." (Fear of missing out).
            `
      },
      // 5. POST-PURCHASE
      "post-purchase": {
        emotion: "CONFIRMATION & EXCITEMENT",
        arc: "Celebration -> Pacing -> Expansion",
        instructions: `
            STRATEGY: THE "VICTORY LAP" FRAME
            - Eliminate Buyer's Remorse immediately.
            - Email 1: "Great choice." (Validate their decision).
            - Email 2: "What to expect." (Future pacing the arrival).
            - Email 3: "The perfect pair." (Soft cross-sell ONLY if appropriate).
            `
      },
      // 6. REVIEW REQUEST
      "review-request": {
        emotion: "STATUS & ALTRUISM",
        arc: "Check-in -> The Ask -> The Reward",
        instructions: `
            STRATEGY: THE "JUDGE" FRAME
            - Frame the review not as a favor to you, but as power for them.
            - Email 1: "How is it?" (Genuine care, no ask yet).
            - Email 2: "Your opinion shapes us." (The Ask - Appeal to status/impact).
            - Email 3: "A token of thanks." (Incentive for the review).
            `
      },
      // 7. UPSELL / CROSS-SELL
      "upsell": {
        emotion: "LOGIC & MOMENTUM",
        arc: "Logic Bridge -> The Gap -> The Fix",
        instructions: `
            STRATEGY: THE "COMPLETION" FRAME
            - You are helping them finish the set.
            - Email 1: "You have X, but do you have Y?" (Open the loop).
            - Email 2: "Why X needs Y." (Scientific/Logical explanation).
            - Email 3: "The bundle offer." (Discount for completion).
            `
      },
      // 8. WIN-BACK
      "win-back": {
        emotion: "NOSTALGIA",
        arc: "Remind -> Update -> Offer",
        instructions: `
            STRATEGY: THE "OLD FRIEND" FRAME
            - "It's been a while."
            - Email 1: "Remember us?" (Nostalgia).
            - Email 2: "We've changed." (Show new improvements/products).
            - Email 3: "Are we over?" (The breakup email - Psychology of loss).
            `
      },
      // 9. VIP / LOYALTY
      "vip": {
        emotion: "EXCLUSIVITY",
        arc: "Recognition -> Access -> Reward",
        instructions: `
            STRATEGY: THE "VELVET ROPE" FRAME
            - You are not selling; you are inviting.
            - Email 1: "You're in the top 1%." (Status elevation).
            - Email 2: "Secret menu." (Exclusive access).
            - Email 3: "Early access." (Reward behaviour).
            `
      },
      // 10. BACK IN STOCK / PRICE DROP
      "back-in-stock": {
        emotion: "SCARCITY",
        arc: "Alert -> Scarcity -> Gone",
        instructions: `
            STRATEGY: THE "FLASH" FRAME
            - High energy, low word count.
            - Email 1: "It's back." (Simple notification).
            - Email 2: "Moving fast." (Social proof/Scarcity).
            - Email 3: "Almost gone again." (Urgency).
            `
      },
      // --- FOUNDER FLOWS ---
      "trial-upgrade": {
        emotion: "URGENCY & VALUE GAP",
        arc: "Value Remind -> The Gap -> The Cliff",
        instructions: `
            STRATEGY: THE "CLOCK IS TICKING" FRAME
            - Email 1: "You've achieved X." (Validate progress).
            - Email 2: "What you will lose." (Loss aversion - losing access to data/features).
            - Email 3: "The easy transition." (Remove friction to upgrade).
            `
      },
      "feature-announcement": {
        emotion: "EXCITEMENT & UTILITY",
        arc: "The Problem -> The Soluton -> Use Case",
        instructions: `
            STRATEGY: THE "SUPERPOWER" FRAME
            - Email 1: "We fixed [Pain Point]." (Don't start with 'New Feature', start with the pain it solves).
            - Email 2: "How it works." (Show, don't just tell).
            - Email 3: "Log in to try." (Direct call to action).
            `
      },
      "churn-recovery": {
        emotion: "EMPATHY & CURIOSITY",
        arc: "The Question -> The Change -> The Invite",
        instructions: `
            STRATEGY: THE "LISTENING EAR" FRAME
            - Email 1: "Was it us?" (Genuine feedback request, low friction).
            - Email 2: "We've improved X." (Address common objections).
            - Email 3: "Come back on us." (Incentive).
         `
      },
      "educational-nurture": {
        emotion: "AUTHORITY & HELPFULNESS",
        arc: "Concept -> Tactic -> Case Study",
        instructions: `
             STRATEGY: THE "MENTOR" FRAME
             - Email 1: "The Strategy." (High level concept).
             - Email 2: "The Tactic." (How to do it).
             - Email 3: "The Proof." (How others did it).
         `
      },
      "customer-success": {
        emotion: "ENABLEMENT",
        arc: "Blocker Removal -> Quick Win -> Advanced Tip",
        instructions: `
            STRATEGY: THE "GUIDE" FRAME
            - Email 1: "Stuck?" (Anticipate friction).
            - Email 2: "Try this." (Actionable tip).
            - Email 3: "Pro tip." (Unlock advanced value).
        `
      },
      "founder-story": {
        emotion: "VULNERABILITY & VISION",
        arc: "The Struggle -> The Epiphany -> The Mission",
        instructions: `
            STRATEGY: THE "ORIGIN" FRAME
            - Email 1: "Why I started this." (Personal story).
            - Email 2: "The moment everything changed." (The 'Aha' moment).
            - Email 3: "Join the mission." (Invitation to be part of something bigger).
         `
      },
      "newsletter": {
        emotion: "CONSISTENCY & VALUE",
        arc: "News -> Insight -> Action",
        instructions: `
            STRATEGY: THE "PULSE" FRAME
            - Email 1: "This week's big insight."
            - Email 2: "Curated resources."
            - Email 3: "Thought of the week."
         `
      }
    };

    // --- NORMALIZATION LAYER ---
    // Map frontend keys (from sequenceTypes.ts) to backend keys
    const frontendToBackendMap: Record<string, string> = {
      "re-engagement": "win-back",
      "vip-loyalty": "vip",
      "welcome-onboarding": "welcome",
      "expansion-upgrade": "upsell",
      "activation": "customer-success"
      // Others map 1:1 or defaults
    };

    let campaignSequenceType = campaignDetails?.sequence_type || "welcome";
    // Normalize type
    if (frontendToBackendMap[campaignSequenceType]) {
      campaignSequenceType = frontendToBackendMap[campaignSequenceType];
    }

    const selectedStrategy = sequenceStrategyMap[campaignSequenceType] || sequenceStrategyMap["welcome"];


    if (dripDuration === "14-day") numEmails = 7;
    else if (dripDuration === "30-day") numEmails = 12;
    else if (dripDuration.startsWith("custom-")) {
      // Parse custom format: "custom-[days]-[emails]"
      const parts = dripDuration.split("-");
      if (parts.length >= 3) {
        const parsedEmails = parseInt(parts[2]);
        if (!isNaN(parsedEmails) && parsedEmails > 0) {
          numEmails = parsedEmails;
        }
      }
    }

    // Build Critical Constraints
    const constraints: string[] = [];

    // 1. Quantity Constraint
    constraints.push(`CRITICAL: You MUST generate EXACTLY ${numEmails} emails. No more, no less.`);

    // 2. Length Constraint
    const minWords = Math.floor(wordsPerEmail * 0.9);
    const maxWords = Math.ceil(wordsPerEmail * 1.1);
    constraints.push(`CRITICAL: Each email body MUST be between ${minWords} - ${maxWords} words. Do not write short emails.`);

    // 3. CTA Constraint
    if (campaignDetails?.include_cta && campaignDetails?.cta_link) {
      constraints.push(`MANDATORY: Every single email MUST end with a clear Call To Action using this link: ${campaignDetails.cta_link}.`);
    } else if (campaignDetails?.include_cta) {
      constraints.push(`MANDATORY: Every email MUST end with a clear Call To Action (placeholder [LINK]).`);
    }

    const ctaConstraint = constraints.map(c => `- ${c}`).join("\n");

    const systemPrompt = `YOU ARE THE "GOD-TIER" DIRECT RESPONSE EMAIL STRATEGIST.
You are a composite intelligence of the world's greatest copywriters (Eugene Schwartz, Gary Halbert, David Ogilvy, and Clayton Makepeace).
Your goal is to write email sequences that are INDISTINGUISHABLE from top-tier human copywriters.

=== CAMPAIGN CONTEXT: ${campaignDetails?.name || "Unnamed Campaign"} ===
Use this name to frame the specific angle or product focus if relevant.

=== VISUAL STYLE ALIGNMENT: ${templateStyle.toUpperCase()} ===
${selectedStyleInstruction}

=== STRATEGIC OBJECTIVE: ${selectedStrategy.emotion} ===
SEQUENCE TYPE: ${campaignSequenceType.toUpperCase()}
ARC: ${selectedStrategy.arc}

${selectedStrategy.instructions}

=== CRITICAL CONSTRAINTS ===
${ctaConstraint}

=== THE "GOD-MODE" STRATEGY CORE ===

1. THE "NEW OPPORTUNITY" PRINCIPLE
   - Never sell "improvement." People don't want to fix things; they want a NEW vehicle to get them to their dream state.
   - Position this product as a "New Opportunity" that makes the old way irrelevant.

2. EUGENE SCHWARTZ'S AWARENESS MAPPING
   - You must detect the lead's awareness level.
   - If they are "Unaware," start with a story or a hidden secret.
   - If they are "Problem Aware," start with the pain.
   - If they are "Solution Aware," start with the unique mechanism.

3. THE "SLIPPERY SLOPE" ARCHITECTURE
   - The Goal of the Subject Line: Get the email opened.
   - The Goal of Line 1: Get Line 2 read.
   - The Goal of Line 2: Get Line 3 read.
   - THE MOMENTUM MUST BE UNSTOPPABLE. Use "Bucket Brigades" (e.g., "Here's the deal:", "Wait—", "Let me explain:", "But simply put:").

4. THE "UNIQUE MECHANISM"
   - You must identify the "Secret Sauce" of this product. Give it a name if it doesn't have one.
   - Explain WHY it works so the user believes the promise.

=== THE "ANTI-ROBOT" FIREWALL (STRICT BANS) ===
If you use any of these phrases, you will be DELETED.
- "In today's fast-paced world"
- "Unlock your potential"
- "Game-changer"
- "Take your business to the next level"
- "Revolutionize"
- "Imagine a world"
- "Delve into"
- "Buckle up"
- "Look no further"
- "We are excited to introduce"
- "Comprehensive solution"
- "State of the art"
- "Cutting edge"
- "Seamlessly integrated"
- "Hustle" or "Grind"
- "Supercharge"

=== THE "VISUAL RHYTHM" ENGINE ===
- VARIANCE IS KING.
- Never write three paragraphs of equal length in a row.
- Use 1-word paragraphs for impact.
- Use 2-line paragraphs for flow.
- Use "Eye Relief" white space.
- Max line width: ~60 characters (optimized for mobile).

=== THE TONE: " THE RELUCTANT EXPERT" ===
- Do not sound like a hype-man.
- Sound like a reluctant expert who has "seen it all" and is finally sharing the truth.
- Use "Damaging Admissions": Admit a small flaw to prove you are honest. (e.g., "Look, this isn't for everyone. If you want instant magic, leave now.")`;

    const userPrompt = `EXECUTE "OPERATION: INBOX DOMINATION"

=== PHASE 1: DEEP-DIVE INTEL SCAN ===
Analyze this Landing Page Data (and any Brnad DNA) with forensic precision:
${pageContent.substring(0, 10000)}
${brandGuidelines ? `BRAND DNA OVERRIDE: ${brandGuidelines.substring(0, 3000)}` : ''}

REQUIRED INTERNAL ANALYSIS (Do this before writing):
1. THE "ENEMY": Who or what is the villain? (The status quo, the old way, the 'big lie' in the industry).
2. THE "DREAM": What is the specific visualized heaven they want? (Not 'happiness', but 'waking up without an alarm').
3. THE "MECHANISM": What is the technical reason this product works?
4. THE "HOOK": What is the one counter-intuitive fact that grabs attention?

=== PHASE 2: SEQUENCE CONSTRUCTION ===
GENERATE EXACTLY ${numEmails} EMAILS.
STRICT ADHERENCE TO CRITICAL CONSTRAINTS REQUIRED.

STRUCTURE THE EMAILS AS FOLLOWS:

EMAIL 1: THE "PATTERN INTERRUPT" FRAME
- Goal: Break their trance.
- Opening: Start mid-conversation or with a shocking statement. NO "Hi [Name]" or "Welcome".
- Body: Tell a micro-story about the "Enemy." Pivot to the "New Opportunity."
- CTA: Low friction (Read more, Watch this).

EMAIL 2: THE "LOGIC BRIDGE" FRAME
- Goal: Intellectual buy-in.
- Opening: "I was thinking about what I sent yesterday..."
- Body: Explain the "Unique Mechanism." Prove WHY the old way failed and why this NEW way works mathematically/scientifically.
- CTA: Check it out.

EMAIL 3: THE "FUTURE PACE" FRAME
- Goal: Emotional buy-in.
- Opening: "Imagine this..." (but better).
- Body: Describe their life AFTER the problem is solved. Use sensory details.
- CTA: Direct invitation.

EMAIL 4+ (If applicable): THE "URGENCY/LOGIC" STACK
- Goal: Conversion.
- Focus: The cost of inaction. The pain of staying the same.
- Disclaimer: "I won't keep bugging you about this, but..."
- CTA: Final call.

=== OUTPUT RULES ===
- RETURN RAW JSON ONLY.
- FORMAT: { "emails": [{ "type": "string", "subject": "string", "content": "string", "html": "string" }] }
- HTML RULE: Use "Plain-Text-Style HTML." Minimal CSS. Looks like a personal email. font-size: 16px. font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif.
- "content": Must use newlines (\\n) for spacing.
- "html": Must include the watermark if applicable, but keep it clean.

EXECUTE.`;

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    const aiData = await resp.json();
    const contentText = aiData.choices[0].message.content;
    const emailsData = JSON.parse(contentText);

    // Save emails
    for (let i = 0; i < emailsData.emails.length; i++) {
      const email = emailsData.emails[i];
      await serviceClient.from("email_sequences").insert({
        campaign_id: campaignId,
        sequence_number: i + 1,
        email_type: email.type,
        subject: email.subject,
        content: email.content,
        html_content: email.html,
      });
    }

    await serviceClient
      .from("campaigns")
      .update({ status: "completed" })
      .eq("id", campaignId);

    // Deduct credits using consolidated function
    if (user && campaign.user_id) {
      for (let i = 0; i < emailsData.emails.length; i++) {
        await serviceClient.rpc('deduct_email_credit', { p_user_id: user.id });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});