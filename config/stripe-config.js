// Stripe Configuration
// Replace with your actual Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = 'pk_test_your_stripe_publishable_key_here';

// Initialize Stripe
const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);

// Stripe Price IDs for different subscription plans
// Replace these with your actual Stripe Price IDs
const STRIPE_PRICES = {
    basic: 'price_basic_monthly_id',
    pro: 'price_pro_monthly_id', 
    enterprise: 'price_enterprise_monthly_id'
};

// Your backend endpoints for Stripe operations
// Update these URLs to match your backend server
const STRIPE_ENDPOINTS = {
    createCheckoutSession: '/api/create-checkout-session',
    createPortalSession: '/api/create-portal-session',
    webhookEndpoint: '/api/stripe-webhook',
    getSubscriptionStatus: '/api/subscription-status'
};

// Export for use in other files
window.stripeServices = {
    stripe,
    STRIPE_PRICES,
    STRIPE_ENDPOINTS
};

console.log('Stripe initialized successfully');