/**
 * Auth guard - redirect to login if Firebase is used and user not signed in
 * Include on every protected page (dashboard and modules)
 */
(function () {
  function useFirebase() {
    return typeof firebase !== 'undefined' && firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_API_KEY';
  }
  if (!useFirebase()) return;
  if (typeof initFirebase === 'function') initFirebase();
  if (typeof onAuthStateChanged !== 'function') return;
  onAuthStateChanged(function (user) {
    if (!user) {
      var base = window.location.pathname.includes('admin') ? '../' : (window.location.pathname.includes('modules') ? '../../' : '');
      window.location.href = base + 'index.html';
    }
  });
})();
