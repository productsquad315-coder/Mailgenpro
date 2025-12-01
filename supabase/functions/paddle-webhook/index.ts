import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, paddle-signature',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const paddleWebhookSecret = Deno.env.get('PADDLE_WEBHOOK_SECRET');

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get raw body for signature verification
        const rawBody = await req.text();
        const payload = JSON.parse(rawBody);

        // Verify webhook signature if secret is set
        if (paddleWebhookSecret) {
            const signature = req.headers.get('paddle-signature');
            if (!signature) {
                console.error('Missing Paddle signature');
                return new Response(JSON.stringify({ error: 'Missing signature' }), {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            // Verify signature (Paddle uses ts and h1 format)
            const isValid = await verifyPaddleSignature(signature, rawBody, paddleWebhookSecret);
            if (!isValid) {
                console.error('Invalid Paddle signature');
                return new Response(JSON.stringify({ error: 'Invalid signature' }), {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
        }

        console.log('Received Paddle webhook event:', payload.event_type);
        console.log('Custom data:', payload.data?.custom_data);

        const eventType = payload.event_type;
        const userId = payload.data?.custom_data?.user_id;

        if (!userId) {
            console.error('No user_id in webhook payload');
            return new Response(JSON.stringify({ error: 'Missing user_id' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Handle different webhook events
        switch (eventType) {
            case 'transaction.completed':
                await handleTransactionCompleted(supabase, payload, userId);
                break;

            case 'subscription.created':
                await handleSubscriptionCreated(supabase, payload, userId);
                break;

            case 'subscription.updated':
                await handleSubscriptionUpdated(supabase, payload, userId);
                break;

            case 'subscription.canceled':
            case 'subscription.expired':
                await handleSubscriptionCanceled(supabase, payload, userId);
                break;

            case 'subscription.paused':
                await handleSubscriptionPaused(supabase, payload, userId);
                break;

            case 'subscription.resumed':
                await handleSubscriptionResumed(supabase, payload, userId);
                break;

            default:
                console.log('Unhandled event:', eventType);
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Webhook error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});

async function verifyPaddleSignature(
    signature: string,
    rawBody: string,
    secret: string
): Promise<boolean> {
    try {
        // Parse signature header (format: ts=timestamp;h1=signature)
        const parts = signature.split(';');
        const tsMatch = parts.find(p => p.startsWith('ts='));
        const h1Match = parts.find(p => p.startsWith('h1='));

        if (!tsMatch || !h1Match) {
            return false;
        }

        const timestamp = tsMatch.split('=')[1];
        const receivedSignature = h1Match.split('=')[1];

        // Create signed payload: timestamp:rawBody
        const signedPayload = `${timestamp}:${rawBody}`;

        // Create HMAC SHA256 signature
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secret);
        const key = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        const signatureData = await crypto.subtle.sign(
            'HMAC',
            key,
            encoder.encode(signedPayload)
        );

        // Convert to hex string
        const computedSignature = Array.from(new Uint8Array(signatureData))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        return computedSignature === receivedSignature;
    } catch (error) {
        console.error('Signature verification error:', error);
        return false;
    }
}

async function handleTransactionCompleted(supabase: any, payload: any, userId: string) {
    console.log('Handling transaction completed for user:', userId);

    const data = payload.data;
    const items = data.items || [];
    const customerId = data.customer_id;

    // Update customer ID if not already set
    await supabase
        .from('user_usage')
        .update({ paddle_customer_id: customerId })
        .eq('user_id', userId);

    // Check if this is a one-time credit pack purchase
    const creditPackMap: { [key: string]: number } = {
        'starter pack': 40,
        'starter': 40,
        'growth pack': 120,
        'growth': 120,
        'pro pack': 300,
        'agency pack': 800,
        'agency': 800,
    };

    for (const item of items) {
        const productName = (item.product?.name || '').toLowerCase();
        let creditsToAdd = 0;

        for (const [key, credits] of Object.entries(creditPackMap)) {
            if (productName.includes(key)) {
                creditsToAdd = credits;
                console.log(`Detected credit pack: ${key} - ${credits} credits`);
                break;
            }
        }

        if (creditsToAdd > 0) {
            // Add credits to topup_credits column
            const { data: currentUsage } = await supabase
                .from('user_usage')
                .select('topup_credits')
                .eq('user_id', userId)
                .single();

            const currentTopup = currentUsage?.topup_credits || 0;

            const { error: updateError } = await supabase
                .from('user_usage')
                .update({ topup_credits: currentTopup + creditsToAdd })
                .eq('user_id', userId);

            if (updateError) {
                console.error('Error adding topup credits:', updateError);
                throw updateError;
            }

            console.log(`Successfully added ${creditsToAdd} topup credits to user ${userId}`);
        }
    }
}

async function handleSubscriptionCreated(supabase: any, payload: any, userId: string) {
    console.log('Handling subscription created for user:', userId);

    const data = payload.data;
    const customerId = data.customer_id;
    const subscriptionId = data.id;
    const status = data.status;
    const items = data.items || [];

    // Get product name from first item
    const productName = (items[0]?.product?.name || '').toLowerCase();

    // Determine plan based on product name
    let plan = 'trial';
    let generationsLimit = 20;

    if (productName.includes('lifetime')) {
        plan = 'lifetime';
        generationsLimit = 150;
        console.log('Detected lifetime plan - 150 credits');
    } else if (productName.includes('pro')) {
        plan = 'pro';
        generationsLimit = 500;
        console.log('Detected pro plan - 500 credits');
    } else if (productName.includes('starter')) {
        plan = 'starter';
        generationsLimit = 150;
        console.log('Detected starter plan - 150 credits');
    }

    console.log(`Updating user ${userId} to plan: ${plan} with ${generationsLimit} credits`);

    // Calculate period end
    const currentPeriodEnd = data.current_billing_period?.ends_at ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const updateData: any = {
        plan,
        generations_limit: generationsLimit,
        generations_used: 0, // Reset credits on new subscription
        subscription_status: status,
        paddle_customer_id: customerId,
        paddle_subscription_id: subscriptionId,
        current_period_end: currentPeriodEnd,
    };

    console.log(`Setting current_period_end to: ${currentPeriodEnd}`);

    const { error } = await supabase
        .from('user_usage')
        .update(updateData)
        .eq('user_id', userId);

    if (error) {
        console.error('Error updating user usage:', error);
        throw error;
    }

    console.log('Successfully created subscription with credits');
}

async function handleSubscriptionUpdated(supabase: any, payload: any, userId: string) {
    console.log('Handling subscription updated for user:', userId);

    const data = payload.data;
    const status = data.status;
    const currentPeriodEnd = data.current_billing_period?.ends_at;

    // Fetch current user data to detect renewals
    const { data: currentData } = await supabase
        .from('user_usage')
        .select('current_period_end, plan, generations_limit')
        .eq('user_id', userId)
        .single();

    const updateData: any = {
        subscription_status: status,
    };

    // Check if this is a renewal event (period has advanced)
    if (currentPeriodEnd && currentData?.current_period_end) {
        const oldPeriodEnd = new Date(currentData.current_period_end);
        const newPeriodEnd = new Date(currentPeriodEnd);

        // If the new period is in the future and different from old period, it's a renewal
        if (newPeriodEnd > oldPeriodEnd && newPeriodEnd > new Date()) {
            console.log('Detected subscription renewal - resetting credits');
            updateData.generations_used = 0; // Reset credits on renewal
        }

        updateData.current_period_end = currentPeriodEnd;
    } else if (currentPeriodEnd) {
        updateData.current_period_end = currentPeriodEnd;
    }

    const { error } = await supabase
        .from('user_usage')
        .update(updateData)
        .eq('user_id', userId);

    if (error) {
        console.error('Error updating subscription:', error);
        throw error;
    }

    console.log('Successfully updated subscription status');
}

async function handleSubscriptionCanceled(supabase: any, payload: any, userId: string) {
    console.log('Handling subscription canceled for user:', userId);

    // When subscription is canceled, user goes back to trial with 0 credits
    const { error } = await supabase
        .from('user_usage')
        .update({
            subscription_status: 'canceled',
            plan: 'trial',
            generations_limit: 0,
            generations_used: 0,
        })
        .eq('user_id', userId);

    if (error) {
        console.error('Error canceling subscription:', error);
        throw error;
    }

    console.log('Successfully canceled subscription - user moved to trial with 0 credits');
}

async function handleSubscriptionPaused(supabase: any, payload: any, userId: string) {
    console.log('Handling subscription paused for user:', userId);

    const { error } = await supabase
        .from('user_usage')
        .update({
            subscription_status: 'paused',
        })
        .eq('user_id', userId);

    if (error) {
        console.error('Error pausing subscription:', error);
        throw error;
    }

    console.log('Successfully paused subscription');
}

async function handleSubscriptionResumed(supabase: any, payload: any, userId: string) {
    console.log('Handling subscription resumed for user:', userId);

    const data = payload.data;
    const status = data.status || 'active';

    const { error } = await supabase
        .from('user_usage')
        .update({
            subscription_status: status,
        })
        .eq('user_id', userId);

    if (error) {
        console.error('Error resuming subscription:', error);
        throw error;
    }

    console.log('Successfully resumed subscription');
}
