// schedulingService.js
// Handles post scheduling

import { collection, addDoc, query, where, getDocs, updateDoc, doc, orderBy, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

// Schedule a post
export const schedulePost = async (postData) => {
  try {
    const docRef = await addDoc(collection(db, 'scheduledPosts'), {
      ...postData,
      status: 'scheduled', // scheduled, published, failed
      createdAt: new Date().toISOString()
    });

    return {
      success: true,
      postId: docRef.id
    };
  } catch (error) {
    console.error('Error scheduling post:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get scheduled posts for a business
export const getScheduledPosts = async (businessId) => {
  try {
    const q = query(
      collection(db, 'scheduledPosts'),
      where('businessId', '==', businessId),
      orderBy('scheduledTime', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      success: true,
      posts
    };
  } catch (error) {
    console.error('Error fetching scheduled posts:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Update post status
export const updatePostStatus = async (postId, status, publishResults = null) => {
  try {
    const updateData = {
      status: status,
      updatedAt: new Date().toISOString()
    };

    if (publishResults) {
      updateData.publishResults = publishResults;
      updateData.publishedAt = new Date().toISOString();
    }

    await updateDoc(doc(db, 'scheduledPosts', postId), updateData);

    return { success: true };
  } catch (error) {
    console.error('Error updating post status:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Cancel scheduled post
export const cancelScheduledPost = async (postId) => {
  try {
    await updateDoc(doc(db, 'scheduledPosts', postId), {
      status: 'cancelled',
      updatedAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    console.error('Error cancelling post:', error);
    return {
      success: false,
      error: error.message
    };
  }
};