# Customer Support Ticketing System 🚀

A production-grade, enterprise-ready Customer Support Ticketing platform. This system mimics industry leaders like Zendesk and Jira Service Management, providing role-based ticketing, real-time WebSockets, AI auto-categorization, and an advanced analytics dashboard.

---

## 🏗️ Hybrid Database Architecture (Polyglot Persistence)

One of the standout, enterprise-level technical decisions in this project is its **Hybrid Database Architecture**. Rather than forcing all data into a single paradigm, this backend utilizes both **MySQL (SQL)** and **MongoDB (NoSQL)** simultaneously to handle different types of data exactly as they are best suited.

### Why use both SQL and MongoDB?

In large-scale systems, data comes strictly structured and highly relational (like User hierarchies and Billing), but also massively unstructured, flexible, and high-volume (like Chat logs and Activity streams). 

1. **MySQL (Structured Data & Relationships)**
   - **What it stores:** `Users`, `Roles`, `Authentication Details`, and `Ticket Metadata`.
   - **Why:** SQL databases excel at strictly enforcing relationships, data integrity, and transactions. A user's profile and core ticket assignments must strictly conform to schemas. MySQL foreign keys ensure that a ticket cannot be assigned to an agent that does not exist.
   
2. **MongoDB (Unstructured & High-Volume Data)**
   - **What it stores:** `Comments (Chat History)`, `Activity Logs`, `Notifications`, and `Knowledge Base Articles`.
   - **Why:** NoSQL shines with document-based, flexible data. Comments and system logs grow at an exponential rate and don't strictly require heavily constrained schemas. Keeping logs in MongoDB prevents the primary MySQL relational database from being bogged down by read/write heavy chat streams.

### 🔗 How the Code Connects Them

The backend acts as a bridge. For instance, when a customer creates a comment on a ticket:
1. The backend verifies the user using **MySQL**.
2. The exact ticket instance is queried from **MySQL** using Sequelize.
3. The comment text itself is written into **MongoDB** using Mongoose, storing the integer `ticketId` as a reference.
4. When fetching a full Ticket view, the controllers perform parallel querying—grabbing relational ticket details from SQL, and the associated massive chat arrays from MongoDB.

---

## 💻 Tech Stack

- **Frontend:** React, React Router v7, TailwindCSS v4, Recharts (Analytics)
- **Backend:** Node.js, Express.js, Socket.IO (Real-time updates)
- **Databases:** MySQL (Sequelize ORM) & MongoDB (Mongoose ODM)
- **Authentication:** JWT (JSON Web Tokens) with strictly enforced RBAC (Role-Based Access Control)
- **Add-ons:** Multer (File uploads), Cloudinary (Image hosting API), Nodemailer (SMTP Emails)

---

## 🗄️ Database Schemas (Examples)

### 1. SQL: `User` Table (Sequelize)
Strict constraints mapping explicit roles and permissions.
```javascript
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('customer', 'agent', 'admin'), defaultValue: 'customer' }
});
```

### 2. SQL: `Ticket` Metadata Table
Tracks priority, status, and mapped Foreign Keys to the `Users` table.
```javascript
const Ticket = sequelize.define('Ticket', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  ticketId: { type: DataTypes.STRING, unique: true },
  title: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.ENUM('billing', 'technical_issue', ...), defaultValue: 'uncategorized' },
  status: { type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'), defaultValue: 'open' },
  customerId: { type: DataTypes.INTEGER, references: { model: User, key: 'id' } },
  assignedAgentId: { type: DataTypes.INTEGER, references: { model: User, key: 'id' } }
});
```

### 3. MongoDB: `ActivityLog` Collection (Mongoose)
Stores massive volumes of system analytics without rigid schemas.
```javascript
const activityLogSchema = new mongoose.Schema({
  userId: { type: Number, required: true }, // References SQL User ID implicitly
  action: { type: String, required: true },
  entity: { type: String, enum: ['Ticket', 'User', 'KnowledgeBase'], required: true },
  entityId: { type: Number, required: true }, 
  metadata: { type: mongoose.Schema.Types.Mixed }, // Fully dynamic NoSQL metadata object
}, { timestamps: true });
```

---

## 🚀 Getting Started Locally

This project uses **SQLite**, which means you do **NOT** need to install MySQL or Postgres on your computer. The SQL database engine is fully embedded into the codebase natively!

### Prerequisites
1. **Node.js** (v18+)
2. **MongoDB** installed and running on `localhost:27017` (e.g. MongoDB Compass)

### Installation
1. Clone this repository.
2. Open `server/.env` and verify your MongoDB URL:
```env
MONGO_URI=mongodb://127.0.0.1:27017/support-tickets
```
3. Open a terminal and start the backend:
```bash
cd server
npm install
npm run dev
```
4. *Important: Sequelize will automatically connect to SQLite, generate the `database.sqlite` file natively, and sync all SQL tables on startup.*

5. Open a second terminal and start the frontend:
```bash
cd client
npm install
npm run dev
```

Your dual-database, enterprise-grade architecture is now running locally on `http://localhost:5173`!
