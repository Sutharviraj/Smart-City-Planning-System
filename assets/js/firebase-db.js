/**
 * Firestore Database
 * Complaints, alerts, counters, admin check
 */

function getDb() {
  if (!firebaseApp && typeof firebase !== 'undefined') initFirebase();
  return firebaseApp ? firebaseApp.firestore() : null;
}

function getCurrentUserId() {
  const user = getCurrentUser();
  return user ? user.uid : null;
}

async function isAdmin() {
  const uid = getCurrentUserId();
  if (!uid) return false;
  const db = getDb();
  if (!db) return false;
  const doc = await db.collection('admins').doc(uid).get();
  return doc.exists;
}

async function getComplaintCount() {
  const db = getDb();
  if (!db) return 0;
  const snap = await db.collection('counters').doc('complaints').get();
  return snap.exists && snap.data().value ? snap.data().value : 0;
}

async function incrementComplaintCount() {
  const db = getDb();
  if (!db) throw new Error('Firebase not loaded');
  const ref = db.collection('counters').doc('complaints');
  const snap = await ref.get();
  const next = snap.exists ? (snap.data().value || 0) + 1 : 1;
  await ref.set({ value: next }, { merge: true });
  return next;
}


async function getComplaintByTicket(ticketId) {
  const db = getDb();
  if (!db) return null;
  const snap = await db.collection('complaints').where('id', '==', ticketId.toUpperCase()).limit(1).get();
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { _docId: d.id, ...d.data() };
}

async function getAllComplaints() {
  const db = getDb();
  if (!db) return [];
  const snap = await db.collection('complaints').orderBy('createdAt', 'desc').get();
  return snap.docs.map(d => ({ _docId: d.id, ...d.data() }));
}

async function updateComplaint(docId, updates) {
  const db = getDb();
  if (!db) throw new Error('Firebase not loaded');
  const ref = db.collection('complaints').doc(docId);
  await ref.update(updates);
}

async function getComplaintDocIdByTicket(ticketId) {
  const db = getDb();
  if (!db) return null;
  const snap = await db.collection('complaints').where('id', '==', ticketId.toUpperCase()).limit(1).get();
  return snap.empty ? null : snap.docs[0].id;
}

async function getAlerts() {
  const db = getDb();
  if (!db) return [];
  const snap = await db.collection('alerts').orderBy('date', 'desc').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function getUserDismissedAlerts() {
  const uid = getCurrentUserId();
  if (!uid) return [];
  const db = getDb();
  if (!db) return [];
  const snap = await db.collection('userDismissedAlerts').doc(uid).get();
  const data = snap.data();
  return data && data.alertIds ? data.alertIds : [];
}

async function dismissAlert(alertId) {
  const uid = getCurrentUserId();
  if (!uid) return;
  const db = getDb();
  if (!db) return;
  const ref = db.collection('userDismissedAlerts').doc(uid);
  const snap = await ref.get();
  const list = snap.exists && snap.data().alertIds ? snap.data().alertIds : [];
  if (list.includes(alertId)) return;
  list.push(alertId);
  await ref.set({ alertIds: list });
}

async function saveUserProfile(uid, displayName, email, lastLoginAt) {
  const db = getDb();
  if (!db) return;
  const data = { displayName: displayName || '', email: email || '', updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
  if (lastLoginAt !== undefined) data.lastLoginAt = lastLoginAt;
  await db.collection('users').doc(uid).set(data, { merge: true });
}

async function getAllUsers() {
  const db = getDb();
  if (!db) return [];
  try {
    const snap = await db.collection('users').orderBy('updatedAt', 'desc').get();
    return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
  } catch (e) {
    try {
      const snap = await db.collection('users').get();
      const users = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
      users.sort((a, b) => {
        const ta = a.updatedAt && a.updatedAt.toDate ? a.updatedAt.toDate().getTime() : 0;
        const tb = b.updatedAt && b.updatedAt.toDate ? b.updatedAt.toDate().getTime() : 0;
        return tb - ta;
      });
      return users;
    } catch (e2) {
      return [];
    }
  }
}

async function addComplaint(data) {
  const db = getDb();
  if (!db) throw new Error('Firebase not loaded');
  const userId = getCurrentUserId();
  const ticketNum = await incrementComplaintCount();
  const id = 'SC' + String(ticketNum).padStart(3, '0');
  const doc = {
    id,
    ticketNumber: id,
    category: data.category,
    status: 'pending',
    worker: null,
    message: data.message,
    rating: null,
    photoURL: data.photoURL || null,
    voiceURL: data.voiceURL || null,
    latitude: data.latitude != null ? data.latitude : null,
    longitude: data.longitude != null ? data.longitude : null,
    address: data.address || null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    userId: userId || null
  };
  const ref = await db.collection('complaints').add(doc);
  return { id, docId: ref.id };
}

// ---- Gallery (dashboard photo uploads) ----
async function addGalleryPhoto(data) {
  const db = getDb();
  if (!db) throw new Error('Firebase not loaded');
  const uid = getCurrentUserId();
  await db.collection('gallery').add({
    userId: uid,
    photoURL: data.photoURL,
    caption: data.caption || '',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

async function getGalleryPhotos(limitCount) {
  const db = getDb();
  if (!db) return [];
  const limit = limitCount || 20;
  const snap = await db.collection('gallery').orderBy('createdAt', 'desc').limit(limit).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ---- Chat (user ↔ admin, real-time) ----
async function getOrCreateUserConversation() {
  const uid = getCurrentUserId();
  if (!uid) return null;
  const user = getCurrentUser();
  const db = getDb();
  if (!db) return null;
  const convRef = db.collection('conversations').doc(uid);
  const snap = await convRef.get();
  if (!snap.exists) {
    await convRef.set({
      userId: uid,
      userName: user.displayName || user.email || 'User',
      userEmail: user.email || '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastMessageText: ''
    });
  }
  return uid;
}

function subscribeChatMessages(convId, callback) {
  const db = getDb();
  if (!db) return () => {};
  return db.collection('conversations').doc(convId).collection('messages')
    .orderBy('createdAt', 'asc')
    .onSnapshot(snap => {
      const messages = snap.docs.map(d => {
        const x = d.data();
        return { id: d.id, ...x, createdAt: x.createdAt && x.createdAt.toDate ? x.createdAt.toDate() : null };
      });
      callback(messages);
    });
}

async function sendChatMessage(convId, text, isAdminSender) {
  const db = getDb();
  if (!db) throw new Error('Firebase not loaded');
  const uid = getCurrentUserId();
  const user = getCurrentUser();
  const name = isAdminSender ? 'Support' : (user.displayName || user.email || 'User');
  const ref = db.collection('conversations').doc(convId).collection('messages').doc();
  await ref.set({
    senderId: uid,
    senderName: name,
    isAdmin: !!isAdminSender,
    text,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  await db.collection('conversations').doc(convId).update({
    lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
    lastMessageText: text.substring(0, 100)
  });
}

async function getAllConversations() {
  const db = getDb();
  if (!db) return [];
  const snap = await db.collection('conversations').orderBy('lastMessageAt', 'desc').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function addFeedback(data) {
  const db = getDb();
  if (!db) throw new Error('Firebase not loaded');
  const uid = getCurrentUserId();
  await db.collection('feedback').add({
    userId: uid,
    rating: data.rating,
    text: data.text || '',
    photoURL: data.photoURL || null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

// ---- Hero Slider (admin-only: only admins can change slides) ----
const HERO_SLIDES_SETTINGS_DOC = 'heroSlides';

async function getHeroSlides() {
  const db = getDb();
  if (!db) return [];
  const snap = await db.collection('settings').doc(HERO_SLIDES_SETTINGS_DOC).get();
  if (!snap.exists || !snap.data().slides) return [];
  return snap.data().slides;
}

async function setHeroSlides(slides) {
  const db = getDb();
  if (!db) throw new Error('Firebase not loaded');
  await db.collection('settings').doc(HERO_SLIDES_SETTINGS_DOC).set({ slides, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
}
