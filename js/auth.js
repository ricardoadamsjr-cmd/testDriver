// Authentication Module
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authStateListeners = [];
        this.init();
    }

    init() {
        // Listen for authentication state changes
        window.firebaseServices.auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            this.updateUI(user);
            this.notifyAuthStateListeners(user);
            
            if (user) {
                this.saveUserToFirestore(user);
                this.showToast('Welcome back!', 'success');
            }
        });

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Login button
        document.getElementById('loginBtn').addEventListener('click', () => {
            this.showAuthModal('login');
        });

        // Signup button
        document.getElementById('signupBtn').addEventListener('click', () => {
            this.showAuthModal('signup');
        });

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Modal close
        document.querySelector('.close').addEventListener('click', () => {
            this.hideAuthModal();
        });

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Form submissions
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('signupForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup();
        });

        // Google authentication
        document.getElementById('googleLogin').addEventListener('click', () => {
            this.handleGoogleAuth();
        });

        document.getElementById('googleSignup').addEventListener('click', () => {
            this.handleGoogleAuth();
        });

        // Close modal when clicking outside
        document.getElementById('authModal').addEventListener('click', (e) => {
            if (e.target.id === 'authModal') {
                this.hideAuthModal();
            }
        });
    }

    showAuthModal(tab = 'login') {
        const modal = document.getElementById('authModal');
        modal.style.display = 'block';
        this.switchTab(tab);
    }

    hideAuthModal() {
        const modal = document.getElementById('authModal');
        modal.style.display = 'none';
    }

    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // Update forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        document.getElementById(`${tab}Form`).classList.add('active');
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }

        this.showLoading(true);

        try {
            await window.firebaseServices.auth.signInWithEmailAndPassword(email, password);
            this.hideAuthModal();
            this.showToast('Login successful!', 'success');
        } catch (error) {
            console.error('Login error:', error);
            this.showToast(this.getErrorMessage(error), 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleSignup() {
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;

        if (!name || !email || !password) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }

        if (password.length < 6) {
            this.showToast('Password must be at least 6 characters', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const userCredential = await window.firebaseServices.auth.createUserWithEmailAndPassword(email, password);
            
            // Update user profile with display name
            await userCredential.user.updateProfile({
                displayName: name
            });

            this.hideAuthModal();
            this.showToast('Account created successfully!', 'success');
        } catch (error) {
            console.error('Signup error:', error);
            this.showToast(this.getErrorMessage(error), 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleGoogleAuth() {
        this.showLoading(true);

        try {
            await window.firebaseServices.auth.signInWithPopup(window.firebaseServices.googleProvider);
            this.hideAuthModal();
            this.showToast('Google authentication successful!', 'success');
        } catch (error) {
            console.error('Google auth error:', error);
            this.showToast(this.getErrorMessage(error), 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async logout() {
        try {
            await window.firebaseServices.auth.signOut();
            this.showToast('Logged out successfully', 'success');
        } catch (error) {
            console.error('Logout error:', error);
            this.showToast('Error logging out', 'error');
        }
    }

    async saveUserToFirestore(user) {
        try {
            const userRef = window.firebaseServices.db.collection('users').doc(user.uid);
            const userDoc = await userRef.get();

            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || 'Anonymous User',
                photoURL: user.photoURL || null,
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (!userDoc.exists) {
                userData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                userData.subscriptionStatus = 'none';
                userData.subscriptionPlan = null;
            }

            await userRef.set(userData, { merge: true });
            console.log('User data saved to Firestore');
        } catch (error) {
            console.error('Error saving user to Firestore:', error);
        }
    }

    updateUI(user) {
        const loginBtn = document.getElementById('loginBtn');
        const signupBtn = document.getElementById('signupBtn');
        const logoutBtn = document.getElementById('logoutBtn');

        if (user) {
            loginBtn.style.display = 'none';
            signupBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-flex';
            logoutBtn.textContent = `Logout (${user.displayName || user.email})`;
        } else {
            loginBtn.style.display = 'inline-flex';
            signupBtn.style.display = 'inline-flex';
            logoutBtn.style.display = 'none';
        }

        // Update user info in dashboard
        this.updateUserInfo(user);
    }

    updateUserInfo(user) {
        const userInfoDiv = document.getElementById('userInfo');
        
        if (user) {
            userInfoDiv.innerHTML = `
                <div class="user-avatar">
                    ${user.photoURL ? 
                        `<img src="${user.photoURL}" alt="Profile" style="width: 50px; height: 50px; border-radius: 50%; margin-bottom: 1rem;">` : 
                        `<div style="width: 50px; height: 50px; border-radius: 50%; background: var(--primary-color); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-bottom: 1rem;">${(user.displayName || user.email).charAt(0).toUpperCase()}</div>`
                    }
                </div>
                <p><strong>Name:</strong> ${user.displayName || 'Not provided'}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>User ID:</strong> ${user.uid}</p>
                <p><strong>Email Verified:</strong> ${user.emailVerified ? 'Yes' : 'No'}</p>
                <p><strong>Last Sign In:</strong> ${user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'N/A'}</p>
            `;
        } else {
            userInfoDiv.innerHTML = '<p>Please log in to view your information</p>';
        }
    }

    addAuthStateListener(callback) {
        this.authStateListeners.push(callback);
    }

    notifyAuthStateListeners(user) {
        this.authStateListeners.forEach(callback => callback(user));
    }

    getErrorMessage(error) {
        switch (error.code) {
            case 'auth/user-not-found':
                return 'No account found with this email';
            case 'auth/wrong-password':
                return 'Incorrect password';
            case 'auth/email-already-in-use':
                return 'Email is already registered';
            case 'auth/weak-password':
                return 'Password is too weak';
            case 'auth/invalid-email':
                return 'Invalid email address';
            case 'auth/popup-closed-by-user':
                return 'Authentication cancelled';
            case 'auth/popup-blocked':
                return 'Popup blocked. Please allow popups and try again';
            default:
                return error.message || 'An error occurred';
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        overlay.style.display = show ? 'flex' : 'none';
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return !!this.currentUser;
    }
}

// Initialize authentication manager
window.authManager = new AuthManager();