/**
 * Firebase Storage - photos, recordings, uploads
 */

function getStorage() {
  if (typeof firebase === 'undefined') return null;
  if (!firebaseApp) initFirebase();
  try {
    return firebase.storage();
  } catch (e) {
    return null;
  }
}

async function uploadFile(path, file) {
  const storage = getStorage();
  if (!storage) throw new Error('Firebase Storage not loaded. Enable Storage in Firebase Console and add storage script.');
  const ref = storage.ref(path);
  try {
    await ref.put(file);
    return await ref.getDownloadURL();
  } catch (err) {
    console.error('Firebase Storage error:', err.code || err.name, err.message, err);
    if (err.code) throw new Error(err.code + ': ' + (err.message || 'Storage failed.'));
    throw err;
  }
}

function useFirebaseStorage() {
  return typeof firebase !== 'undefined' && firebaseApp && firebaseApp.storage;
}
