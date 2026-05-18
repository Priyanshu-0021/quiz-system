const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/auth');

// GET /api/quizzes - Get all active quizzes (students)
router.get('/', verifyToken, async (req, res) => {
  try {
    const [quizzes] = await db.query(
      `SELECT q.*, u.name as creator_name,
        (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) as question_count,
        (SELECT COUNT(*) FROM attempts WHERE quiz_id = q.id AND student_id = ?) as attempt_count
       FROM quizzes q JOIN users u ON q.created_by = u.id
       WHERE q.is_active = 1 ORDER BY q.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, quizzes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/quizzes/all - Admin: get all quizzes
router.get('/all', verifyToken, isAdmin, async (req, res) => {
  try {
    const [quizzes] = await db.query(
      `SELECT q.*, u.name as creator_name,
        (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) as question_count,
        (SELECT COUNT(*) FROM attempts WHERE quiz_id = q.id) as attempt_count
       FROM quizzes q JOIN users u ON q.created_by = u.id
       ORDER BY q.created_at DESC`
    );
    res.json({ success: true, quizzes });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/quizzes/:id - Get single quiz with questions
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const [quizzes] = await db.query('SELECT * FROM quizzes WHERE id = ?', [req.params.id]);
    if (quizzes.length === 0)
      return res.status(404).json({ success: false, message: 'Quiz not found.' });

    const quiz = quizzes[0];
    const [questions] = await db.query(
      'SELECT id, question_text, option_a, option_b, option_c, option_d, marks FROM questions WHERE quiz_id = ?',
      [req.params.id]
    );

    res.json({ success: true, quiz: { ...quiz, questions } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/quizzes - Admin: create quiz
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { title, description, time_limit, pass_marks, questions } = req.body;

    if (!title || !questions || questions.length === 0)
      return res.status(400).json({ success: false, message: 'Title and at least one question required.' });

    const total_marks = questions.reduce((sum, q) => sum + (parseInt(q.marks) || 1), 0);

    const [result] = await db.query(
      'INSERT INTO quizzes (title, description, created_by, time_limit, total_marks, pass_marks) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description || '', req.user.id, time_limit || 30, total_marks, pass_marks || Math.ceil(total_marks * 0.5)]
    );

    const quizId = result.insertId;

    // Insert questions
    for (const q of questions) {
      await db.query(
        'INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [quizId, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option, q.marks || 1]
      );
    }

    // Update total marks
    await db.query('UPDATE quizzes SET total_marks = ? WHERE id = ?', [total_marks, quizId]);

    res.status(201).json({ success: true, message: 'Quiz created successfully!', quizId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PUT /api/quizzes/:id - Admin: update quiz status
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { title, description, time_limit, pass_marks, is_active } = req.body;
    await db.query(
      'UPDATE quizzes SET title=?, description=?, time_limit=?, pass_marks=?, is_active=? WHERE id=?',
      [title, description, time_limit, pass_marks, is_active, req.params.id]
    );
    res.json({ success: true, message: 'Quiz updated successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/quizzes/:id - Admin: delete quiz
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM quizzes WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Quiz deleted successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
