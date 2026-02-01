/**
 * Alerts Module
 * From Firestore when configured; else dummy data
 */

function useFirebase() {
  return typeof firebase !== 'undefined' && firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_API_KEY';
}

document.addEventListener('DOMContentLoaded', () => {
  if (useFirebase()) initFirebase();

  const container = document.getElementById('alertsList');

  function getBadgeClass(priority) {
    const map = { high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };
    return map[priority] || 'badge-low';
  }

  function render(alerts) {
    container.innerHTML = alerts.map(a => `
      <div class="card alert-card">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <span class="badge-status ${getBadgeClass(a.priority)}">${a.priority}</span>
            <h3 style="margin: 8px 0;">${a.title}</h3>
            <p style="color: var(--gray-500); margin-bottom: 4px;">${a.message}</p>
            <span style="font-size: 0.8rem; color: var(--gray-500);">📅 ${a.date}</span>
          </div>
          <button class="btn btn-outline btn-sm dismiss-btn" data-id="${a.id}">Dismiss</button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.dismiss-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (useFirebase()) {
          try {
            await dismissAlert(id);
            const alerts = await getAlerts();
            const dismissed = await getUserDismissedAlerts();
            const list = alerts.filter(x => !dismissed.includes(x.id));
            render(list);
            showToast('Alert dismissed', 'success');
          } catch (e) {
            showToast('Failed to dismiss', 'error');
          }
        } else {
          alertsList = alertsList.filter(a => String(a.id) !== String(id));
          saveDummyData('alerts', alertsList);
          render(alertsList);
          showToast('Alert dismissed', 'success');
        }
      });
    });
  }

  let alertsList = [];

  if (useFirebase()) {
    Promise.all([getAlerts(), getUserDismissedAlerts()]).then(([alerts, dismissed]) => {
      alertsList = alerts.filter(a => !dismissed.includes(a.id));
      render(alertsList);
    }).catch(() => {
      alertsList = loadDummyData('alerts', DUMMY_ALERTS);
      render(alertsList);
    });
  } else {
    alertsList = loadDummyData('alerts', DUMMY_ALERTS);
    render(alertsList);
  }
});
