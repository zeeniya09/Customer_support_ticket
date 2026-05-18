# SupportDesk — Customer Support Ticketing System

A production-grade helpdesk platform built with the **MERN stack** (MongoDB, Express, React, Node.js). Features ticket management, SLA tracking, real-time updates, analytics, and a knowledge base.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** ≥ 18
- **MongoDB** (local instance or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd "Customer support ticket"

# Backend
cd server
cp .env.example .env   # Edit .env with your MongoDB URI
npm install

# Frontend
cd ../client
npm install
```

### 2. Configure Environment Variables

Edit `server/.env`:

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for JWT signing (change in production!) |
| `SMTP_USER` / `SMTP_PASS` | Gmail/SMTP credentials for email notifications (optional) |
| `CLOUDINARY_*` | Cloudinary credentials for file storage (optional) |

### 3. Run Development Servers

```bash
# Terminal 1 — Backend (port 5000)
cd server
npm run dev

# Terminal 2 — Frontend (port 5173)
cd client
npm run dev
```

Open **http://localhost:5173** in your browser.

### 4. Create Your First Admin

1. Register at `/register`
2. In MongoDB, update the user's `role` to `"admin"`:
   ```js
   db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
   ```

---

## 📁 Project Structure

```
├── server/                 # Express.js backend
│   ├── src/
│   │   ├── config/         # DB connection, SLA config
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/      # Auth, validation, upload, errors
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # Express routers
│   │   ├── services/       # SLA, email, AI services
│   │   ├── socket/         # Socket.IO handlers
│   │   ├── validators/     # Joi schemas
│   │   └── docs/           # Swagger setup
│   └── uploads/            # Local file uploads
│
├── client/                 # React frontend (Vite)
│   └── src/
│       ├── api/            # Axios instance
│       ├── components/     # Reusable UI components
│       ├── context/        # Auth & Socket providers
│       ├── hooks/          # Custom hooks
│       ├── pages/          # Route pages
│       └── utils/          # Constants & helpers
│
└── .github/workflows/      # CI/CD pipeline
```

---

## 🔑 User Roles

| Role | Capabilities |
|---|---|
| **Customer** | Create tickets, track progress, add comments, rate support |
| **Agent** | View assigned tickets, update status, resolve tickets |
| **Admin** | Manage users, assign tickets, view analytics, manage KB |

---

## 📊 Key Features

- **JWT Authentication** with role-based access control
- **Real-time updates** via Socket.IO
- **SLA tracking** with auto-escalation
- **AI ticket categorization** (keyword-based)
- **Analytics dashboard** with Recharts
- **Knowledge base** for self-service support
- **Email notifications** via Nodemailer
- **File attachments** via Multer
- **Swagger API docs** at `/api-docs`

---

## 🌐 API Documentation

With the backend running, visit: **http://localhost:5000/api-docs**

---

## 🚢 Deployment

| Component | Recommended Platform |
|---|---|
| Frontend | Vercel, Netlify |
| Backend | Render, Railway, AWS |
| Database | MongoDB Atlas |

**Frontend build:**
```bash
cd client && npm run build
```

**Backend production:**
```bash
cd server && NODE_ENV=production npm start
```

---

## 📜 License

MIT
