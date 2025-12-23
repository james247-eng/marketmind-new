// contentService.js
// Handles saving and retrieving content from Firestore

import { collection, addDoc, query, where, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

// Save generated content
export const saveContent = async (contentData) => {
  try {
    const docRef = await addDoc(collection(db, 'content'), {
      ...contentData,
      createdAt: new Date().toISOString(),
      status: 'draft' // draft, scheduled, published
    });

    return {
      success: true,
      contentId: docRef.id
    };
  } catch (error) {
    console.error('Error saving content:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get content history for a business
export const getContentHistory = async (businessId) => {
  try {
    const q = query(
      collection(db, 'content'),
      where('businessId', '==', businessId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const contentList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      success: true,
      content: contentList
    };
  } catch (error) {
    console.error('Error fetching content:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Update content status
export const updateContentStatus = async (contentId, status) => {
  try {
    await updateDoc(doc(db, 'content', contentId), {
      status: status,
      updatedAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating content:', error);
    return {
      success: false,
      error: error.message
    };
  }
};