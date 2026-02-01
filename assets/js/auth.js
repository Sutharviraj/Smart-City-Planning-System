/**
 * Smart City Portal - Auth (Login/Register)
 * Firebase Auth when configured; fallback to redirect for demo
 */

document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.auth-tab');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  const useFirebase = typeof firebase !== 'undefined' && firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_API_KEY';
  if (useFirebase) initFirebase();

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (tab.dataset.tab === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
      } else {
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
      }
    });
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailEl = document.getElementById('loginEmail');
    const passwordEl = document.getElementById('loginPassword');
    const emailError = document.getElementById('loginEmailError');
    const passwordError = document.getElementById('loginPasswordError');

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

    if (useFirebase) {
      try {
        const cred = await loginWithEmail(emailEl.value.trim(), passwordEl.value);
        if (cred && cred.user && typeof saveUserProfile === 'function' && typeof firebase !== 'undefined' && firebase.firestore) {
          await saveUserProfile(cred.user.uid, cred.user.displayName || '', cred.user.email || '', firebase.firestore.FieldValue.serverTimestamp());
        }
        window.location.href = 'dashboard.html';
      } catch (err) {
        passwordError.textContent = err.code === 'auth/user-not-found' ? 'No account with this email.' : err.code === 'auth/wrong-password' ? 'Wrong password.' : err.message || 'Login failed.';
        passwordEl.classList.add('error');
      }
    } else {
      window.location.href = 'dashboard.html';
    }
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameEl = document.getElementById('regName');
    const emailEl = document.getElementById('regEmail');
    const passwordEl = document.getElementById('regPassword');
    const nameError = document.getElementById('regNameError');
    const emailError = document.getElementById('regEmailError');
    const passwordError = document.getElementById('regPasswordError');

    nameEl.classList.remove('error');
    emailEl.classList.remove('error');
    passwordEl.classList.remove('error');
    nameError.textContent = '';
    emailError.textContent = '';
    passwordError.textContent = '';

    if (!nameEl.value.trim()) {
      nameError.textContent = 'Name is required';
      nameEl.classList.add('error');
      return;
    }
    if (!emailEl.value.trim()) {
      emailError.textContent = 'Email is required';
      emailEl.classList.add('error');
      return;
    }
    if (passwordEl.value.length < 6) {
      passwordError.textContent = 'Password must be at least 6 characters';
      passwordEl.classList.add('error');
      return;
    }

    if (useFirebase) {
      try {
        const cred = await registerWithEmail(emailEl.value.trim(), passwordEl.value, nameEl.value.trim());
        if (cred && cred.user && typeof saveUserProfile === 'function') {
          await saveUserProfile(cred.user.uid, nameEl.value.trim(), emailEl.value.trim());
        }
        showToast('Registration successful! Please login.', 'success');
        tabs[0].click();
      } catch (err) {
        emailError.textContent = err.code === 'auth/email-already-in-use' ? 'This email is already registered.' : err.message || 'Registration failed.';
        emailEl.classList.add('error');
      }
    } else {
      showToast('Registration successful! Please login.', 'success');
      tabs[0].click();
    }
  });
});
