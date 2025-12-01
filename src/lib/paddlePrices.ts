/**
 * Paddle Price IDs Configuration
 * 
 * Centralized configuration for all Paddle pricing
 */

// Subscription Plans
export const PADDLE_PRICES = {
    // Monthly and Lifetime Subscriptions
    STARTER_MONTHLY: import.meta.env.VITE_PADDLE_PRICE_STARTER_MONTHLY || 'pri_01kb7t4xayvp10v538qc8tqh1r',
    STARTER_LIFETIME: import.meta.env.VITE_PADDLE_PRICE_STARTER_LIFETIME || 'pri_01kb7t82ed4a0yxnc1y1t0vv7a',
    PRO_MONTHLY: import.meta.env.VITE_PADDLE_PRICE_PRO_MONTHLY || 'pro_01kb7t975f5y420krps01z95va',

    // One-Time Credit Packs
    PACK_STARTER: import.meta.env.VITE_PADDLE_PRICE_PACK_STARTER || 'pro_01kb7td4d4qw50vwp3d3w431zs',
    PACK_GROWTH: import.meta.env.VITE_PADDLE_PRICE_PACK_GROWTH || 'pro_01kb7thxsv1y4jq92g8g2xswa9',
    PACK_PRO: import.meta.env.VITE_PADDLE_PRICE_PACK_PRO || 'pro_01kb7tkmw1nwm76rk9mw19rchd',
    PACK_AGENCY: import.meta.env.VITE_PADDLE_PRICE_PACK_AGENCY || 'pri_01kb7tnkn72ab3ngqf97r4xt5r',
} as const;

// Plan metadata
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

// Credit pack metadata
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
