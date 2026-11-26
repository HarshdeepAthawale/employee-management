import { api } from '../api.js';
import { showModal, closeModal, showConfirmModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

let _all = [];
let _employees = [];
let _container;

const TYPE_BADGE = {
  SICK: 'badge-red',
  CASUAL: 'badge-amber',
  EARNED: 'badge-teal',
  UNPAID: 'badge-gray',
};

const STATUS_BADGE = {
  PENDING: 'badge-amber',
  APPROVED: 'badge-green',
  REJECTED: 'badge-red',
};

function empOptions(selected) {
  return `<option value="">All employees</option>` + _employees
    .map(e => `<option value="${e.empId}"${String(e.empId) === String(selected) ? ' selected' : ''}>${e.name} (#${e.empId})</option>`)
    .join('');
}

export async function renderLeavesPage(el) {
  el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Leaves</div>
        <div class="page-subtitle">Leave requests, approvals and yearly balances</div>
      </div>
      <button class="btn btn-primary" id="btn-apply">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Apply Leave
      </button>
    </div>

    <div class="insight-card" style="margin-bottom:20px">
      <div class="insight-card-title">Leave Balance</div>
      <div class="insight-card-desc">Yearly entitlement vs. usage for one employee.</div>
      <div class="filter-bar" style="margin-bottom:12px;gap:8px">
        <select class="filter-select" id="bal-emp" style="flex:1">${empOptions('')}</select>
        <input class="filter-select" id="bal-year" type="number" min="2000" max="2100" value="${new Date().getFullYear()}" style="width:110px">
        <button class="btn btn-primary btn-sm" id="btn-bal">Load Balance</button>
      </div>
      <div class="stats-grid" id="bal-grid" style="margin-bottom:0">
        <div class="stat-card"><div class="stat-label">Sick</div><div class="stat-value" id="bal-SICK">—</div></div>
        <div class="stat-card"><div class="stat-label">Casual</div><div class="stat-value" id="bal-CASUAL">—</div></div>
        <div class="stat-card"><div class="stat-label">Earned</div><div class="stat-value" id="bal-EARNED">—</div></div>
        <div class="stat-card"><div class="stat-label">Unpaid</div><div class="stat-value" id="bal-UNPAID">—</div><div class="stat-hint">unlimited</div></div>
      </div>
    </div>

    <div class="filter-bar">
      <select class="filter-select" id="fl-status">
        <option value="">All statuses</option>
        <option>PENDING</option><option>APPROVED</option><option>REJECTED</option>
      </select>
      <select class="filter-select" id="fl-emp">${empOptions('')}</select>
      <button class="btn btn-outline" id="btn-clear">Clear</button>
    </div>

    <div id="leave-table-container">
      <div class="loading-state"><div class="spinner"></div> Loading…</div>
    </div>
  `;

  _container = el.querySelector('#leave-table-container');

  el.querySelector('#btn-apply').onclick = () => openApplyModal();
  el.querySelector('#btn-bal').onclick = loadBalance;
  el.querySelector('#fl-status').onchange = renderTable;
  el.querySelector('#fl-emp').onchange = renderTable;
  el.querySelector('#btn-clear').onclick = () => {
    el.querySelector('#fl-status').value = '';
    el.querySelector('#fl-emp').value = '';
    renderTable();
  };

  await load();
}

async function load() {
  try {
    [_employees, _all] = await Promise.all([api.getAll(), api.leaveGetAll()]);
    const fl = document.getElementById('fl-emp');
    const bal = document.getElementById('bal-emp');
    if (fl) fl.innerHTML = empOptions('');
    if (bal) bal.innerHTML = empOptions('');
    renderTable();
  } catch (e) {
    _container.innerHTML = `<div class="table-wrap"><div class="table-empty" style="color:var(--danger)">Failed to load leave requests.</div></div>`;
  }
}

async function loadBalance() {
  const empId = document.getElementById('bal-emp').value;
  if (!empId) { showToast('Select an employee first', 'error'); return; }
  const year = Number(document.getElementById('bal-year').value) || new Date().getFullYear();
  try {
    const rows = await api.leaveBalance(Number(empId), year);
    for (const r of rows) {
      const n = document.getElementById('bal-' + r.leaveType);
      if (n) {
        n.textContent = r.unlimited ? `${r.usedDays}` : `${r.remainingDays} / ${r.totalDays}`;
        n.title = `used ${r.usedDays} of ${r.totalDays}`;
      }
    }
  } catch (e) {
    showToast('Failed to load balance: ' + e.message, 'error');
  }
}

function renderTable() {
  const status = document.getElementById('fl-status')?.value ?? '';
  const emp = document.getElementById('fl-emp')?.value ?? '';
  const rows = _all.filter(r => {
    if (status && r.status !== status) return false;
    if (emp && String(r.employee?.empId) !== String(emp)) return false;
    return true;
  });

  if (!rows.length) {
    _container.innerHTML = `<div class="table-wrap"><div class="table-empty">No leave requests found.</div></div>`;
    return;
  }

  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';
  wrap.innerHTML = `
    <div class="table-info">${rows.length} request${rows.length !== 1 ? 's' : ''}</div>
    <table>
      <thead>
        <tr>
          <th>Employee</th>
          <th>Type</th>
          <th>Start</th>
          <th>End</th>
          <th>Days</th>
          <th>Reason</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td style="font-weight:500">${r.employee?.name ?? '#' + r.employee?.empId} <span style="color:var(--text-muted);font-size:12px">#${r.employee?.empId}</span></td>
            <td><span class="badge ${TYPE_BADGE[r.leaveType] || 'badge-gray'}">${r.leaveType}</span></td>
            <td style="color:var(--text-secondary)">${r.startDate}</td>
            <td style="color:var(--text-secondary)">${r.endDate}</td>
            <td>${r.days}</td>
            <td style="color:var(--text-secondary);max-width:220px">${r.reason || '—'}</td>
            <td><span class="badge ${STATUS_BADGE[r.status] || 'badge-gray'}">${r.status}</span></td>
            <td>
              <div class="actions-cell">
                ${r.status === 'PENDING' ? `
                  <button class="btn btn-primary btn-sm btn-approve" data-id="${r.id}">Approve</button>
                  <button class="btn btn-outline btn-sm btn-reject" data-id="${r.id}">Reject</button>
                  <button class="btn btn-danger btn-sm btn-del" data-id="${r.id}">Cancel</button>
                ` : ''}
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  wrap.querySelectorAll('.btn-approve').forEach(b => b.addEventListener('click', () => onDecide(Number(b.dataset.id), 'APPROVED')));
  wrap.querySelectorAll('.btn-reject').forEach(b => b.addEventListener('click', () => onDecide(Number(b.dataset.id), 'REJECTED')));
  wrap.querySelectorAll('.btn-del').forEach(b => b.addEventListener('click', () => onCancel(Number(b.dataset.id))));

  _container.innerHTML = '';
  _container.appendChild(wrap);
}

async function reload() {
  _all = await api.leaveGetAll();
  renderTable();
}

function openApplyModal() {
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
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Leave Type <span>*</span></label>
        <select class="form-control" id="f-type">
          <option value="SICK">Sick</option>
          <option value="CASUAL" selected>Casual</option>
          <option value="EARNED">Earned</option>
          <option value="UNPAID">Unpaid</option>
        </select>
      </div>
      <div class="form-group"></div>
    </div>
    <div class="form-row">
      <div class="form-group" id="fg-start">
        <label class="form-label">Start Date <span>*</span></label>
        <input class="form-control" id="f-start" type="date">
        <div class="form-error">Start date is required</div>
      </div>
      <div class="form-group" id="fg-end">
        <label class="form-label">End Date <span>*</span></label>
        <input class="form-control" id="f-end" type="date">
        <div class="form-error">End date must be on/after start date</div>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Reason</label>
      <textarea class="form-control" id="f-reason" rows="3" maxlength="500" placeholder="Optional reason…"></textarea>
    </div>
  `;

  showModal({
    title: 'Apply Leave',
    body: form,
    confirmText: 'Apply',
    onConfirm: async (backdrop) => {
      const empId = backdrop.querySelector('#f-emp').value;
      const start = backdrop.querySelector('#f-start').value;
      const end = backdrop.querySelector('#f-end').value;
      const fgEmp = backdrop.querySelector('#fg-emp');
      const fgStart = backdrop.querySelector('#fg-start');
      const fgEnd = backdrop.querySelector('#fg-end');
      fgEmp.classList.remove('has-error');
      fgStart.classList.remove('has-error');
      fgEnd.classList.remove('has-error');
      let bad = false;
      if (!empId) { fgEmp.classList.add('has-error'); bad = true; }
      if (!start) { fgStart.classList.add('has-error'); bad = true; }
      if (!end || (start && end < start)) { fgEnd.classList.add('has-error'); bad = true; }
      if (bad) return;
      const data = {
        employee: { empId: Number(empId) },
        leaveType: backdrop.querySelector('#f-type').value,
        startDate: start,
        endDate: end,
        reason: backdrop.querySelector('#f-reason').value.trim() || null,
      };
      try {
        await api.leaveApply(data);
        showToast('Leave request submitted');
        closeModal();
        await reload();
      } catch (e) {
        showToast('Failed to apply: ' + e.message, 'error');
      }
    },
  });
}

async function onDecide(id, status) {
  try {
    await api.leaveDecide(id, status);
    showToast(`Leave ${status.toLowerCase()}`);
    await reload();
  } catch (e) {
    showToast('Failed: ' + e.message, 'error');
  }
}

function onCancel(id) {
  showConfirmModal({
    title: 'Cancel Leave Request',
    message: 'Cancel this pending leave request? This action cannot be undone.',
    onConfirm: async () => {
      try {
        await api.leaveDelete(id);
        showToast('Leave request cancelled', 'info');
        await reload();
      } catch (e) {
        showToast('Failed to cancel: ' + e.message, 'error');
      }
    },
  });
}
