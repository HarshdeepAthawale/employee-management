const BADGE_COLORS = {
  Developer: 'badge-teal',
  Manager: 'badge-blue',
  Analyst: 'badge-purple',
  Designer: 'badge-pink',
  QA: 'badge-amber',
};

function badgeClass(desig) {
  return BADGE_COLORS[desig] || 'badge-gray';
}

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatDate(dob) {
  if (!dob) return '—';
  if (Array.isArray(dob)) return dob.join('-');
  return dob;
}

let _sortKey = null;
let _sortAsc = true;

export function renderTable(container, employees, { onEdit, onDelete }) {
  if (!employees || employees.length === 0) {
    container.innerHTML = `<div class="table-wrap"><div class="table-empty">No employees found. Add one to get started.</div></div>`;
    return;
  }

  let sorted = [...employees];
  if (_sortKey) {
    sorted.sort((a, b) => {
      const av = (a[_sortKey] ?? '').toString().toLowerCase();
      const bv = (b[_sortKey] ?? '').toString().toLowerCase();
      return _sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }

  function sortBy(key) {
    if (_sortKey === key) _sortAsc = !_sortAsc;
    else { _sortKey = key; _sortAsc = true; }
    renderTable(container, employees, { onEdit, onDelete });
  }

  function thClass(key) {
    if (_sortKey !== key) return '';
    return _sortAsc ? 'sort-asc' : 'sort-desc';
  }

  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';
  wrap.innerHTML = `
    <div class="table-info">${sorted.length} employee${sorted.length !== 1 ? 's' : ''}</div>
    <table>
      <thead>
        <tr>
          <th class="${thClass('name')}"     data-sort="name">Name</th>
          <th class="${thClass('designation')}" data-sort="designation">Designation</th>
          <th class="${thClass('company')}"  data-sort="company">Company</th>
          <th data-sort="department">Department</th>
          <th class="${thClass('dob')}"      data-sort="dob">Date of Birth</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${sorted.map(emp => `
          <tr data-id="${emp.empId}">
            <td>
              <div class="cell-name">
                <div class="avatar">${initials(emp.name)}</div>
                <div>
                  <div style="font-weight:500">${emp.name}</div>
                  <div style="font-size:12px;color:var(--text-muted)">ID #${emp.empId}</div>
                </div>
              </div>
            </td>
            <td>${emp.designation ? `<span class="badge ${badgeClass(emp.designation)}">${emp.designation}</span>` : '<span style="color:var(--text-muted)">—</span>'}</td>
            <td>${emp.company || '<span style="color:var(--text-muted)">—</span>'}</td>
            <td>${emp.department ? `<span class="badge badge-blue">${emp.department.name}</span>` : '<span style="color:var(--text-muted)">—</span>'}</td>
            <td style="color:var(--text-secondary)">${formatDate(emp.dob)}</td>
            <td>
              <div class="actions-cell">
                <button class="btn btn-outline btn-sm btn-edit" data-id="${emp.empId}" title="Edit">
                  <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit
                </button>
                <button class="btn btn-danger btn-sm btn-del" data-id="${emp.empId}" title="Delete">
                  <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                  Delete
                </button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  wrap.querySelectorAll('thead th[data-sort]').forEach(th => {
    th.addEventListener('click', () => sortBy(th.dataset.sort));
  });
  wrap.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => onEdit(Number(btn.dataset.id)));
  });
  wrap.querySelectorAll('.btn-del').forEach(btn => {
    btn.addEventListener('click', () => onDelete(Number(btn.dataset.id)));
  });

  container.innerHTML = '';
  container.appendChild(wrap);
}
