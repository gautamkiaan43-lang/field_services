# PROJECT OVERVIEW

## 📌 Project Name
Field Service Management Software (SaaS)

## 🎯 Description
This is a cloud-based field service management system similar to Housecall Pro, designed to manage service operations including jobs, estimates, invoices, payments, and workforce management.

The system supports multiple user roles and provides role-based dashboards for operational efficiency.

---

## 👥 User Roles

### 1. Admin
- Full system control
- Manage users, customers, jobs, reports, and integrations

### 2. Manager
- Assign jobs
- Manage operations
- Approve estimates
- Monitor technicians

### 3. Technician
- View assigned jobs
- Update job progress
- Upload photos and notes
- Track attendance and timesheets

### 4. Customer
- View job history
- Approve estimates
- Make payments
- Track job progress

---

## ⚙️ Core Features

- Authentication & Authorization (JWT-based)
- Customer Management
- Employee Management
- Job Management (status, assignment, tracking)
- Estimate System (create, revise, approve)
- Invoice System
- Payment System (with allocation logic)
- File Upload (photos, documents)
- Role-based dashboards

---

## 🛠️ Tech Stack

### Backend
- Node.js
- Express.js
- Prisma ORM
- MySQL

### Frontend
- React (already built)

---

## 🌍 Environment Setup

### Local Development
- MySQL database via DATABASE_URL
- Prisma ORM for database interaction
- Node server running on PORT (default: 3000 or 5000)

### Production (Railway)
- MySQL plugin (Railway provides DATABASE_URL)
- Same Prisma schema (no changes required)
- Same codebase used without modification

---

## 🔑 Environment Variables

- DATABASE_URL
- PORT
- JWT_SECRET

---

## 🚀 Goal

To build a scalable backend system that fully integrates with the existing frontend without modifying frontend logic or structure.