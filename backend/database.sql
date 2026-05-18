-- ============================================
-- ONLINE QUIZ MANAGEMENT SYSTEM - DATABASE
-- ============================================

CREATE DATABASE IF NOT EXISTS quiz_system;
USE quiz_system;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'student') DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quizzes Table
CREATE TABLE IF NOT EXISTS quizzes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  created_by INT NOT NULL,
  time_limit INT DEFAULT 30,  -- in minutes
  total_marks INT DEFAULT 0,
  pass_marks INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Questions Table
CREATE TABLE IF NOT EXISTS questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT NOT NULL,
  question_text TEXT NOT NULL,
  option_a VARCHAR(300) NOT NULL,
  option_b VARCHAR(300) NOT NULL,
  option_c VARCHAR(300) NOT NULL,
  option_d VARCHAR(300) NOT NULL,
  correct_option ENUM('A','B','C','D') NOT NULL,
  marks INT DEFAULT 1,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- Quiz Attempts Table
CREATE TABLE IF NOT EXISTS attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT NOT NULL,
  student_id INT NOT NULL,
  score INT DEFAULT 0,
  total_marks INT DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0,
  passed BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP NULL,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Student Answers Table
CREATE TABLE IF NOT EXISTS answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  attempt_id INT NOT NULL,
  question_id INT NOT NULL,
  selected_option ENUM('A','B','C','D') NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- =====================
-- SEED: Default Admin
-- Password: admin123
-- =====================
INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@quiz.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'admin');

-- Sample Quiz
INSERT INTO quizzes (title, description, created_by, time_limit, total_marks, pass_marks) VALUES
('JavaScript Basics', 'Test your JavaScript fundamentals', 1, 10, 5, 3);

-- Sample Questions
INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks) VALUES
(1, 'Which keyword is used to declare a variable in JavaScript?', 'var', 'int', 'string', 'define', 'A', 1),
(1, 'What does DOM stand for?', 'Document Object Model', 'Data Object Model', 'Document Oriented Model', 'Dynamic Object Module', 'A', 1),
(1, 'Which method is used to add an element at the end of an array?', 'push()', 'pop()', 'shift()', 'append()', 'A', 1),
(1, 'What is the output of typeof null?', 'object', 'null', 'undefined', 'string', 'A', 1),
(1, 'Which symbol is used for single-line comments in JavaScript?', '//', '/* */', '#', '--', 'A', 1);
