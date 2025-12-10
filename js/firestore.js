// Firestore Database Module
class FirestoreManager {
    constructor() {
        this.db = window.firebaseServices.db;
        this.realtimeListeners = [];
        this.init();
    }

    init() {
        // Listen for authentication state changes
        window.authManager.addAuthStateListener((user) => {
            if (user) {
                this.setupRealtimeListeners(user);
            } else {
                this.cleanupListeners();
                this.clearDashboardData();
            }
        });
    }

    setupRealtimeListeners(user) {
        this.cleanupListeners(); // Clean up existing listeners first

        // Listen to user document changes
        const userListener = this.db.collection('users').doc(user.uid)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    this.handleUserDataUpdate(doc.data());
                }
            }, (error) => {
                console.error('Error listening to user data:', error);
            });

        // Listen to user's subscription changes
        const subscriptionListener = this.db.collection('subscriptions')
            .where('userId', '==', user.uid)
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    this.handleSubscriptionUpdate(change);
                });
            }, (error) => {
                console.error('Error listening to subscription data:', error);
            });

        // Listen to real-time updates collection
        const updatesListener = this.db.collection('realtime_updates')
            .where('userId', '==', user.uid)
            .orderBy('timestamp', 'desc')
            .limit(10)
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        this.handleRealtimeUpdate(change.doc.data());
                    }
                });
            }, (error) => {
                console.error('Error listening to real-time updates:', error);
            });

        // Listen to webhook events
        const webhookListener = this.db.collection('webhook_events')
            .where('userId', '==', user.uid)
            .orderBy('timestamp', 'desc')
            .limit(10)
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        this.handleWebhookEvent(change.doc.data());
                    }
                });
            }, (error) => {
                console.error('Error listening to webhook events:', error);
            });

        // Store listeners for cleanup
        this.realtimeListeners = [
            userListener,
            subscriptionListener,
            updatesListener,
            webhookListener
        ];

        console.log('Firestore real-time listeners established');
    }

    cleanupListeners() {
        this.realtimeListeners.forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        this.realtimeListeners = [];
    }

    handleUserDataUpdate(userData) {
        console.log('User data updated:', userData);
        
        // Update subscription info in UI
        if (userData.subscriptionStatus) {
            this.updateSubscriptionUI(userData);
        }

        // Add to real-time updates
        this.addRealtimeUpdate('User data synchronized', 'info');
    }

    handleSubscriptionUpdate(change) {
        const subscription = change.doc.data();
        console.log('Subscription update:', change.type, subscription);

        let message = '';
        let type = 'info';

        switch (change.type) {
            case 'added':
                message = `New subscription created: ${subscription.planName}`;
                type = 'success';
                break;
            case 'modified':
                message = `Subscription updated: ${subscription.status}`;
                type = 'info';
                break;
            case 'removed':
                message = 'Subscription cancelled';
                type = 'warning';
                break;
        }

        this.addRealtimeUpdate(message, type);
        this.updateSubscriptionDisplay(subscription);
    }

    handleRealtimeUpdate(updateData) {
        console.log('Real-time update received:', updateData);
        this.displayRealtimeUpdate(updateData);
    }

    handleWebhookEvent(eventData) {
        console.log('Webhook event received:', eventData);
        this.displayWebhookEvent(eventData);
    }

    updateSubscriptionUI(userData) {
        const subscriptionInfo = document.getElementById('subscriptionInfo');
        const manageBtn = document.getElementById('manageSubscription');

        if (userData.subscriptionStatus && userData.subscriptionStatus !== 'none') {
            subscriptionInfo.innerHTML = `
                <div class="subscription-active">
                    <p><strong>Plan:</strong> ${userData.subscriptionPlan || 'Unknown'}</p>
                    <p><strong>Status:</strong> <span class="status-badge ${userData.subscriptionStatus}">${userData.subscriptionStatus}</span></p>
                    <p><strong>Next Billing:</strong> ${userData.nextBillingDate ? new Date(userData.nextBillingDate.toDate()).toLocaleDateString() : 'N/A'}</p>
                    <p><strong>Amount:</strong> ${userData.subscriptionAmount ? `$${userData.subscriptionAmount}` : 'N/A'}</p>
                </div>
            `;
            manageBtn.style.display = 'inline-flex';
        } else {
            subscriptionInfo.innerHTML = '<p>No active subscription</p>';
            manageBtn.style.display = 'none';
        }
    }

    updateSubscriptionDisplay(subscription) {
        const subscriptionInfo = document.getElementById('subscriptionInfo');
        
        subscriptionInfo.innerHTML = `
            <div class="subscription-active">
                <p><strong>Plan:</strong> ${subscription.planName}</p>
                <p><strong>Status:</strong> <span class="status-badge ${subscription.status}">${subscription.status}</span></p>
                <p><strong>Created:</strong> ${new Date(subscription.createdAt.toDate()).toLocaleDateString()}</p>
                <p><strong>Amount:</strong> $${subscription.amount}</p>
            </div>
        `;
    }

    addRealtimeUpdate(message, type = 'info') {
        const timestamp = new Date();
        const updateData = {
            message,
            type,
            timestamp: timestamp.toISOString()
        };
        
        this.displayRealtimeUpdate(updateData);
    }

    displayRealtimeUpdate(updateData) {
        const updatesContainer = document.getElementById('realtimeUpdates');
        
        // Create update element
        const updateElement = document.createElement('div');
        updateElement.className = `update-item ${updateData.type}`;
        updateElement.innerHTML = `
            <div class="update-content">
                <span class="update-message">${updateData.message}</span>
                <span class="update-time">${new Date(updateData.timestamp).toLocaleTimeString()}</span>
            </div>
        `;

        // Add to top of list
        if (updatesContainer.firstChild && updatesContainer.firstChild.tagName !== 'P') {
            updatesContainer.insertBefore(updateElement, updatesContainer.firstChild);
        } else {
            updatesContainer.innerHTML = '';
            updatesContainer.appendChild(updateElement);
        }

        // Limit to 10 updates
        const updates = updatesContainer.querySelectorAll('.update-item');
        if (updates.length > 10) {
            updates[updates.length - 1].remove();
        }
    }

    displayWebhookEvent(eventData) {
        const eventsContainer = document.getElementById('webhookEvents');
        
        // Create event element
        const eventElement = document.createElement('div');
        eventElement.className = 'event-item';
        eventElement.innerHTML = `
            <div class="event-content">
                <div class="event-header">
                    <span class="event-type">${eventData.type}</span>
                    <span class="event-time">${new Date(eventData.timestamp).toLocaleTimeString()}</span>
                </div>
                <div class="event-details">
                    ${eventData.description || 'Webhook event received'}
                </div>
            </div>
        `;

        // Add to top of list
        if (eventsContainer.firstChild && eventsContainer.firstChild.tagName !== 'P') {
            eventsContainer.insertBefore(eventElement, eventsContainer.firstChild);
        } else {
            eventsContainer.innerHTML = '';
            eventsContainer.appendChild(eventElement);
        }

        // Limit to 10 events
        const events = eventsContainer.querySelectorAll('.event-item');
        if (events.length > 10) {
            events[events.length - 1].remove();
        }
    }

    clearDashboardData() {
        document.getElementById('realtimeUpdates').innerHTML = '<p>Waiting for real-time updates...</p>';
        document.getElementById('webhookEvents').innerHTML = '<p>No webhook events received</p>';
        document.getElementById('subscriptionInfo').innerHTML = '<p>No active subscription</p>';
        document.getElementById('manageSubscription').style.display = 'none';
    }

    // Utility methods for testing
    async createTestUpdate(message, type = 'info') {
        const user = window.authManager.getCurrentUser();
        if (!user) return;

        try {
            await this.db.collection('realtime_updates').add({
                userId: user.uid,
                message,
                type,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('Test update created');
        } catch (error) {
            console.error('Error creating test update:', error);
        }
    }

    async createTestWebhookEvent(type, description) {
        const user = window.authManager.getCurrentUser();
        if (!user) return;

        try {
            await this.db.collection('webhook_events').add({
                userId: user.uid,
                type,
                description,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('Test webhook event created');
        } catch (error) {
            console.error('Error creating test webhook event:', error);
        }
    }

    // Get user subscription data
    async getUserSubscription(userId) {
        try {
            const snapshot = await this.db.collection('subscriptions')
                .where('userId', '==', userId)
                .where('status', '==', 'active')
                .get();
            
            if (!snapshot.empty) {
                return snapshot.docs[0].data();
            }
            return null;
        } catch (error) {
            console.error('Error getting user subscription:', error);
            return null;
        }
    }

    // Update user subscription status
    async updateUserSubscription(userId, subscriptionData) {
        try {
            const userRef = this.db.collection('users').doc(userId);
            await userRef.update({
                subscriptionStatus: subscriptionData.status,
                subscriptionPlan: subscriptionData.planName,
                subscriptionAmount: subscriptionData.amount,
                nextBillingDate: subscriptionData.nextBillingDate,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('User subscription updated');
        } catch (error) {
            console.error('Error updating user subscription:', error);
        }
    }
}

// Initialize Firestore manager
window.firestoreManager = new FirestoreManager();

// Add some CSS for status badges
const style = document.createElement('style');
style.textContent = `
    .status-badge {
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
    }
    
    .status-badge.active {
        background: #dcfce7;
        color: #166534;
    }
    
    .status-badge.cancelled {
        background: #fef2f2;
        color: #991b1b;
    }
    
    .status-badge.past_due {
        background: #fef3c7;
        color: #92400e;
    }
    
    .update-item, .event-item {
        border-left: 3px solid var(--primary-color);
    }
    
    .update-item.success {
        border-left-color: var(--success-color);
    }
    
    .update-item.warning {
        border-left-color: var(--warning-color);
    }
    
    .update-item.error {
        border-left-color: var(--error-color);
    }
    
    .update-content, .event-content {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
    }
    
    .update-time, .event-time {
        font-size: 0.75rem;
        color: var(--text-secondary);
        white-space: nowrap;
    }
    
    .event-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.25rem;
    }
    
    .event-type {
        font-weight: 600;
        color: var(--primary-color);
    }
    
    .event-details {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }
`;
document.head.appendChild(style);