/**
 * Track Complaint Module
 * Lookup from Firestore or localStorage by ticket ID
 */

const STATUS_ORDER = ['pending', 'assigned', 'in_progress', 'resolved'];

function useFirebase() {
  return typeof firebase !== 'undefined' && firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_API_KEY';
}

document.addEventListener('DOMContentLoaded', () => {
  if (useFirebase()) initFirebase();

  const ticketInput = document.getElementById('ticketInput');
  const trackBtn = document.getElementById('trackBtn');
  const trackResult = document.getElementById('trackResult');

  function getStatusBadgeClass(status) {
    const map = { pending: 'badge-pending', assigned: 'badge-assigned', 'in_progress': 'badge-in-progress', resolved: 'badge-resolved' };
    return map[status] || 'badge-pending';
  }

  function renderStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) html += `<span class="star ${i <= (rating || 0) ? 'filled' : ''}">★</span>`;
    return html;
  }

  function renderTimeline(status) {
    const idx = STATUS_ORDER.indexOf(status);
    return STATUS_ORDER.map((s, i) => {
      const done = i <= idx;
      return `<div class="timeline-step ${done ? 'done' : ''}"><span class="step-dot"></span><span>${s.replace('_', ' ')}</span></div>`;
    }).join('');
  }

  function showComplaint(complaint) {
    const statusClass = getStatusBadgeClass(complaint.status);
    const starsHtml = complaint.status === 'resolved' ? renderStars(complaint.rating || 0) : '';
    const id = complaint.id || complaint.ticketNumber;
    trackResult.innerHTML = `
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
          <h3>${id} - ${complaint.category}</h3>
          <span class="badge-status ${statusClass}">${(complaint.status || '').replace('_', ' ')}</span>
        </div>
        <p style="margin-bottom: 16px;">${complaint.message}</p>
        ${complaint.worker ? `<p><strong>Worker:</strong> ${complaint.worker}</p>` : ''}
        <div class="timeline" style="margin: 20px 0;">${renderTimeline(complaint.status)}</div>
        ${complaint.status === 'resolved' ? `<div class="rating-section"><strong>Rating:</strong><div class="stars" style="font-size: 1.5rem;">${starsHtml}</div></div>` : ''}
      </div>
    `;
  }

  trackBtn.addEventListener('click', async () => {
    const ticket = ticketInput.value.trim().toUpperCase();
    if (!ticket) {
      showToast('Enter ticket number', 'error');
      return;
    }

    if (useFirebase()) {
      try {
        const complaint = await getComplaintByTicket(ticket);
        if (!complaint) {
          trackResult.innerHTML = '<div class="card"><p>Ticket not found. Please check the number.</p></div>';
          return;
        }
        if (complaint.createdAt && complaint.createdAt.toDate) complaint.createdAt = complaint.createdAt.toDate().toISOString();
        showComplaint(complaint);
      } catch (err) {
        trackResult.innerHTML = '<div class="card"><p>Error loading ticket. Try again.</p></div>';
      }
      return;
    }

    const complaints = loadDummyData('complaints', DUMMY_COMPLAINTS);
    const complaint = complaints.find(c => (c.id || '').toUpperCase() === ticket);
    if (!complaint) {
      trackResult.innerHTML = '<div class="card"><p>Ticket not found. Please check the number.</p></div>';
      return;
    }
    showComplaint(complaint);
  });
});
