import { api } from './api.js';
import { renderSidebar, setActiveNav, setSidebarUser } from './components/sidebar.js';
import { renderLogin } from './components/login.js';
import { renderEmployeesPage } from './pages/employees.js';
import { renderDepartmentsPage } from './pages/departments.js';
import { renderInsightsPage } from './pages/insights.js';
import { renderAttendancePage } from './pages/attendance.js';
import { renderLeavesPage } from './pages/leaves.js';
import { renderSalariesPage } from './pages/salaries.js';

const PAGES = {
  employees:   renderEmployeesPage,
  departments: renderDepartmentsPage,
  attendance:  renderAttendancePage,
  leaves:      renderLeavesPage,
  salaries:    renderSalariesPage,
  insights:    renderInsightsPage,
};

function navigate(page) {
  if (!PAGES[page]) page = 'employees';
  setActiveNav(page);
  history.replaceState(null, '', '#' + page);
  const main = document.getElementById('main');
  main.innerHTML = '';
  PAGES[page](main);
}

window.navigate = navigate;

/** Shown whenever an API call comes back 401 — swaps the app for the login view. */
function showLogin() {
  document.getElementById('sidebar').style.display = 'none';
  const main = document.getElementById('main');
  main.style.marginLeft = '0';
  renderLogin(main, { onSuccess: (user) => boot(user) });
}
window.showLogin = showLogin;

async function boot(user) {
  if (!user) {
    try { user = await api.me(); } catch { user = null; }
  }
  if (!user) {
    showLogin();
    return;
  }
  window.APP_USER = user;
  const sidebar = document.getElementById('sidebar');
  sidebar.style.display = '';
  document.getElementById('main').style.marginLeft = '';
  renderSidebar(sidebar);
  setSidebarUser(user);
  // EMPLOYEE role can't see the Salaries nav (backend enforces 403 anyway)
  const roles = (user.roles || []).map(r => r.replace(/^ROLE_/, ''));
  if (!roles.includes('ADMIN') && !roles.includes('HR')) {
    document.querySelector('.nav-item[data-page="salaries"]')?.remove();
  }
  const page = location.hash.replace('#', '') || 'employees';
  navigate(page);
}

document.addEventListener('DOMContentLoaded', () => boot());

window.addEventListener('hashchange', () => {
  if (window.APP_USER) navigate(location.hash.replace('#', '') || 'employees');
});
