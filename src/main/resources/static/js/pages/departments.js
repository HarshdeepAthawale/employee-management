import { api, canManage } from '../api.js';
import { showModal, closeModal, showConfirmModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

let _all = [];
let _container;

export async function renderDepartmentsPage(el) {
  el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Departments</div>
        <div class="page-subtitle">Manage organizational departments</div>
      </div>
      ${canManage() ? `
      <button class="btn btn-primary" id="btn-new-dept">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        New Department
      </button>` : ''}
    </div>

    <div class="stats-grid" id="dept-stats">
      <div class="stat-card"><div class="stat-label">Total Departments</div><div class="stat-value" id="stat-dept-total">—</div></div>
    </div>

    <div id="dept-table-container">
      <div class="loading-state"><div class="spinner"></div> Loading…</div>
    </div>
  `;

  _container = el.querySelector('#dept-table-container');
  el.querySelector('#btn-new-dept')?.addEventListener('click', () => openDeptModal(null));
  await loadDepartments();
}

async function loadDepartments() {
  try {
    _all = await api.deptGetAll();
    const statEl = document.getElementById('stat-dept-total');
    if (statEl) statEl.textContent = _all.length;
    renderDeptTable();
  } catch {
    _container.innerHTML = `<div class="table-wrap"><div class="table-empty" style="color:var(--danger)">Failed to load departments.</div></div>`;
  }
}

async function renderDeptTable() {
  if (!_all.length) {
    _container.innerHTML = `<div class="table-wrap"><div class="table-empty">No departments yet. Create one to get started.</div></div>`;
    return;
  }

  const counts = await Promise.all(_all.map(d => api.deptEmpCount(d.id).catch(() => 0)));

  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';
  wrap.innerHTML = `
    <div class="table-info">${_all.length} department${_all.length !== 1 ? 's' : ''}</div>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Description</th>
          <th>Employees</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${_all.map((d, i) => `
          <tr>
            <td style="color:var(--text-muted)">#${d.id}</td>
            <td style="font-weight:500">${d.name}</td>
            <td style="color:var(--text-secondary)">${d.description || '—'}</td>
            <td><span class="badge badge-teal">${counts[i]}</span></td>
            <td>
              <div class="actions-cell">
                ${canManage() ? `
                <button class="btn btn-outline btn-sm btn-edit-dept" data-id="${d.id}" title="Edit">
                  <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit
                </button>
                <button class="btn btn-danger btn-sm btn-del-dept" data-id="${d.id}" data-name="${d.name}" title="Delete">
                  <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                  Delete
                </button>` : ''}
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  wrap.querySelectorAll('.btn-edit-dept').forEach(btn =>
    btn.addEventListener('click', () => onEdit(Number(btn.dataset.id))));
  wrap.querySelectorAll('.btn-del-dept').forEach(btn =>
    btn.addEventListener('click', () => onDelete(Number(btn.dataset.id), btn.dataset.name)));

  _container.innerHTML = '';
  _container.appendChild(wrap);
}

function openDeptModal(dept) {
  const isEdit = !!dept;
  const form = document.createElement('form');
  form.innerHTML = `
    <div class="form-group" id="fg-dname">
      <label class="form-label">Name <span>*</span></label>
      <input class="form-control" id="f-dname" placeholder="e.g. Engineering" value="${dept?.name || ''}" maxlength="50">
      <div class="form-error" id="fe-dname">Name must be 2–50 characters</div>
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <input class="form-control" id="f-ddesc" placeholder="Optional description" value="${dept?.description || ''}" maxlength="200">
    </div>
  `;

  showModal({
    title: isEdit ? 'Edit Department' : 'New Department',
    body: form,
    confirmText: isEdit ? 'Update' : 'Create',
    onConfirm: async (backdrop) => {
      const name = backdrop.querySelector('#f-dname').value.trim();
      const fg = backdrop.querySelector('#fg-dname');
      fg.classList.remove('has-error');
      if (name.length < 2 || name.length > 50) {
        fg.classList.add('has-error');
        return;
      }
      const data = {
        name,
        description: backdrop.querySelector('#f-ddesc').value.trim() || null,
      };
      try {
        if (isEdit) {
          await api.deptUpdate(dept.id, data);
          showToast('Department updated');
        } else {
          await api.deptCreate(data);
          showToast('Department created');
        }
        closeModal();
        await loadDepartments();
      } catch (e) {
        showToast('Failed: ' + e.message, 'error');
      }
    },
  });

  form.querySelector('#f-dname').focus();
}

function onEdit(id) {
  const dept = _all.find(d => d.id === id);
  if (dept) openDeptModal(dept);
}

function onDelete(id, name) {
  showConfirmModal({
    title: 'Delete Department',
    message: `Are you sure you want to delete <strong>${name}</strong>? This action cannot be undone. Departments with assigned employees cannot be deleted.`,
    onConfirm: async () => {
      try {
        await api.deptDelete(id);
        showToast('Department deleted', 'info');
        await loadDepartments();
      } catch (e) {
        showToast('Cannot delete — employees still assigned', 'error');
      }
    },
  });
}
