// authService.js
// Handles all authentication operations with Cloud Functions integration

import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Sign up with email and password
export const signUpWithEmail = async (email, password, displayName) => {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user document in Firestore with FREE tier
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: displayName || 'User',
      createdAt: new Date().toISOString(),
      subscriptionTier: 'free',
      subscriptionStatus: 'active',
      subscriptionStart: new Date().toISOString(),
      businesses: [],
      preferences: {
        emailNotifications: true,
        newsletter: true
      }
    });

    return { success: true, user, tier: 'free' };
  } catch (error) {
    // Normalize error messages to prevent information leakage
    const message = error.code === 'auth/email-already-in-use'
      ? 'This email is already registered. Please sign in instead.'
      : 'Failed to create account. Please try again.';
    
    return { success: false, error: message };
  }
};

// Sign in with email and password
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    const message = error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password'
      ? 'Invalid email or password.'
      : 'Failed to sign in. Please try again.';
    
    return { success: false, error: message };
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user document exists, if not create it
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'User',
        photoUrl: user.photoURL || '',
        createdAt: new Date().toISOString(),
        subscriptionTier: 'free',
        subscriptionStatus: 'active',
        subscriptionStart: new Date().toISOString(),
        businesses: [],
        preferences: {
          emailNotifications: true,
          newsletter: true
        }
      });
    }

    return { success: true, user };
  } catch (error) {
    return { success: false, error: 'Google Sign-In failed. Please try again.' };
  }
};

// Sign out
export const logOut = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Listen to auth state changes
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Get current user subscription info
export const getUserTier = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return 'free';
    
    const user = userDoc.data();
    
    // Check if subscription expired
    if (user.subscriptionEnd) {
      const endDate = new Date(user.subscriptionEnd);
      if (endDate < new Date()) {
        return 'free'; // Expired subscription
      }
    }
    
    return user.subscriptionTier || 'free';
  } catch (error) {
    console.error('Error getting user tier:', error);
    return 'free';
  }
};

// Get full user subscription details
export const getSubscriptionDetails = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return null;
    
    const user = userDoc.data();
    return {
      tier: user.subscriptionTier || 'free',
      status: user.subscriptionStatus || 'inactive',
      startDate: user.subscriptionStart,
      endDate: user.subscriptionEnd,
      billing: user.subscriptionBilling || 'monthly'
    };
  } catch (error) {
    console.error('Error getting subscription details:', error);
    return null;
  }
};