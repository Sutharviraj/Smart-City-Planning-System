/**
 * Smart City Portal - Utility Functions
 * Helper functions used across the app
 */

/**
 * Show toast notification
 * @param {string} message - Toast message
 * @param {string} type - 'success' | 'error' | 'info'
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toastContainer';
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

/**
 * Open modal by ID
 * @param {string} modalId - Modal element ID
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Close modal by ID
 * @param {string} modalId - Modal element ID
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }
}

/**
 * Fake API call for demo purposes
 * @param {number} delay - Simulated delay in ms
 * @returns {Promise<{success: boolean}>}
 */
function fakeApiCall(delay = 500) {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ success: true }), delay);
  });
}

/**
 * Load dummy data from storage or default
 * @param {string} key - localStorage key
 * @param {*} defaultValue - Default if no data
 * @returns {*}
 */
function loadDummyData(key, defaultValue = []) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Save data to localStorage
 * @param {string} key - localStorage key
 * @param {*} data - Data to save
 */
function saveDummyData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Reverse geocode lat/lng to address (OpenStreetMap Nominatim, no key required)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string>} - Display address or empty string
 */
function reverseGeocode(lat, lng) {
  const url = 'https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng + '&zoom=18&addressdetails=1';
  return fetch(url, { headers: { 'Accept-Language': 'en' } })
    .then(r => r.json())
    .then(data => {
      if (data && data.display_name) return data.display_name;
      return '';
    })
    .catch(() => '');
}
