const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/auth');

// GET /api/admin/stats - Dashboard stats
router.get('/stats', verifyToken, isAdmin, async (req, res) => {
  try {
    const [[{ total_students }]] = await db.query("SELECT COUNT(*) as total_students FROM users WHERE role='student'");
    const [[{ total_quizzes }]] = await db.query("SELECT COUNT(*) as total_quizzes FROM quizzes");
    const [[{ total_attempts }]] = await db.query("SELECT COUNT(*) as total_attempts FROM attempts");
    const [[{ avg_score }]] = await db.query("SELECT AVG(percentage) as avg_score FROM attempts");

    res.json({
      success: true,
      stats: {
        total_students,
        total_quizzes,
        total_attempts,
        avg_score: avg_score ? parseFloat(avg_score).toFixed(1) : 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/admin/users - Get all students
router.get('/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT u.id, u.name, u.email, u.role, u.created_at,
        (SELECT COUNT(*) FROM attempts WHERE student_id = u.id) as attempt_count
       FROM users u ORDER BY u.created_at DESC`
    );
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    if (req.params.id == req.user.id)
      return res.status(400).json({ success: false, message: 'Cannot delete yourself.' });
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/admin/leaderboard - Top performers
router.get('/leaderboard', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.name, u.email,
        COUNT(a.id) as total_attempts,
        AVG(a.percentage) as avg_percentage,
        SUM(CASE WHEN a.passed = 1 THEN 1 ELSE 0 END) as passed_count
       FROM attempts a JOIN users u ON a.student_id = u.id
       GROUP BY u.id, u.name, u.email
       ORDER BY avg_percentage DESC LIMIT 10`
    );
    res.json({ success: true, leaderboard: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
