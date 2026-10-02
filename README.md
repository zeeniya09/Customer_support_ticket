# Customer Support Ticketing System

A full-stack Customer Support Ticketing System for ticket lifecycle management and agent workflow automation, built with the MERN stack.

---

## Features

- **Role-Based Access Control (RBAC)** with three roles: Customer, Agent, and Admin
- **Ticket Creation** by customers with title, description, category, and priority
- **Ticket Listing and Details** with role-filtered views
- **Agent Assignment** by admins; agents see only their assigned tickets
- **Ticket Status and Priority Updates** by agents and admins
- **Comment System** visible to all parties on a ticket
- **Internal Notes** visible only to agents and admins (hidden from customers)
- **Admin User Management** with the ability to view users and change roles
- **JWT Authentication** with automatic expiry handling on the client
- **Secure Password Hashing** using bcrypt
- **Responsive, Component-Based React UI** with role-specific navigation
- **REST API** with input validation, rate limiting, and global error handling

---

## Tech Stack

Layer | Technology
------|----------
Frontend | React 19, React Router v7, TailwindCSS v4, Axios
Backend | Node.js, Express.js
Database | MongoDB with Mongoose ODM
Authentication | JWT (jsonwebtoken) + bcryptjs
Dev Server | Vite 6
Process Manager | Nodemon

---

## Roles and Permissions

Action | Customer | Agent | Admin
-------|----------|-------|------
Register and Login | Yes | Yes | Yes
Create ticket | Yes | No | Yes
View own tickets | Yes | No | No
View assigned tickets | No | Yes | No
View all tickets | No | No | Yes
Update ticket status or priority | No | Yes | Yes
Assign ticket to agent | No | No | Yes
Add comments | Yes | Yes | Yes
Add internal notes | No | Yes | Yes
View internal notes | No | Yes | Yes
Manage users | No | No | Yes
Change user roles | No | No | Yes

---

## Architecture

During development the Vite dev server proxies all /api requests to the Express backend.

React Frontend (Vite)
  HTTP /api/* -> Express REST API (Node.js)
                   Mongoose -> MongoDB

Express middleware chain per request:
  helmet -> cors -> morgan -> authenticate (JWT) -> authorize (role) -> validate -> controller

---

## Project Structure

client/
  src/
    api/axios.js          # Axios instance with JWT interceptor
    components/
      layout/            # DashboardLayout, Navbar, Sidebar
      tickets/           # TicketCard, TicketFilters
      ui/               # Loader
    context/AuthContext.jsx
    hooks/useAuth.js
    pages/
      Login.jsx
      Register.jsx
      Dashboard.jsx
      CreateTicket.jsx
      TicketDetails.jsx
      Users.jsx
    utils/
      constants.js       # Status/priority/category enums
      helpers.js
  index.html
  vite.config.js

server/
  src/
    config/db.js         # MongoDB connection
    controllers/
      auth.controller.js
      ticket.controller.js
      comment.controller.js
      user.controller.js
    middleware/
      auth.js            # authenticate + authorize
      errorHandler.js
      rateLimiter.js
      validate.js
    models/
      User.js
      Ticket.js
      Comment.js
    routes/
      auth.routes.js
      ticket.routes.js
      user.routes.js
    validators/
      auth.validator.js
      ticket.validator.js
      comment.validator.js
  .env.example
  package.json

---

## Local Setup

Prerequisites: Node.js v18+, MongoDB running locally or Atlas URI

1. Clone the repository
   git clone https://github.com/your-username/customer-support-ticket.git

2. Set up environment
   cd server
   copy .env.example .env
   (edit .env with your values)

3. Install dependencies
   cd server && npm install
   cd ../client && npm install

---

## Environment Variables

Variable | Required | Description
---------|----------|------------
MONGO_URI | Yes | MongoDB connection string
JWT_SECRET | Yes | Secret for signing JWTs
PORT | No | Server port (default 5000)
NODE_ENV | No | development or production
JWT_EXPIRES_IN | No | Token lifespan (default 7d)
CLIENT_URL | No | Frontend origin for CORS (default http://localhost:5173)

Example server/.env:
  PORT=5000
  NODE_ENV=development
  MONGO_URI=mongodb://localhost:27017/support-tickets
  JWT_SECRET=replace_with_a_strong_random_secret
  JWT_EXPIRES_IN=7d
  CLIENT_URL=http://localhost:5173

---

## Running the Backend

  cd server
  npm install
  npm run dev

Server starts on http://localhost:5000

---

## Running the Frontend

  cd client
  npm install
  npm run dev

Frontend starts on http://localhost:5173
All /api requests are proxied to the backend via the Vite dev server.

---

## Production Build

  cd client
  npm run build

Output is generated in client/dist/

---

## Verification

Health check:
  GET http://localhost:5000/api/health

Manual workflow verification:
  1. Customer - register, login, create a ticket, view it on the dashboard
  2. Agent - set role to agent via admin UI, login, view assigned tickets, update status and priority, add internal note
  3. Admin - login, view all tickets, assign tickets to agents, update ticket status and priority, and manage users and roles

Backend test script:
  cd server
  node verify_test.js

Runs 8 automated checks (registration, login, JWT, RBAC, ticket creation, assignment, status update, comments)
against a live MongoDB instance. Test data is cleaned up automatically.
