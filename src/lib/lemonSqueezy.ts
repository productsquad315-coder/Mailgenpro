/**
 * Lemon Squeezy Payment Integration Utility
 * 
 * This module handles creation of Lemon Squeezy checkout URLs.
 */

import { toast } from "sonner";

interface LemonSqueezyCheckoutOptions {
    variantId: string;
    userId?: string;
    userEmail?: string;
    redirectUrl?: string;
}

/**
 * Get the checkout URL for a specific variant
 */
export function getLemonSqueezyCheckoutUrl(
    variantId: string,
    userId?: string,
    userEmail?: string,
    redirectUrl?: string
): string {
    // Base checkout URL - usually https://store-name.lemonsqueezy.com/checkout/buy/variant_id
    // But since we just have the variant ID and maybe not the store subdomain in env,
    // we can use the generic checkout URL structure if available, or assume the user sets the full URL or just the ID.
    // However, the standard way is https://store.lemonsqueezy.com/checkout/buy/VARIANT_ID

    // We will assume the VITE_LEMON_SQUEEZY_STORE_URL is set (e.g., https://my-store.lemonsqueezy.com)
    // If not, we might need to ask the user. For now, let's try to construct it or use a default.

    // Actually, Lemon Squeezy allows checkout links like:
    // https://{store}.lemonsqueezy.com/checkout/buy/{variant_id}?checkout[custom][user_id]={user_id}

    const storeUrl = import.meta.env.VITE_LEMON_SQUEEZY_STORE_URL;

    if (!storeUrl || storeUrl.includes('your-store')) {
        console.warn('Lemon Squeezy Store URL not configured properly.');
        // We can't generate a valid URL without the store URL or at least the store name.
        // Fallback: use a placeholder that will 404 but show the intent.
        // Or check if variantId is actually a full URL.
    }

    // Checking if variantId is already a full URL (some users might put the whole link in the env)
    let baseUrl = variantId;
    if (!variantId.startsWith('http')) {
        const cleanStoreUrl = storeUrl ? storeUrl.replace(/\/$/, '') : 'https://checkout.lemonsqueezy.com';
        // Note: checkout.lemonsqueezy.com might not work without store slug. 
        // Best approach: https://store-subdomain.lemonsqueezy.com/checkout/buy/VARIANT_ID

        baseUrl = `${cleanStoreUrl}/checkout/buy/${variantId}`;
    }

    const url = new URL(baseUrl);

    // Append custom data for webhook identification
    if (userId) {
        url.searchParams.append('checkout[custom][user_id]', userId);
    }

    // Prefill email if available
    if (userEmail) {
        url.searchParams.append('checkout[email]', userEmail);
    }

    // Redirect after purchase
    if (redirectUrl) {
        url.searchParams.append('checkout[redirect_url]', redirectUrl);
    }

    return url.toString();
}

/**
 * Open Lemon Squeezy checkout in a new tab
 */
export function openLemonSqueezyCheckout(
    variantId: string,
    userId?: string,
    userEmail?: string,
    redirectUrl?: string
): void {
    if (!variantId || variantId.includes('variant_')) {
        toast.error("Checkout configuration missing. Please contact support.");
        console.error("Lemon Squeezy Variant ID is missing or default.");
        return;
    }

    try {
        const url = getLemonSqueezyCheckoutUrl(variantId, userId, userEmail, redirectUrl);
        window.open(url, '_blank');
    } catch (error) {
        console.error("Error opening checkout:", error);
        toast.error("Failed to open checkout.");
    }
}
