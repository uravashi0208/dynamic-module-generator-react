# 🧩 Dynamic Module Generator

A full-stack application for building dynamic data modules with custom fields — built with **React 18**, **Node.js/Express**, and **MongoDB Atlas**.

---

## 📁 Project Structure

```
dynamic-module-gen/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js     # MongoDB Atlas connection
│   │   │   ├── logger.js       # Winston logger
│   │   │   └── seed.js         # Default admin seeder
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   └── moduleController.js
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT authenticate + authorize
│   │   │   ├── errorHandler.js
│   │   │   └── validate.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   └── Module.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   └── moduleRoutes.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
└── frontend/                   # React 18 + Vite
    ├── src/
    │   ├── components/
    │   │   ├── auth/
    │   │   │   ├── ProtectedRoute.jsx
    │   │   │   └── GuestRoute.jsx
    │   │   ├── layout/
    │   │   │   └── AppLayout.jsx
    │   │   └── modules/
    │   │       └── FieldEditor.jsx
    │   ├── context/
    │   │   ├── authStore.js    # Zustand auth store
    │   │   └── moduleStore.js  # Zustand module store
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   ├── ModulesPage.jsx
    │   │   ├── ModuleFormPage.jsx
    │   │   ├── ModuleDetailPage.jsx
    │   │   ├── ProfilePage.jsx
    │   │   └── NotFoundPage.jsx
    │   ├── utils/
    │   │   ├── api.js          # Axios instance + interceptors
    │   │   └── fieldTypes.js   # Field type definitions
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── .env.example
    └── package.json
```

---

## ⚙️ Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | https://nodejs.org |
| npm | 9+ | Included with Node.js |
| MongoDB Atlas | Free tier | https://cloud.mongodb.com |

---

## 🗄️ MongoDB Atlas Setup

1. Go to https://cloud.mongodb.com and sign up (free)
2. Create a new **Cluster** (M0 Free Tier)
3. Under **Database Access** → Add a new database user with a password
4. Under **Network Access** → Add IP Address → `0.0.0.0/0` (allow all, or your specific IP)
5. Click **Connect** → **Connect your application** → copy the URI
6. Replace `<username>` and `<password>` in the URI with your actual credentials

Example URI:
```
mongodb+srv://myuser:mypassword@cluster0.abcde.mongodb.net/dynamic_module_gen?retryWrites=true&w=majority
```

---

## 🚀 Installation & Setup

### Step 1 — Clone and navigate
```bash
git clone <your-repo-url>
cd dynamic-module-gen
```

### Step 2 — Backend setup
```bash
cd backend

# Install all dependencies
npm install

# Copy env file and configure it
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/dynamic_module_gen?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_here_change_this
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret_key_min_32_chars_change_this
JWT_REFRESH_EXPIRES_IN=30d
CLIENT_URL=http://localhost:3000
```

### Step 3 — Seed default admin user
```bash
# From backend/ directory
npm run seed
# Output: ✅ Admin seeded: admin@admin.com / Admin@123456
```

### Step 4 — Start backend
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```
Backend runs at: http://localhost:5000

### Step 5 — Frontend setup (new terminal)
```bash
cd frontend

# Install all dependencies
npm install

# Copy env file
cp .env.example .env
```

The default `.env` points to `http://localhost:5000/api` via Vite proxy — no changes needed for local dev.

### Step 6 — Start frontend
```bash
npm run dev
```
Frontend runs at: http://localhost:3000

---

## 📦 Full Dependency Install Commands

### Backend
```bash
cd backend
npm install express mongoose bcryptjs jsonwebtoken cors helmet morgan express-rate-limit express-validator dotenv winston
npm install --save-dev nodemon
```

### Frontend
```bash
cd frontend
npm install react react-dom react-router-dom react-hook-form @hookform/resolvers zod zustand axios react-hot-toast lucide-react recharts clsx date-fns framer-motion @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install --save-dev vite @vitejs/plugin-react tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

---

## 🔐 Authentication Flow

| Route | Access | Description |
|-------|--------|-------------|
| `/login` | Public only | Redirect to dashboard if logged in |
| `/register` | Public only | Redirect to dashboard if logged in |
| `/dashboard` | Private | Redirect to login if not authenticated |
| `/modules` | Private | Redirect to login if not authenticated |
| `/modules/new` | Private | Redirect to login if not authenticated |
| `/modules/:id` | Private | Redirect to login if not authenticated |
| `/modules/:id/edit` | Private | Redirect to login if not authenticated |
| `/profile` | Private | Redirect to login if not authenticated |

**Token Management:**
- Access token stored in `localStorage` (7 day expiry)
- Refresh token stored in `localStorage` (30 day expiry)
- Auto-refresh: Axios interceptor silently refreshes expired access tokens
- Persisted login: Zustand `persist` middleware keeps auth state across browser sessions

---

## 🌐 API Endpoints

### Auth
```
POST   /api/auth/register         Register new admin
POST   /api/auth/login            Login
POST   /api/auth/refresh          Refresh access token
POST   /api/auth/logout           Logout (clears refresh token)
GET    /api/auth/me               Get current user profile
PUT    /api/auth/me               Update profile name
PUT    /api/auth/change-password  Change password
```

### Modules (all protected — Bearer token required)
```
GET    /api/modules                     List modules (pagination, search, filter)
POST   /api/modules                     Create module
GET    /api/modules/stats/summary       Dashboard stats
GET    /api/modules/:id                 Get single module
PUT    /api/modules/:id                 Update module
DELETE /api/modules/:id                 Delete module
PATCH  /api/modules/:id/toggle-status  Toggle active/inactive
POST   /api/modules/:id/fields         Add field to module
DELETE /api/modules/:id/fields/:fid    Remove field from module
```

---

## 🎛️ Supported Field Types

| Type | Category | Description |
|------|----------|-------------|
| `text` | Basic | Single line text |
| `email` | Basic | Email with validation |
| `password` | Basic | Masked password input |
| `number` | Basic | Numeric input |
| `textarea` | Basic | Multi-line text |
| `checkbox` | Choice | Boolean or multi-select |
| `radio` | Choice | Single-select from options |
| `select` | Choice | Dropdown with options |
| `date` | Date & Time | Date picker |
| `datetime-local` | Date & Time | Date + time picker |
| `file` | Advanced | File upload |
| `url` | Advanced | URL with validation |
| `tel` | Advanced | Phone number |
| `color` | Advanced | Color picker |
| `range` | Advanced | Slider with min/max |

---

## 🛡️ Security Features

- **Helmet.js** — HTTP security headers
- **CORS** — Restricted to configured client URL
- **Rate Limiting** — Auth: 20 req/15min, API: 200 req/15min
- **Password Hashing** — bcrypt with salt rounds 12
- **JWT** — Short-lived access + long-lived refresh token pattern
- **Input Validation** — express-validator (server) + Zod (client)
- **MongoDB Injection** — Mongoose schema validation

---

## 🧑‍💻 Default Admin Credentials

After running `npm run seed` in the backend:

| Field | Value |
|-------|-------|
| Email | `admin@admin.com` |
| Password | `Admin@123456` |

> ⚠️ Change these credentials immediately after first login in production!

---

## 🏗️ Build for Production

### Backend
```bash
cd backend
NODE_ENV=production npm start
```

### Frontend
```bash
cd frontend
npm run build
# Output in frontend/dist/
```

Serve `dist/` with nginx, Vercel, or any static host. Set `VITE_API_URL` to your production API URL before building.
