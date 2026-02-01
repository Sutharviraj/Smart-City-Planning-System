/**
 * Admin Panel
 * Firebase: require auth + admins collection. Fallback: password gate + localStorage
 */

function useFirebase() {
  return typeof firebase !== 'undefined' && firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_API_KEY';
}

const ADMIN_PASSWORD = 'admin123';
const ADMIN_AUTH_KEY = 'smartcity_admin';
const STATUS_BADGE = { pending: 'badge-pending', assigned: 'badge-assigned', in_progress: 'badge-in-progress', resolved: 'badge-resolved' };

function getComplaintsSync() {
  return loadDummyData('complaints', DUMMY_COMPLAINTS);
}

function saveComplaintsSync(data) {
  saveDummyData('complaints', data);
}

function renderTable(complaints, filterStatus = '') {
  let list = complaints || [];
  if (filterStatus) list = list.filter(c => c.status === filterStatus);
  const tbody = document.getElementById('complaintsTableBody');
  const docIdKey = list.length && list[0]._docId !== undefined ? '_docId' : null;
  tbody.innerHTML = list.map(c => {
    const docId = c._docId || c.id;
    const id = c.id || c.ticketNumber || docId;
    return `
    <tr>
      <td>${id}</td>
      <td>${c.category}</td>
      <td><span class="badge-status ${STATUS_BADGE[c.status] || 'badge-pending'}">${(c.status || '').replace('_', ' ')}</span></td>
      <td>${c.worker || '-'}</td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="openAssignModal('${String(docId).replace(/'/g, "\\'")}')">Assign</button>
        <button class="btn btn-primary btn-sm" onclick="openStatusModal('${String(docId).replace(/'/g, "\\'")}', '${(c.status || '').replace(/'/g, "\\'")}')">Status</button>
      </td>
    </tr>
  `;
  }).join('');
}

function openAssignModal(docId) {
  document.getElementById('assignComplaintId').value = docId;
  document.getElementById('workerName').value = '';
  openModal('assignModal');
}

function submitAssign() {
  const docId = document.getElementById('assignComplaintId').value;
  const worker = document.getElementById('workerName').value.trim();
  if (!worker) {
    showToast('Enter worker name', 'error');
    return;
  }
  if (useFirebase()) {
    updateComplaint(docId, { worker, status: 'assigned' }).then(() => {
      closeModal('assignModal');
      loadAndRender();
      showToast('Worker assigned', 'success');
    }).catch(() => showToast('Failed to update', 'error'));
  } else {
    const complaints = getComplaintsSync();
    const c = complaints.find(x => x.id === docId || x._docId === docId);
    if (c) {
      c.worker = worker;
      c.status = 'assigned';
      saveComplaintsSync(complaints);
      closeModal('assignModal');
      renderAll();
      showToast('Worker assigned', 'success');
    }
  }
}

function openStatusModal(docId, current) {
  document.getElementById('statusComplaintId').value = docId;
  document.getElementById('newStatus').value = current || 'pending';
  openModal('statusModal');
}

function submitStatus() {
  const docId = document.getElementById('statusComplaintId').value;
  const status = document.getElementById('newStatus').value;
  if (useFirebase()) {
    const updates = { status };
    if (status === 'resolved') updates.rating = 5;
    updateComplaint(docId, updates).then(() => {
      closeModal('statusModal');
      loadAndRender();
      showToast('Status updated', 'success');
    }).catch(() => showToast('Failed to update', 'error'));
  } else {
    const complaints = getComplaintsSync();
    const c = complaints.find(x => x.id === docId || x._docId === docId);
    if (c) {
      c.status = status;
      if (status === 'resolved') c.rating = 5;
      saveComplaintsSync(complaints);
      closeModal('statusModal');
      renderAll();
      showToast('Status updated', 'success');
    }
  }
}

function renderStats(complaints) {
  const list = complaints || [];
  document.getElementById('adminTotal').textContent = list.length;
  document.getElementById('adminPending').textContent = list.filter(c => c.status !== 'resolved').length;
  document.getElementById('adminResolved').textContent = list.filter(c => c.status === 'resolved').length;
}

function renderChart(complaints) {
  const list = complaints || [];
  const counts = { pending: 0, assigned: 0, in_progress: 0, resolved: 0 };
  list.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1; });

  const canvas = document.getElementById('statusChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const values = [counts.pending, counts.assigned, counts.in_progress, counts.resolved];
  const colors = ['#fbbf24', '#3b82f6', '#8b5cf6', '#10b981'];
  const max = Math.max(...values, 1);
  const barWidth = (w - 80) / 4 - 16;

  ctx.clearRect(0, 0, w, h);
  values.forEach((v, i) => {
    const x = 40 + i * (barWidth + 16);
    const barH = (v / max) * (h - 50);
    ctx.fillStyle = colors[i];
    ctx.fillRect(x, h - 30 - barH, barWidth, barH);
    ctx.fillStyle = '#334155';
    ctx.font = '12px sans-serif';
    ctx.fillText(['Pending', 'Assigned', 'In Progress', 'Resolved'][i], x, h - 8);
    ctx.fillText(v, x + barWidth / 2 - 6, h - 35 - barH);
  });
}

let allComplaints = [];
let adminChatUnsub = null;
let selectedConvId = null;
let heroSlidesList = [];

async function loadAndRenderUsers() {
  if (!useFirebase() || typeof getAllUsers !== 'function') return;
  try {
    const users = await getAllUsers();
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    tbody.innerHTML = users.map(u => {
      const lastLogin = u.lastLoginAt && u.lastLoginAt.toDate ? u.lastLoginAt.toDate().toLocaleString() : (u.updatedAt && u.updatedAt.toDate ? u.updatedAt.toDate().toLocaleString() : '-');
      return `<tr><td>${u.displayName || '-'}</td><td>${u.email || '-'}</td><td>${lastLogin}</td></tr>`;
    }).join('');
  } catch (e) {
    if (document.getElementById('usersTableBody')) document.getElementById('usersTableBody').innerHTML = '<tr><td colspan="3">Failed to load users.</td></tr>';
  }
}

function setupAdminChat() {
  const input = document.getElementById('adminChatInput');
  const sendBtn = document.getElementById('adminSendBtn');
  if (!sendBtn) return;
  sendBtn.addEventListener('click', async () => {
    if (!selectedConvId || !input || !input.value.trim()) return;
    try {
      await sendChatMessage(selectedConvId, input.value.trim(), true);
      input.value = '';
    } catch (e) {
      showToast('Failed to send', 'error');
    }
  });
  if (input) input.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendBtn.click(); });
}

async function loadAdminConversations() {
  const listEl = document.getElementById('conversationsList');
  if (!listEl || !useFirebase()) return;
  try {
    const convos = await getAllConversations();
    listEl.innerHTML = convos.length === 0 ? '<p style="color: var(--gray-500);">No conversations yet.</p>' : convos.map(c => {
      const name = c.userName || c.userEmail || c.id;
      return `<button type="button" class="btn btn-outline btn-sm" style="display: block; width: 100%; margin-bottom: 8px; text-align: left;" data-conv-id="${c.id}">${name}</button>`;
    }).join('');
    listEl.querySelectorAll('[data-conv-id]').forEach(btn => {
      btn.addEventListener('click', () => selectAdminConversation(btn.dataset.convId));
    });
  } catch (e) {
    listEl.innerHTML = '<p style="color: var(--gray-500);">Failed to load.</p>';
  }
}

function selectAdminConversation(convId) {
  selectedConvId = convId;
  document.getElementById('adminChatPlaceholder').style.display = 'none';
  document.getElementById('adminChatArea').style.display = 'block';
  const messagesEl = document.getElementById('adminChatMessages');
  messagesEl.innerHTML = '';
  if (adminChatUnsub) adminChatUnsub();
  adminChatUnsub = subscribeChatMessages(convId, (messages) => {
    messagesEl.innerHTML = messages.map(m => {
      const cls = m.isAdmin ? 'bot' : 'user';
      return `<div class="chat-bubble ${cls}"><p>${escapeHtml(m.text)}</p></div>`;
    }).join('');
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

// ---- Hero Slider (admin-only) ----
function getDefaultHeroSlides() {
  return typeof DEFAULT_HERO_SLIDES !== 'undefined' ? [...DEFAULT_HERO_SLIDES] : [];
}

async function loadHeroSlidesForAdmin() {
  if (useFirebase() && typeof getHeroSlides === 'function') {
    try {
      heroSlidesList = await getHeroSlides();
    } catch (e) {
      heroSlidesList = loadDummyData('heroSlides', getDefaultHeroSlides()) || [];
    }
  } else {
    heroSlidesList = loadDummyData('heroSlides', getDefaultHeroSlides()) || [];
  }
  if (!Array.isArray(heroSlidesList)) heroSlidesList = [];
  renderSliderAdminList();
}

function renderSliderAdminList() {
  const listEl = document.getElementById('sliderAdminList');
  if (!listEl) return;
  if (heroSlidesList.length === 0) {
    listEl.innerHTML = '<li class="slider-admin-empty">No slides. Add slides above and click Save.</li>';
    return;
  }
  listEl.innerHTML = heroSlidesList.map((s, i) => `
    <li class="slider-admin-item" data-index="${i}">
      <div class="slider-admin-thumb" style="background-image: url('${(s.imageUrl || '').replace(/'/g, "%27")}');"></div>
      <div class="slider-admin-info">
        <span class="slider-admin-title">${escapeHtml(s.title || 'Slide ' + (i + 1))}</span>
        <span class="slider-admin-url">${escapeHtml((s.imageUrl || '').substring(0, 50))}…</span>
      </div>
      <div class="slider-admin-btns">
        <button type="button" class="btn btn-outline btn-sm slider-move-btn" data-action="up" data-index="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Move up">↑</button>
        <button type="button" class="btn btn-outline btn-sm slider-move-btn" data-action="down" data-index="${i}" ${i === heroSlidesList.length - 1 ? 'disabled' : ''} aria-label="Move down">↓</button>
        <button type="button" class="btn btn-outline btn-sm slider-remove-btn" data-index="${i}" aria-label="Remove">Remove</button>
      </div>
    </li>
  `).join('');
  listEl.querySelectorAll('.slider-move-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      const action = btn.getAttribute('data-action');
      if (action === 'up' && idx > 0) {
        [heroSlidesList[idx - 1], heroSlidesList[idx]] = [heroSlidesList[idx], heroSlidesList[idx - 1]];
      } else if (action === 'down' && idx < heroSlidesList.length - 1) {
        [heroSlidesList[idx], heroSlidesList[idx + 1]] = [heroSlidesList[idx + 1], heroSlidesList[idx]];
      }
      renderSliderAdminList();
    });
  });
  listEl.querySelectorAll('.slider-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      heroSlidesList.splice(idx, 1);
      renderSliderAdminList();
    });
  });
}

function setupSliderAdmin() {
  const addBtn = document.getElementById('sliderAddBtn');
  const presetSelect = document.getElementById('sliderAddPreset');
  const titleInput = document.getElementById('sliderAddTitle');
  const saveBtn = document.getElementById('sliderSaveBtn');
  const saveStatus = document.getElementById('sliderSaveStatus');

  if (addBtn && presetSelect) {
    addBtn.addEventListener('click', () => {
      const imageUrl = presetSelect.value;
      if (!imageUrl) {
        showToast('Choose an image from the list', 'error');
        return;
      }
      const title = (titleInput && titleInput.value.trim()) || presetSelect.options[presetSelect.selectedIndex].text;
      heroSlidesList.push({ imageUrl, title });
      renderSliderAdminList();
      if (titleInput) titleInput.value = '';
      presetSelect.value = '';
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      if (saveStatus) saveStatus.textContent = 'Saving…';
      if (useFirebase() && typeof setHeroSlides === 'function') {
        try {
          await setHeroSlides(heroSlidesList);
          if (saveStatus) saveStatus.textContent = 'Saved.';
          showToast('Slider saved. Dashboard will show updated slides.', 'success');
        } catch (e) {
          if (saveStatus) saveStatus.textContent = 'Failed.';
          showToast('Failed to save slider', 'error');
        }
      } else {
        saveDummyData('heroSlides', heroSlidesList);
        if (saveStatus) saveStatus.textContent = 'Saved (local).';
        showToast('Slider saved locally. Dashboard will show updated slides.', 'success');
      }
    });
  }
}

function renderAll() {
  renderStats(allComplaints);
  renderChart(allComplaints);
  renderTable(allComplaints, document.getElementById('filterStatus').value);
}

async function loadAndRender() {
  if (useFirebase()) {
    try {
      allComplaints = await getAllComplaints();
    } catch (e) {
      allComplaints = getComplaintsSync();
    }
  } else {
    allComplaints = getComplaintsSync();
  }
  renderAll();
}

function checkAdminAuth() {
  if (sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true') {
    const modal = document.getElementById('adminLoginModal');
    if (modal) modal.classList.remove('show');
    return true;
  }
  return false;
}

function hideAllAdminSections() {
  const main = document.getElementById('mainAdminSection');
  const users = document.getElementById('usersSection');
  const chat = document.getElementById('adminChatSection');
  const slider = document.getElementById('sliderSection');
  if (main) main.style.display = 'none';
  if (users) users.style.display = 'none';
  if (chat) chat.style.display = 'none';
  if (slider) slider.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', async () => {
  if (useFirebase()) {
    initFirebase();
    const user = getCurrentUser();
    if (!user) {
      window.location.href = 'login.html';
      return;
    }
    const admin = await isAdmin();
    if (!admin) {
      document.getElementById('adminContent').innerHTML = '<div class="page-container"><div class="card"><p>Access denied. Admin only.</p><a href="../dashboard.html" class="btn btn-primary">Back to Dashboard</a></div></div>';
      return;
    }
    const loginModal = document.getElementById('adminLoginModal');
    if (loginModal) loginModal.classList.remove('show');
    const mainSection = document.getElementById('mainAdminSection');
    if (mainSection) mainSection.style.display = 'block';
    await loadAndRender();
    document.getElementById('filterStatus').addEventListener('change', (e) => {
      renderTable(allComplaints, e.target.value);
    });
    await loadAndRenderUsers();
    setupAdminChat();
    document.getElementById('navUsers').addEventListener('click', (e) => {
      e.preventDefault();
      hideAllAdminSections();
      document.getElementById('usersSection').style.display = 'block';
      document.querySelector('.nav-item.active') && document.querySelector('.nav-item.active').classList.remove('active');
      e.currentTarget.classList.add('active');
    });
    document.getElementById('navComplaints').addEventListener('click', (e) => {
      e.preventDefault();
      hideAllAdminSections();
      document.getElementById('mainAdminSection').style.display = 'block';
      document.querySelector('.nav-item.active') && document.querySelector('.nav-item.active').classList.remove('active');
      e.currentTarget.classList.add('active');
    });
    document.getElementById('navSlider').addEventListener('click', (e) => {
      e.preventDefault();
      hideAllAdminSections();
      const sliderSection = document.getElementById('sliderSection');
      if (sliderSection) sliderSection.style.display = 'block';
      document.querySelector('.nav-item.active') && document.querySelector('.nav-item.active').classList.remove('active');
      e.currentTarget.classList.add('active');
      loadHeroSlidesForAdmin();
    });
    document.getElementById('navChat').addEventListener('click', (e) => {
      e.preventDefault();
      hideAllAdminSections();
      document.getElementById('adminChatSection').style.display = 'block';
      document.querySelector('.nav-item.active') && document.querySelector('.nav-item.active').classList.remove('active');
      e.currentTarget.classList.add('active');
      loadAdminConversations();
    });
    setupSliderAdmin();
    return;
  }

  if (checkAdminAuth()) {
    const mainSection = document.getElementById('mainAdminSection');
    if (mainSection) mainSection.style.display = 'block';
    await loadAndRender();
    document.getElementById('filterStatus').addEventListener('change', (e) => {
      renderTable(allComplaints, e.target.value);
    });
    setupSliderAdmin();
    document.getElementById('navSlider').addEventListener('click', (e) => {
      e.preventDefault();
      hideAllAdminSections();
      const sliderSection = document.getElementById('sliderSection');
      if (sliderSection) sliderSection.style.display = 'block';
      document.querySelector('.nav-item.active') && document.querySelector('.nav-item.active').classList.remove('active');
      e.currentTarget.classList.add('active');
      loadHeroSlidesForAdmin();
    });
    document.getElementById('navUsers').addEventListener('click', (e) => {
      e.preventDefault();
      hideAllAdminSections();
      document.getElementById('usersSection').style.display = 'block';
      document.querySelector('.nav-item.active') && document.querySelector('.nav-item.active').classList.remove('active');
      e.currentTarget.classList.add('active');
    });
    document.getElementById('navComplaints').addEventListener('click', (e) => {
      e.preventDefault();
      hideAllAdminSections();
      document.getElementById('mainAdminSection').style.display = 'block';
      document.querySelector('.nav-item.active') && document.querySelector('.nav-item.active').classList.remove('active');
      e.currentTarget.classList.add('active');
    });
    document.getElementById('navChat').addEventListener('click', (e) => {
      e.preventDefault();
      hideAllAdminSections();
      document.getElementById('adminChatSection').style.display = 'block';
      document.querySelector('.nav-item.active') && document.querySelector('.nav-item.active').classList.remove('active');
      e.currentTarget.classList.add('active');
      loadAdminConversations();
    });
    return;
  }

  const adminLoginModal = document.getElementById('adminLoginModal');
  if (adminLoginModal) adminLoginModal.classList.add('show');
  document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('adminPassword');
    const errorEl = document.getElementById('adminPasswordError');
    if (input.value === ADMIN_PASSWORD) {
      sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
      if (adminLoginModal) adminLoginModal.classList.remove('show');
      loadAndRender();
      document.getElementById('filterStatus').addEventListener('change', (e) => {
        renderTable(allComplaints, e.target.value);
      });
      setupSliderAdmin();
      document.getElementById('navSlider').addEventListener('click', (e) => {
        e.preventDefault();
        hideAllAdminSections();
        const sliderSection = document.getElementById('sliderSection');
        if (sliderSection) sliderSection.style.display = 'block';
        document.querySelector('.nav-item.active') && document.querySelector('.nav-item.active').classList.remove('active');
        e.currentTarget.classList.add('active');
        loadHeroSlidesForAdmin();
      });
      document.getElementById('navUsers').addEventListener('click', (e) => {
        e.preventDefault();
        hideAllAdminSections();
        document.getElementById('usersSection').style.display = 'block';
        document.querySelector('.nav-item.active') && document.querySelector('.nav-item.active').classList.remove('active');
        e.currentTarget.classList.add('active');
      });
      document.getElementById('navComplaints').addEventListener('click', (e) => {
        e.preventDefault();
        hideAllAdminSections();
        document.getElementById('mainAdminSection').style.display = 'block';
        document.querySelector('.nav-item.active') && document.querySelector('.nav-item.active').classList.remove('active');
        e.currentTarget.classList.add('active');
      });
      document.getElementById('navChat').addEventListener('click', (e) => {
        e.preventDefault();
        hideAllAdminSections();
        document.getElementById('adminChatSection').style.display = 'block';
        document.querySelector('.nav-item.active') && document.querySelector('.nav-item.active').classList.remove('active');
        e.currentTarget.classList.add('active');
        loadAdminConversations();
      });
    } else {
      errorEl.textContent = 'Incorrect password';
      input.classList.add('error');
    }
  });
});
