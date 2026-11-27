import { api } from '../api.js';

/**
 * SPA sign-in view — rendered into #main when there is no session (401).
 * Calls POST /api/auth/login (JSON); on success hands the user to onSuccess.
 */
export function renderLogin(el, { onSuccess } = {}) {
  el.innerHTML = `
    <div class="login-wrap">
      <div class="login-card">
        <div class="login-brand">
          <div class="login-logo">EM</div>
          <div>
            <div class="login-title">EmployeeHub</div>
            <div class="login-subtitle">Sign in to continue</div>
          </div>
        </div>
        <div class="login-alert error" id="login-error"></div>
        <form id="login-form">
          <div class="form-group">
            <label class="form-label">Username</label>
            <input class="form-control" name="username" id="login-username" autocomplete="username" required autofocus>
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input class="form-control" name="password" id="login-password" type="password" autocomplete="current-password" required>
          </div>
          <button class="btn btn-primary btn-block" id="login-submit" type="submit">Sign in</button>
        </form>
        <div class="login-hint">
          Demo accounts — <code>admin/admin123</code> (ADMIN), <code>hr/hr123</code> (HR), <code>emp/emp123</code> (EMPLOYEE)
        </div>
      </div>
    </div>
  `;

  const form = el.querySelector('#login-form');
  const err = el.querySelector('#login-error');
  const btn = el.querySelector('#login-submit');

  form.onsubmit = async (e) => {
    e.preventDefault();
    err.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Signing in…';
    try {
      const user = await api.login(form.username.value.trim(), form.password.value);
      onSuccess?.(user);
    } catch (ex) {
      err.textContent = ex.message || 'Sign-in failed';
      err.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Sign in';
      form.password.value = '';
      form.password.focus();
    }
  };
}
