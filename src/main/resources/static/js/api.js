const BASE = '/api/employees';
const DEPT = '/api/departments';
const ATT = '/api/attendance';
const LEAVE = '/api/leaves';
const SAL = '/api/salaries';

function csrfHeader() {
  const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return m ? { 'X-XSRF-TOKEN': decodeURIComponent(m[1]) } : {};
}

async function _req(url, options = {}) {
  const r = await fetch(url, {
    ...options,
    headers: { ...csrfHeader(), ...(options.headers || {}) },
  });
  if (r.status === 401) {
    // Swap the SPA to the JS login view (except for the login call itself)
    if (!options.noAuthRedirect && typeof window.showLogin === 'function') window.showLogin();
    throw new Error('Unauthorized');
  }
  if (r.status === 204) return null;
  const text = await r.text();
  if (!r.ok) {
    let msg = text || `HTTP ${r.status}`;
    try { msg = JSON.parse(text).details || JSON.parse(text).message || msg; } catch {}
    throw new Error(msg);
  }
  if (!text) return null;
  return JSON.parse(text);
}

const json = body => ({
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const api = {
  getAll:              ()            => _req(BASE),
  getById:             id            => _req(`${BASE}/${id}`),
  create:              data          => _req(BASE, { method: 'POST', ...json(data) }),
  update:              (id, data)    => _req(`${BASE}/${id}`, { method: 'PUT', ...json(data) }),
  patch:               (id, data)    => _req(`${BASE}/${id}`, { method: 'PATCH', ...json(data) }),
  remove:              id            => _req(`${BASE}/${id}`, { method: 'DELETE' }),
  byDesignation:       d             => _req(`${BASE}/designation/${encodeURIComponent(d)}`),
  byCompany:           c             => _req(`${BASE}/company/${encodeURIComponent(c)}`),
  search:              name          => _req(`${BASE}/search?name=${encodeURIComponent(name)}`),
  bornAfter:           date          => _req(`${BASE}/born-after?date=${date}`),
  filter:              (desig, comp) => _req(`${BASE}/filter?designation=${encodeURIComponent(desig)}&company=${encodeURIComponent(comp)}`),
  countByDesignation:  d             => _req(`${BASE}/count/designation/${encodeURIComponent(d)}`),
  existsByName:        name          => _req(`${BASE}/exists?name=${encodeURIComponent(name)}`),
  health:              ()            => fetch(`${BASE}/health`).then(r => r.text()),

  deptGetAll:          ()            => _req(DEPT),
  deptCreate:          data          => _req(DEPT, { method: 'POST', ...json(data) }),
  deptUpdate:          (id, data)    => _req(`${DEPT}/${id}`, { method: 'PUT', ...json(data) }),
  deptDelete:          id            => _req(`${DEPT}/${id}`, { method: 'DELETE' }),
  deptEmpCount:        id            => _req(`${DEPT}/${id}/employee-count`),

  attCheckIn:   (employeeId, date) => _req(`${ATT}/check-in`, { method: 'POST', ...json({ employeeId, date }) }),
  attCheckOut:  id            => _req(`${ATT}/${id}/check-out`, { method: 'POST' }),
  attGetAll:    (params = {})  => {
    const q = new URLSearchParams();
    if (params.employeeId) q.set('employeeId', params.employeeId);
    if (params.from) q.set('from', params.from);
    if (params.to) q.set('to', params.to);
    const qs = q.toString();
    return _req(qs ? `${ATT}?${qs}` : ATT);
  },
  attToday:     ()            => _req(`${ATT}/today`),
  attByEmployee: empId        => _req(`${ATT}/employee/${empId}`),
  attMonthly:   (empId, year, month) => _req(`${ATT}/employee/${empId}/monthly?year=${year}&month=${month}`),
  attPatch:     (id, status)  => _req(`${ATT}/${id}`, { method: 'PATCH', ...json({ status }) }),
  attDelete:    id            => _req(`${ATT}/${id}`, { method: 'DELETE' }),

  leaveApply:      data          => _req(LEAVE, { method: 'POST', ...json(data) }),
  leaveGetAll:     status        => _req(status ? `${LEAVE}?status=${status}` : LEAVE),
  leaveByEmployee: empId         => _req(`${LEAVE}/employee/${empId}`),
  leaveDecide:     (id, status)  => _req(`${LEAVE}/${id}/status`, { method: 'PUT', ...json({ status }) }),
  leaveDelete:     id            => _req(`${LEAVE}/${id}`, { method: 'DELETE' }),
  leaveBalance:    (empId, year) => _req(`${LEAVE}/employee/${empId}/balance${year ? `?year=${year}` : ''}`),

  salCreate:       data          => _req(SAL, { method: 'POST', ...json(data) }),
  salGetAll:       ()            => _req(SAL),
  salByEmployee:   empId         => _req(`${SAL}/employee/${empId}`),
  salCurrent:      empId         => _req(`${SAL}/employee/${empId}/current`),
  salUpdate:       (id, data)    => _req(`${SAL}/${id}`, { method: 'PUT', ...json(data) }),
  salDelete:       id            => _req(`${SAL}/${id}`, { method: 'DELETE' }),

  me:              ()            => _req('/api/me', { noAuthRedirect: true }),
  login:           (username, password) => _req('/api/auth/login', { method: 'POST', noAuthRedirect: true, ...json({ username, password }) }),
  logout:          ()            => _req('/api/auth/logout', { method: 'POST', noAuthRedirect: true }),
};
