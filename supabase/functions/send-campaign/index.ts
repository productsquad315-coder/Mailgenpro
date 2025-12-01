import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { campaignId, listId, scheduledAt } = await req.json();

        console.log('Send campaign request:', { campaignId, listId, scheduledAt });

        // Initialize Supabase client with service role
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Get user from auth header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'No authorization header' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

        if (userError || !user) {
            console.error('Auth error:', userError);
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        console.log('User authenticated:', user.id);

        // Check if user is Pro
        const { data: usage, error: usageError } = await supabaseClient
            .from('user_usage')
            .select('plan')
            .eq('user_id', user.id)
            .single();

        if (usageError) {
            console.error('Usage error:', usageError);
            return new Response(JSON.stringify({ error: 'Failed to check subscription' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (usage?.plan === 'free' || usage?.plan === 'trial') {
            return new Response(JSON.stringify({
                error: 'Pro subscription required',
                message: 'Upgrade to Pro to send campaigns directly'
            }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Get campaign and emails
        const { data: campaign, error: campaignError } = await supabaseClient
            .from('campaigns')
            .select('*')
            .eq('id', campaignId)
            .eq('user_id', user.id)
            .single();

        if (campaignError || !campaign) {
            console.error('Campaign error:', campaignError);
            return new Response(JSON.stringify({ error: 'Campaign not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { data: emails, error: emailsError } = await supabaseClient
            .from('email_sequences')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('sequence_number');

        if (emailsError || !emails || emails.length === 0) {
            console.error('Emails error:', emailsError);
            return new Response(JSON.stringify({ error: 'No emails found in campaign' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Get contacts from list
        const { data: contacts, error: contactsError } = await supabaseClient
            .from('contacts')
            .select('*')
            .eq('list_id', listId)
            .eq('status', 'active');

        if (contactsError) {
            console.error('Contacts error:', contactsError);
            return new Response(JSON.stringify({ error: 'Failed to fetch contacts' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (!contacts || contacts.length === 0) {
            return new Response(JSON.stringify({ error: 'No active contacts in list' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Check for unsubscribes
        const contactEmails = contacts.map(c => c.email);
        const { data: unsubscribed } = await supabaseClient
            .from('unsubscribes')
            .select('email')
            .in('email', contactEmails);

        const unsubscribedSet = new Set(unsubscribed?.map(u => u.email) || []);
        const activeContacts = contacts.filter(c => !unsubscribedSet.has(c.email));

        console.log(`Active contacts: ${activeContacts.length} (${contacts.length - activeContacts.length} unsubscribed)`);

        // Calculate total emails to send
        const totalEmails = activeContacts.length * emails.length;

        // Check email credits
        const { data: credits, error: creditsError } = await supabaseClient
            .from('email_credits')
            .select('credits_total')
            .eq('user_id', user.id)
            .single();

        if (creditsError) {
            console.error('Credits error:', creditsError);
            return new Response(JSON.stringify({ error: 'Failed to check email credits' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const availableCredits = credits?.credits_total || 0;

        if (availableCredits < totalEmails) {
            return new Response(JSON.stringify({
                error: 'Insufficient email credits',
                required: totalEmails,
                available: availableCredits,
                shortfall: totalEmails - availableCredits
            }), {
                status: 402,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        console.log(`Credits check passed: ${availableCredits} available, ${totalEmails} needed`);

        // Create send queue entry
        const { data: queue, error: queueError } = await supabaseClient
            .from('email_send_queue')
            .insert({
                campaign_id: campaignId,
                user_id: user.id,
                total_emails: totalEmails,
                status: 'pending'
            })
            .select()
            .single();

        if (queueError || !queue) {
            console.error('Queue error:', queueError);
            return new Response(JSON.stringify({ error: 'Failed to create send queue' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        console.log('Queue created:', queue.id);

        // Queue individual email sends
        const emailSends = [];
        for (const contact of activeContacts) {
            for (const email of emails) {
                // Personalize content
                const personalizedSubject = email.subject
                    .replace(/\{\{first_name\}\}/g, contact.first_name || '')
                    .replace(/\{\{last_name\}\}/g, contact.last_name || '')
                    .replace(/\{\{email\}\}/g, contact.email);

                emailSends.push({
                    campaign_id: campaignId,
                    contact_id: contact.id,
                    email_sequence_id: email.id,
                    user_id: user.id,
                    recipient_email: contact.email,
                    subject: personalizedSubject,
                    status: 'queued',
                    scheduled_at: scheduledAt || new Date().toISOString(), // Use provided time or now
                    metadata: {
                        queue_id: queue.id,
                        sequence_number: email.sequence_number,
                        contact_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                    }
                });
            }
        }

        // Batch insert email sends
        const { error: sendsError } = await supabaseClient
            .from('email_sends')
            .insert(emailSends);

        if (sendsError) {
            console.error('Sends insert error:', sendsError);
            return new Response(JSON.stringify({ error: 'Failed to queue emails' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // ... (previous code)

        console.log(`Queued ${emailSends.length} emails`);

        // DIRECT SEND LOGIC: If batch is small, send immediately
        if (emailSends.length <= 20) {
            console.log('Small batch detected, sending immediately...');

            const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
            let sentCount = 0;
            let failedCount = 0;

            // Update queue status to processing
            await supabaseClient
                .from('email_send_queue')
                .update({ status: 'processing', started_at: new Date().toISOString() })
                .eq('id', queue.id);

            for (const emailSend of emailSends) {
                try {
                    // Update status to sending
                    await supabaseClient
                        .from('email_sends')
                        .update({ status: 'sending' })
                        .eq('id', emailSend.metadata.queue_id ? undefined : emailSend.id) // Use undefined if ID not generated yet? 
                    // Wait, we haven't inserted them yet? Yes we did.
                    // But we don't have their IDs easily unless we select them back.
                    // Actually, the insert call didn't return data. Let's fix that.

                    // RE-STRATEGY: We inserted them but didn't get IDs back in the previous code.
                    // Let's just use the loop to send and then update based on metadata match or similar.
                    // Or better, let's fetch them back.
                } catch (e) {
                    console.error('Error in direct send loop setup', e);
                }
            }

            // Actually, let's just fetch the inserted emails back to get their IDs
            const { data: insertedEmails } = await supabaseClient
                .from('email_sends')
                .select('*')
                .eq('status', 'queued')
                .contains('metadata', { queue_id: queue.id });

            if (insertedEmails) {
                for (const emailSend of insertedEmails) {
                    try {
                        // Personalize content (same logic as worker)
                        const emailSeq = emails.find(e => e.id === emailSend.email_sequence_id);
                        if (!emailSeq) continue;

                        let htmlContent = emailSeq.html_content;
                        const metadata = emailSend.metadata as any;

                        if (metadata?.contact_name) {
                            htmlContent = htmlContent.replace(/\{\{first_name\}\}/g, metadata.contact_name.split(' ')[0] || '');
                            htmlContent = htmlContent.replace(/\{\{last_name\}\}/g, metadata.contact_name.split(' ')[1] || '');
                        }
                        htmlContent = htmlContent.replace(/\{\{email\}\}/g, emailSend.recipient_email);

                        // Add unsubscribe link
                        const unsubscribeUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/unsubscribe?email=${encodeURIComponent(emailSend.recipient_email)}&campaign=${emailSend.campaign_id}`;
                        htmlContent += `<br><br><small style="color: #999;">Don't want to receive these emails? <a href="${unsubscribeUrl}">Unsubscribe</a></small>`;

                        // Send via Resend
                        const res = await fetch('https://api.resend.com/emails', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${RESEND_API_KEY}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                from: 'campaigns@onboarding.resend.dev',
                                to: emailSend.recipient_email,
                                subject: emailSend.subject,
                                html: htmlContent,
                                headers: {
                                    'List-Unsubscribe': `<${unsubscribeUrl}>`,
                                    'X-Campaign-ID': emailSend.campaign_id,
                                    'X-Email-Send-ID': emailSend.id
                                }
                            }),
                        });

                        const data = await res.json();

                        if (res.ok && data.id) {
                            console.log(`Direct send success: ${emailSend.recipient_email}`);
                            sentCount++;

                            await supabaseClient
                                .from('email_sends')
                                .update({
                                    status: 'sent',
                                    esp_message_id: data.id,
                                    sent_at: new Date().toISOString()
                                })
                                .eq('id', emailSend.id);

                            // Deduct credit
                            await supabaseClient.rpc('deduct_email_credit', { p_user_id: user.id });
                        } else {
                            console.error(`Direct send failed: ${emailSend.recipient_email}`, data);
                            failedCount++;

                            await supabaseClient
                                .from('email_sends')
                                .update({
                                    status: 'failed',
                                    error_message: data.message || JSON.stringify(data)
                                })
                                .eq('id', emailSend.id);
                        }
                    } catch (err) {
                        console.error('Direct send error:', err);
                        failedCount++;
                    }
                }
            }

            // Update queue status to completed
            await supabaseClient
                .from('email_send_queue')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                    emails_sent: sentCount,
                    emails_failed: failedCount
                })
                .eq('id', queue.id);

            return new Response(JSON.stringify({
                success: true,
                queueId: queue.id,
                totalEmails: totalEmails,
                contacts: activeContacts.length,
                message: 'Sent immediately (Direct Send)'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Trigger send worker (async) for larger batches
        supabaseClient.functions.invoke('send-worker', {
            body: { queueId: queue.id }
        }).catch(err => console.error('Worker invoke error:', err));

        return new Response(JSON.stringify({
            success: true,
            queueId: queue.id,
            totalEmails: totalEmails,
            contacts: activeContacts.length,
            emailsPerContact: emails.length
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Unexpected error:', error);
        return new Response(JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
