/**
 * Lemon Squeezy Price (Variant) IDs Configuration
 * 
 * Centralized configuration for all Lemon Squeezy pricing.
 * These IDs correspond to the "Variant ID" in your Lemon Squeezy dashboard.
 */

// Subscription Plans
export const LEMON_SQUEEZY_PRICES = {
    // Monthly and Lifetime Subscriptions
    STARTER_MONTHLY: import.meta.env.VITE_LEMON_SQUEEZY_VARIANT_STARTER_MONTHLY || '747603', // $11 Starter
    STARTER_LIFETIME: import.meta.env.VITE_LEMON_SQUEEZY_VARIANT_STARTER_LIFETIME || '747620', // $59 Lifetime
    PRO_MONTHLY: import.meta.env.VITE_LEMON_SQUEEZY_VARIANT_PRO_MONTHLY || '747619', // $29 Pro

    // One-Time Credit Packs
    PACK_STARTER: import.meta.env.VITE_LEMON_SQUEEZY_VARIANT_PACK_STARTER || '747623', // $5 Starter Pack
    PACK_GROWTH: import.meta.env.VITE_LEMON_SQUEEZY_VARIANT_PACK_GROWTH || '747624', // $12 Growth Pack
    PACK_PRO: import.meta.env.VITE_LEMON_SQUEEZY_VARIANT_PACK_PRO || '747625', // $25 Pro Pack
    PACK_AGENCY: import.meta.env.VITE_LEMON_SQUEEZY_VARIANT_PACK_AGENCY || '747626', // $60 Agency Pack
} as const;

// Plan metadata for UI display
export const PLAN_METADATA = {
    STARTER_MONTHLY: {
        name: 'Starter',
        price: 11,
        period: 'month',
        credits: 150,
    },
    STARTER_LIFETIME: {
        name: 'Starter Lifetime',
        price: 59,
        period: 'lifetime',
        credits: 150,
    },
    PRO_MONTHLY: {
        name: 'Pro',
        price: 29,
        period: 'month',
        credits: 500,
    },
} as const;

// Credit pack metadata for UI display
export const PACK_METADATA = {
    PACK_STARTER: {
        name: 'Starter Pack',
        price: 5,
        credits: 40,
    },
    PACK_GROWTH: {
        name: 'Growth Pack',
        price: 12,
        credits: 120,
    },
    PACK_PRO: {
        name: 'Pro Pack',
        price: 25,
        credits: 300,
    },
    PACK_AGENCY: {
        name: 'Agency Pack',
        price: 60,
        credits: 800,
    },
} as const;
