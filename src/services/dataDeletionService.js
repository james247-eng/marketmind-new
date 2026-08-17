// dataDeletionService.js
// Handles data deletion requests for Facebook compliance

import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase.js';
import { deleteUser } from 'firebase/auth';
import COLLECTIONS from '../lib/schema.js';

const SUBCOLLECTIONS = ['socialConnections', 'contentItems', 'publishingJobs', 'usageCounters', 'assets', 'campaigns', 'leads', 'emailContacts', 'emailCampaigns', 'assistantThreads', 'members'];

async function clearPath(path) {
  const snapshot = await getDocs(collection(db, path));
  for (const item of snapshot.docs) await deleteDoc(item.ref);
}

// Request data deletion (call from frontend)
export const requestDataDeletion = async (email, facebookUserId = null) => {
  try {
    // Generate confirmation code
    const confirmationCode = `DEL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // In production, send this to your backend API
    // Backend should:
    // 1. Find user by email or Facebook ID
    // 2. Queue deletion job (process within 30 days)
    // 3. Log deletion request
    // 4. Return confirmation code
    
    // Simulated API call
    const response = await fetch('/api/data-deletion/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        facebookUserId,
        confirmationCode
      })
    });

    if (!response.ok) {
      throw new Error('Deletion request failed');
    }

    return {
      success: true,
      confirmationCode
    };
  } catch (error) {
    console.error('Data deletion request error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Process data deletion (backend only)
export const processDataDeletion = async (userId) => {
  try {
    const workspaces = await getDocs(query(collection(db, COLLECTIONS.workspaces), where('ownerId', '==', userId)));
    for (const workspace of workspaces.docs) {
      for (const name of SUBCOLLECTIONS) await clearPath(COLLECTIONS[name](workspace.id));
      await deleteDoc(workspace.ref);
    }

    for (const collectionName of ['businesses', 'accounts', 'socialAccounts', 'content', 'scheduledPosts', 'usage']) {
      const q = query(
        collection(db, collectionName),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      
      for (const docSnap of querySnapshot.docs) {
        await deleteDoc(doc(db, collectionName, docSnap.id));
      }
    }

    // Delete user account
    await deleteDoc(doc(db, COLLECTIONS.users, userId));

    return { success: true };
  } catch (error) {
    console.error('Data deletion processing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Facebook callback handler (for your backend)
// This endpoint handles Facebook's data deletion callback
export const handleFacebookDeletionCallback = async (signedRequest) => {
  try {
    // Parse Facebook's signed request
    // Extract user_id
    // Queue deletion job
    // Return confirmation code and URL
    
    const confirmationCode = `FB-DEL-${Date.now()}`;
    
    return {
      url: `https://marketmind.app/data-deletion-status?code=${confirmationCode}`,
      confirmation_code: confirmationCode
    };
  } catch (error) {
    console.error('Facebook callback error:', error);
    throw error;
  }
};
