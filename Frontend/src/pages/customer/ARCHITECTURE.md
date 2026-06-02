# ARCHITECTURE

## 🧠 System Architecture

Frontend → API → Controller → Service → Prisma → MySQL

---

## 📦 Backend Layers

### 1. Routes
- Define API endpoints
- Map routes to controllers

### 2. Controllers
- Handle request & response
- Validate input
- Call services

### 3. Services
- Business logic layer
- Interacts with Prisma

### 4. Prisma ORM
- Database queries
- Schema management

### 5. Database (MySQL)
- Persistent storage

---

## 🔐 Authentication Flow

1. User logs in
2. Backend validates credentials
3. JWT token generated
4. Token sent to frontend
5. Token used in Authorization header

---

## 🛡️ Authorization

- Role-based middleware
- Roles:
  - ADMIN
  - MANAGER
  - TECHNICIAN
  - CUSTOMER

---

## 🌍 Environment Configuration

- Uses `.env` file
- No hardcoded values
- DATABASE_URL used for Prisma

---

## 🚀 Server Setup

- Express server
- Uses `process.env.PORT`
- Default fallback allowed

---

## 🔄 Prisma Setup

- Single schema
- No environment branching
- Compatible with Railway

---

## 🔌 Database Connection Flow

1. App starts
2. Prisma connects using DATABASE_URL
3. Queries executed through Prisma client

---

## 🧯 Error Handling

- Centralized error handling middleware
- Proper HTTP status codes