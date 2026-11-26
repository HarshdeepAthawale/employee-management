import { renderSidebar, setActiveNav } from './components/sidebar.js';
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

document.addEventListener('DOMContentLoaded', () => {
  renderSidebar(document.getElementById('sidebar'));
  const page = location.hash.replace('#', '') || 'employees';
  navigate(page);
});

window.addEventListener('hashchange', () => {
  navigate(location.hash.replace('#', '') || 'employees');
});
