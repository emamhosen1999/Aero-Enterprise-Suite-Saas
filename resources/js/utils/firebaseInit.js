import axios from 'axios';

let firebaseInitialized = false;

export const initFirebase = async () => {
    if (firebaseInitialized) return;
    
    try {
        // Dynamic import to avoid loading Firebase unless needed
        const { onMessageListener, requestNotificationPermission } = await import("@/firebase-config.js");
        
        // Request notification permission and get token
        const token = await requestNotificationPermission();
        if (token) {
            // Store FCM token in localStorage for device identification service
            localStorage.setItem('fcm_token', token);
            
            try {
                const response = await axios.post(route('updateFcmToken'), { fcm_token: token });
                if (response.status === 200) {
                    console.log('FCM Token Updated:', response.data.fcm_token);
                }
            } catch (error) {
                console.error('Failed to update FCM token:', error);
            }
        } else {
            console.warn('Notification permission denied or no token retrieved.');
        }

        // Listen for foreground messages
        const unsubscribeOnMessage = onMessageListener()
            .then(payload => {
                console.log('Message received:', payload);
                const { title, body, icon } = payload.notification;

                // Display desktop notification
                if (Notification.permission === 'granted') {
                    new Notification(title, { body, icon });
                }

                // Also show in-app alert (optional)
                alert(`${title}: ${body}`);
            })
            .catch(err => console.error('onMessageListener error:', err));

        firebaseInitialized = true;
        
        return () => {
            if (unsubscribeOnMessage && typeof unsubscribeOnMessage === 'function') {
                unsubscribeOnMessage();
            }
        };
    } catch (err) {
        console.error('Firebase initialization error:', err);
    }
};
