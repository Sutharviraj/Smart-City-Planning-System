/**
 * Report Complaint Module
 * Real-time geolocation, description. Submit to Firestore or localStorage.
 */

function useFirebase() {
  return typeof firebase !== 'undefined' && firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_API_KEY';
}

document.addEventListener('DOMContentLoaded', () => {
  if (useFirebase()) {
    initFirebase();
    onAuthStateChanged((user) => {
      if (!user) window.location.href = '../../index.html';
    });
  }

  const form = document.getElementById('reportForm');
  const locationBtn = document.getElementById('locationBtn');
  const locationStatus = document.getElementById('locationStatus');
  const locationCoords = document.getElementById('locationCoords');
  const locationAddress = document.getElementById('locationAddress');

  let currentLocation = { latitude: null, longitude: null, address: null };

  function setLocationStatus(text, isError) {
    locationStatus.textContent = text;
    locationStatus.className = 'location-status ' + (isError ? 'error' : 'success');
  }

  function updateLocationDisplay() {
    if (locationCoords) {
      if (currentLocation.latitude != null && currentLocation.longitude != null) {
        locationCoords.textContent = currentLocation.latitude.toFixed(6) + ', ' + currentLocation.longitude.toFixed(6);
        locationCoords.classList.remove('hidden');
      } else {
        locationCoords.textContent = '';
        locationCoords.classList.add('hidden');
      }
    }
    if (locationAddress) {
      if (currentLocation.address) {
        locationAddress.textContent = currentLocation.address;
        locationAddress.classList.remove('hidden');
      } else {
        locationAddress.textContent = '';
        locationAddress.classList.add('hidden');
      }
    }
  }

  locationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.', true);
      return;
    }
    setLocationStatus('Getting location...', false);
    locationBtn.disabled = true;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        currentLocation.latitude = pos.coords.latitude;
        currentLocation.longitude = pos.coords.longitude;
        setLocationStatus('Location captured', false);
        locationBtn.disabled = false;
        updateLocationDisplay();
        if (typeof reverseGeocode === 'function') {
          reverseGeocode(pos.coords.latitude, pos.coords.longitude).then(addr => {
            currentLocation.address = addr;
            updateLocationDisplay();
          }).catch(() => {});
        }
      },
      (err) => {
        let msg = 'Could not get location.';
        if (err.code === 1) msg = 'Location permission denied.';
        else if (err.code === 2) msg = 'Location unavailable.';
        else if (err.code === 3) msg = 'Request timed out.';
        setLocationStatus(msg, true);
        locationBtn.disabled = false;
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const category = document.getElementById('category').value;
    const message = document.getElementById('message').value;

    if (useFirebase()) {
      try {
        const payload = {
          category,
          message,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          address: currentLocation.address || null
        };
        const { id } = await addComplaint(payload);
        showToast('Complaint submitted! Ticket: ' + id, 'success');
        form.reset();
        currentLocation = { latitude: null, longitude: null, address: null };
        setLocationStatus('');
        updateLocationDisplay();
      } catch (err) {
        console.error('Report submit error:', err);
        showToast(err.message || 'Failed to submit', 'error');
      }
      return;
    }

    const complaints = loadDummyData('complaints', DUMMY_COMPLAINTS);
    const newId = 'SC' + String(complaints.length + 1).padStart(3, '0');
    complaints.unshift({
      id: newId,
      category,
      status: 'pending',
      worker: null,
      message,
      rating: null,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      address: currentLocation.address,
      createdAt: new Date().toISOString()
    });
    saveDummyData('complaints', complaints);
    showToast('Complaint submitted! Ticket: ' + newId, 'success');
    form.reset();
    currentLocation = { latitude: null, longitude: null, address: null };
    setLocationStatus('');
    updateLocationDisplay();
  });
});
