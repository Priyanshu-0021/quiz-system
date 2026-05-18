# 🎓 QuizMaster — Online Quiz Management System

A full-stack web application built with **Node.js + Express + MySQL** featuring a modern dark theme UI.

---

## 📁 Project Structure

```
quiz-system/
├── backend/
│   ├── config/
│   │   └── db.js              # MySQL connection
│   ├── middleware/
│   │   └── auth.js            # JWT authentication
│   ├── routes/
│   │   ├── auth.js            # Login / Register
│   │   ├── quizzes.js         # Quiz CRUD
│   │   ├── attempts.js        # Submit quiz & results
│   │   └── admin.js           # Admin dashboard
│   ├── database.sql           # DB schema + seed data
│   ├── server.js              # Main Express server
│   ├── package.json
│   └── .env.example           # Environment variables
└── frontend/
    └── public/
        ├── index.html
        ├── css/style.css
        └── js/
            ├── api.js         # API helper
            ├── router.js      # SPA router
            ├── app.js         # Entry point
            └── pages/
                ├── auth.js    # Login & Register
                ├── student.js # Student dashboard, quiz, results
                └── admin.js   # Admin panel
```

---

## ⚙️ Setup Instructions

### Step 1 — Install MySQL
Make sure MySQL is installed and running on your machine.

### Step 2 — Create the Database
Open MySQL and run:
```sql
source path/to/quiz-system/backend/database.sql
```
Or copy-paste the contents of `database.sql` into MySQL Workbench / phpMyAdmin.

### Step 3 — Configure Environment
```bash
cd backend
cp .env.example .env
```
Edit `.env` and set your MySQL password:
```
DB_PASSWORD=your_mysql_password
JWT_SECRET=any_random_secret_string
```

### Step 4 — Install Dependencies
```bash
cd backend
npm install
```

### Step 5 — Start the Server
```bash
npm start
```
Or for development with auto-reload:
```bash
npm run dev
```

### Step 6 — Open in Browser
Visit: **http://localhost:5000**

---

## 🔐 Default Login Credentials

| Role  | Email            | Password  |
|-------|-----------------|-----------|
| Admin | admin@quiz.com  | admin123  |

Students can register from the Register page.

---

## ✨ Features

### Student Features
- ✅ Register & Login
- ✅ View all available quizzes
- ✅ Attempt timed quizzes with countdown timer
- ✅ Auto-submit on timeout
- ✅ Instant result with correct answers review
- ✅ View attempt history with scores

### Admin Features
- ✅ Admin Dashboard with stats
- ✅ Leaderboard of top students
- ✅ Create quizzes with multiple questions
- ✅ Manage quizzes (activate/deactivate/delete)
- ✅ Manage users (view/delete)
- ✅ View all quiz attempts

---

## 🛠️ Tech Stack

| Layer      | Technology          |
|------------|---------------------|
| Frontend   | HTML5, CSS3, Vanilla JS (SPA) |
| Backend    | Node.js + Express.js |
| Database   | MySQL               |
| Auth       | JWT (jsonwebtoken)  |
| Security   | bcryptjs (password hashing) |

---

## 📡 API Endpoints

### Auth
- `POST /api/auth/register` — Register student
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get logged-in user

### Quizzes
- `GET /api/quizzes` — Get all active quizzes
- `GET /api/quizzes/all` — Admin: all quizzes
- `GET /api/quizzes/:id` — Get quiz with questions
- `POST /api/quizzes` — Admin: create quiz
- `PUT /api/quizzes/:id` — Admin: update quiz
- `DELETE /api/quizzes/:id` — Admin: delete quiz

### Attempts
- `POST /api/attempts/submit` — Submit quiz answers
- `GET /api/attempts/my` — Get my attempts
- `GET /api/attempts/:id` — Get attempt details

### Admin
- `GET /api/admin/stats` — Dashboard statistics
- `GET /api/admin/users` — All users
- `DELETE /api/admin/users/:id` — Delete user
- `GET /api/admin/leaderboard` — Top performers
