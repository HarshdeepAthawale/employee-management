import { api } from '../api.js';
import { showModal, closeModal, showConfirmModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

let _all = [];
let _employees = [];
let _container;

const STATUS_BADGE = {
  PRESENT: 'badge-green',
  HALF_DAY: 'badge-amber',
  ABSENT: 'badge-red',
  ON_LEAVE: 'badge-blue',
};

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtTime(t) {
  if (!t) return '—';
  return String(t).slice(0, 5);
}

function fmtHours(min) {
  if (min == null) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function empName(id) {
  const e = _employees.find(x => x.empId === id);
  return e ? e.name : `#${id}`;
}

function empOptions(selected) {
  return `<option value="">All employees</option>` + _employees
    .map(e => `<option value="${e.empId}"${String(e.empId) === String(selected) ? ' selected' : ''}>${e.name} (#${e.empId})</option>`)
    .join('');
}

export async function renderAttendancePage(el) {
  const today = todayStr();
  const now = new Date();
  const monthVal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Attendance</div>
        <div class="page-subtitle">Daily check-in / check-out tracking</div>
      </div>
      <button class="btn btn-primary" id="btn-checkin">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        Check In
      </button>
    </div>

    <div class="stats-grid" id="att-stats">
      <div class="stat-card"><div class="stat-label">Present Today</div><div class="stat-value" id="st-present">—</div></div>
      <div class="stat-card"><div class="stat-label">Half Day</div><div class="stat-value" id="st-half">—</div></div>
      <div class="stat-card"><div class="stat-label">Absent</div><div class="stat-value" id="st-absent">—</div></div>
      <div class="stat-card"><div class="stat-label">Currently In</div><div class="stat-value" id="st-open">—</div><div class="stat-hint">checked in, not out</div></div>
    </div>

    <div class="filter-bar">
      <select class="filter-select" id="fl-emp">${empOptions('')}</select>
      <input class="filter-select" id="fl-from" type="date" style="width:auto">
      <input class="filter-select" id="fl-to" type="date" style="width:auto">
      <select class="filter-select" id="fl-status">
        <option value="">All statuses</option>
        <option>PRESENT</option><option>HALF_DAY</option><option>ABSENT</option><option>ON_LEAVE</option>
      </select>
      <button class="btn btn-outline" id="btn-clear">Clear</button>
    </div>

    <div class="insight-card" style="margin-bottom:20px">
      <div class="insight-card-title">Monthly Report</div>
      <div class="insight-card-desc">Aggregated attendance summary for one employee in a month.</div>
      <div class="filter-bar" style="margin-bottom:0;gap:8px">
        <select class="filter-select" id="rp-emp" style="flex:1">${empOptions('')}</select>
        <input class="filter-select" id="rp-month" type="month" value="${monthVal}" style="width:auto">
        <button class="btn btn-primary btn-sm" id="btn-report">Run Report</button>
      </div>
      <div class="insight-result" id="rp-result">Pick an employee and month, then click Run Report.</div>
    </div>

    <div id="att-table-container">
      <div class="loading-state"><div class="spinner"></div> Loading…</div>
    </div>
  `;

  _container = el.querySelector('#att-table-container');

  el.querySelector('#btn-checkin').onclick = () => openCheckInModal();
  el.querySelector('#btn-clear').onclick = () => {
    el.querySelector('#fl-emp').value = '';
    el.querySelector('#fl-from').value = '';
    el.querySelector('#fl-to').value = '';
    el.querySelector('#fl-status').value = '';
    renderTable();
  };
  el.querySelector('#fl-emp').onchange = renderTable;
  el.querySelector('#fl-from').onchange = renderTable;
  el.querySelector('#fl-to').onchange = renderTable;
  el.querySelector('#fl-status').onchange = renderTable;
  el.querySelector('#btn-report').onclick = runReport;

  await load();
}

async function load() {
  try {
    [_employees, _all] = await Promise.all([api.getAll(), api.attGetAll()]);
    // re-populate selects now that employees are known
    const cur = document.getElementById('fl-emp')?.value ?? '';
    const rp = document.getElementById('rp-emp');
    if (rp) rp.innerHTML = empOptions('');
    const fl = document.getElementById('fl-emp');
    if (fl) { fl.innerHTML = empOptions(cur); }
    updateStats();
    renderTable();
  } catch (e) {
    _container.innerHTML = `<div class="table-wrap"><div class="table-empty" style="color:var(--danger)">Failed to load attendance. Is the backend running?</div></div>`;
  }
}

async function updateStats() {
  try {
    const today = await api.attToday();
    const set = (id, v) => { const n = document.getElementById(id); if (n) n.textContent = v; };
    set('st-present', today.filter(r => r.status === 'PRESENT').length);
    set('st-half', today.filter(r => r.status === 'HALF_DAY').length);
    set('st-absent', today.filter(r => r.status === 'ABSENT').length);
    set('st-open', today.filter(r => r.status === 'PRESENT' && !r.checkOut).length);
  } catch { /* stats are best-effort */ }
}

function currentFilters() {
  return {
    emp: document.getElementById('fl-emp')?.value ?? '',
    from: document.getElementById('fl-from')?.value ?? '',
    to: document.getElementById('fl-to')?.value ?? '',
    status: document.getElementById('fl-status')?.value ?? '',
  };
}

function renderTable() {
  const { emp, from, to, status } = currentFilters();
  const rows = _all.filter(r => {
    if (emp && String(r.employee?.empId) !== String(emp)) return false;
    if (from && r.date < from) return false;
    if (to && r.date > to) return false;
    if (status && r.status !== status) return false;
    return true;
  });

  if (!rows.length) {
    _container.innerHTML = `<div class="table-wrap"><div class="table-empty">No attendance records match the filters.</div></div>`;
    return;
  }

  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';
  wrap.innerHTML = `
    <div class="table-info">${rows.length} record${rows.length !== 1 ? 's' : ''}</div>
    <table>
      <thead>
        <tr>
          <th>Employee</th>
          <th>Date</th>
          <th>Check In</th>
          <th>Check Out</th>
          <th>Hours</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td style="font-weight:500">${r.employee?.name ?? empName(r.employee?.empId)} <span style="color:var(--text-muted);font-size:12px">#${r.employee?.empId}</span></td>
            <td style="color:var(--text-secondary)">${r.date}</td>
            <td>${fmtTime(r.checkIn)}</td>
            <td>${fmtTime(r.checkOut)}</td>
            <td style="color:var(--text-secondary)">${fmtHours(r.workedMinutes)}</td>
            <td><span class="badge ${STATUS_BADGE[r.status] || 'badge-gray'}">${r.status}</span></td>
            <td>
              <div class="actions-cell">
                ${!r.checkOut && r.status === 'PRESENT' ? `<button class="btn btn-primary btn-sm btn-out" data-id="${r.id}">Check Out</button>` : ''}
                ${r.status === 'PRESENT' ? `<button class="btn btn-outline btn-sm btn-absent" data-id="${r.id}">Absent</button>` : ''}
                <button class="btn btn-danger btn-sm btn-del" data-id="${r.id}">Delete</button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  wrap.querySelectorAll('.btn-out').forEach(b => b.addEventListener('click', () => onCheckOut(Number(b.dataset.id))));
  wrap.querySelectorAll('.btn-absent').forEach(b => b.addEventListener('click', () => onMarkAbsent(Number(b.dataset.id))));
  wrap.querySelectorAll('.btn-del').forEach(b => b.addEventListener('click', () => onDelete(Number(b.dataset.id))));

  _container.innerHTML = '';
  _container.appendChild(wrap);
}

async function reload() {
  _all = await api.attGetAll();
  updateStats();
  renderTable();
}

function openCheckInModal() {
  const form = document.createElement('form');
  form.innerHTML = `
    <div class="form-group" id="fg-emp">
      <label class="form-label">Employee <span>*</span></label>
      <select class="form-control" id="f-emp">
        <option value="">— Select employee —</option>
        ${_employees.map(e => `<option value="${e.empId}">${e.name} (#${e.empId})</option>`).join('')}
      </select>
      <div class="form-error">Please select an employee</div>
    </div>
    <div class="form-group">
      <label class="form-label">Date</label>
      <input class="form-control" id="f-date" type="date" value="${todayStr()}">
    </div>
  `;

  showModal({
    title: 'Check In',
    body: form,
    confirmText: 'Check In',
    onConfirm: async (backdrop) => {
      const empId = backdrop.querySelector('#f-emp').value;
      const fg = backdrop.querySelector('#fg-emp');
      fg.classList.remove('has-error');
      if (!empId) { fg.classList.add('has-error'); return; }
      const date = backdrop.querySelector('#f-date').value || null;
      try {
        await api.attCheckIn(Number(empId), date);
        showToast('Checked in');
        closeModal();
        await reload();
      } catch (e) {
        showToast('Check-in failed: ' + e.message, 'error');
      }
    },
  });
}

async function onCheckOut(id) {
  try {
    await api.attCheckOut(id);
    showToast('Checked out');
    await reload();
  } catch (e) {
    showToast('Check-out failed: ' + e.message, 'error');
  }
}

async function onMarkAbsent(id) {
  try {
    await api.attPatch(id, 'ABSENT');
    showToast('Marked absent');
    await reload();
  } catch (e) {
    showToast('Failed: ' + e.message, 'error');
  }
}

function onDelete(id) {
  showConfirmModal({
    title: 'Delete Attendance Record',
    message: 'Delete this attendance record? This action cannot be undone.',
    onConfirm: async () => {
      try {
        await api.attDelete(id);
        showToast('Record deleted', 'info');
        await reload();
      } catch (e) {
        showToast('Failed to delete: ' + e.message, 'error');
      }
    },
  });
}

async function runReport() {
  const empId = document.getElementById('rp-emp').value;
  const month = document.getElementById('rp-month').value;
  const r = document.getElementById('rp-result');
  if (!empId) { r.className = 'insight-result'; r.textContent = 'Please select an employee.'; return; }
  if (!month) { r.className = 'insight-result'; r.textContent = 'Please pick a month.'; return; }
  const [year, mon] = month.split('-').map(Number);
  r.innerHTML = '<div class="spinner"></div>';
  try {
    const rep = await api.attMonthly(Number(empId), year, mon);
    r.className = 'insight-result success';
    r.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:14px;width:100%">
      <span><span class="result-value">${rep.presentDays}</span> present</span>
      <span><span class="result-value">${rep.halfDays}</span> half-day</span>
      <span><span class="result-value">${rep.absentDays}</span> absent</span>
      <span><span class="result-value">${rep.leaveDays}</span> on leave</span>
      <span><span class="result-value">${rep.totalHours}h</span> worked</span>
      <span style="margin-left:auto;color:var(--text-secondary)">${rep.employeeName} · ${rep.year}-${String(rep.month).padStart(2, '0')}</span>
    </div>`;
  } catch (e) {
    r.className = 'insight-result error';
    r.textContent = 'Report failed: ' + e.message;
  }
}
