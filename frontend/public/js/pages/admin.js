// ── Admin Pages ───────────────────────────────

Pages.adminDashboard = async (app) => {
  app.innerHTML = navbar('admin-dashboard') + `<div class="container"><div class="loader"><div class="spinner"></div></div></div>`;

  const [statsData, leaderData] = await Promise.all([
    api.get('/admin/stats'),
    api.get('/admin/leaderboard')
  ]);

  const s = statsData.stats || {};
  const leaderboard = leaderData.leaderboard || [];

  app.innerHTML = navbar('admin-dashboard') + `
  <div class="container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Admin Dashboard</h1>
        <p class="page-subtitle">Overview of the quiz system</p>
      </div>
      <button class="btn btn-primary" onclick="router.navigate('admin-create-quiz')">
        <i class="fas fa-plus"></i> Create Quiz
      </button>
    </div>

    <div class="grid grid-4" style="margin-bottom:32px">
      <div class="stat-card"><div class="stat-icon purple"><i class="fas fa-users"></i></div>
        <div><div class="stat-value">${s.total_students || 0}</div><div class="stat-label">Total Students</div></div></div>
      <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-book"></i></div>
        <div><div class="stat-value">${s.total_quizzes || 0}</div><div class="stat-label">Total Quizzes</div></div></div>
      <div class="stat-card"><div class="stat-icon green"><i class="fas fa-check-circle"></i></div>
        <div><div class="stat-value">${s.total_attempts || 0}</div><div class="stat-label">Total Attempts</div></div></div>
      <div class="stat-card"><div class="stat-icon orange"><i class="fas fa-chart-line"></i></div>
        <div><div class="stat-value">${s.avg_score || 0}%</div><div class="stat-label">Avg. Score</div></div></div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="fas fa-trophy" style="color:var(--warning)"></i> Leaderboard — Top Students</div>
      </div>
      ${leaderboard.length === 0 ? `<div class="empty-state"><i class="fas fa-trophy"></i><p>No attempts yet.</p></div>` : `
      <div class="table-wrap">
        <table>
          <thead><tr><th>Rank</th><th>Student</th><th>Attempts</th><th>Avg Score</th><th>Passed</th></tr></thead>
          <tbody>
            ${leaderboard.map((s, i) => `
            <tr>
              <td>${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i+1}</td>
              <td><strong>${s.name}</strong><br><span style="font-size:0.8rem;color:var(--text-muted)">${s.email}</span></td>
              <td>${s.total_attempts}</td>
              <td><span style="color:var(--accent);font-weight:700">${parseFloat(s.avg_percentage).toFixed(1)}%</span></td>
              <td><span class="quiz-badge badge-green">${s.passed_count} quiz(zes)</span></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`}
    </div>
  </div>`;
};

// ── Admin: Manage Quizzes ──
Pages.adminQuizzes = async (app) => {
  app.innerHTML = navbar('admin-quizzes') + `<div class="container"><div class="loader"><div class="spinner"></div></div></div>`;
  const data = await api.get('/quizzes/all');

  app.innerHTML = navbar('admin-quizzes') + `
  <div class="container">
    <div class="page-header">
      <div><h1 class="page-title">Manage Quizzes</h1><p class="page-subtitle">${data.quizzes?.length || 0} quizzes total</p></div>
      <button class="btn btn-primary" onclick="router.navigate('admin-create-quiz')"><i class="fas fa-plus"></i> Create Quiz</button>
    </div>
    ${!data.quizzes?.length ? `<div class="empty-state"><i class="fas fa-book"></i><p>No quizzes yet. Create one!</p></div>` : `
    <div class="table-wrap">
      <table>
        <thead><tr><th>#</th><th>Title</th><th>Questions</th><th>Marks</th><th>Time</th><th>Attempts</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          ${data.quizzes.map((q, i) => `
          <tr>
            <td>${i+1}</td>
            <td><strong>${q.title}</strong><br><span style="font-size:0.8rem;color:var(--text-muted)">${q.description?.slice(0,50) || '—'}</span></td>
            <td>${q.question_count}</td>
            <td>${q.total_marks}</td>
            <td>${q.time_limit} min</td>
            <td>${q.attempt_count}</td>
            <td><span class="quiz-badge ${q.is_active ? 'badge-green' : 'badge-grey'}">${q.is_active ? 'Active' : 'Inactive'}</span></td>
            <td>
              <button class="btn btn-sm btn-secondary" onclick="toggleQuiz(${q.id}, ${q.is_active}, '${q.title}', '${q.description || ''}', ${q.time_limit}, ${q.pass_marks})">
                <i class="fas fa-${q.is_active ? 'eye-slash' : 'eye'}"></i>
              </button>
              <button class="btn btn-sm btn-danger" onclick="deleteQuiz(${q.id})"><i class="fas fa-trash"></i></button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`}
  </div>`;

  window.toggleQuiz = async (id, active, title, desc, time, pass_marks) => {
    const res = await api.put(`/quizzes/${id}`, { title, description: desc, time_limit: time, pass_marks, is_active: !active });
    if (res.success) Pages.adminQuizzes(app);
  };

  window.deleteQuiz = async (id) => {
    if (!confirm('Delete this quiz? All attempts will be deleted too.')) return;
    const res = await api.delete(`/quizzes/${id}`);
    if (res.success) Pages.adminQuizzes(app);
  };
};

// ── Admin: Manage Users ──
Pages.adminUsers = async (app) => {
  app.innerHTML = navbar('admin-users') + `<div class="container"><div class="loader"><div class="spinner"></div></div></div>`;
  const data = await api.get('/admin/users');

  app.innerHTML = navbar('admin-users') + `
  <div class="container">
    <div class="page-header">
      <div><h1 class="page-title">Manage Users</h1><p class="page-subtitle">${data.users?.length || 0} users registered</p></div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Attempts</th><th>Joined</th><th>Action</th></tr></thead>
        <tbody>
          ${(data.users || []).map((u, i) => `
          <tr>
            <td>${i+1}</td>
            <td><strong>${u.name}</strong></td>
            <td>${u.email}</td>
            <td><span class="quiz-badge ${u.role === 'admin' ? 'badge-purple' : 'badge-blue'}">${u.role}</span></td>
            <td>${u.attempt_count}</td>
            <td style="color:var(--text-secondary)">${new Date(u.created_at).toLocaleDateString()}</td>
            <td>${u.role !== 'admin' ? `<button class="btn btn-sm btn-danger" onclick="deleteUser(${u.id})"><i class="fas fa-trash"></i></button>` : '—'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;

  window.deleteUser = async (id) => {
    if (!confirm('Delete this user and all their data?')) return;
    const res = await api.delete(`/admin/users/${id}`);
    if (res.success) Pages.adminUsers(app);
  };
};

// ── Admin: Create Quiz ──
Pages.adminCreateQuiz = (app) => {
  let questions = [newQuestion()];

  function newQuestion() {
    return { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A', marks: 1 };
  }

  const render = () => {
    app.innerHTML = navbar('admin-quizzes') + `
    <div class="container" style="padding-bottom:60px">
      <div class="page-header">
        <div><h1 class="page-title">Create New Quiz</h1></div>
        <button class="btn btn-secondary" onclick="router.navigate('admin-quizzes')"><i class="fas fa-arrow-left"></i> Back</button>
      </div>

      <div id="create-alert"></div>

      <div class="card" style="margin-bottom:24px">
        <div class="card-header"><div class="card-title">Quiz Details</div></div>
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label">Quiz Title *</label>
            <input type="text" class="form-control" id="quiz-title" placeholder="e.g. JavaScript Fundamentals" value="${window._quizDraft?.title || ''}"/>
          </div>
          <div class="grid grid-2">
            <div class="form-group">
              <label class="form-label">Time Limit (min)</label>
              <input type="number" class="form-control" id="quiz-time" value="${window._quizDraft?.time || 30}" min="1"/>
            </div>
            <div class="form-group">
              <label class="form-label">Pass Marks</label>
              <input type="number" class="form-control" id="quiz-pass" value="${window._quizDraft?.pass || ''}" min="0" placeholder="Auto"/>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-control" id="quiz-desc" placeholder="Brief description of this quiz...">${window._quizDraft?.desc || ''}</textarea>
        </div>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <h2 style="font-size:1.1rem;font-weight:700">Questions (${questions.length})</h2>
        <button class="btn btn-outline btn-sm" onclick="addQuestion()"><i class="fas fa-plus"></i> Add Question</button>
      </div>

      ${questions.map((q, i) => `
      <div class="question-builder" id="qb-${i}">
        <div class="question-builder-header">
          <strong style="color:var(--accent)">Question ${i+1}</strong>
          <div style="display:flex;gap:8px;align-items:center">
            <label style="font-size:0.8rem;color:var(--text-secondary)">Marks:</label>
            <input type="number" style="width:60px" class="form-control" id="q${i}-marks" value="${q.marks}" min="1" onchange="updateQ(${i})"/>
            ${questions.length > 1 ? `<button class="btn btn-sm btn-danger" onclick="removeQ(${i})"><i class="fas fa-trash"></i></button>` : ''}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Question Text *</label>
          <textarea class="form-control" id="q${i}-text" rows="2" placeholder="Enter your question..." onchange="updateQ(${i})">${q.question_text}</textarea>
        </div>
        <div class="options-grid">
          ${['A','B','C','D'].map(opt => `
          <div class="option-input-wrap">
            <div class="option-letter-badge">${opt}</div>
            <input type="text" class="form-control" id="q${i}-opt${opt}" placeholder="Option ${opt}" value="${q[`option_${opt.toLowerCase()}`]}" onchange="updateQ(${i})"/>
          </div>`).join('')}
        </div>
        <div class="form-group" style="margin-top:14px">
          <label class="form-label">Correct Answer</label>
          <select class="form-control" id="q${i}-correct" onchange="updateQ(${i})">
            ${['A','B','C','D'].map(o => `<option value="${o}" ${q.correct_option === o ? 'selected' : ''}>Option ${o}</option>`).join('')}
          </select>
        </div>
      </div>`).join('')}

      <div style="display:flex;gap:12px;margin-top:24px">
        <button class="btn btn-primary btn-lg" onclick="submitQuizCreate()">
          <i class="fas fa-save"></i> Create Quiz
        </button>
        <button class="btn btn-secondary" onclick="router.navigate('admin-quizzes')">Cancel</button>
      </div>
    </div>`;
  };

  window.updateQ = (i) => {
    questions[i] = {
      question_text: document.getElementById(`q${i}-text`)?.value || '',
      option_a: document.getElementById(`q${i}-optA`)?.value || '',
      option_b: document.getElementById(`q${i}-optB`)?.value || '',
      option_c: document.getElementById(`q${i}-optC`)?.value || '',
      option_d: document.getElementById(`q${i}-optD`)?.value || '',
      correct_option: document.getElementById(`q${i}-correct`)?.value || 'A',
      marks: parseInt(document.getElementById(`q${i}-marks`)?.value) || 1
    };
  };

  window.addQuestion = () => {
    questions.forEach((_, i) => window.updateQ(i));
    questions.push(newQuestion());
    render();
  };

  window.removeQ = (i) => {
    questions.forEach((_, j) => window.updateQ(j));
    questions.splice(i, 1);
    render();
  };

  window.submitQuizCreate = async () => {
    questions.forEach((_, i) => window.updateQ(i));

    const title = document.getElementById('quiz-title')?.value?.trim();
    const desc = document.getElementById('quiz-desc')?.value?.trim();
    const time_limit = parseInt(document.getElementById('quiz-time')?.value) || 30;
    const pass_marks = parseInt(document.getElementById('quiz-pass')?.value) || 0;

    if (!title) { alert('Please enter a quiz title.'); return; }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d) {
        alert(`Please fill all fields for Question ${i+1}.`);
        return;
      }
    }

    const btn = document.querySelector('[onclick="submitQuizCreate()"]');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px"></div> Creating...';

    const res = await api.post('/quizzes', { title, description: desc, time_limit, pass_marks, questions });
    if (res.success) {
      alert('Quiz created successfully!');
      router.navigate('admin-quizzes');
    } else {
      document.getElementById('create-alert').innerHTML = `<div class="alert alert-error"><i class="fas fa-exclamation-circle"></i> ${res.message}</div>`;
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-save"></i> Create Quiz';
    }
  };

  render();
};
