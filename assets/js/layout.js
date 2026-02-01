/**
 * Layout - Sidebar toggle for mobile
 */
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
});
