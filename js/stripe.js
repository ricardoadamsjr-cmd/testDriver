// Stripe Integration Module
class StripeManager {
    constructor() {
        this.stripe = window.stripeServices.stripe;
        this.prices = window.stripeServices.STRIPE_PRICES;
        this.endpoints = window.stripeServices.STRIPE_ENDPOINTS;
        this.init();
    }

    init() {
        this.setupEventListeners();
        
        // Listen for authentication state changes
        window.authManager.addAuthStateListener((user) => {
            if (user) {
                this.loadUserSubscriptionStatus(user);
            }
        });
    }

    setupEventListeners() {
        // Subscribe buttons
        document.querySelectorAll('.subscribe-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const priceId = e.target.dataset.priceId;
                this.handleSubscription(priceId);
            });
        });

        // Manage subscription button
        document.getElementById('manageSubscription').addEventListener('click', () => {
            this.openCustomerPortal();
        });
    }

    async handleSubscription(priceId) {
        const user = window.authManager.getCurrentUser();
        
        if (!user) {
            window.authManager.showAuthModal('login');
            window.authManager.showToast('Please log in to subscribe', 'warning');
            return;
        }

        // Map price IDs to plan names
        const planNames = {
            'price_basic': 'Basic',
            'price_pro': 'Pro', 
            'price_enterprise': 'Enterprise'
        };

        const planName = planNames[priceId] || 'Unknown Plan';

        window.authManager.showLoading(true);

        try {
            // Create checkout session
            const response = await this.createCheckoutSession({
                priceId: this.prices[priceId.replace('price_', '')] || priceId,
                userId: user.uid,
                userEmail: user.email,
                planName: planName
            });

            if (response.sessionId) {
                // Redirect to Stripe Checkout
                const { error } = await this.stripe.redirectToCheckout({
                    sessionId: response.sessionId
                });

                if (error) {
                    console.error('Stripe checkout error:', error);
                    window.authManager.showToast('Error redirecting to checkout', 'error');
                }
            } else {
                throw new Error('No session ID received');
            }
        } catch (error) {
            console.error('Subscription error:', error);
            window.authManager.showToast('Error creating subscription. Please try again.', 'error');
        } finally {
            window.authManager.showLoading(false);
        }
    }

    async createCheckoutSession(data) {
        // This would typically call your backend API
        // For demo purposes, we'll simulate the API call
        console.log('Creating checkout session with data:', data);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In a real implementation, this would be:
        /*
        const response = await fetch(this.endpoints.createCheckoutSession, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Failed to create checkout session');
        }
        
        return await response.json();
        */
        
        // For demo, we'll create a test subscription in Firestore
        await this.createTestSubscription(data);
        
        // Return mock session ID (in real app, this would come from Stripe)
        return {
            sessionId: 'cs_test_' + Math.random().toString(36).substr(2, 9)
        };
    }

    async createTestSubscription(data) {
        const user = window.authManager.getCurrentUser();
        if (!user) return;

        try {
            // Create subscription document in Firestore
            const subscriptionData = {
                userId: user.uid,
                planName: data.planName,
                priceId: data.priceId,
                status: 'active',
                amount: this.getPlanAmount(data.planName),
                currency: 'usd',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                nextBillingDate: firebase.firestore.Timestamp.fromDate(
                    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
                )
            };

            await window.firestoreManager.db.collection('subscriptions').add(subscriptionData);

            // Update user document
            await window.firestoreManager.updateUserSubscription(user.uid, subscriptionData);

            // Create webhook event simulation
            await this.simulateWebhookEvent('customer.subscription.created', {
                subscription: subscriptionData,
                customer: {
                    email: user.email,
                    id: user.uid
                }
            });

            window.authManager.showToast(`Successfully subscribed to ${data.planName} plan!`, 'success');
            
        } catch (error) {
            console.error('Error creating test subscription:', error);
            throw error;
        }
    }

    async openCustomerPortal() {
        const user = window.authManager.getCurrentUser();
        
        if (!user) {
            window.authManager.showToast('Please log in first', 'warning');
            return;
        }

        window.authManager.showLoading(true);

        try {
            // In a real implementation, this would call your backend:
            /*
            const response = await fetch(this.endpoints.createPortalSession, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customerId: user.stripeCustomerId,
                    returnUrl: window.location.origin
                })
            });
            
            const { url } = await response.json();
            window.location.href = url;
            */
            
            // For demo purposes, show a modal with subscription management options
            this.showSubscriptionManagementModal();
            
        } catch (error) {
            console.error('Error opening customer portal:', error);
            window.authManager.showToast('Error opening subscription management', 'error');
        } finally {
            window.authManager.showLoading(false);
        }
    }

    showSubscriptionManagementModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <div style="padding: 2rem;">
                    <h3>Subscription Management</h3>
                    <p>In a real implementation, this would redirect to Stripe Customer Portal where users can:</p>
                    <ul style="margin: 1rem 0; padding-left: 2rem;">
                        <li>Update payment methods</li>
                        <li>Change subscription plans</li>
                        <li>View billing history</li>
                        <li>Cancel subscription</li>
                        <li>Download invoices</li>
                    </ul>
                    <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                        <button class="btn btn-primary" onclick="stripeManager.simulateSubscriptionChange()">
                            Simulate Plan Change
                        </button>
                        <button class="btn btn-outline" onclick="stripeManager.simulateSubscriptionCancel()">
                            Simulate Cancellation
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal functionality
        modal.querySelector('.close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    async simulateSubscriptionChange() {
        const user = window.authManager.getCurrentUser();
        if (!user) return;

        try {
            // Simulate changing to Pro plan
            const newSubscriptionData = {
                userId: user.uid,
                planName: 'Pro',
                status: 'active',
                amount: 19,
                currency: 'usd',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await window.firestoreManager.updateUserSubscription(user.uid, newSubscriptionData);

            // Simulate webhook
            await this.simulateWebhookEvent('customer.subscription.updated', {
                subscription: newSubscriptionData,
                previous_attributes: { planName: 'Basic' }
            });

            window.authManager.showToast('Subscription updated to Pro plan!', 'success');
            
            // Close modal
            const modal = document.querySelector('.modal');
            if (modal) document.body.removeChild(modal);
            
        } catch (error) {
            console.error('Error simulating subscription change:', error);
            window.authManager.showToast('Error updating subscription', 'error');
        }
    }

    async simulateSubscriptionCancel() {
        const user = window.authManager.getCurrentUser();
        if (!user) return;

        try {
            const cancelledSubscriptionData = {
                userId: user.uid,
                planName: null,
                status: 'cancelled',
                amount: 0,
                cancelledAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await window.firestoreManager.updateUserSubscription(user.uid, {
                subscriptionStatus: 'cancelled',
                subscriptionPlan: null,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Simulate webhook
            await this.simulateWebhookEvent('customer.subscription.deleted', {
                subscription: cancelledSubscriptionData
            });

            window.authManager.showToast('Subscription cancelled successfully', 'warning');
            
            // Close modal
            const modal = document.querySelector('.modal');
            if (modal) document.body.removeChild(modal);
            
        } catch (error) {
            console.error('Error simulating subscription cancellation:', error);
            window.authManager.showToast('Error cancelling subscription', 'error');
        }
    }

    async simulateWebhookEvent(eventType, data) {
        const user = window.authManager.getCurrentUser();
        if (!user) return;

        try {
            const webhookEvent = {
                userId: user.uid,
                type: eventType,
                description: this.getWebhookDescription(eventType, data),
                data: data,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            await window.firestoreManager.db.collection('webhook_events').add(webhookEvent);
            console.log('Webhook event simulated:', eventType);
            
        } catch (error) {
            console.error('Error simulating webhook event:', error);
        }
    }

    getWebhookDescription(eventType, data) {
        switch (eventType) {
            case 'customer.subscription.created':
                return `New subscription created for ${data.subscription.planName} plan`;
            case 'customer.subscription.updated':
                return `Subscription updated to ${data.subscription.planName} plan`;
            case 'customer.subscription.deleted':
                return 'Subscription cancelled';
            case 'invoice.payment_succeeded':
                return `Payment of $${data.amount} succeeded`;
            case 'invoice.payment_failed':
                return `Payment of $${data.amount} failed`;
            default:
                return `Webhook event: ${eventType}`;
        }
    }

    async loadUserSubscriptionStatus(user) {
        try {
            const subscription = await window.firestoreManager.getUserSubscription(user.uid);
            if (subscription) {
                console.log('User subscription loaded:', subscription);
            }
        } catch (error) {
            console.error('Error loading subscription status:', error);
        }
    }

    getPlanAmount(planName) {
        const amounts = {
            'Basic': 9,
            'Pro': 19,
            'Enterprise': 49
        };
        return amounts[planName] || 0;
    }

    // Utility method to test webhook handling
    async testWebhookHandling() {
        const user = window.authManager.getCurrentUser();
        if (!user) {
            window.authManager.showToast('Please log in first', 'warning');
            return;
        }

        // Simulate various webhook events
        const events = [
            { type: 'invoice.payment_succeeded', amount: 19 },
            { type: 'customer.subscription.updated', subscription: { planName: 'Pro' } },
            { type: 'invoice.payment_failed', amount: 19 }
        ];

        for (const event of events) {
            await this.simulateWebhookEvent(event.type, event);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between events
        }

        window.authManager.showToast('Webhook events simulated!', 'success');
    }
}

// Initialize Stripe manager
window.stripeManager = new StripeManager();

// Add test functions to window for console testing
window.testStripe = {
    testWebhooks: () => window.stripeManager.testWebhookHandling(),
    simulatePaymentSuccess: () => window.stripeManager.simulateWebhookEvent('invoice.payment_succeeded', { amount: 19 }),
    simulatePaymentFailure: () => window.stripeManager.simulateWebhookEvent('invoice.payment_failed', { amount: 19 })
};