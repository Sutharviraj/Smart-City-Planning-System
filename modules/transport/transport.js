/**
 * Transport Module
 * Route planner, map placeholder, estimated time, card results
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('routeForm');
  const resultsDiv = document.getElementById('routeResults');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const from = document.getElementById('fromInput').value.trim();
    const to = document.getElementById('toInput').value.trim();

    if (!from || !to) {
      showToast('Enter from and to locations', 'error');
      return;
    }

    // Dummy route results
    const routes = [
      { id: 1, from, to, time: '25 min', stops: 8, bus: 'Bus 101' },
      { id: 2, from, to, time: '35 min', stops: 12, bus: 'Bus 205' }
    ];

    resultsDiv.innerHTML = '<h3 style="margin-bottom: 12px;">Available Routes</h3>' + routes.map(r => `
      <div class="card" style="margin-bottom: 12px;">
        <strong>${r.bus}</strong>
        <p style="margin: 8px 0;">${r.from} → ${r.to}</p>
        <div style="display: flex; gap: 16px; font-size: 0.9rem;">
          <span>⏱️ ${r.time}</span>
          <span>🚏 ${r.stops} stops</span>
        </div>
      </div>
    `).join('');
  });
});
