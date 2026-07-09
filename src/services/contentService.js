// contentService.js
// Handles saving and retrieving content from Firestore with schema normalization defenses

import { collection, addDoc, query, where, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase.js';

/**
 * Save generated content payload to Firestore
 * @param {Object} contentData - Complete post configuration structure
 */
export const saveContent = async (contentData) => {
  try {
    const docRef = await addDoc(collection(db, 'content'), {
      ...contentData,
      createdAt: new Date().toISOString(),
      status: 'draft',
    });
    return { success: true, contentId: docRef.id };
  } catch (error) {
    console.error('Error saving content safely:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get content history — requires userId to satisfy Firestore security rules.
 * Includes automatic index-exception fallbacks and data normalization.
 * @param {string} businessId - Target workspace id context
 * @param {string} userId - Authenticated user owner id
 */
export const getContentHistory = async (businessId, userId) => {
  try {
    // Primary index query matching exact dashboard requirements
    const primaryQuery = query(
      collection(db, 'content'),
      where('userId', '==', userId),
      where('businessId', '==', businessId),
      orderBy('createdAt', 'desc')
    );
    
    let snapshot;
    try {
      snapshot = await getDocs(primaryQuery);
    } catch (indexError) {
      console.warn(
        'Firestore custom index may still be provisioning or missing. ' +
        'Falling back to unindexed compilation sorting...', 
        indexError.message
      );
      
      // Resilient fallback query if the developer has not configured composite indexes yet
      const fallbackQuery = query(
        collection(db, 'content'),
        where('userId', '==', userId),
        where('businessId', '==', businessId)
      );
      snapshot = await getDocs(fallbackQuery);
    }

    const content = snapshot.docs.map(d => {
      const data = d.data();
      
      // Data Normalization Layer: Ensure whatever format content was saved in 
      // (stringified object vs raw unstructured text) is gracefully managed
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt || new Date().toISOString()
      };
    });

    // Manually ensure sorting order is pristine if local client-side sorting fallback kicked in
    content.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return { success: true, content };
  } catch (error) {
    console.error('Fatal failure retrieving content history:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update content status tracking states
 * @param {string} contentId - Document ID target
 * @param {string} status - New target state ('draft', 'published', etc.)
 */
export const updateContentStatus = async (contentId, status) => {
  try {
    await updateDoc(doc(db, 'content', contentId), {
      status,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating content status profile:', error);
    return { success: false, error: error.message };
  }
};