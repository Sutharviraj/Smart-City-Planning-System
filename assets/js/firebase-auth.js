/**
 * Firebase Authentication
 * Login, register, logout, auth state, admin check
 */

let firebaseApp = null;
let firebaseAuth = null;

function initFirebase() {
  if (typeof firebase === 'undefined') return false;
  if (firebaseApp) return true;
  firebaseApp = firebase.initializeApp(firebaseConfig);
  firebaseAuth = firebaseApp.auth();
  return true;
}

function getAuth() {
  if (!firebaseAuth && typeof firebase !== 'undefined') initFirebase();
  return firebaseAuth;
}

function getCurrentUser() {
  const auth = getAuth();
  return auth ? auth.currentUser : null;
}

function onAuthStateChanged(callback) {
  const auth = getAuth();
  if (!auth) {
    callback(null);
    return () => {};
  }
  return auth.onAuthStateChanged(callback);
}

function loginWithEmail(email, password) {
  const auth = getAuth();
  if (!auth) return Promise.reject(new Error('Firebase not loaded'));
  return auth.signInWithEmailAndPassword(email, password);
}

function registerWithEmail(email, password, displayName) {
  const auth = getAuth();
  if (!auth) return Promise.reject(new Error('Firebase not loaded'));
  return auth.createUserWithEmailAndPassword(email, password).then(cred => {
    if (cred.user && displayName) {
      return cred.user.updateProfile({ displayName }).then(() => cred);
    }
    return cred;
  });
}

function logout() {
  const auth = getAuth();
  if (auth) return auth.signOut();
  return Promise.resolve();
}

function requireAuth(redirectUrl) {
  redirectUrl = redirectUrl || 'index.html';
  return new Promise((resolve) => {
    onAuthStateChanged((user) => {
      if (user) resolve(user);
      else {
        window.location.href = redirectUrl;
        resolve(null);
      }
    });
  });
}
