import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const BATCH_SIZE = 10; // Process 10 emails at a time
const DELAY_MS = 100; // 100ms between emails (respects rate limits)

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { queueId } = await req.json();

        console.log('Processing queue:', queueId);

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Update queue status to processing
        await supabase
            .from('email_send_queue')
            .update({ status: 'processing', started_at: new Date().toISOString() })
            .eq('id', queueId);

        // Get queued emails (batch) - only those scheduled for now or earlier
        const { data: emails, error: emailsError } = await supabase
            .from('email_sends')
            .select('*')
            .eq('status', 'queued')
            .contains('metadata', { queue_id: queueId })
            .lte('scheduled_at', new Date().toISOString()) // Only send if scheduled time has passed
            .order('created_at')
            .limit(BATCH_SIZE);

        if (emailsError) {
            console.error('Error fetching emails:', emailsError);
            throw emailsError;
        }

        if (!emails || emails.length === 0) {
            // Queue complete
            console.log('Queue completed:', queueId);
            await supabase
                .from('email_send_queue')
                .update({ status: 'completed', completed_at: new Date().toISOString() })
                .eq('id', queueId);

            return new Response(JSON.stringify({
                success: true,
                message: 'Queue completed'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        console.log(`Processing ${emails.length} emails`);

        // Send emails via Resend
        for (const emailSend of emails) {
            try {
                // Update status to sending
                await supabase
                    .from('email_sends')
                    .update({ status: 'sending' })
                    .eq('id', emailSend.id);

                // Get email content
                const { data: emailSeq, error: seqError } = await supabase
                    .from('email_sequences')
                    .select('html_content')
                    .eq('id', emailSend.email_sequence_id)
                    .single();

                if (seqError || !emailSeq) {
                    throw new Error('Email content not found');
                }

                // Personalize HTML content
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
                        from: 'campaigns@onboarding.resend.dev', // Use Resend's shared domain
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
                    // Success
                    console.log(`Email sent: ${emailSend.id} -> ${data.id}`);

                    await supabase
                        .from('email_sends')
                        .update({
                            status: 'sent',
                            esp_message_id: data.id,
                            sent_at: new Date().toISOString()
                        })
                        .eq('id', emailSend.id);

                    // Deduct credit
                    await supabase.rpc('deduct_email_credit', { p_user_id: emailSend.user_id });

                    // Update queue progress
                    await supabase
                        .from('email_send_queue')
                        .update({ emails_sent: supabase.sql`emails_sent + 1` })
                        .eq('id', queueId);
                } else {
                    // Failed
                    console.error(`Email failed: ${emailSend.id}`, data);

                    await supabase
                        .from('email_sends')
                        .update({
                            status: 'failed',
                            error_message: data.message || JSON.stringify(data)
                        })
                        .eq('id', emailSend.id);

                    await supabase
                        .from('email_send_queue')
                        .update({ emails_failed: supabase.sql`emails_failed + 1` })
                        .eq('id', queueId);
                }
            } catch (error) {
                console.error('Error sending email:', emailSend.id, error);

                await supabase
                    .from('email_sends')
                    .update({
                        status: 'failed',
                        error_message: error instanceof Error ? error.message : 'Unknown error'
                    })
                    .eq('id', emailSend.id);

                await supabase
                    .from('email_send_queue')
                    .update({ emails_failed: supabase.sql`emails_failed + 1` })
                    .eq('id', queueId);
            }

            // Delay between sends to respect rate limits
            await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        }

        console.log(`Batch complete, processed ${emails.length} emails`);

        // Trigger next batch (async, don't wait)
        supabase.functions.invoke('send-worker', {
            body: { queueId }
        }).catch(err => console.error('Next batch invoke error:', err));

        return new Response(JSON.stringify({
            success: true,
            processed: emails.length
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Worker error:', error);
        return new Response(JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
