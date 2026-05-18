const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/auth');

// POST /api/attempts/submit - Student submits quiz
router.post('/submit', verifyToken, async (req, res) => {
  try {
    const { quiz_id, answers } = req.body; // answers: [{question_id, selected_option}]
    const student_id = req.user.id;

    if (!quiz_id || !answers || answers.length === 0)
      return res.status(400).json({ success: false, message: 'Quiz ID and answers are required.' });

    // Get quiz info
    const [quizzes] = await db.query('SELECT * FROM quizzes WHERE id = ?', [quiz_id]);
    if (quizzes.length === 0)
      return res.status(404).json({ success: false, message: 'Quiz not found.' });

    const quiz = quizzes[0];

    // Get all questions with correct answers
    const [questions] = await db.query('SELECT * FROM questions WHERE quiz_id = ?', [quiz_id]);

    // Calculate score
    let score = 0;
    const answerMap = {};
    answers.forEach(a => { answerMap[a.question_id] = a.selected_option; });

    const answerDetails = questions.map(q => {
      const selected = answerMap[q.id];
      const is_correct = selected === q.correct_option;
      if (is_correct) score += q.marks;
      return { question_id: q.id, selected_option: selected || 'A', is_correct };
    });

    const total_marks = quiz.total_marks;
    const percentage = total_marks > 0 ? ((score / total_marks) * 100).toFixed(2) : 0;
    const passed = score >= quiz.pass_marks;

    // Create attempt record
    const [attemptResult] = await db.query(
      'INSERT INTO attempts (quiz_id, student_id, score, total_marks, percentage, passed, submitted_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [quiz_id, student_id, score, total_marks, percentage, passed]
    );

    const attempt_id = attemptResult.insertId;

    // Save answers
    for (const ans of answerDetails) {
      await db.query(
        'INSERT INTO answers (attempt_id, question_id, selected_option, is_correct) VALUES (?, ?, ?, ?)',
        [attempt_id, ans.question_id, ans.selected_option, ans.is_correct]
      );
    }

    // Return result with correct answers
    const resultQuestions = questions.map(q => ({
      id: q.id,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_option: q.correct_option,
      selected_option: answerMap[q.id] || null,
      is_correct: answerMap[q.id] === q.correct_option,
      marks: q.marks
    }));

    res.json({
      success: true,
      result: {
        attempt_id,
        quiz_title: quiz.title,
        score,
        total_marks,
        percentage,
        passed,
        pass_marks: quiz.pass_marks,
        questions: resultQuestions
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/attempts/my - Student: get own attempt history
router.get('/my', verifyToken, async (req, res) => {
  try {
    const [attempts] = await db.query(
      `SELECT a.*, q.title as quiz_title, q.total_marks as quiz_total
       FROM attempts a JOIN quizzes q ON a.quiz_id = q.id
       WHERE a.student_id = ? ORDER BY a.submitted_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, attempts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/attempts/:id - Get single attempt result
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const [attempts] = await db.query(
      `SELECT a.*, q.title as quiz_title, q.pass_marks, u.name as student_name
       FROM attempts a JOIN quizzes q ON a.quiz_id = q.id JOIN users u ON a.student_id = u.id
       WHERE a.id = ?`,
      [req.params.id]
    );
    if (attempts.length === 0)
      return res.status(404).json({ success: false, message: 'Attempt not found.' });

    const attempt = attempts[0];
    if (attempt.student_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Access denied.' });

    const [answers] = await db.query(
      `SELECT ans.*, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option, q.marks
       FROM answers ans JOIN questions q ON ans.question_id = q.id
       WHERE ans.attempt_id = ?`,
      [req.params.id]
    );

    res.json({ success: true, attempt: { ...attempt, answers } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/attempts/quiz/:quizId - Admin: all attempts for a quiz
router.get('/quiz/:quizId', verifyToken, isAdmin, async (req, res) => {
  try {
    const [attempts] = await db.query(
      `SELECT a.*, u.name as student_name, u.email as student_email
       FROM attempts a JOIN users u ON a.student_id = u.id
       WHERE a.quiz_id = ? ORDER BY a.submitted_at DESC`,
      [req.params.quizId]
    );
    res.json({ success: true, attempts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
