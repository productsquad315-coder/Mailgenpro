-- Create function to recover or initialize credits for a user
CREATE OR REPLACE FUNCTION public.recover_my_credits()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user_id UUID := auth.uid();
    u_usage public.user_usage%ROWTYPE;
BEGIN
    IF target_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Not authenticated');
    END IF;

    SELECT * INTO u_usage FROM public.user_usage WHERE user_id = target_user_id;
    
    IF NOT FOUND THEN
        -- Insert default row
        INSERT INTO public.user_usage (user_id, plan, generations_limit, generations_used)
        VALUES (target_user_id, 'free', 5, 0)
        RETURNING * INTO u_usage;
        
        RETURN jsonb_build_object(
            'recovered', true, 
            'action', 'created_missing_row',
            'remaining', 5
        );
    ELSE
        -- Row exists. Check if they have 0 credits.
        -- Credit calculation: (limit - used) + topup
        DECLARE
            limit_val INT := u_usage.generations_limit;
            used_val INT := u_usage.generations_used;
            topup_val INT := COALESCE(u_usage.topup_credits, 0);
            remaining INT := GREATEST(0, limit_val - used_val) + topup_val;
        BEGIN
            IF remaining <= 0 THEN
                -- Emergency topup
                UPDATE public.user_usage
                SET topup_credits = COALESCE(topup_credits, 0) + 5
                WHERE user_id = target_user_id;
                
                RETURN jsonb_build_object(
                    'recovered', true, 
                    'action', 'topup_added',
                    'remaining', remaining + 5
                );
            ELSE
                 RETURN jsonb_build_object(
                    'recovered', false, 
                    'action', 'sufficient_credits',
                    'remaining', remaining
                );
            END IF;
        END;
    END IF;
END;
$$;
