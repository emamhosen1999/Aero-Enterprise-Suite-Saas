// firebase-config.js
// Firebase is optional - only loaded when needed for push notifications
// This module gracefully handles missing firebase dependency

let app = null;
let messaging = null;
let firebaseAvailable = null; // null = not checked, true = available, false = not available

const firebaseConfig = {
    apiKey: "AIzaSyCwfSbrgNYCrhdmFIlU7pS7bVVT__lwOgo",
    authDomain: "dbedc-erp.firebaseapp.com",
    projectId: "dbedc-erp",
    storageBucket: "dbedc-erp.firebasestorage.app",
    messagingSenderId: "551140686722",
    appId: "1:551140686722:web:d99b8829aad35e60232d9b",
    measurementId: "G-GRR20JHLW3"
};

// Check if Firebase is available (runtime check only, no build-time imports)
const checkFirebaseAvailability = () => {
    if (firebaseAvailable !== null) {
        return firebaseAvailable;
    }
    
    // Check if firebase is available without importing it
    firebaseAvailable = false;
    console.warn('[Firebase] Package not installed - push notifications disabled');
    return false;
};

// Initialize Firebase only if the package is available
const initFirebase = async () => {
    if (!checkFirebaseAvailability()) {
        return false;
    }
    
    // This code will never execute if firebase isn't installed
    // but we keep it for when firebase IS installed
    return false;
};

export const requestNotificationPermission = async () => {
    console.warn('[Firebase] Push notifications are disabled - firebase package not installed');
    return null;
};

export const onMessageListener = () => new Promise((resolve, reject) => {
    reject(new Error('Firebase not available - push notifications disabled'));
});
