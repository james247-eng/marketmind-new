import admin from 'firebase-admin';

if (!admin.apps.length) {
  const credential = process.env.FIREBASE_SERVICE_ACCOUNT
    ? admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    : admin.credential.applicationDefault();
  admin.initializeApp({ credential });
}

const db = admin.firestore();
const workspaceCache = new Map();

async function workspacesFor(userId) {
  if (!userId) return [];
  if (!workspaceCache.has(userId)) {
    const snapshot = await db.collection('workspaces').where('userId', '==', userId).get();
    workspaceCache.set(userId, snapshot.docs.map((document) => document.id));
  }
  return workspaceCache.get(userId);
}

async function resolveWorkspace(document) {
  const data = document.data();
  if (data.workspaceId) return data.workspaceId;
  if (data.businessId) return data.businessId;
  const candidates = await workspacesFor(data.userId);
  if (candidates.length === 1) return candidates[0];
  console.warn(`[SKIP] ${document.ref.path}: ${candidates.length ? 'multiple workspaces' : 'no workspace'} and no explicit workspace id`);
  return null;
}

async function copyBusinesses() {
  const snapshot = await db.collection('businesses').get();
  for (const document of snapshot.docs) {
    try {
      await db.collection('workspaces').doc(document.id).set({ ...document.data(), workspaceId: document.id }, { merge: true });
      console.log(`[COPY] ${document.ref.path} -> workspaces/${document.id}`);
    } catch (error) { console.error(`[FAIL] ${document.ref.path}:`, error); }
  }
  workspaceCache.clear();
}

async function copyNested(source, destination) {
  const snapshot = await db.collection(source).get();
  for (const document of snapshot.docs) {
    try {
      const workspaceId = await resolveWorkspace(document);
      if (!workspaceId) continue;
      const target = db.collection(`workspaces/${workspaceId}/${destination}`).doc(document.id);
      await target.set({ ...document.data(), workspaceId }, { merge: true });
      console.log(`[COPY] ${document.ref.path} -> ${target.path}`);
    } catch (error) { console.error(`[FAIL] ${document.ref.path}:`, error); }
  }
}

function normalizePlatforms(data) {
  if (data.platforms && !Array.isArray(data.platforms)) return data.platforms;
  let content = data.content || '';
  let parsed = {};
  if (typeof content === 'string') {
    try { parsed = JSON.parse(content); } catch { parsed = {}; }
  } else if (content && typeof content === 'object') parsed = content;
  return Object.fromEntries((data.platforms || []).map((entry) => {
    const platform = typeof entry === 'string' ? entry : entry.platform;
    return [platform, parsed[platform] || (typeof content === 'string' ? content : '')];
  }).filter(([platform]) => Boolean(platform)));
}

async function copyScheduledPosts() {
  const snapshot = await db.collection('scheduledPosts').get();
  for (const document of snapshot.docs) {
    try {
      const workspaceId = await resolveWorkspace(document);
      if (!workspaceId) continue;
      const data = document.data();
      const target = db.collection(`workspaces/${workspaceId}/publishingJobs`).doc(document.id);
      await target.set({ ...data, workspaceId, platforms: normalizePlatforms(data) }, { merge: true });
      console.log(`[COPY] ${document.ref.path} -> ${target.path}`);
    } catch (error) { console.error(`[FAIL] ${document.ref.path}:`, error); }
  }
}

async function main() {
  console.log('[START] Firestore collection migration');
  await copyBusinesses();
  await copyNested('accounts', 'socialConnections');
  await copyNested('content', 'contentItems');
  await copyScheduledPosts();
  console.log('[DONE] Migration finished. Legacy collections were not deleted.');
}

main().catch((error) => { console.error('[FATAL]', error); process.exitCode = 1; });
