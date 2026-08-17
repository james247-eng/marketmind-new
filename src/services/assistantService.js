import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase.js';
import { getBrandProfile } from './brandService.js';
import COLLECTIONS from '../lib/schema.js';

const normalize = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });
const asDate = (value) => value?.toDate?.() || (value ? new Date(value) : null);

export const getThreads = async (workspaceId) => {
  try { const snapshot = await getDocs(collection(db, COLLECTIONS.assistantThreads(workspaceId))); const threads = snapshot.docs.map(normalize).sort((a, b) => (asDate(b.updatedAt)?.getTime() || 0) - (asDate(a.updatedAt)?.getTime() || 0)); return { success: true, threads }; }
  catch (error) { return { success: false, error: error.message, threads: [] }; }
};
export const getThread = async (workspaceId, threadId) => { try { const snapshot = await getDoc(doc(db, COLLECTIONS.assistantThreads(workspaceId), threadId)); return { success: snapshot.exists(), thread: snapshot.exists() ? normalize(snapshot) : null, error: snapshot.exists() ? null : 'Conversation not found' }; } catch (error) { return { success: false, error: error.message }; } };
export const createThread = async (workspaceId, firstMessage) => { try { const ref = doc(collection(db, COLLECTIONS.assistantThreads(workspaceId))); const timestamp = new Date().toISOString(); const messages = [{ role: 'user', content: firstMessage, timestamp }]; await setDoc(ref, { title: firstMessage.trim().slice(0, 40), workspaceId, messages, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); return { success: true, threadId: ref.id, messages }; } catch (error) { return { success: false, error: error.message }; } };
export const updateThread = async (workspaceId, threadId, messages) => { try { await updateDoc(doc(db, COLLECTIONS.assistantThreads(workspaceId), threadId), { messages, updatedAt: serverTimestamp() }); return { success: true }; } catch (error) { return { success: false, error: error.message }; } };
export const deleteThread = async (workspaceId, threadId) => { try { await deleteDoc(doc(db, COLLECTIONS.assistantThreads(workspaceId), threadId)); return { success: true }; } catch (error) { return { success: false, error: error.message }; } };

export const getAssistantContext = async (workspaceId) => {
  const [brandResult, contentSnapshot, jobsSnapshot] = await Promise.all([getBrandProfile(workspaceId), getDocs(collection(db, COLLECTIONS.contentItems(workspaceId))), getDocs(collection(db, COLLECTIONS.publishingJobs(workspaceId)))]);
  const content = contentSnapshot.docs.map(normalize).sort((a, b) => (asDate(b.createdAt)?.getTime() || 0) - (asDate(a.createdAt)?.getTime() || 0)).slice(0, 5);
  const jobs = jobsSnapshot.docs.map((item) => item.data());
  return { brand: brandResult.profile || {}, recentContent: content, stats: { generated: contentSnapshot.size, published: jobs.filter((item) => item.status === 'published').length, scheduled: jobs.filter((item) => item.status === 'scheduled').length, failed: jobs.filter((item) => item.status === 'failed').length } };
};

export const requestAssistantResponse = async (systemPrompt, messages) => {
  try { const response = await fetch('/.netlify/functions/generate-content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'assistant', systemPrompt, messages: messages.map(({ role, content }) => ({ role, content })) }) }); const data = await response.json(); if (!response.ok || !data.success) throw new Error(data.error || 'Assistant request failed'); return { success: true, response: data.response }; }
  catch (error) { return { success: false, error: error.message }; }
};
