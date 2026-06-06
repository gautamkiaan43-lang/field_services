# BUSINESS RULES

---

## 🔐 AUTH RULES

- All protected routes require JWT
- Token must be valid
- User must exist in database

---

## 👥 ROLE RULES

### Admin
- Full access

### Manager
- Manage jobs, approvals

### Technician
- Only assigned jobs

### Customer
- Only own data

---

## 📄 ESTIMATE RULES

- Must be linked to customer
- Can have multiple items
- Can be revised
- Must be approved before job conversion

---

## 🧱 JOB RULES

- Must have customer
- Must have status
- Must be assigned to technician

---

## 🧾 INVOICE RULES

- Can be created from estimate
- Must be linked to customer

---

## 💰 PAYMENT RULES

- Payment can be partial
- Payment can be split:
  - labor
  - material
- Overpayment stored as credit

---

## 📸 FILE UPLOAD RULES

- Allowed types: image, pdf
- Must be linked to job

---

## 🔄 DATA RULES

- No mock data
- All data from MySQL via Prisma