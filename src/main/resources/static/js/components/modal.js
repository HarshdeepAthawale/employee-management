import { api } from '../api.js';

let _currentModal = null;

export function showModal({ title, body, onConfirm, confirmText = 'Save', confirmClass = 'btn-primary' }) {
  closeModal();
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-label="${title}">
      <div class="modal-header">
        <span class="modal-title">${title}</span>
        <button class="modal-close" aria-label="Close">✕</button>
      </div>
      <div class="modal-body"></div>
      <div class="modal-footer">
        <button class="btn btn-outline" id="modal-cancel">Cancel</button>
        <button class="btn ${confirmClass}" id="modal-confirm">${confirmText}</button>
      </div>
    </div>
  `;

  if (typeof body === 'string') {
    backdrop.querySelector('.modal-body').innerHTML = body;
  } else {
    backdrop.querySelector('.modal-body').appendChild(body);
  }

  backdrop.querySelector('.modal-close').onclick = closeModal;
  backdrop.querySelector('#modal-cancel').onclick = closeModal;
  backdrop.querySelector('#modal-confirm').onclick = () => onConfirm?.(backdrop);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
  document.getElementById('modal-container').appendChild(backdrop);
  _currentModal = backdrop;
}

export function closeModal() {
  _currentModal?.remove();
  _currentModal = null;
}

export async function showEmployeeModal(employee, onSave) {
  const isEdit = !!employee;
  const val = k => employee?.[k] ?? '';
  const dobVal = val('dob') ? (Array.isArray(val('dob')) ? val('dob').join('-') : val('dob')) : '';
  const deptId = employee?.department?.id ?? '';

  let departments = [];
  try { departments = await api.deptGetAll(); } catch {}

  const deptOptions = departments.map(d =>
    `<option value="${d.id}"${d.id === deptId ? ' selected' : ''}>${d.name}</option>`
  ).join('');

  const form = document.createElement('form');
  form.id = 'emp-form';
  form.innerHTML = `
    <div class="form-row">
      <div class="form-group" id="fg-name">
        <label class="form-label">Name <span>*</span></label>
        <input class="form-control" id="f-name" placeholder="e.g. John Doe" value="${val('name')}" maxlength="20">
        <div class="form-error" id="fe-name">Name must be 2–20 characters</div>
      </div>
      <div class="form-group">
        <label class="form-label">Designation</label>
        <input class="form-control" id="f-designation" placeholder="e.g. Developer" value="${val('designation')}" maxlength="50">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Date of Birth</label>
        <input class="form-control" id="f-dob" type="date" value="${dobVal}">
      </div>
      <div class="form-group">
        <label class="form-label">Company</label>
        <input class="form-control" id="f-company" placeholder="e.g. TechCorp" value="${val('company')}" maxlength="100">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Department</label>
        <select class="form-control" id="f-department">
          <option value="">— None —</option>
          ${deptOptions}
        </select>
      </div>
    </div>
  `;

  showModal({
    title: isEdit ? 'Edit Employee' : 'New Employee',
    body: form,
    confirmText: isEdit ? 'Update' : 'Create',
    onConfirm: (backdrop) => {
      const name = backdrop.querySelector('#f-name').value.trim();
      const fg = backdrop.querySelector('#fg-name');
      fg.classList.remove('has-error');
      if (name.length < 2 || name.length > 20) {
        fg.classList.add('has-error');
        return;
      }
      const selDept = backdrop.querySelector('#f-department').value;
      const data = {
        name,
        designation: backdrop.querySelector('#f-designation').value.trim() || null,
        dob: backdrop.querySelector('#f-dob').value || null,
        company: backdrop.querySelector('#f-company').value.trim() || null,
        department: selDept ? { id: Number(selDept) } : null,
      };
      onSave(data);
      closeModal();
    },
  });

  form.querySelector('#f-name').focus();
}

export function showConfirmModal({ title, message, onConfirm }) {
  showModal({
    title,
    body: `<p style="color:var(--text-secondary);line-height:1.6;">${message}</p>`,
    confirmText: 'Delete',
    confirmClass: 'btn-danger',
    onConfirm: () => { onConfirm?.(); closeModal(); },
  });
}
