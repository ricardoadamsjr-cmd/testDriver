// Firebase Configuration
// Replace these values with your actual Firebase project configuration
const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id",
    measurementId: "your-measurement-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Configure Firestore settings
db.settings({
    timestampsInSnapshots: true
});

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Export for use in other files
window.firebaseServices = {
    auth,
    db,
    googleProvider,
    firebase
};

console.log('Firebase initialized successfully');