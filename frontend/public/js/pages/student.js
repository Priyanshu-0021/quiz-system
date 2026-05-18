// ── Student Pages ─────────────────────────────

function navbar(activeLink = '') {
  const user = api.getUser();
  const isAdmin = user?.role === 'admin';
  const links = isAdmin ? [
    { label: 'Dashboard', page: 'admin-dashboard', icon: 'chart-pie' },
    { label: 'Quizzes', page: 'admin-quizzes', icon: 'list-check' },
    { label: 'Users', page: 'admin-users', icon: 'users' },
  ] : [
    { label: 'Dashboard', page: 'student-dashboard', icon: 'home' },
    { label: 'My Results', page: 'my-results', icon: 'chart-bar' },
  ];

  return `
  <nav class="navbar">
    <a class="navbar-brand" href="#"><i class="fas fa-graduation-cap"></i> QuizMaster</a>
    <div class="navbar-nav">
      ${links.map(l => `<button class="nav-link ${activeLink === l.page ? 'active' : ''}" onclick="router.navigate('${l.page}')">
        <i class="fas fa-${l.icon}"></i> ${l.label}
      </button>`).join('')}
      <div class="nav-user">
        <div class="avatar">${user?.name?.[0]?.toUpperCase() || 'U'}</div>
        <span>${user?.name || 'User'}</span>
      </div>
      <button class="btn btn-sm btn-secondary" onclick="logout()">
        <i class="fas fa-sign-out-alt"></i> Logout
      </button>
    </div>
  </nav>`;
}

function logout() {
  api.clearAuth();
  router.navigate('login');
}

// ── Student Dashboard ──
Pages.studentDashboard = async (app) => {
  app.innerHTML = navbar('student-dashboard') + `<div class="container"><div class="loader"><div class="spinner"></div></div></div>`;

  const data = await api.get('/quizzes');
  if (!data.success) return;

  const quizzes = data.quizzes;
  const attempted = quizzes.filter(q => q.attempt_count > 0).length;

  app.innerHTML = navbar('student-dashboard') + `
  <div class="container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Welcome back, ${api.getUser()?.name?.split(' ')[0]} 👋</h1>
        <p class="page-subtitle">Ready to test your knowledge today?</p>
      </div>
    </div>

    <div class="grid grid-3" style="margin-bottom:32px">
      <div class="stat-card">
        <div class="stat-icon purple"><i class="fas fa-book-open"></i></div>
        <div><div class="stat-value">${quizzes.length}</div><div class="stat-label">Available Quizzes</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green"><i class="fas fa-check-circle"></i></div>
        <div><div class="stat-value">${attempted}</div><div class="stat-label">Attempted</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue"><i class="fas fa-clock"></i></div>
        <div><div class="stat-value">${quizzes.length - attempted}</div><div class="stat-label">Remaining</div></div>
      </div>
    </div>

    <h2 style="font-size:1.2rem;font-weight:700;margin-bottom:16px">Available Quizzes</h2>
    ${quizzes.length === 0 ? `<div class="empty-state"><i class="fas fa-inbox"></i><p>No quizzes available right now.</p></div>` : `
    <div class="grid grid-3">
      ${quizzes.map(q => `
      <div class="quiz-card ${q.attempt_count > 0 ? 'attempted' : ''}" onclick="router.navigate('take-quiz', {quizId: ${q.id}})">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div class="quiz-card-title">${q.title}</div>
          ${q.attempt_count > 0 ? `<span class="quiz-badge badge-green"><i class="fas fa-check"></i> Done</span>` : ''}
        </div>
        <div class="quiz-card-desc">${q.description || 'No description provided.'}</div>
        <div class="quiz-meta">
          <span class="quiz-badge badge-purple"><i class="fas fa-question-circle"></i> ${q.question_count} Questions</span>
          <span class="quiz-badge badge-orange"><i class="fas fa-clock"></i> ${q.time_limit} min</span>
          <span class="quiz-badge badge-blue"><i class="fas fa-star"></i> ${q.total_marks} marks</span>
        </div>
        <button class="btn btn-primary btn-full btn-sm">
          ${q.attempt_count > 0 ? '<i class="fas fa-redo"></i> Retake Quiz' : '<i class="fas fa-play"></i> Start Quiz'}
        </button>
      </div>`).join('')}
    </div>`}
  </div>`;
};

// ── Take Quiz Page ──
Pages.takeQuiz = async (app) => {
  const quizId = router.params?.quizId;
  if (!quizId) return router.navigate('student-dashboard');

  app.innerHTML = navbar() + `<div class="container"><div class="loader"><div class="spinner"></div></div></div>`;

  const data = await api.get(`/quizzes/${quizId}`);
  if (!data.success) return router.navigate('student-dashboard');

  const quiz = data.quiz;
  const questions = quiz.questions;
  let currentQ = 0;
  const userAnswers = {};
  let timeLeft = (quiz.time_limit || 30) * 60;
  let timerInterval;

  const renderQuiz = () => {
    const q = questions[currentQ];
    const progress = (Object.keys(userAnswers).length / questions.length) * 100;

    app.innerHTML = navbar() + `
    <div class="container quiz-take-page">
      <div class="quiz-header-bar">
        <div>
          <div style="font-size:1.1rem;font-weight:700">${quiz.title}</div>
          <div style="font-size:0.85rem;color:var(--text-secondary)">${questions.length} Questions • ${quiz.total_marks} Marks</div>
        </div>
        <div id="timer" class="timer"><i class="fas fa-clock"></i> <span id="timer-display">--:--</span></div>
        <button class="btn btn-success" onclick="submitQuiz()">
          <i class="fas fa-paper-plane"></i> Submit Quiz
        </button>
      </div>

      <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>

      <div class="question-nav">
        ${questions.map((_, i) => `
        <button class="q-nav-btn ${i === currentQ ? 'current' : ''} ${userAnswers[questions[i].id] ? 'answered' : ''}"
          onclick="gotoQ(${i})">${i + 1}</button>`).join('')}
      </div>

      <div class="question-card">
        <div class="question-num">Question ${currentQ + 1} of ${questions.length} • ${q.marks} mark${q.marks > 1 ? 's' : ''}</div>
        <div class="question-text">${q.question_text}</div>
        <div class="options">
          ${['A','B','C','D'].map(opt => {
            const val = q[`option_${opt.toLowerCase()}`];
            const selected = userAnswers[q.id] === opt;
            return `<label class="option-label ${selected ? 'selected' : ''}" onclick="selectAnswer(${q.id}, '${opt}', this)">
              <input type="radio" name="q${q.id}" value="${opt}" ${selected ? 'checked' : ''}>
              <span class="option-letter">${opt}</span>
              <span>${val}</span>
            </label>`;
          }).join('')}
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;gap:12px">
        <button class="btn btn-secondary" onclick="gotoQ(${currentQ - 1})" ${currentQ === 0 ? 'disabled' : ''}>
          <i class="fas fa-arrow-left"></i> Previous
        </button>
        <button class="btn btn-primary" onclick="gotoQ(${currentQ + 1})" ${currentQ === questions.length - 1 ? 'disabled' : ''}>
          Next <i class="fas fa-arrow-right"></i>
        </button>
      </div>
    </div>`;

    startTimer();
  };

  window.gotoQ = (i) => {
    if (i < 0 || i >= questions.length) return;
    currentQ = i;
    clearInterval(timerInterval);
    renderQuiz();
  };

  window.selectAnswer = (qId, opt, label) => {
    userAnswers[qId] = opt;
    document.querySelectorAll(`[onclick^="selectAnswer(${qId}"]`).forEach(el => el.classList.remove('selected'));
    label.classList.add('selected');
    // update nav btn
    document.querySelectorAll('.q-nav-btn').forEach((btn, i) => {
      if (i === currentQ) btn.classList.add('answered');
    });
    const fill = document.querySelector('.progress-fill');
    if (fill) fill.style.width = (Object.keys(userAnswers).length / questions.length * 100) + '%';
  };

  window.submitQuiz = async () => {
    const answered = Object.keys(userAnswers).length;
    const unanswered = questions.length - answered;
    if (unanswered > 0) {
      if (!confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return;
    }
    clearInterval(timerInterval);
    const answers = questions.map(q => ({ question_id: q.id, selected_option: userAnswers[q.id] || 'A' }));
    const result = await api.post('/attempts/submit', { quiz_id: quizId, answers });
    if (result.success) router.navigate('result', { result: result.result });
    else alert('Submission failed. Please try again.');
  };

  const startTimer = () => {
    clearInterval(timerInterval);
    const display = document.getElementById('timer-display');
    const timerEl = document.getElementById('timer');
    if (!display) return;

    const updateDisplay = () => {
      const m = Math.floor(timeLeft / 60);
      const s = timeLeft % 60;
      display.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      if (timeLeft <= 60) timerEl?.classList.add('danger');
      if (timeLeft <= 0) { clearInterval(timerInterval); window.submitQuiz(); }
      timeLeft--;
    };
    updateDisplay();
    timerInterval = setInterval(updateDisplay, 1000);
  };

  renderQuiz();
};

// ── Result Page ──
Pages.result = (app) => {
  const result = router.params?.result;
  if (!result) return router.navigate('student-dashboard');

  const pct = parseFloat(result.percentage);
  const passClass = result.passed ? 'pass' : 'fail';
  const passColor = result.passed ? 'var(--success)' : 'var(--danger)';

  app.innerHTML = navbar() + `
  <div class="container" style="padding-bottom:40px">
    <div class="page-header">
      <h1 class="page-title">Quiz Result</h1>
      <div style="display:flex;gap:12px">
        <button class="btn btn-secondary" onclick="router.navigate('my-results')"><i class="fas fa-history"></i> All Results</button>
        <button class="btn btn-primary" onclick="router.navigate('student-dashboard')"><i class="fas fa-home"></i> Dashboard</button>
      </div>
    </div>

    <div class="result-hero">
      <div class="result-score-ring ${passClass}">
        <div class="result-percentage" style="color:${passColor}">${pct}%</div>
        <div class="result-status" style="color:${passColor}">${result.passed ? '✓ Passed' : '✗ Failed'}</div>
      </div>
      <h2 style="font-size:1.5rem;font-weight:800;margin-bottom:8px">${result.quiz_title}</h2>
      <div class="quiz-meta" style="justify-content:center">
        <span class="quiz-badge badge-purple"><i class="fas fa-star"></i> Score: ${result.score} / ${result.total_marks}</span>
        <span class="quiz-badge badge-orange"><i class="fas fa-bullseye"></i> Pass Mark: ${result.pass_marks}</span>
        <span class="quiz-badge ${result.passed ? 'badge-green' : 'badge-red'}">
          <i class="fas fa-${result.passed ? 'trophy' : 'times'}"></i> ${result.passed ? 'Passed' : 'Failed'}
        </span>
      </div>
    </div>

    <h2 style="font-size:1.2rem;font-weight:700;margin-bottom:16px">Answer Review</h2>
    ${result.questions.map((q, i) => {
      const correct = q.correct_option;
      const selected = q.selected_option;
      return `
      <div class="question-card" style="margin-bottom:16px;cursor:default">
        <div class="question-num" style="color:${q.is_correct ? 'var(--success)' : 'var(--danger)'}">
          Question ${i+1} • ${q.is_correct ? `+${q.marks} mark${q.marks>1?'s':''}` : '0 marks'}
          <i class="fas fa-${q.is_correct ? 'check-circle' : 'times-circle'}" style="margin-left:6px"></i>
        </div>
        <div class="question-text">${q.question_text}</div>
        <div class="options">
          ${['A','B','C','D'].map(opt => {
            const val = q[`option_${opt.toLowerCase()}`];
            let cls = '';
            if (opt === correct) cls = 'correct';
            else if (opt === selected && !q.is_correct) cls = 'wrong';
            return `<div class="option-label ${cls}" style="cursor:default">
              <span class="option-letter">${opt}</span>
              <span>${val}</span>
              ${opt === correct ? '<i class="fas fa-check" style="margin-left:auto;color:var(--success)"></i>' : ''}
              ${opt === selected && !q.is_correct ? '<i class="fas fa-times" style="margin-left:auto;color:var(--danger)"></i>' : ''}
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }).join('')}
  </div>`;
};

// ── My Results Page ──
Pages.myResults = async (app) => {
  app.innerHTML = navbar('my-results') + `<div class="container"><div class="loader"><div class="spinner"></div></div></div>`;
  const data = await api.get('/attempts/my');

  app.innerHTML = navbar('my-results') + `
  <div class="container">
    <div class="page-header">
      <div>
        <h1 class="page-title">My Results</h1>
        <p class="page-subtitle">Your quiz attempt history</p>
      </div>
    </div>
    ${!data.success || data.attempts.length === 0 ? `<div class="empty-state"><i class="fas fa-chart-bar"></i><p>No attempts yet. Take a quiz to see your results!</p></div>` : `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Quiz Title</th>
            <th>Score</th>
            <th>Percentage</th>
            <th>Status</th>
            <th>Submitted At</th>
          </tr>
        </thead>
        <tbody>
          ${data.attempts.map((a, i) => `
          <tr>
            <td>${i + 1}</td>
            <td style="font-weight:600">${a.quiz_title}</td>
            <td>${a.score} / ${a.total_marks}</td>
            <td>
              <span style="color:${a.passed ? 'var(--success)' : 'var(--danger)'};font-weight:700">${parseFloat(a.percentage).toFixed(1)}%</span>
            </td>
            <td>
              <span class="quiz-badge ${a.passed ? 'badge-green' : 'badge-red'}">
                ${a.passed ? '✓ Passed' : '✗ Failed'}
              </span>
            </td>
            <td style="color:var(--text-secondary)">${new Date(a.submitted_at).toLocaleString()}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`}
  </div>`;
};
