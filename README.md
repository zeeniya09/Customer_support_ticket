# Customer Support Ticketing System 🚀

A production-grade, enterprise-ready Customer Support Ticketing platform. This system mimics industry leaders like Zendesk and Jira Service Management, providing role-based ticketing, real-time WebSockets, AI auto-categorization, and an advanced analytics dashboard.

---

## 🏗️ Hybrid Database Architecture (MongoDB-Lead Hybrid)

This project utilizes a **Polyglot Persistence** strategy, using both **SQL (SQLite)** and **NoSQL (MongoDB)**. It is specifically balanced to make MongoDB the lead database for business logic while using SQLite for secure identity management.

### The Database Split

1. **SQL (SQLite) — Identity & Auth**
   *   **What it stores:** `Users`, `Roles`, `Auth Sessions`.
   *   **Why:** SQLite ensures strict referential integrity for accounts. This is the "Skeleton" of your application. All user authentication and relational role management happen here via **Sequelize**.
   
2. **MongoDB — Core Business Data**
   *   **What it stores:** `Tickets`, `Comments`, `Activity Logs`, `Notifications`, `Knowledge Base`.
   *   **Why:** Mongoose handles the "Flesh" of the application. Business objects like tickets and logs are dynamic and high-volume, making MongoDB the ideal home for them.

### 🔗 Cross-Database "Polyglot Joins"

The backend acts as a bridge. Since standard SQL `JOIN` or Mongoose `populate` cannot cross databases, the controllers perform **manual joins**:
1. Search results are fetched from **MongoDB**.
2. Unique User IDs are extracted from the results.
3. A single batch query is sent to **SQLite** to fetch the corresponding User names/avatars.
4. The data is merged in the backend before being sent to the React frontend.

---

## 💻 Tech Stack

- **Frontend:** React, React Router v7, TailwindCSS v4, Recharts
- **Backend:** Node.js, Express.js, Socket.IO
- **Databases:** **MongoDB** (Lead) & **SQLite** (Identity/Auth)
- **Auth:** JWT with RBAC (Role-Based Access Control)
- **AI:** Keyword-based auto-categorization and priority detection

---

## 🗄️ Sample Schema Logic

### SQL: User Table (Sequelize)
```javascript
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('customer', 'agent', 'admin'), defaultValue: 'customer' }
});
```

### NoSQL: Ticket Collection (Mongoose)
```javascript
const ticketSchema = new mongoose.Schema({
  ticketId: { type: String, unique: true },
  customerId: { type: Number, required: true }, // Foreign Link: Int ID from SQLite
  assignedAgentId: { type: Number },           // Foreign Link: Int ID from SQLite
  status: { type: String, default: 'open' }
});
```

---

## 🚀 Getting Started

### Prerequisites
1. **Node.js** (v18+)
2. **MongoDB** installed and running on `localhost:27017`

### Setup
1. Clone the repository.
2. Run `npm install` in both `client` and `server` folders.
3. Start the backend: `cd server && npm run dev`
4. Start the frontend: `cd client && npm run dev`

*No SQL installation required — SQLite generates `database.sqlite` automatically.*
