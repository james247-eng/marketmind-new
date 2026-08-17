import { collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, setDoc, Timestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase.js';
import COLLECTIONS from '../lib/schema.js';

const normalize = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
const normalizeSchedule = (value) => value instanceof Date ? Timestamp.fromDate(value) : value || null;

export const getContacts = async (workspaceId, filters = {}) => {
  try { const snapshot = await getDocs(query(collection(db, COLLECTIONS.emailContacts(workspaceId)), orderBy('createdAt', 'desc'))); const term = (filters.search || '').toLowerCase(); const contacts = snapshot.docs.map(normalize).filter((item) => (!term || `${item.name || ''} ${item.email || ''} ${(item.tags || []).join(' ')}`.toLowerCase().includes(term)) && (!filters.status || filters.status === 'all' || item.status === filters.status)); return { success: true, contacts }; }
  catch (error) { return { success: false, error: error.message, contacts: [] }; }
};

export const addContact = async (workspaceId, contactData) => {
  if (!validEmail(contactData.email)) return { success: false, error: 'A valid email address is required.' };
  try { const ref = doc(collection(db, COLLECTIONS.emailContacts(workspaceId))); await setDoc(ref, { name: contactData.name || '', email: contactData.email.trim().toLowerCase(), status: 'subscribed', tags: contactData.tags || [], source: contactData.source || 'manual', consentAt: serverTimestamp(), createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); return { success: true, contactId: ref.id }; }
  catch (error) { return { success: false, error: error.message }; }
};

export const updateContact = async (workspaceId, contactId, updates) => { try { await updateDoc(doc(db, COLLECTIONS.emailContacts(workspaceId), contactId), { ...updates, updatedAt: serverTimestamp() }); return { success: true }; } catch (error) { return { success: false, error: error.message }; } };
export const deleteContact = async (workspaceId, contactId) => { try { await deleteDoc(doc(db, COLLECTIONS.emailContacts(workspaceId), contactId)); return { success: true }; } catch (error) { return { success: false, error: error.message }; } };

export const importContacts = async (workspaceId, contactsArray) => {
  const valid = contactsArray.filter((item) => validEmail(item.email)); let imported = 0;
  try { for (let start = 0; start < valid.length; start += 400) { const batch = writeBatch(db); valid.slice(start, start + 400).forEach((item) => { const ref = doc(collection(db, COLLECTIONS.emailContacts(workspaceId))); batch.set(ref, { name: item.name || '', email: item.email.trim().toLowerCase(), status: 'subscribed', tags: Array.isArray(item.tags) ? item.tags : [], source: 'csv-import', consentAt: serverTimestamp(), createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); }); await batch.commit(); imported += Math.min(400, valid.length - start); } return { success: true, imported, skipped: contactsArray.length - valid.length }; }
  catch (error) { return { success: false, error: error.message, imported, skipped: contactsArray.length - valid.length }; }
};

export const getCampaigns = async (workspaceId) => { try { const snapshot = await getDocs(query(collection(db, COLLECTIONS.emailCampaigns(workspaceId)), orderBy('createdAt', 'desc'))); return { success: true, campaigns: snapshot.docs.map(normalize) }; } catch (error) { return { success: false, error: error.message, campaigns: [] }; } };
export const createCampaign = async (workspaceId, campaignData) => { try { const ref = doc(collection(db, COLLECTIONS.emailCampaigns(workspaceId))); await setDoc(ref, { name: campaignData.name, type: campaignData.type, subject: campaignData.subject, previewText: campaignData.previewText || '', content: campaignData.content || '', audienceFilter: campaignData.audienceFilter || { type: 'all' }, status: campaignData.status || 'draft', scheduledAt: normalizeSchedule(campaignData.scheduledAt), metrics: { sent: 0, opened: 0, clicked: 0, unsubscribed: 0 }, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); return { success: true, campaignId: ref.id }; } catch (error) { return { success: false, error: error.message }; } };
export const updateCampaign = async (workspaceId, campaignId, updates) => { try { await updateDoc(doc(db, COLLECTIONS.emailCampaigns(workspaceId), campaignId), { ...updates, ...(Object.prototype.hasOwnProperty.call(updates, 'scheduledAt') ? { scheduledAt: normalizeSchedule(updates.scheduledAt) } : {}), updatedAt: serverTimestamp() }); return { success: true }; } catch (error) { return { success: false, error: error.message }; } };
export const deleteCampaign = async (workspaceId, campaignId) => { try { await deleteDoc(doc(db, COLLECTIONS.emailCampaigns(workspaceId), campaignId)); return { success: true }; } catch (error) { return { success: false, error: error.message }; } };
export const sendCampaign = async (workspaceId, campaignId) => updateCampaign(workspaceId, campaignId, { status: 'sent', sentAt: serverTimestamp(), scheduledAt: null });
