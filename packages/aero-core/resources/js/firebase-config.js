// firebase-config.js
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: "AIzaSyCwfSbrgNYCrhdmFIlU7pS7bVVT__lwOgo",
    authDomain: "dbedc-erp.firebaseapp.com",
    projectId: "dbedc-erp",
    storageBucket: "dbedc-erp.firebasestorage.app",
    messagingSenderId: "551140686722",
    appId: "1:551140686722:web:d99b8829aad35e60232d9b",
    measurementId: "G-GRR20JHLW3"
  };
  

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestNotificationPermission = async () => {
    try {
        // Support both old REACT_APP and new VITE naming conventions
        const vapidKey = import.meta.env.VITE_VAPID_KEY 
            || import.meta.env.REACT_APP_VAPID_ID 
            || 'BIB_ue-OutyDEoIxodVhJkdkmUif0C_4pOjd6CCK5U1FxicXrzSh1m8oHjm5su8jCELdd0osPgEdd_7DeYk2JxI';
        
        const token = await getToken(messaging, { vapidKey });
        if (token) {
            return token;
        } else {
            console.error('No registration token available');
        }
    } catch (err) {
        console.error('An error occurred while retrieving token:', err);
    }
};

export const onMessageListener = () => new Promise((resolve) => {
    onMessage(messaging, (payload) => {
        resolve(payload);
    });
});
