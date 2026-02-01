/**
 * Online Services Module
 * Opens form modals for Pay Bills, Certificates, Appointments
 */

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-modal]').forEach(card => {
    card.addEventListener('click', () => {
      const modalId = card.getAttribute('data-modal');
      openModal(modalId);
    });
  });

  // Close modal on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('show');
        document.body.style.overflow = '';
      }
    });
  });
});
