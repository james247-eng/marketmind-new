import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase.js';
import COLLECTIONS from '../lib/schema.js';

const normalize = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });
const asDate = (value) => value?.toDate?.() || (value ? new Date(value) : null);

export const getLeads = async (workspaceId, filters = {}) => {
  try {
    const snapshot = await getDocs(query(collection(db, COLLECTIONS.leads(workspaceId)), orderBy('createdAt', 'desc')));
    const { status = 'all', source = 'all', search = '' } = filters;
    const term = search.trim().toLowerCase();
    const leads = snapshot.docs.map(normalize).filter((lead) => (!term || `${lead.name} ${lead.email} ${lead.phone || ''}`.toLowerCase().includes(term)) && (status === 'all' || lead.status === status) && (source === 'all' || lead.source === source));
    return { success: true, leads };
  } catch (error) { return { success: false, error: error.message, leads: [] }; }
};

export const getLead = async (workspaceId, leadId) => {
  try { const snapshot = await getDoc(doc(db, COLLECTIONS.leads(workspaceId), leadId)); return { success: snapshot.exists(), lead: snapshot.exists() ? normalize(snapshot) : null, error: snapshot.exists() ? null : 'Lead not found' }; }
  catch (error) { return { success: false, error: error.message }; }
};

export const createLead = async (workspaceId, leadData) => {
  try { const ref = await addDoc(collection(db, COLLECTIONS.leads(workspaceId)), { ...leadData, workspaceId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); return { success: true, leadId: ref.id }; }
  catch (error) { return { success: false, error: error.message }; }
};

export const updateLead = async (workspaceId, leadId, updates) => {
  try { await updateDoc(doc(db, COLLECTIONS.leads(workspaceId), leadId), { ...updates, updatedAt: serverTimestamp() }); return { success: true }; }
  catch (error) { return { success: false, error: error.message }; }
};

export const deleteLead = async (workspaceId, leadId) => {
  try { await deleteDoc(doc(db, COLLECTIONS.leads(workspaceId), leadId)); return { success: true }; }
  catch (error) { return { success: false, error: error.message }; }
};

export const getLeadStats = async (workspaceId) => {
  const result = await getLeads(workspaceId);
  if (!result.success) return result;
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7); weekStart.setHours(0, 0, 0, 0);
  return { success: true, stats: { total: result.leads.length, newThisWeek: result.leads.filter((lead) => (asDate(lead.createdAt) || new Date(0)) >= weekStart).length, qualified: result.leads.filter((lead) => lead.status === 'qualified').length, won: result.leads.filter((lead) => lead.status === 'won').length } };
};
