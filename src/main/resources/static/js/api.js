const BASE = '/api/employees';
const DEPT = '/api/departments';

async function _req(url, options = {}) {
  const r = await fetch(url, options);
  if (r.status === 204) return null;
  const text = await r.text();
  if (!r.ok) throw new Error(text || `HTTP ${r.status}`);
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
};
