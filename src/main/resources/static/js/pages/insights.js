import { api } from '../api.js';

export function renderInsightsPage(el) {
  el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Insights</div>
        <div class="page-subtitle">Query and explore employee data</div>
      </div>
    </div>

    <div class="insight-grid">

      <div class="insight-card">
        <div class="insight-card-title">Count by Designation</div>
        <div class="insight-card-desc">Get the number of employees with a specific designation.</div>
        <div class="filter-bar" style="margin-bottom:0;gap:8px">
          <select class="filter-select" id="count-desig" style="flex:1">
            <option value="">Select designation</option>
            <option>Developer</option><option>Manager</option>
            <option>Analyst</option><option>Designer</option><option>QA</option>
          </select>
          <button class="btn btn-primary btn-sm" id="btn-count">Count</button>
        </div>
        <div class="insight-result" id="result-count">Select a designation and click Count.</div>
      </div>

      <div class="insight-card">
        <div class="insight-card-title">Employee Exists by Name</div>
        <div class="insight-card-desc">Check whether an employee with a given name exists in the system.</div>
        <div class="filter-bar" style="margin-bottom:0;gap:8px">
          <input class="search-input" id="exists-name" placeholder="Enter a name…" style="flex:1;padding-left:12px">
          <button class="btn btn-primary btn-sm" id="btn-exists">Check</button>
        </div>
        <div class="insight-result" id="result-exists">Enter a name and click Check.</div>
      </div>

      <div class="insight-card">
        <div class="insight-card-title">Filter by Designation + Company</div>
        <div class="insight-card-desc">Find employees matching both a designation and a company name.</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <select class="filter-select" id="fl-desig">
            <option value="">Select designation</option>
            <option>Developer</option><option>Manager</option>
            <option>Analyst</option><option>Designer</option><option>QA</option>
          </select>
          <input class="form-control" id="fl-company" placeholder="Company name">
          <button class="btn btn-primary btn-sm" id="btn-filter">Filter</button>
        </div>
        <div class="insight-result" id="result-filter">Fill both fields and click Filter.</div>
      </div>

      <div class="insight-card" style="grid-column:1/-1">
        <div class="insight-card-title">Service Health</div>
        <div class="insight-card-desc">Check whether the Employee REST service is responding.</div>
        <button class="btn btn-primary btn-sm" id="btn-health">Check Health</button>
        <div class="insight-result" id="result-health" style="margin-top:12px">Click Check Health to run the probe.</div>
      </div>

    </div>
  `;

  el.querySelector('#btn-count').onclick = async () => {
    const d = el.querySelector('#count-desig').value;
    const r = el.querySelector('#result-count');
    if (!d) { r.className = 'insight-result'; r.textContent = 'Please select a designation.'; return; }
    r.innerHTML = '<div class="spinner"></div>';
    try {
      const count = await api.countByDesignation(d);
      r.className = 'insight-result success';
      r.innerHTML = `<span class="result-value">${count}</span> ${d}${count !== 1 ? 's' : ''} found`;
    } catch { r.className = 'insight-result error'; r.textContent = 'Request failed.'; }
  };

  el.querySelector('#btn-exists').onclick = async () => {
    const name = el.querySelector('#exists-name').value.trim();
    const r = el.querySelector('#result-exists');
    if (!name) { r.className = 'insight-result'; r.textContent = 'Please enter a name.'; return; }
    r.innerHTML = '<div class="spinner"></div>';
    try {
      const exists = await api.existsByName(name);
      r.className = `insight-result ${exists ? 'success' : 'error'}`;
      r.textContent = exists ? `✓ "${name}" exists in the system.` : `✗ No employee named "${name}" was found.`;
    } catch { r.className = 'insight-result error'; r.textContent = 'Request failed.'; }
  };

  el.querySelector('#btn-filter').onclick = async () => {
    const d = el.querySelector('#fl-desig').value;
    const c = el.querySelector('#fl-company').value.trim();
    const r = el.querySelector('#result-filter');
    if (!d || !c) { r.className = 'insight-result'; r.textContent = 'Please fill both fields.'; return; }
    r.innerHTML = '<div class="spinner"></div>';
    try {
      const list = await api.filter(d, c);
      r.className = 'insight-result success';
      r.innerHTML = `<span class="result-value">${list.length}</span> ${d}${list.length !== 1 ? 's' : ''} at ${c}`;
    } catch { r.className = 'insight-result error'; r.textContent = 'Request failed.'; }
  };

  el.querySelector('#btn-health').onclick = async () => {
    const r = el.querySelector('#result-health');
    r.innerHTML = '<div class="spinner"></div>';
    try {
      const msg = await api.health();
      r.className = 'insight-result success';
      r.textContent = '✓ ' + msg;
    } catch { r.className = 'insight-result error'; r.textContent = '✗ Service unreachable.'; }
  };
}
