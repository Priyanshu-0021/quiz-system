// ── Simple SPA Router ────────────────────────
const router = {
  currentPage: null,

  navigate: (page, params = {}) => {
    router.currentPage = page;
    router.params = params;
    router.render();
  },

  render: () => {
    const app = document.getElementById('app');
    const page = router.currentPage;
    const user = api.getUser();

    // Guard routes
    if (!api.isLoggedIn() && !['login', 'register'].includes(page)) {
      return router.navigate('login');
    }
    if (api.isLoggedIn() && ['login', 'register'].includes(page)) {
      return router.navigate(user?.role === 'admin' ? 'admin-dashboard' : 'student-dashboard');
    }

    // Route map
    const routes = {
      'login': Pages.auth,
      'register': Pages.auth,
      'student-dashboard': Pages.studentDashboard,
      'take-quiz': Pages.takeQuiz,
      'result': Pages.result,
      'my-results': Pages.myResults,
      'admin-dashboard': Pages.adminDashboard,
      'admin-quizzes': Pages.adminQuizzes,
      'admin-users': Pages.adminUsers,
      'admin-create-quiz': Pages.adminCreateQuiz,
    };

    const renderFn = routes[page];
    if (renderFn) renderFn(app);
    else router.navigate(api.isLoggedIn() ? (user?.role === 'admin' ? 'admin-dashboard' : 'student-dashboard') : 'login');
  }
};

window.router = router;
