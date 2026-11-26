export function renderSidebar(el) {
  el.innerHTML = `
    <div class="sidebar-brand">
      <div class="sidebar-logo">EM</div>
      <div>
        <div class="sidebar-title">EmployeeHub</div>
        <div class="sidebar-subtitle">Management portal</div>
      </div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-item" data-page="employees" onclick="navigate('employees')">
        <span class="nav-icon">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </span>
        Employees
      </div>
      <div class="nav-item" data-page="departments" onclick="navigate('departments')">
        <span class="nav-icon">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
          </svg>
        </span>
        Departments
      </div>
      <div class="nav-item" data-page="insights" onclick="navigate('insights')">
        <span class="nav-icon">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
        </span>
        Insights
      </div>
    </nav>
    <div class="sidebar-footer">
      <a href="/swagger-ui.html" target="_blank" class="footer-link">↗ Swagger UI</a>
      <a href="/h2-console" target="_blank" class="footer-link">↗ H2 Console</a>
      <a href="/actuator/health" target="_blank" class="footer-link">↗ Actuator Health</a>
    </div>
  `;
}

export function setActiveNav(page) {
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
}
