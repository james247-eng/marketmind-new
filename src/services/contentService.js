// contentService.js
// Handles saving and retrieving content from Firestore

import { collection, addDoc, query, where, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase.js';

// Save generated content
export const saveContent = async (contentData) => {
  try {
    const docRef = await addDoc(collection(db, 'content'), {
      ...contentData,
      createdAt: new Date().toISOString(),
      status: 'draft',
    });
    return { success: true, contentId: docRef.id };
  } catch (error) {
    console.error('Error saving content:', error);
    return { success: false, error: error.message };
  }
};

// Get content history — requires userId to satisfy Firestore security rules
export const getContentHistory = async (businessId, userId) => {
  try {
    const q = query(
      collection(db, 'content'),
      where('userId',     '==', userId),      // ← required by security rules
      where('businessId', '==', businessId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const content = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return { success: true, content };
  } catch (error) {
    console.error('Error fetching content:', error);
    return { success: false, error: error.message };
  }
};

// Update content status
export const updateContentStatus = async (contentId, status) => {
  try {
    await updateDoc(doc(db, 'content', contentId), {
      status,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating content:', error);
    return { success: false, error: error.message };
  }
};