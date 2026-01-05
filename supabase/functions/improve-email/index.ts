import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const requestSchema = z.object({
  currentContent: z.string().min(1, "Content cannot be empty").max(5000, "Content too long"),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY FIX 1: Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing Authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized - Missing authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create authenticated Supabase client to verify user
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize service client for privileged operations (credits)
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });

    // Check credit balance via RPC
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

    console.log("Authenticated user:", user.id);

    // SECURITY FIX 2: Validate input data
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

    const { currentContent } = validationResult.data;
    console.log("Improving content of length:", currentContent.length);

    const systemPrompt = `YOU ARE THE "GOD-TIER" DIRECT RESPONSE EMAIL EDITOR.
Your goal is to Rewrite this email to be INDISTINGUISHABLE from top-tier human copywriters.

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
`;

    // Use OpenAI
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Calling OpenAI to improve email");
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
          { role: "user", content: `Improve this email to be more compelling and high-converting while keeping the same length and structure: ${currentContent}` }
        ],
      }),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("OpenAI error:", resp.status, errorText);

      if (resp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please wait a moment and retry." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable. Please try again." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await resp.json();

    // OpenAI returns OpenAI-compatible format
    if (!aiData.choices?.[0]?.message?.content) {
      console.error("Invalid AI response format:", aiData);
      throw new Error("Invalid AI response format");
    }

    const improvedContent = aiData.choices[0].message.content.trim();
    console.log("Content improved successfully");

    // Deduct credit
    const { error: deductError } = await serviceClient.rpc("deduct_email_credit", { p_user_id: user.id });
    if (deductError) {
      console.error("Error deducting credit:", deductError);
      // We still return the content as the AI work is done, but log the error
    }

    return new Response(JSON.stringify({ improvedContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in improve-email:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});