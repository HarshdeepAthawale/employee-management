import { api, canManage } from '../api.js';
import { renderTable } from '../components/table.js';
import { showEmployeeModal, showConfirmModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

let _all = [];
let _filtered = [];
let _tableContainer;

export async function renderEmployeesPage(el) {
  el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Employees</div>
        <div class="page-subtitle">Manage your team records</div>
      </div>
      ${canManage() ? `
      <button class="btn btn-primary" id="btn-new">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        New Employee
      </button>` : ''}
    </div>

    <div class="stats-grid" id="stats-grid">
      <div class="stat-card"><div class="stat-label">Total</div><div class="stat-value" id="stat-total">—</div><div class="stat-hint">all records</div></div>
      <div class="stat-card"><div class="stat-label">Developers</div><div class="stat-value" id="stat-dev">—</div></div>
      <div class="stat-card"><div class="stat-label">Managers</div><div class="stat-value" id="stat-mgr">—</div></div>
      <div class="stat-card"><div class="stat-label">Analysts</div><div class="stat-value" id="stat-anl">—</div></div>
    </div>

    <div class="filter-bar">
      <div class="search-wrap">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input class="search-input" id="search-input" placeholder="Search by name…">
      </div>
      <select class="filter-select" id="filter-desig">
        <option value="">All designations</option>
        <option>Developer</option><option>Manager</option>
        <option>Analyst</option><option>Designer</option><option>QA</option>
      </select>
      <select class="filter-select" id="filter-company">
        <option value="">All companies</option>
      </select>
      <select class="filter-select" id="filter-status">
        <option value="">All statuses</option>
        <option>ACTIVE</option><option>INACTIVE</option><option>ON_LEAVE</option>
      </select>
      <button class="btn btn-outline" id="btn-clear">Clear</button>
    </div>

    <div id="table-container">
      <div class="loading-state"><div class="spinner"></div> Loading…</div>
    </div>
  `;

  _tableContainer = el.querySelector('#table-container');

  el.querySelector('#btn-new')?.addEventListener('click', () => openNewModal());
  el.querySelector('#search-input').oninput = applyFilter;
  el.querySelector('#filter-desig').onchange = applyFilter;
  el.querySelector('#filter-company').onchange = applyFilter;
  el.querySelector('#filter-status').onchange = applyFilter;
  el.querySelector('#btn-clear').onclick = clearFilter;

  await loadEmployees();
}

async function loadEmployees() {
  try {
    _all = await api.getAll();
    populateCompanyFilter();
    updateStats();
    applyFilter();
  } catch (e) {
    _tableContainer.innerHTML = `<div class="table-wrap"><div class="table-empty" style="color:var(--danger)">Failed to load employees. Is the backend running?</div></div>`;
  }
}

function populateCompanyFilter() {
  const sel = document.getElementById('filter-company');
  if (!sel) return;
  const companies = [...new Set(_all.map(e => e.company).filter(Boolean))].sort();
  const current = sel.value;
  sel.innerHTML = '<option value="">All companies</option>' +
    companies.map(c => `<option${c === current ? ' selected' : ''}>${c}</option>`).join('');
}

function updateStats() {
  const set = val => { const el = document.getElementById(val[0]); if (el) el.textContent = val[1]; };
  set(['stat-total', _all.length]);
  set(['stat-dev',   _all.filter(e => e.designation === 'Developer').length]);
  set(['stat-mgr',   _all.filter(e => e.designation === 'Manager').length]);
  set(['stat-anl',   _all.filter(e => e.designation === 'Analyst').length]);
}

function applyFilter() {
  const search = (document.getElementById('search-input')?.value ?? '').toLowerCase();
  const desig  = document.getElementById('filter-desig')?.value ?? '';
  const comp   = document.getElementById('filter-company')?.value ?? '';
  const status = document.getElementById('filter-status')?.value ?? '';
  _filtered = _all.filter(e => {
    if (search && !(e.name ?? '').toLowerCase().includes(search)) return false;
    if (desig  && e.designation !== desig) return false;
    if (comp   && e.company !== comp) return false;
    if (status && (e.status || 'ACTIVE') !== status) return false;
    return true;
  });
  renderTable(_tableContainer, _filtered, { onEdit, onDelete });
}

function clearFilter() {
  const si = document.getElementById('search-input');
  const fd = document.getElementById('filter-desig');
  const fc = document.getElementById('filter-company');
  const fs = document.getElementById('filter-status');
  if (si) si.value = '';
  if (fd) fd.value = '';
  if (fc) fc.value = '';
  if (fs) fs.value = '';
  applyFilter();
}

function openNewModal() {
  showEmployeeModal(null, async data => {
    try {
      await api.create(data);
      showToast('Employee created');
      await loadEmployees();
    } catch (e) {
      showToast('Failed to create: ' + e.message, 'error');
    }
  });
}

function onEdit(id) {
  const emp = _all.find(e => e.empId === id);
  if (!emp) return;
  showEmployeeModal(emp, async data => {
    try {
      await api.update(id, { ...emp, ...data });
      showToast('Employee updated');
      await loadEmployees();
    } catch (e) {
      showToast('Failed to update: ' + e.message, 'error');
    }
  });
}

function onDelete(id) {
  const emp = _all.find(e => e.empId === id);
  showConfirmModal({
    title: 'Delete Employee',
    message: `Are you sure you want to delete <strong>${emp?.name ?? 'this employee'}</strong>? This action cannot be undone.`,
    onConfirm: async () => {
      try {
        await api.remove(id);
        showToast('Employee deleted', 'info');
        await loadEmployees();
      } catch (e) {
        showToast('Failed to delete: ' + e.message, 'error');
      }
    },
  });
}
