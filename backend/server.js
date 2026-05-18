const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend/public')));

// ── API Routes ──
app.use('/api/auth', require('./routes/auth'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/attempts', require('./routes/attempts'));
app.use('/api/admin', require('./routes/admin'));

// ── Health Check ──
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Quiz System API is running!', timestamp: new Date() });
});

// ── Catch-all: serve frontend ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// ── Start Server ──
app.listen(PORT, () => {
  console.log(`\n🚀 Quiz System Server running at http://localhost:${PORT}`);
  console.log(`📚 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🔐 Admin Login: admin@quiz.com / admin123\n`);
});
