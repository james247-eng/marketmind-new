import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase.js';
import COLLECTIONS from '../lib/schema.js';

export const getBrandProfile = async (workspaceId) => {
  try {
    const docRef = doc(db, COLLECTIONS.brandProfile(workspaceId));
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      return { success: true, profile: null };
    }

    return { success: true, profile: snapshot.data() };
  } catch (error) {
    console.error('Error fetching brand profile:', error);
    return { success: false, error: error.message };
  }
};

export const saveBrandProfile = async (workspaceId, profileData) => {
  try {
    const docRef = doc(db, COLLECTIONS.brandProfile(workspaceId));
    await setDoc(docRef, {
      ...profileData,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error saving brand profile:', error);
    return { success: false, error: error.message };
  }
};

export const updateBrandProfile = async (workspaceId, updates) => {
  try {
    const docRef = doc(db, COLLECTIONS.brandProfile(workspaceId));
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating brand profile:', error);
    return { success: false, error: error.message };
  }
};
