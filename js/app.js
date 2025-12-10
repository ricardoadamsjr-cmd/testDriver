// Main Application Module
class App {
    constructor() {
        this.init();
    }

    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupApp();
            });
        } else {
            this.setupApp();
        }
    }

    setupApp() {
        this.setupNavigation();
        this.setupScrollEffects();
        this.setupTestingFeatures();
        this.displayAppInfo();
        
        console.log('Firebase & Stripe Integration App initialized');
    }

    setupNavigation() {
        // Smooth scrolling for navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                this.scrollToSection(targetId);
                this.updateActiveNavLink(link);
            });
        });

        // Update active nav link on scroll
        window.addEventListener('scroll', () => {
            this.updateActiveNavOnScroll();
        });
    }

    setupScrollEffects() {
        // Header background on scroll
        window.addEventListener('scroll', () => {
            const header = document.querySelector('.header');
            if (window.scrollY > 50) {
                header.style.background = 'rgba(255, 255, 255, 0.98)';
                header.style.boxShadow = 'var(--shadow-md)';
            } else {
                header.style.background = 'rgba(255, 255, 255, 0.95)';
                header.style.boxShadow = 'none';
            }
        });

        // Intersection Observer for animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe elements for animation
        document.querySelectorAll('.feature-card, .pricing-card').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    setupTestingFeatures() {
        // Add testing buttons to dashboard
        this.addTestingControls();
        
        // Setup keyboard shortcuts for testing
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + T for testing mode
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.toggleTestingMode();
            }
        });
    }

    addTestingControls() {
        const dashboard = document.querySelector('.dashboard-content');
        
        const testingCard = document.createElement('div');
        testingCard.className = 'testing-card';
        testingCard.innerHTML = `
            <h3><i class="fas fa-flask"></i> Testing Controls</h3>
            <div class="testing-buttons">
                <button class="btn btn-outline btn-small" onclick="app.testRealtimeUpdate()">
                    Test Real-time Update
                </button>
                <button class="btn btn-outline btn-small" onclick="app.testWebhookEvent()">
                    Test Webhook Event
                </button>
                <button class="btn btn-outline btn-small" onclick="app.testFirestoreConnection()">
                    Test Firestore
                </button>
                <button class="btn btn-outline btn-small" onclick="app.clearTestData()">
                    Clear Test Data
                </button>
            </div>
            <div class="testing-info">
                <p><small>Use these buttons to test Firebase and Stripe integrations</small></p>
            </div>
        `;

        dashboard.appendChild(testingCard);

        // Add CSS for testing card
        const style = document.createElement('style');
        style.textContent = `
            .testing-card {
                background: var(--bg-primary);
                border-radius: 16px;
                padding: 2rem;
                box-shadow: var(--shadow-md);
                border: 2px dashed var(--primary-color);
                grid-column: 1 / -1;
            }
            
            .testing-card h3 {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 1.25rem;
                font-weight: 600;
                margin-bottom: 1.5rem;
                color: var(--primary-color);
            }
            
            .testing-buttons {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
                margin-bottom: 1rem;
            }
            
            .btn-small {
                padding: 0.5rem 1rem;
                font-size: 0.875rem;
            }
            
            .testing-info {
                color: var(--text-secondary);
                font-style: italic;
            }
            
            @media (max-width: 768px) {
                .testing-buttons {
                    flex-direction: column;
                }
            }
        `;
        document.head.appendChild(style);
    }

    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            const headerHeight = document.querySelector('.header').offsetHeight;
            const targetPosition = section.offsetTop - headerHeight - 20;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }

    updateActiveNavLink(activeLink) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        activeLink.classList.add('active');
    }

    updateActiveNavOnScroll() {
        const sections = document.querySelectorAll('section[id]');
        const headerHeight = document.querySelector('.header').offsetHeight;
        const scrollPosition = window.scrollY + headerHeight + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                });
                
                const activeLink = document.querySelector(`[href="#${sectionId}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        });
    }

    displayAppInfo() {
        console.log(`
🔥 Firebase & Stripe Integration Test App
=========================================

Features:
✅ Firebase Authentication (Email/Password + Google)
✅ Firestore Real-time Database
✅ Stripe Subscription Management
✅ Webhook Event Simulation
✅ Real-time Updates

Testing Commands:
- app.testRealtimeUpdate() - Test real-time updates
- app.testWebhookEvent() - Test webhook events
- app.testFirestoreConnection() - Test Firestore connection
- testStripe.testWebhooks() - Test Stripe webhooks
- Ctrl/Cmd + Shift + T - Toggle testing mode

Setup Instructions:
1. Replace Firebase config in config/firebase-config.js
2. Replace Stripe keys in config/stripe-config.js
3. Set up your backend API endpoints
4. Configure Firestore security rules
5. Set up Stripe webhooks

Happy testing! 🚀
        `);
    }

    // Testing methods
    async testRealtimeUpdate() {
        const user = window.authManager.getCurrentUser();
        if (!user) {
            window.authManager.showToast('Please log in first', 'warning');
            return;
        }

        const messages = [
            'Database connection established',
            'User preferences updated',
            'New feature unlocked',
            'System maintenance completed',
            'Performance optimization applied'
        ];

        const types = ['info', 'success', 'warning'];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        const randomType = types[Math.floor(Math.random() * types.length)];

        await window.firestoreManager.createTestUpdate(randomMessage, randomType);
        window.authManager.showToast('Real-time update sent!', 'success');
    }

    async testWebhookEvent() {
        const user = window.authManager.getCurrentUser();
        if (!user) {
            window.authManager.showToast('Please log in first', 'warning');
            return;
        }

        const events = [
            { type: 'invoice.payment_succeeded', desc: 'Payment processed successfully' },
            { type: 'customer.subscription.updated', desc: 'Subscription plan changed' },
            { type: 'invoice.payment_failed', desc: 'Payment failed - retry scheduled' },
            { type: 'customer.subscription.trial_will_end', desc: 'Trial ending in 3 days' }
        ];

        const randomEvent = events[Math.floor(Math.random() * events.length)];
        await window.firestoreManager.createTestWebhookEvent(randomEvent.type, randomEvent.desc);
        window.authManager.showToast('Webhook event simulated!', 'success');
    }

    async testFirestoreConnection() {
        try {
            // Test write
            const testDoc = await window.firestoreManager.db.collection('test').add({
                message: 'Connection test',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Test read
            const doc = await testDoc.get();
            
            if (doc.exists) {
                // Clean up
                await testDoc.delete();
                window.authManager.showToast('Firestore connection successful!', 'success');
            } else {
                throw new Error('Document not found');
            }
        } catch (error) {
            console.error('Firestore test failed:', error);
            window.authManager.showToast('Firestore connection failed', 'error');
        }
    }

    async clearTestData() {
        const user = window.authManager.getCurrentUser();
        if (!user) {
            window.authManager.showToast('Please log in first', 'warning');
            return;
        }

        try {
            // Clear real-time updates
            const updatesSnapshot = await window.firestoreManager.db
                .collection('realtime_updates')
                .where('userId', '==', user.uid)
                .get();

            const updateDeletePromises = updatesSnapshot.docs.map(doc => doc.ref.delete());

            // Clear webhook events
            const eventsSnapshot = await window.firestoreManager.db
                .collection('webhook_events')
                .where('userId', '==', user.uid)
                .get();

            const eventDeletePromises = eventsSnapshot.docs.map(doc => doc.ref.delete());

            await Promise.all([...updateDeletePromises, ...eventDeletePromises]);

            // Clear UI
            document.getElementById('realtimeUpdates').innerHTML = '<p>Waiting for real-time updates...</p>';
            document.getElementById('webhookEvents').innerHTML = '<p>No webhook events received</p>';

            window.authManager.showToast('Test data cleared!', 'success');
        } catch (error) {
            console.error('Error clearing test data:', error);
            window.authManager.showToast('Error clearing test data', 'error');
        }
    }

    toggleTestingMode() {
        const testingCard = document.querySelector('.testing-card');
        if (testingCard) {
            testingCard.style.display = testingCard.style.display === 'none' ? 'block' : 'none';
            window.authManager.showToast('Testing mode toggled', 'info');
        }
    }

    // Utility methods
    formatTimestamp(timestamp) {
        if (timestamp && timestamp.toDate) {
            return timestamp.toDate().toLocaleString();
        }
        return new Date(timestamp).toLocaleString();
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // Error handling
    handleError(error, context = 'Application') {
        console.error(`${context} Error:`, error);
        window.authManager.showToast(`${context} error occurred`, 'error');
    }
}

// Global utility functions
window.scrollToSection = (sectionId) => {
    window.app.scrollToSection(sectionId);
};

// Initialize the application
window.app = new App();

// Add global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// Service worker registration (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment to register service worker
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => console.log('SW registered'))
        //     .catch(error => console.log('SW registration failed'));
    });
}