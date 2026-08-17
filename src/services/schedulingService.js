import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase.js';
import COLLECTIONS from '../lib/schema.js';

const createIdempotencyKey = (workspaceId, contentItemId, platform, scheduledAt) => {
  const randomPart = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  return `${workspaceId}:${contentItemId || 'manual'}:${platform}:${scheduledAt.getTime()}:${randomPart}`;
};

export const schedulePosts = async (workspaceId, jobs) => {
  try {
    const batch = writeBatch(db);
    const jobIds = [];

    jobs.forEach((job) => {
      const jobRef = doc(collection(db, COLLECTIONS.publishingJobs(workspaceId)));
      jobIds.push(jobRef.id);
      batch.set(jobRef, {
        contentItemId: job.contentItemId || null,
        workspaceId,
        platform: job.platform,
        content: job.content,
        mediaUrl: job.mediaUrl || null,
        scheduledAt: Timestamp.fromDate(job.scheduledAt),
        status: 'scheduled',
        attempts: 0,
        idempotencyKey: createIdempotencyKey(workspaceId, job.contentItemId, job.platform, job.scheduledAt),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (job.contentItemId) {
        batch.update(doc(db, COLLECTIONS.contentItems(workspaceId), job.contentItemId), {
          status: 'scheduled',
          updatedAt: serverTimestamp(),
        });
      }
    });

    await batch.commit();
    return { success: true, jobIds };
  } catch (error) {
    console.error('Error scheduling posts:', error);
    return { success: false, error: error.message };
  }
};

export const getScheduledPosts = async (workspaceId) => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.publishingJobs(workspaceId)));
    const posts = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    posts.sort((a, b) => (a.scheduledAt?.toMillis?.() || 0) - (b.scheduledAt?.toMillis?.() || 0));
    return { success: true, posts };
  } catch (error) {
    console.error('Error fetching scheduled posts:', error);
    return { success: false, error: error.message };
  }
};

export const updatePostStatus = async (workspaceId, postId, status, publishResults = null) => {
  try {
    const updates = { status, updatedAt: serverTimestamp() };
    if (publishResults) updates.publishResults = publishResults;
    await updateDoc(doc(db, COLLECTIONS.publishingJobs(workspaceId), postId), updates);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const cancelScheduledPost = async (workspaceId, postId) => updatePostStatus(workspaceId, postId, 'cancelled');

export const reschedulePost = async (workspaceId, postId, scheduledAt) => {
  try {
    await updateDoc(doc(db, COLLECTIONS.publishingJobs(workspaceId), postId), {
      scheduledAt: Timestamp.fromDate(scheduledAt),
      status: 'scheduled',
      attempts: 0,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
