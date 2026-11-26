import { api } from '../api.js';
import { showModal, closeModal, showConfirmModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

let _all = [];
let _employees = [];
let _container;

function money(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function empOptions(selected) {
  return `<option value="">Select employee…</option>` + _employees
    .map(e => `<option value="${e.empId}"${String(e.empId) === String(selected) ? ' selected' : ''}>${e.name} (#${e.empId})</option>`)
    .join('');
}

export async function renderSalariesPage(el) {
  el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Salaries</div>
        <div class="page-subtitle">Salary structures and payslip-style net pay</div>
      </div>
      <button class="btn btn-primary" id="btn-new-sal">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add Salary
      </button>
    </div>

    <div class="insight-card" style="margin-bottom:20px">
      <div class="insight-card-title">Current Salary</div>
      <div class="insight-card-desc">Latest salary record effective today for one employee.</div>
      <div class="filter-bar" style="margin-bottom:12px;gap:8px">
        <select class="filter-select" id="cur-emp" style="flex:1">${empOptions('')}</select>
        <button class="btn btn-primary btn-sm" id="btn-cur">Load</button>
      </div>
      <div class="insight-result" id="cur-result">Select an employee and click Load.</div>
    </div>

    <div id="sal-table-container">
      <div class="loading-state"><div class="spinner"></div> Loading…</div>
    </div>
  `;

  _container = el.querySelector('#sal-table-container');

  el.querySelector('#btn-new-sal').onclick = () => openSalaryModal(null);
  el.querySelector('#btn-cur').onclick = loadCurrent;

  await load();
}

async function load() {
  try {
    [_employees, _all] = await Promise.all([api.getAll(), api.salGetAll()]);
    const cur = document.getElementById('cur-emp');
    if (cur) cur.innerHTML = empOptions('');
    renderTable();
  } catch (e) {
    _container.innerHTML = `<div class="table-wrap"><div class="table-empty" style="color:var(--danger)">Failed to load salary records.</div></div>`;
  }
}

async function loadCurrent() {
  const empId = document.getElementById('cur-emp').value;
  const r = document.getElementById('cur-result');
  if (!empId) { r.className = 'insight-result'; r.textContent = 'Please select an employee.'; return; }
  r.innerHTML = '<div class="spinner"></div>';
  try {
    const s = await api.salCurrent(Number(empId));
    r.className = 'insight-result success';
    r.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:14px;width:100%">
      <span><span class="result-value">${money(s.netSalary)}</span> net</span>
      <span>base ${money(s.baseSalary)}</span>
      <span>+ allowances ${money(s.allowances)}</span>
      <span>− deductions ${money(s.deductions)}</span>
      <span style="margin-left:auto;color:var(--text-secondary)">effective ${s.effectiveDate}</span>
    </div>`;
  } catch (e) {
    r.className = 'insight-result error';
    r.textContent = 'No current salary found for this employee.';
  }
}

function renderTable() {
  if (!_all.length) {
    _container.innerHTML = `<div class="table-wrap"><div class="table-empty">No salary records yet. Add one to get started.</div></div>`;
    return;
  }

  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';
  wrap.innerHTML = `
    <div class="table-info">${_all.length} record${_all.length !== 1 ? 's' : ''}</div>
    <table>
      <thead>
        <tr>
          <th>Employee</th>
          <th>Base</th>
          <th>Allowances</th>
          <th>Deductions</th>
          <th>Net</th>
          <th>Effective</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${_all.map(s => `
          <tr>
            <td style="font-weight:500">${s.employee?.name ?? '#' + s.employee?.empId} <span style="color:var(--text-muted);font-size:12px">#${s.employee?.empId}</span></td>
            <td>${money(s.baseSalary)}</td>
            <td style="color:var(--text-secondary)">${money(s.allowances)}</td>
            <td style="color:var(--text-secondary)">${money(s.deductions)}</td>
            <td style="font-weight:600"><span class="badge badge-green">${money(s.netSalary)}</span></td>
            <td style="color:var(--text-secondary)">${s.effectiveDate}</td>
            <td>
              <div class="actions-cell">
                <button class="btn btn-outline btn-sm btn-edit" data-id="${s.id}">Edit</button>
                <button class="btn btn-danger btn-sm btn-del" data-id="${s.id}">Delete</button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  wrap.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', () => onEdit(Number(b.dataset.id))));
  wrap.querySelectorAll('.btn-del').forEach(b => b.addEventListener('click', () => onDelete(Number(b.dataset.id))));

  _container.innerHTML = '';
  _container.appendChild(wrap);
}

async function reload() {
  _all = await api.salGetAll();
  renderTable();
}

function openSalaryModal(sal) {
  const isEdit = !!sal;
  const val = k => sal?.[k] ?? '';
  const empSel = isEdit
    ? `<input class="form-control" value="${sal.employee?.name ?? ''} (#${sal.employee?.empId})" disabled>`
    : `<select class="form-control" id="f-emp">
         <option value="">— Select employee —</option>
         ${_employees.map(e => `<option value="${e.empId}">${e.name} (#${e.empId})</option>`).join('')}
       </select>`;

  const form = document.createElement('form');
  form.innerHTML = `
    <div class="form-group" id="fg-emp">
      <label class="form-label">Employee <span>*</span></label>
      ${empSel}
      <div class="form-error">Please select an employee</div>
    </div>
    <div class="form-row">
      <div class="form-group" id="fg-base">
        <label class="form-label">Base Salary <span>*</span></label>
        <input class="form-control" id="f-base" type="number" min="0" step="0.01" placeholder="e.g. 75000" value="${val('baseSalary')}">
        <div class="form-error">Base salary is required and cannot be negative</div>
      </div>
      <div class="form-group">
        <label class="form-label">Effective Date</label>
        <input class="form-control" id="f-eff" type="date" value="${val('effectiveDate') || new Date().toISOString().slice(0, 10)}">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Allowances</label>
        <input class="form-control" id="f-allow" type="number" min="0" step="0.01" placeholder="0" value="${val('allowances') ?? 0}">
      </div>
      <div class="form-group">
        <label class="form-label">Deductions</label>
        <input class="form-control" id="f-ded" type="number" min="0" step="0.01" placeholder="0" value="${val('deductions') ?? 0}">
      </div>
    </div>
  `;

  showModal({
    title: isEdit ? 'Edit Salary' : 'Add Salary',
    body: form,
    confirmText: isEdit ? 'Update' : 'Create',
    onConfirm: async (backdrop) => {
      const fgEmp = backdrop.querySelector('#fg-emp');
      const fgBase = backdrop.querySelector('#fg-base');
      fgEmp.classList.remove('has-error');
      fgBase.classList.remove('has-error');
      const base = backdrop.querySelector('#f-base').value;
      const empId = isEdit ? sal.employee.empId : backdrop.querySelector('#f-emp')?.value;
      if (!isEdit && !empId) { fgEmp.classList.add('has-error'); return; }
      if (base === '' || Number(base) < 0) { fgBase.classList.add('has-error'); return; }
      const data = {
        employee: { empId: Number(empId) },
        baseSalary: Number(base),
        allowances: Number(backdrop.querySelector('#f-allow').value) || 0,
        deductions: Number(backdrop.querySelector('#f-ded').value) || 0,
        effectiveDate: backdrop.querySelector('#f-eff').value || null,
      };
      try {
        if (isEdit) {
          await api.salUpdate(sal.id, data);
          showToast('Salary updated');
        } else {
          await api.salCreate(data);
          showToast('Salary record created');
        }
        closeModal();
        await reload();
      } catch (e) {
        showToast('Failed: ' + e.message, 'error');
      }
    },
  });
}

function onEdit(id) {
  const sal = _all.find(s => s.id === id);
  if (sal) openSalaryModal(sal);
}

function onDelete(id) {
  showConfirmModal({
    title: 'Delete Salary Record',
    message: 'Delete this salary record? This action cannot be undone.',
    onConfirm: async () => {
      try {
        await api.salDelete(id);
        showToast('Salary record deleted', 'info');
        await reload();
      } catch (e) {
        showToast('Failed to delete: ' + e.message, 'error');
      }
    },
  });
}
