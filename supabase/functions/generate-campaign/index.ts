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
    let supabaseClient = null;

    console.log("Request received, auth header present:", !!authHeader);

    if (authHeader) {
      // Create authenticated Supabase client
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

      supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
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
      console.log("Checking credit balance via RPC for user:", user.id);
      // Use supabaseClient (with auth context) instead of serviceClient so auth.uid() works in RPC
      const { data: creditsData, error: creditsError } = await supabaseClient
        .rpc('get_my_credits');

      if (creditsError) {
        console.error("Error fetching credit balance:", creditsError);
        return new Response(
          JSON.stringify({ error: "Unable to verify credit balance" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // get_my_credits returns [{ credits_total, ... }]
      const creditsRemaining = creditsData?.[0]?.credits_total || 0;

      if (creditsRemaining <= 0) {
        console.error("Insufficient credits for user:", user.id);
        return new Response(
          JSON.stringify({
            error: "Insufficient credits",
            details: "Not enough credits. Please buy a credit pack to continue."
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch URL content with Multi-Level Strategy
    let pageContent = "";
    let cleanBody = "";

    try {
      console.log(`[SCRAPER] Level 1: Fetching ${url}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // Increased to 12s

      const urlResponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Referer': 'https://www.google.com/'
        },
        redirect: 'follow',
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));

      if (urlResponse.ok) {
        let html = await urlResponse.text();

        // --- SHOPIFY SPECIFIC EXTRACTION (JSON-LD) ---
        const ldJsonMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
        let structuredData = "";

        if (ldJsonMatches) {
          ldJsonMatches.forEach(match => {
            try {
              const jsonContent = match.replace(/<\/?script[^>]*>/gi, "").trim();
              const data = JSON.parse(jsonContent);
              if (data['@type'] === 'Product' || data['@type'] === 'Organization' || data['@context']?.includes('schema.org')) {
                structuredData += JSON.stringify(data, null, 2) + "\n";
              }
            } catch (e) { /* ignore parse errors */ }
          });
        }

        // --- META TAG EXTRACTION ---
        const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
        const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i);
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);

        const metaContext = `
        Title: ${titleMatch ? titleMatch[1] : ''}
        Description: ${metaDescMatch ? metaDescMatch[1] : (ogDescMatch ? ogDescMatch[1] : '')}
        `;

        // Clean HTML Body
        cleanBody = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        // Combine for maximum context
        pageContent = `
=== METADATA ===
${metaContext}

=== STRUCTURED DATA (JSON-LD) ===
${structuredData}

=== PAGE CONTENT ===
${cleanBody.substring(0, 15000)}
        `;

        console.log(`[SCRAPER] Level 1 success. JSON-LD: ${!!structuredData}, Body length: ${cleanBody.length}`);
      } else {
        console.warn(`[SCRAPER] Level 1 failed with status: ${urlResponse.status}`);
      }

      // Level 2: Fallback to Jina Reader if body content is thin (< 300 chars)
      const bodyIsEmpty = !pageContent || pageContent.includes("=== PAGE CONTENT ===\n\n") || cleanBody.length < 300;

      if (bodyIsEmpty) {
        console.log("[SCRAPER] Level 2: Triggering Jina Reader...");
        const jinaUrl = `https://r.jina.ai/${url}`;
        const jinaController = new AbortController();
        const jinaTimeoutId = setTimeout(() => jinaController.abort(), 20000); // 20s for Jina

        const jinaResponse = await fetch(jinaUrl, {
          headers: {
            'Accept': 'application/json',
            'X-Return-Format': 'markdown'
          },
          signal: jinaController.signal
        }).finally(() => clearTimeout(jinaTimeoutId));

        if (jinaResponse.ok) {
          pageContent = await jinaResponse.text();
          console.log(`[SCRAPER] Level 2 (Jina) success. Length: ${pageContent.length}`);
        } else {
          console.error(`[SCRAPER] Level 2 (Jina) failed with status: ${jinaResponse.status}`);
        }
      }

      // Final Fail State Check - SOFT FAIL
      if (!pageContent || pageContent.length < 100) {
        console.error("[SCRAPER] CRITICAL: Both levels failed to extract content.");
        // If we have brand guidelines, we can still try to proceed.
        if (brandGuidelines && brandGuidelines.length > 50) {
          pageContent = `Note: Website scraping failed. Using only Brand Guidelines for context.`;
        } else {
          // If no guidelines AND no website, then we must error
          return new Response(
            JSON.stringify({
              error: "Unable to read website",
              details: "We couldn't extract content from your URL. Please manually paste your 'Brand Guidelines' or 'About Us' text in the Advanced Options section."
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    } catch (e) {
      console.error("[SCRAPER] Unexpected Error:", e);
      // Soft fail: if we have guidelines, keep going, else return 400
      if (!brandGuidelines || brandGuidelines.length < 50) {
        return new Response(
          JSON.stringify({
            error: "Website access restricted",
            details: "Could not read website. Please manually paste your 'Brand Guidelines' or 'About Us' text in the text box."
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      pageContent = `Note: Website scraping crashed with error: ${(e as any).message}. Using Brand Guidelines instead.`;
    }

    // Generate emails
    console.log("[GENERATOR] Fetching campaign details...");
    const { data: campaignDetails, error: fetchError } = await serviceClient
      .from("campaigns")
      .select("name, drip_duration, words_per_email, include_cta, cta_link, analyzed_data, sequence_type")
      .eq("id", campaignId)
      .single();

    if (fetchError) {
      console.error("[GENERATOR] Campaign detail fetch error:", fetchError);
      throw new Error("Failed to fetch campaign details");
    }

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
    const frontendToBackendMap: Record<string, string> = {
      "re-engagement": "win-back",
      "vip-loyalty": "vip",
      "welcome-onboarding": "welcome",
      "expansion-upgrade": "upsell",
      "activation": "customer-success"
    };

    let campaignSequenceType = campaignDetails?.sequence_type || "welcome";
    if (frontendToBackendMap[campaignSequenceType]) {
      campaignSequenceType = frontendToBackendMap[campaignSequenceType];
    }

    const selectedStrategy = sequenceStrategyMap[campaignSequenceType] || sequenceStrategyMap["welcome"];
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("AI service not configured.");

    // Phase 1: The Brain (Strategic Reasoning with o1-mini)
    let blueprint = (campaignDetails?.analyzed_data as any)?.blueprint;

    if (!blueprint) {
      console.log(`[BRAIN] Phase 1: Performing Deep Strategic Analysis for Flow: ${campaignSequenceType}`);
      const brainResp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "o1-mini",
          messages: [
            {
              role: "user",
              content: `Analyze this website data and product details to construct a "Strategic Blueprint" for a ${campaignSequenceType.toUpperCase()} email sequence.
              
              === WEBSITE DATA ===
              ${pageContent.substring(0, 12000)}
              
              === BRAND GUIDELINES ===
              ${brandGuidelines || "None provided."}
              
              === TASK ===
              Reason through the following 4 pillars:
              1. THE ENEMY: What is the "Old Way" of doing things that this product fights against?
              2. THE DREAM: What is the emotional/financial "After" state for the customer?
              3. THE MECHANISM: How specifically does the product solve the problem?
              4. THE HOOK: What is the single most curious angle we can use to start this ${campaignSequenceType} journey?
              
              Return ONLY a JSON object with these 4 keys: "enemy", "dream", "mechanism", "hook".`
            }
          ]
        }),
      });

      if (brainResp.ok) {
        const brainData = await brainResp.json();
        const brainContent = brainData.choices[0].message.content;
        try {
          const match = brainContent.match(/\{[\s\S]*\}/);
          blueprint = JSON.parse(match ? match[0] : brainContent);

          // Cache the blueprint
          await serviceClient.from("campaigns").update({
            analyzed_data: { ...(campaignDetails?.analyzed_data as any), blueprint }
          }).eq("id", campaignId);

          console.log("[BRAIN] Strategic Blueprint created and cached.");
        } catch (e) {
          console.error("[BRAIN] Analysis failed to parse. Falling back to generic strategy.", e);
        }
      }
    } else {
      console.log("[BRAIN] Using cached Strategic Blueprint.");
    }

    const blueprintContext = blueprint ? `
=== STRATEGIC BLUEPRINT (THE BRAIN) ===
ENEMY: ${blueprint.enemy}
DREAM: ${blueprint.dream}
MECHANISM: ${blueprint.mechanism}
HOOK: ${blueprint.hook}
` : "";


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
You are a composite intelligence of the world's greatest copywriters (Eugene Schwartz, Gary Halbert, David Ogilvy).
Your goal is to write email sequences that are INDISTINGUISHABLE from top-tier human copywriters.

=== CAMPAIGN CONTEXT: ${campaignDetails?.name || "Unnamed Campaign"} ===
Use this name to frame the specific angle or product focus if relevant.

=== VISUAL STYLE ALIGNMENT: ${templateStyle.toUpperCase()} ===
${selectedStyleInstruction}

${blueprintContext}

=== STRATEGIC OBJECTIVE: ${selectedStrategy.emotion} ===
SEQUENCE TYPE: ${campaignSequenceType.toUpperCase()}
ARC: ${selectedStrategy.arc}

${selectedStrategy.instructions}

=== CRITICAL CONSTRAINTS ===
${ctaConstraint}

=== "GOD-TIER" COPYWRITING FRAMEWORKS (THE ELITE STANDARD) ===
> 1. THE "SLIPPERY SLIDE" (Joseph Sugarman)
> - **The Sole Purpose**: The purpose of the first sentence is to get them to read the second sentence. The second to read the third. Momentum is everything.
> - **Momentum Rule**: Start mid-conversation. No "In today's fast-paced world". No "We are proud to announce". Start with a "greased" sentence.
> - **Rhythm & Cadence**: Vary sentence lengths radically. (Short. Short. Then a long, flowing one that carries the emotional weight.)

> 2. MARKET AWARENESS (Eugene Schwartz)
> - **The Frame**: Identify if the reader is "Problem Aware" (ouch, that hurts) or "Solution Aware" (how does yours work?).
> - **The Unique Mechanism**: Don't sell "features". Sell the *Mechanism*—the specific reason WHY this works when everything else failed. Describe the "how" in simple, vivid verbs.

> 3. THE "ONE-TO-ONE" PROTOCOL (Gary Halbert)
> - **The Friend Test**: You are a friend writing a letter to another friend. If it sounds like "Marketing", delete it.
> - **Specificity > Generality**: Never say "save time". Say "save 17 minutes every Monday".

=== HUMAN WRITING SOPs: THE "IRONCLAD" STANDARD (NUCLEAR GRADE) ===
> OBJECTIVE: To create email content that creates **Intellectual Curiosity**, not "Marketing Hype".
> PASS/FAIL: If the recipient knows it's a mass email within 0.5 seconds, the email is TRASH.

1. THE "KILL SWITCH" LIST (INSTANT FAIL) - NEVER USE THESE:
   - ❌ AI-isms: "Embark", "Tapestry", "Delve", "Harness", "Robust", "Revolutionize", "Navigate", "Synergy", "Empower", "Comprehensive", "Pioneering", "Innovative", "Unlock", "Seamlessly", "Cutting-edge", "Game-changer".
   - ❌ "I hope this email finds you well"
   - ❌ "I wanted to reach out"
   - ❌ "Allow me to introduce myself"
   - ❌ "Apologies for the intrusion"

2. THE "5TH GRADE" VOCABULARY BASELINE (BAR-TALK ONLY)
   - Banish all corporate jargon and "fancy" words.
   - Use simple, grounded words. Replace "Utilize" with "Use". Replace "Facilitate" with "Help".
   - If a 10-year-old wouldn't use it, DON'T USE IT.

3. THE "ADJECTIVE PURGE"
   - Banish 90% of adjectives. Adjectives are where lies hide.
   - BAD: "Our comprehensive, powerful dashboard..."
   - GOOD: "Our dashboard..."

4. THE "BAR TEST" (TONE CHECK)
   - Read the email out loud. If you wouldn't say it to a friend at a bar, REWRITE IT.
   - Peer-to-Peer Tone: You are a consultant, not a salesperson.

5. STRUCTURAL MIMICRY: THE "BUSY HUMAN" PROTOCOL
   - No paragraph > 2 lines on mobile.
   - Use sentence fragments. (e.g., "Fast. Reliable. Simple.")
   - "Liquid Syntax": Never start two consecutive sentences with "We" or "I".

=== CONTENT SAFETY GUARDRAILS: THE "PARANOID" WRITER PROTOCOL ===
> SCOPE: STRICTLY CONTENT-BASED SPAM AVOIDANCE.
> RULE: We write "Letters", not "Flyers".

1. TECHNICAL "HYGIENE"
   - 100% PLAIN TEXT. No <div>, <table>, or <img> tags.
   - Exception: Minimal <br> and <p> only.

2. THE "ONE LINK" LAW
   - Cold Layer (Email 1-2): ZERO LINKS (unless explicitly requested).
   - Warm Layer (Email 3+): Max 1 link.
   - NEVER use "Click Here". Use raw URLs (mailgenpro.com) or "Reply 'link'".

3. THE "SPAM TRAP" DEFENSE (BANNED WORDS)
   - $$$ / Cash / Bonus / Discount / Free / Urgent / Act Now / Limited Time / Guarantee.

4. THE "GET STARTED" CTA PROTOCOL (MANDATORY)
   - NEVER use a "Get Started" button or generic link.
   - OPTION A (Permission Loop): "Reply 'start' and I'll send the guide." (Safest)
   - OPTION B (Soft Link): "If you want to dive in, you can start here: [Link]"

=== THE "SMART EXPANSION" PROTOCOL (LENGTH ENFORCEMENT) ===
If you need length, DO NOT FLUFF. Use:
1. "The Micro-Story": A 3-sentence case study.
2. "The Deeper Why": Explain the MECHANISM (Why it works).
3. "The Cost of Inaction": What happens if they don't buy?

EXECUTE.`;

    const userPrompt = `EXECUTE "OPERATION: INBOX DOMINATION"

=== PHASE 1: DEEP-DIVE INTEL SCAN ===
Analyze this Landing Page Data (and any Brand DNA) with forensic precision:
${pageContent.substring(0, 10000)}
${brandGuidelines ? `BRAND DNA OVERRIDE: ${brandGuidelines.substring(0, 3000)}` : ''}

=== PHASE 2: SEQUENCE CONSTRUCTION ===
GENERATE EXACTLY ${numEmails} EMAILS based on the Strategic Blueprint and Strategy Arc.
STRICT ADHERENCE TO CRITICAL CONSTRAINTS REQUIRED.

=== PHASE 2: SEQUENCE CONSTRUCTION ===
GENERATE EXACTLY ${numEmails} EMAILS based on the Strategic Blueprint and the specific Strategy Arc below.
STRICT ADHERENCE TO CRITICAL CONSTRAINTS REQUIRED.

${selectedStrategy.instructions}

(Note: If the strategy instructions only specify fewer emails than the requested ${numEmails}, continue the established arc and psychological frame logically for the remaining emails, following the Strategic Objective and Human Writing SOPs. NEVER break character or the established frame).

=== OUTPUT RULES ===
- RETURN RAW JSON ONLY.
- FORMAT: { "emails": [{ "type": "string", "subject": "string", "content": "string", "html": "string" }] }
- HTML RULE: Use "Plain-Text-Style HTML." Minimal CSS. Looks like a personal email. font-size: 16px. font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif.
- "content": Must use newlines (\\n) for spacing.
- "html": Must include the watermark if applicable, but keep it clean.

EXECUTE.`;

    console.log("[GENERATOR] Phase 2: Production Writing with gpt-4o...");
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

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("[GENERATOR] production failed:", errorText);
      throw new Error(`AI Generation failed: ${resp.status}`);
    }

    const aiData = await resp.json();
    let contentText = aiData.choices[0].message.content;

    const jsonMatch = contentText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      contentText = jsonMatch[0];
    }

    let emailsData;
    try {
      emailsData = JSON.parse(contentText);
    } catch (parseError) {
      console.error("Failed to parse AI JSON:", contentText);
      throw new Error("Invalid response format from AI. Please try again.");
    }

    if (!emailsData.emails || !Array.isArray(emailsData.emails)) {
      throw new Error("AI response was missing the expected email sequence data.");
    }

    // --- ATOMIC SAVE & CHARGE LOGIC ---
    console.log(`[SAVER] Saving ${emailsData.emails.length} emails to database...`);
    const emailsBatch = emailsData.emails.map((email: any, i: number) => ({
      campaign_id: campaignId,
      sequence_number: i + 1,
      email_type: email.type || "standard",
      subject: email.subject,
      content: email.content,
      html_content: email.html,
    }));

    const { error: insertError } = await serviceClient
      .from("email_sequences")
      .insert(emailsBatch);

    if (insertError) {
      console.error("[SAVER] Failed to save emails:", insertError);
      throw new Error("Failed to save generated emails.");
    }

    await serviceClient
      .from("campaigns")
      .update({ status: "completed" })
      .eq("id", campaignId);

    // SMARTER CREDITS: Atomic Deduction (Capped at ordered count)
    if (user && campaign.user_id) {
      const amountToDeduct = Math.min(numEmails, emailsData.emails.length);
      console.log(`[CREDITS] Deducting capped amount: ${amountToDeduct} credits (Ordered: ${numEmails}, AI Generated: ${emailsData.emails.length})`);

      for (let i = 0; i < amountToDeduct; i++) {
        const { error: deductError } = await serviceClient.rpc('deduct_email_credit', { p_user_id: user.id });
        if (deductError) console.error(`[CREDITS] Deduction ${i + 1} failed:`, deductError);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const err = error as any;
    console.error(`[FATAL] Error in generate-campaign:`, err);

    let status = 500;
    if (err.message?.includes("Insufficient credits")) status = 402;
    if (err.message?.includes("Unauthorized")) status = 403;
    if (err.message?.includes("AI Generation failed: 401")) status = 401;
    if (err.message?.includes("AI Generation failed: 429")) status = 429;

    return new Response(JSON.stringify({
      error: err.message || "An unexpected error occurred",
      details: err.details || ""
    }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});