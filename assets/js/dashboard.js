/**
 * Smart City Portal - Dashboard (Citizen)
 * Auth guard, stats, hero slider; no photo upload (admin-only).
 */

const useFirebase = () => typeof firebase !== 'undefined' && firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_API_KEY';

document.addEventListener('DOMContentLoaded', () => {
  if (useFirebase()) {
    initFirebase();
    onAuthStateChanged((user) => {
      if (!user) {
        window.location.href = 'index.html';
        return;
      }
      loadStats();
      loadHeroSlidesAndInitSlider();
    });
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => logout().then(() => { window.location.href = 'index.html'; }));
  } else {
    loadStats();
    loadHeroSlidesAndInitSlider();
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => { window.location.href = 'index.html'; });
  }

  function loadStats() {
    if (useFirebase()) {
      getAllComplaints().then(complaints => {
        const total = complaints.length;
        const resolved = complaints.filter(c => c.status === 'resolved').length;
        const pending = total - resolved;
        document.getElementById('totalComplaints').textContent = total;
        document.getElementById('resolvedCount').textContent = resolved;
        document.getElementById('pendingCount').textContent = pending;
      }).catch(() => setDummyStats());
    } else {
      setDummyStats();
    }
  }

  function getDefaultHeroSlides() {
    return typeof DEFAULT_HERO_SLIDES !== 'undefined' ? DEFAULT_HERO_SLIDES : [];
  }

  async function loadHeroSlidesAndInitSlider() {
    let slides = [];
    if (useFirebase() && typeof getHeroSlides === 'function') {
      try {
        slides = await getHeroSlides();
      } catch (e) {
        slides = loadDummyData('heroSlides', getDefaultHeroSlides());
      }
    } else {
      slides = loadDummyData('heroSlides', getDefaultHeroSlides());
    }
    if (!slides || slides.length === 0) slides = getDefaultHeroSlides();
    initHeroSlider(slides);
  }

  function initHeroSlider(slides) {
    const track = document.getElementById('heroSliderTrack');
    const emptyEl = document.getElementById('heroSliderEmpty');
    const dotsEl = document.getElementById('heroSliderDots');
    const prevBtn = document.getElementById('heroSliderPrev');
    const nextBtn = document.getElementById('heroSliderNext');

    if (!track) return;

    if (!slides || slides.length === 0) {
      track.innerHTML = '';
      if (emptyEl) {
        track.appendChild(emptyEl);
        emptyEl.style.display = 'block';
      }
      if (dotsEl) dotsEl.innerHTML = '';
      return;
    }

    track.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'none';
    slides.forEach((s, i) => {
      const slide = document.createElement('div');
      slide.className = 'hero-slide' + (i === 0 ? ' hero-slide-active' : '');
      slide.setAttribute('data-index', i);
      slide.style.backgroundImage = "url('" + (s.imageUrl || '').replace(/'/g, "%27") + "')";
      const title = document.createElement('div');
      title.className = 'hero-slide-title';
      title.textContent = s.title || 'Smart City';
      slide.appendChild(title);
      track.appendChild(slide);
    });

    if (dotsEl) {
      dotsEl.innerHTML = '';
      slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'hero-dot' + (i === 0 ? ' hero-dot-active' : '');
        dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        dot.setAttribute('data-index', i);
        dotsEl.appendChild(dot);
      });
    }

    let currentIndex = 0;
    const total = slides.length;
    let autoPlayTimer = null;

    function goTo(index) {
      if (total === 0) return;
      currentIndex = (index + total) % total;
      track.querySelectorAll('.hero-slide').forEach((el, i) => el.classList.toggle('hero-slide-active', i === currentIndex));
      dotsEl && dotsEl.querySelectorAll('.hero-dot').forEach((el, i) => el.classList.toggle('hero-dot-active', i === currentIndex));
    }

    function next() {
      goTo(currentIndex + 1);
      resetAutoPlay();
    }

    function prev() {
      goTo(currentIndex - 1);
      resetAutoPlay();
    }

    function resetAutoPlay() {
      if (autoPlayTimer) clearInterval(autoPlayTimer);
      autoPlayTimer = setInterval(next, 5000);
    }

    if (prevBtn) prevBtn.addEventListener('click', prev);
    if (nextBtn) nextBtn.addEventListener('click', next);
    dotsEl && dotsEl.querySelectorAll('.hero-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        const idx = parseInt(dot.getAttribute('data-index'), 10);
        goTo(idx);
        resetAutoPlay();
      });
    });

    resetAutoPlay();
  }

  function setDummyStats() {
    const complaints = loadDummyData('complaints', DUMMY_COMPLAINTS);
    const total = complaints.length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    const pending = complaints.filter(c => c.status === 'pending' || c.status === 'assigned' || c.status === 'in_progress').length;
    document.getElementById('totalComplaints').textContent = total;
    document.getElementById('resolvedCount').textContent = resolved;
    document.getElementById('pendingCount').textContent = pending;
  }

  const notifBtn = document.getElementById('notificationBtn');
  const notifDropdown = document.getElementById('notificationDropdown');
  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener('click', () => notifDropdown.classList.toggle('show'));
    document.addEventListener('click', (e) => {
      if (!notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) notifDropdown.classList.remove('show');
    });
  }

  const sidebarToggle = document.querySelector('.sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (sidebarToggle && sidebar) sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));

  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-item').forEach(item => {
    const href = item.getAttribute('href') || '';
    if (currentPath.endsWith(href) || (href === 'dashboard.html' && (currentPath.endsWith('/') || currentPath.endsWith('dashboard.html')))) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
});
