// ── App Entry Point ──────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const user = api.getUser();
  if (api.isLoggedIn() && user) {
    router.navigate(user.role === 'admin' ? 'admin-dashboard' : 'student-dashboard');
  } else {
    router.navigate('login');
  }
});
