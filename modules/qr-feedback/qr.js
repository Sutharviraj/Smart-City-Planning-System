/**
 * QR Feedback Module
 * Rating + text only (no photo/voice). Saved to Firebase when configured.
 */

function useFirebase() {
  return typeof firebase !== 'undefined' && firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_API_KEY';
}

document.addEventListener('DOMContentLoaded', () => {
  if (useFirebase()) initFirebase();

  const form = document.getElementById('qrForm');
  const stars = document.querySelectorAll('#ratingStars .star');

  let selectedRating = 0;

  stars.forEach(star => {
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.dataset.rating);
      stars.forEach((s, i) => s.classList.toggle('filled', i < selectedRating));
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (selectedRating === 0) {
      showToast('Please select a rating', 'error');
      return;
    }

    if (useFirebase() && typeof addFeedback === 'function') {
      try {
        await addFeedback({
          rating: selectedRating,
          text: document.getElementById('feedbackText').value.trim()
        });
        showToast('Thank you for your feedback!', 'success');
      } catch (err) {
        showToast(err.message || 'Failed to submit', 'error');
      }
    } else {
      showToast('Thank you for your feedback!', 'success');
    }
    form.reset();
    selectedRating = 0;
    stars.forEach(s => s.classList.remove('filled'));
  });
});
