/**
 * Admin Login - Separate from citizen login (index.html).
 * Only admins can sign in here; after login we check isAdmin() and redirect to admin panel or show error.
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('adminLoginForm');
  const emailEl = document.getElementById('adminLoginEmail');
  const passwordEl = document.getElementById('adminLoginPassword');
  const emailError = document.getElementById('adminLoginEmailError');
  const passwordError = document.getElementById('adminLoginPasswordError');

  const useFirebase = typeof firebase !== 'undefined' && firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_API_KEY';

  if (useFirebase) initFirebase();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    emailEl.classList.remove('error');
    passwordEl.classList.remove('error');
    emailError.textContent = '';
    passwordError.textContent = '';

    if (!emailEl.value.trim()) {
      emailError.textContent = 'Email is required';
      emailEl.classList.add('error');
      return;
    }
    if (!passwordEl.value) {
      passwordError.textContent = 'Password is required';
      passwordEl.classList.add('error');
      return;
    }

    if (!useFirebase) {
      passwordError.textContent = 'Firebase is not configured. Use Admin Panel (password gate) below.';
      return;
    }

    try {
      const cred = await loginWithEmail(emailEl.value.trim(), passwordEl.value);
      if (!cred || !cred.user) {
        passwordError.textContent = 'Login failed.';
        passwordEl.classList.add('error');
        return;
      }
      const isAdminUser = await isAdmin();
      if (!isAdminUser) {
        if (typeof logout === 'function') await logout();
        passwordError.textContent = 'Access denied. This login is for administrators only.';
        passwordEl.classList.add('error');
        if (typeof showToast === 'function') showToast('Not an admin account.', 'error');
        return;
      }
      window.location.href = 'admin.html';
    } catch (err) {
      passwordError.textContent = err.code === 'auth/user-not-found' ? 'No account with this email.' : err.code === 'auth/wrong-password' ? 'Wrong password.' : err.message || 'Login failed.';
      passwordEl.classList.add('error');
    }
  });
});
