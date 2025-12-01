/**
 * Paddle Payment Integration Utility
 * 
 * This module handles Paddle checkout initialization and integration
 */

// Paddle environment types
type PaddleEnvironment = 'sandbox' | 'production';

interface PaddleCheckoutOptions {
    items: Array<{
        priceId: string;
        quantity: number;
    }>;
    customData?: {
        user_id: string;
        [key: string]: string;
    };
    customer?: {
        email?: string;
    };
}

interface PaddleConfig {
    vendorId: string;
    environment: PaddleEnvironment;
}

// Declare Paddle global
declare global {
    interface Window {
        Paddle: any;
    }
}

class PaddleIntegration {
    private config: PaddleConfig;
    private initialized: boolean = false;

    constructor(config: PaddleConfig) {
        this.config = config;
    }

    /**
     * Initialize Paddle
     */
    async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        // Wait for Paddle script to load
        if (typeof window.Paddle === 'undefined') {
            await this.waitForPaddle();
        }

        // Initialize Paddle with vendor ID
        window.Paddle.Environment.set(this.config.environment);
        window.Paddle.Initialize({
            token: this.config.vendorId,
        });

        this.initialized = true;
        console.log('Paddle initialized successfully');
    }

    /**
     * Wait for Paddle script to load
     */
    private waitForPaddle(): Promise<void> {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds max

            const checkPaddle = setInterval(() => {
                attempts++;

                if (typeof window.Paddle !== 'undefined') {
                    clearInterval(checkPaddle);
                    resolve();
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkPaddle);
                    reject(new Error('Paddle script failed to load'));
                }
            }, 100);
        });
    }

    /**
     * Open Paddle checkout overlay
     */
    async openCheckout(options: PaddleCheckoutOptions): Promise<void> {
        if (!this.initialized) {
            await this.initialize();
        }

        window.Paddle.Checkout.open(options);
    }

    /**
     * Get checkout URL for a specific price
     */
    getCheckoutUrl(priceId: string, userId?: string): string {
        const baseUrl = this.config.environment === 'sandbox'
            ? 'https://sandbox-checkout.paddle.com'
            : 'https://checkout.paddle.com';

        let url = `${baseUrl}/checkout?items[0][price_id]=${priceId}`;

        if (userId) {
            url += `&custom_data[user_id]=${userId}`;
        }

        return url;
    }
}

// Create singleton instance
let paddleInstance: PaddleIntegration | null = null;

/**
 * Get Paddle instance
 */
export function getPaddle(): PaddleIntegration {
    if (!paddleInstance) {
        const vendorId = import.meta.env.VITE_PADDLE_VENDOR_ID;
        const environment = (import.meta.env.VITE_PADDLE_ENVIRONMENT || 'sandbox') as PaddleEnvironment;

        if (!vendorId) {
            throw new Error('VITE_PADDLE_VENDOR_ID environment variable is not set');
        }

        paddleInstance = new PaddleIntegration({
            vendorId,
            environment,
        });
    }

    return paddleInstance;
}

/**
 * Open Paddle checkout for a subscription plan
 */
export async function openPaddleCheckout(
    priceId: string,
    userId?: string,
    userEmail?: string
): Promise<void> {
    const paddle = getPaddle();

    const options: PaddleCheckoutOptions = {
        items: [
            {
                priceId,
                quantity: 1,
            },
        ],
    };

    if (userId) {
        options.customData = {
            user_id: userId,
        };
    }

    if (userEmail) {
        options.customer = {
            email: userEmail,
        };
    }

    await paddle.openCheckout(options);
}

/**
 * Get direct checkout URL (for opening in new tab)
 */
export function getPaddleCheckoutUrl(priceId: string, userId?: string): string {
    const paddle = getPaddle();
    return paddle.getCheckoutUrl(priceId, userId);
}
