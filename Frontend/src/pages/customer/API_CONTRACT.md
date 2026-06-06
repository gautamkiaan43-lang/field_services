# API CONTRACT

---

## 🔐 AUTH MODULE

### POST /api/auth/login
Auth: Public

Request:
{
  email: string,
  password: string
}

Response:
{
  token: string,
  user: {
    id,
    name,
    role
  }
}

---

### GET /api/auth/me
Auth: Required

Response:
{
  id,
  name,
  role
}

---

## 👤 CUSTOMERS

### GET /api/customers
Auth: Required

Response:
[
  {
    id,
    name,
    phone,
    email,
    address
  }
]

---

### POST /api/customers

Request:
{
  name,
  phone,
  email,
  address
}

---

## 👨‍🔧 EMPLOYEES

### GET /api/employees

### POST /api/employees

---

## 🧱 JOBS

### GET /api/jobs

### POST /api/jobs

Request:
{
  customerId,
  title,
  description,
  assignedTo,
  status
}

---

### PATCH /api/jobs/:id/status

---

### POST /api/jobs/:id/notes

---

### POST /api/jobs/:id/photos

---

## 📄 ESTIMATES

### GET /api/estimates

### POST /api/estimates

### PATCH /api/estimates/:id

### POST /api/estimates/:id/approve

---

## 🧾 INVOICES

### GET /api/invoices

### POST /api/invoices

---

## 💰 PAYMENTS

### POST /api/payments

### POST /api/payments/:id/allocate

---

## 📸 UPLOADS

### POST /api/uploads