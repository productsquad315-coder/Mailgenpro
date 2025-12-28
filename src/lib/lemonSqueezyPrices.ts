/**
 * Lemon Squeezy Price (Variant) IDs Configuration
 * 
 * Centralized configuration for all Lemon Squeezy pricing.
 * These IDs correspond to the "Variant ID" in your Lemon Squeezy dashboard.
 */

// Subscription Plans
export const LEMON_SQUEEZY_PRICES = {
    // Subscription Plans
    STARTER_MONTHLY: import.meta.env.VITE_LEMON_SQUEEZY_VARIANT_STARTER_MONTHLY || '46d3f0da-1cf9-4792-ac3a-9c87b2ec0983', // $11 Starter
    STARTER_LIFETIME: import.meta.env.VITE_LEMON_SQUEEZY_VARIANT_STARTER_LIFETIME || '0453c288-2c07-4294-9106-52c7ae30586c', // $59 Lifetime
    PRO_MONTHLY: import.meta.env.VITE_LEMON_SQUEEZY_VARIANT_PRO_MONTHLY || '38f7c2be-79cc-4c56-b75c-fccc7eeba296', // $29 Pro

    // One-Time Credit Packs
    PACK_STARTER: import.meta.env.VITE_LEMON_SQUEEZY_VARIANT_PACK_STARTER || 'c0ab2221-a2e3-4e31-971f-f237c1b9e5a6', // $5 Starter Pack
    PACK_GROWTH: import.meta.env.VITE_LEMON_SQUEEZY_VARIANT_PACK_GROWTH || '64065f4a-27c1-4a06-8582-47b5ad38fa28', // $12 Growth Pack
    PACK_PRO: import.meta.env.VITE_LEMON_SQUEEZY_VARIANT_PACK_PRO || '9d4ae459-b744-45c7-b7b9-25e361deb92e', // $25 Pro Pack
    PACK_AGENCY: import.meta.env.VITE_LEMON_SQUEEZY_VARIANT_PACK_AGENCY || 'd6306281-f80a-4038-bd1e-a3b82bdfb40e', // $60 Agency Pack
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
