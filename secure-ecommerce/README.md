# 🛒 SecureShop — Full Stack E-Commerce Platform

A production-grade secure e-commerce platform built with React, Node.js, Express, MongoDB, and Stripe.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Stripe account

### 1. Clone & Install

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Configure Environment Variables

**server/.env**
```
MONGO_URI=mongodb://localhost:27017/secureshop
JWT_SECRET=your_super_secret_jwt_key_here
STRIPE_KEY=sk_test_your_stripe_secret_key
PORT=5000
CLIENT_URL=http://localhost:5173
```

**client/.env**
```
VITE_API_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

### 3. Seed the Database (Optional)

```bash
cd server
npm run seed
```

### 4. Run the App

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

## 🏗️ Project Structure

```
secure-ecommerce/
├── server/
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express route handlers
│   ├── middleware/      # Auth, rate limiting
│   ├── seed.js          # Sample data seeder
│   └── index.js         # Entry point
└── client/
    └── src/
        ├── pages/       # React page components
        ├── components/  # Reusable UI components
        └── services/    # API service layer
```

## ✅ Features

| Feature | Details |
|---|---|
| 🔐 Auth | JWT + bcrypt, register/login/logout |
| 💳 Payments | Stripe PaymentIntents |
| 🛡️ Security | Helmet, CORS, rate limiting, input validation |
| 📦 Products | CRUD, categories, search |
| 🛒 Cart | Persistent cart in localStorage |
| 📋 Orders | Order creation & history |
| 🔒 Protected Routes | Admin & user role-based access |

## 🧪 Test Stripe Payments
Use card: `4242 4242 4242 4242` | Any future date | Any CVC
