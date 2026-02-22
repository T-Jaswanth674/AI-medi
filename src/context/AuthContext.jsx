import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase/config';

// Secondary Firebase app for creating users without disrupting admin session
const secondaryApp = initializeApp(firebaseConfig, 'secondary');
const secondaryAuth = getAuth(secondaryApp);

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Internal helper — not exposed in context
    const fetchUserProfile = async (uid) => {
        try {
            const docRef = doc(db, 'users', uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data();
            }
            console.warn('No Firestore profile found for uid:', uid);
            return null;
        } catch (err) {
            console.error('Error fetching user profile:', err);
            return null;
        }
    };

    const login = async (email, password) => {
        const result = await signInWithEmailAndPassword(auth, email, password);
        // Check for disabled account immediately after login
        const profile = await fetchUserProfile(result.user.uid);
        if (profile?.disabled) {
            await signOut(auth);
            throw Object.assign(new Error('This account has been disabled. Contact your administrator.'), { code: 'auth/account-disabled' });
        }
        return result;
    };

    const logout = async () => {
        await signOut(auth);
        setUserProfile(null);
    };

    // Uses a secondary Firebase app so the admin session is NOT disrupted
    const createUser = async (email, password, profileData) => {
        const result = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        await setDoc(doc(db, 'users', result.user.uid), {
            uid: result.user.uid,
            email,
            ...profileData,
            disabled: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        // Sign out of the secondary auth immediately (we don't need this session)
        await signOut(secondaryAuth);
        return result;
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const profile = await fetchUserProfile(user.uid);
                    // If account was soft-deleted/disabled, force sign out
                    if (profile?.disabled) {
                        await signOut(auth);
                        setCurrentUser(null);
                        setUserProfile(null);
                    } else {
                        setCurrentUser(user);
                        setUserProfile(profile);
                    }
                } catch (error) {
                    console.error("Error during auth state change:", error);
                    setCurrentUser(null);
                    setUserProfile(null);
                } finally {
                    setLoading(false);
                }
            } else {
                setCurrentUser(null);
                setUserProfile(null);
                setLoading(false);
            }
        });
        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userProfile,
        loading,
        login,
        logout,
        createUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
