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

    const systemPrompt = `You are the world's most elite "Human Inbox Expert." Your 100% priority is writing emails that land in the PRIMARY INBOX and sound like they were written by a highly intelligent human advisor.

THE "HUMAN" WRITING PROTOCOL (FOR 100% PRIMARY INBOX):
1. THE ADVISORY TONE: Write as if you are sending a quick, tactical advice email to a peer. No "Welcome to our brand!" or "We are excited to...".
2. BANNED MARKETING SPEAK: Never use: "Incredible," "Revolutionary," "Game-changer," "Limited time," "Act now," "Special offer," "Unlock," "Empower."
3. HUMAN BRAIN RHYTHM: Use sentence fragments. Use "Wait—" or "Anyway," or "Actually..." to break the robotic AI cadence.
4. ZERO SPAM SIGNATURES: No heavy HTML blobs. Use "plain-text-first" philosophy. No excessive bolding or salesy headers.
5. SUBJECT LINES: Must be human-casual. Examples: "quick question for you", "that product link you asked for", "regarding your [niche] strategy". (Keep them 3-6 words, all lowercase or natural sentence case).

STRATEGIC ARC (LEGENDARY STATUS):
- Email 1: The "Small Observation" (Notice something specific about their situation).
- Email 2: The "Contrarian Take" (Why the standard way is failing them).
- Email 3: The "Zero-Pressure Bridge" (How this solution simplifies the chaos).
- Email 4: The "Short P.S. Style" (Direct, one-sentence invitation).`;

    const userPrompt = `HUMAN EXPERT DEEP ANALYSIS:
DATA SCAN:
${pageContent.substring(0, 8000)}

${brandGuidelines ? `BRAND DNA OVERRIDE: ${brandGuidelines.substring(0, 2000)}` : ''}

PHASE 1: THE HUMAN ANGLE
1. Find the "Tiny Frustration" this product solves.
2. Find the "Unspoken Truth" about this niche.

PHASE 2: THE ADVISORY SEQUENCE
Generate a ${numEmails}-email sequence targeting exactly ${wordsPerEmail} words.

STRICT INSTRUCTIONS:
- NO MARKETING CLICHES. If it sounds like an ad, delete it and rewrite.
- Write in "The First Person" (I/me).
- Formatting: Return valid JSON with "emails" array. 
- Each Email JSON: "type", "subject", "content" (The Human advice version), and "html" (An ultra-clean, text-focused, expert HTML version).

Target: ${wordsPerEmail} words (+/- 2% accuracy).`;

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