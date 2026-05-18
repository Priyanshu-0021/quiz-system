// ── Auth Pages ───────────────────────────────
const Pages = {};

Pages.auth = (app) => {
  const isLogin = router.currentPage === 'login';

  app.innerHTML = `
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">
        <div class="logo-icon"><i class="fas fa-graduation-cap"></i></div>
        <h1>QuizMaster</h1>
        <p>Online Quiz Management System</p>
      </div>
      <div class="auth-tabs">
        <button class="auth-tab ${isLogin ? 'active' : ''}" onclick="router.navigate('login')">Login</button>
        <button class="auth-tab ${!isLogin ? 'active' : ''}" onclick="router.navigate('register')">Register</button>
      </div>
      <div id="auth-alert"></div>

      ${isLogin ? `
      <form id="login-form">
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <div class="input-group">
            <i class="fas fa-envelope input-icon"></i>
            <input type="email" class="form-control" id="login-email" placeholder="Enter your email" required/>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <div class="input-group">
            <i class="fas fa-lock input-icon"></i>
            <input type="password" class="form-control" id="login-password" placeholder="Enter your password" required/>
          </div>
        </div>
        <button type="submit" class="btn btn-primary btn-full btn-lg" id="login-btn">
          <i class="fas fa-sign-in-alt"></i> Login
        </button>
        <p style="text-align:center;margin-top:16px;font-size:0.8rem;color:var(--text-muted)">
          Demo Admin: admin@quiz.com / admin123
        </p>
      </form>
      ` : `
      <form id="register-form">
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <div class="input-group">
            <i class="fas fa-user input-icon"></i>
            <input type="text" class="form-control" id="reg-name" placeholder="Enter your full name" required/>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <div class="input-group">
            <i class="fas fa-envelope input-icon"></i>
            <input type="email" class="form-control" id="reg-email" placeholder="Enter your email" required/>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <div class="input-group">
            <i class="fas fa-lock input-icon"></i>
            <input type="password" class="form-control" id="reg-password" placeholder="Min. 6 characters" required/>
          </div>
        </div>
        <button type="submit" class="btn btn-primary btn-full btn-lg" id="reg-btn">
          <i class="fas fa-user-plus"></i> Create Account
        </button>
      </form>
      `}
    </div>
  </div>`;

  if (isLogin) {
    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('login-btn');
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px"></div> Logging in...';

      const data = await api.post('/auth/login', {
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value
      });

      if (data.success) {
        api.setAuth(data.token, data.user);
        router.navigate(data.user.role === 'admin' ? 'admin-dashboard' : 'student-dashboard');
      } else {
        document.getElementById('auth-alert').innerHTML = `<div class="alert alert-error"><i class="fas fa-exclamation-circle"></i> ${data.message}</div>`;
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
      }
    });
  } else {
    document.getElementById('register-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('reg-btn');
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px"></div> Creating...';

      const data = await api.post('/auth/register', {
        name: document.getElementById('reg-name').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value
      });

      if (data.success) {
        document.getElementById('auth-alert').innerHTML = `<div class="alert alert-success"><i class="fas fa-check-circle"></i> ${data.message}</div>`;
        setTimeout(() => router.navigate('login'), 1500);
      } else {
        document.getElementById('auth-alert').innerHTML = `<div class="alert alert-error"><i class="fas fa-exclamation-circle"></i> ${data.message}</div>`;
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
      }
    });
  }
};
