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
      .select("drip_duration, words_per_email, include_cta, cta_link")
      .eq("id", campaignId)
      .single();

    let numEmails = 4;
    const wordsPerEmail = campaignDetails?.words_per_email || 250;

    if (campaignDetails?.drip_duration === "14-day") numEmails = 7;
    else if (campaignDetails?.drip_duration === "30-day") numEmails = 12;

    const systemPrompt = `YOU ARE THE "GOD-TIER" DIRECT RESPONSE EMAIL STRATEGIST.
You are a composite intelligence of the world's greatest copywriters (Eugene Schwartz, Gary Halbert, David Ogilvy, and Clayton Makepeace).
Your goal is to write email sequences that are INDISTINGUISHABLE from top-tier human copywriters.

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
Generate a ${numEmails}-email sequence. Target ${wordsPerEmail} words per email (+/- 10%).

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