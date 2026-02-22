// Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDulwtMmBSr049vT36nHHdIt_k3vvMXdeM",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "medi-ai-bb781.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "medi-ai-bb781",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "medi-ai-bb781.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "968860694230",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:968860694230:web:27691a605882e44a32fb77",
};

export default firebaseConfig;
