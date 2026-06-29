# 🚀 Dynamic Module Generator

<div align="center">

![Dynamic Module Generator](https://img.shields.io/badge/Dynamic%20Module%20Generator-v1.0.0-E66239?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)

**A full-stack, production-grade admin panel that auto-generates complete CRUD modules at runtime — no code regeneration, no server restarts.**

[Live Demo](#) · [Report Bug](#) · [Request Feature](#)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Key Features](#-key-features)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Database Design](#-database-design)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Security](#-security)

---

## 🧠 Overview

Dynamic Module Generator is a **no-code admin platform** where authenticated users can define custom data modules (like "Student Information", "Product Catalog", "Employee Records") via a UI form — and immediately get a fully working CRUD interface with list, create, edit, and delete pages — all **without writing a single line of code or restarting the server**.

### What Makes This Different

Most form builders just collect data. This system:

1. **Stores the module schema** in MongoDB (`modules` collection)
2. **Dynamically builds Mongoose models** at runtime via `dynamicDataRouter.js` — no static model files needed in production
3. **Auto-registers** all active modules on server boot so first requests are instant
4. **Generates generic React pages** (`ModuleDataPage`, `ModuleDataFormPage`) using wildcard routes — no per-module component files in production
5. **Auto-creates MongoDB collections** for every new module on the fly

```
User defines fields in UI
        ↓
Module saved to MongoDB (modules collection)
        ↓
dynamicDataRouter resolves schema → builds Mongoose model → creates collection
        ↓
React wildcard route /:moduleSlug renders generic CRUD pages
        ↓
Full working module — ZERO manual coding
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)              │
│                                                             │
│  LoginPage  RegisterPage  DashboardPage  ModulesPage        │
│       ↓           ↓            ↓              ↓             │
│  AuthStore   ModuleStore  PageVisitStore  VisitorStore       │
│       ↓                        ↓                            │
│  Wildcard Routes: /:moduleSlug → ModuleDataPage             │
│                   /:moduleSlug/new → ModuleDataFormPage      │
│                   /:moduleSlug/:id/edit → ModuleDataFormPage │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS / Axios
┌───────────────────────────▼─────────────────────────────────┐
│                    BACKEND (Node.js + Express)               │
│                                                             │
│  /api/auth/*         → authRoutes → authController          │
│  /api/modules/*      → moduleRoutes → moduleController      │
│  /api/page-visits/*  → pageVisitRoutes                      │
│  /api/visitors/*     → visitorRoutes                        │
│  /api/:moduleSlug/*  → dynamicDataRouter (resolveModel)     │
│                                                             │
│  Middleware: helmet · cors · rate-limit · JWT · multer      │
└───────────────────────────┬─────────────────────────────────┘
                            │ Mongoose
┌───────────────────────────▼─────────────────────────────────┐
│                    MongoDB Atlas                             │
│                                                             │
│  users · modules · pagevisits · visitors                    │
│  [dynamic collections: one per module slug]                 │
└─────────────────────────────────────────────────────────────┘
                            │
                    Cloudinary CDN
                   (file / image uploads)
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | 18+ | Runtime |
| **Express.js** | 4.19 | HTTP framework |
| **Mongoose** | 8.4 | MongoDB ODM |
| **MongoDB Atlas** | Cloud | Database |
| **jsonwebtoken** | 9.x | JWT access & refresh tokens |
| **bcryptjs** | 2.x | Password hashing (salt rounds: 12) |
| **multer** | 2.x | Multipart file upload handling |
| **multer-storage-cloudinary** | 4.x | Stream uploads directly to Cloudinary |
| **cloudinary** | 1.x | CDN file storage (images, docs) |
| **helmet** | 7.x | HTTP security headers |
| **express-rate-limit** | 7.x | Rate limiting (20 req/15min on auth, 200 on API) |
| **express-validator** | 7.x | Request body validation |
| **exceljs** | 4.x | Excel export (`.xlsx`) |
| **pdfkit** | 0.19 | PDF export |
| **winston** | 3.x | Structured logging |
| **morgan** | 1.x | HTTP request logger |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | 18.3 | UI framework |
| **Vite** | 5.x | Build tool & dev server |
| **React Router v6** | 6.23 | Client-side routing (wildcard pattern) |
| **Zustand** | 4.5 | Lightweight global state management |
| **Axios** | 1.7 | HTTP client |
| **React Hook Form** | 7.x | Form state & validation |
| **Zod** | 3.x | Schema-based validation |
| **Bootstrap** | 5.3 | CSS framework |
| **Framer Motion** | 11.x | Animations |
| **@dnd-kit** | 6/8.x | Drag-and-drop field reordering |
| **Recharts** | 2.x | Dashboard bar charts |
| **react-hot-toast** | 2.x | Toast notifications |
| **date-fns** | 2.x | Date formatting utilities |
| **@tabler/icons-webfont** | 3.x | Icon library |

---

## ✨ Key Features

### 🔐 Authentication & Authorization
- JWT-based auth with **access token** (7d) + **refresh token** (30d)
- Bcrypt password hashing with salt rounds 12
- Refresh token rotation — stores last 5 tokens per user
- Protected routes (frontend `ProtectedRoute` + backend `authenticate` middleware)
- Guest-only routes (prevent logged-in users accessing login/register)
- Role-based access: `admin` / `user`

### ⚙️ Dynamic Module Engine
- **Admin UI** to define a module: name, description, icon, permissions, fields
- **15+ field types** supported: `text`, `email`, `password`, `number`, `textarea`, `checkbox`, `radio`, `select`, `date`, `datetime-local`, `file`, `url`, `tel`, `color`, `range`
- **Auto field name generation**: `"First Name"` → `first_name` (snake_case)
- **Auto slug generation**: `"Student Info"` → `student-info`
- **Per-field settings**: required, min/max, pattern, placeholder, default value, colSpan (full/half), showInTable
- **Checkbox field** supports single-select (radio-like) or multi-select mode
- **Layout control**: `colSpan: full` or `colSpan: half` — two fields side-by-side
- **Permissions**: configure which actions (View / Edit / Delete) are available per module
- **Active/Inactive** toggle — deactivates module without deleting data

### 🗄️ Dynamic Data Router (Core Innovation)
```
POST   /api/:moduleSlug       → create record
GET    /api/:moduleSlug       → list records (paginated, searchable)
GET    /api/:moduleSlug/:id   → get single record
PUT    /api/:moduleSlug/:id   → update record
DELETE /api/:moduleSlug/:id   → delete record
GET    /api/:moduleSlug/export/excel → download .xlsx
GET    /api/:moduleSlug/export/pdf   → download landscape PDF
```
Every request resolves the Mongoose model **fresh from DB** to stay in sync with schema changes.

### 📁 File Uploads via Cloudinary
- `multer-storage-cloudinary` streams files directly to Cloudinary CDN
- Organized by module: `dynamic-modules/{moduleSlug}/{fieldname}_{timestamp}`
- Images auto-optimized (`quality: auto, fetch_format: auto`)
- Allowed types: jpeg, jpg, png, gif, webp, svg, pdf, doc, docx, xls, xlsx, csv, txt, zip
- Max file size: **10 MB**

### 📊 Dashboard Analytics
- Total/Active/Inactive module counts
- Total field count across all modules
- **Field type distribution bar chart** (Recharts)
- Recent modules list with record counts
- **Page Visit tracking** — records every page view with path, label, bounce rate
- **Visitor tracking** — logs IP, country (flag emoji), device type (Mobile/Tablet/Desktop/Bot), browser, page

### 📤 Data Export
- **Excel (.xlsx)**: styled headers with brand color (`#E66239`), all field columns, timestamps
- **PDF**: landscape A4, paginated table, brand-colored headers, auto-truncates long values

### 🎨 UI/UX Highlights
- Two-column form layout with drag-to-reorder fields (`@dnd-kit`)
- `FormPreviewPanel` — live preview with width toggle (full/half)
- Fixed-position dropdown menus using `getBoundingClientRect()` — escape overflow clipping
- Stable pagination — no layout shift on page change
- Skeleton loaders on every data list
- `position: fixed` modals with backdrop blur
- All styles in dedicated `.css` files — no inline `<style>` tags in JSX

---

## 📁 Project Structure

```
project/
├── be/                              # Backend (Node.js + Express)
│   ├── src/
│   │   ├── server.js                # Entry point — Express app, all middleware, startup model sync
│   │   ├── config/
│   │   │   ├── database.js          # MongoDB Atlas connection
│   │   │   ├── ensureIndexes.js     # Index management on startup
│   │   │   ├── logger.js            # Winston logger config
│   │   │   └── seed.js              # Database seeder
│   │   ├── controllers/
│   │   │   ├── authController.js    # register, login, refresh, logout, getMe, updateProfile, changePassword
│   │   │   ├── moduleController.js  # getModules, getModule, createModule, updateModule, deleteModule,
│   │   │   │                        #   toggleStatus, addField, removeField, getStats
│   │   │   ├── pageVisitController.js
│   │   │   ├── visitorController.js
│   │   │   └── [auto-generated/]    # Legacy per-module controllers (dev only)
│   │   ├── models/
│   │   │   ├── Module.js            # Core schema — modules + nested fieldSchema
│   │   │   ├── User.js              # User schema with bcrypt + refresh tokens
│   │   │   ├── PageVisit.js
│   │   │   ├── Visitor.js
│   │   │   └── [auto-generated/]    # Legacy per-module models (dev only)
│   │   ├── routes/
│   │   │   ├── authRoutes.js        # POST /register /login /refresh /logout; GET/PUT /me
│   │   │   ├── moduleRoutes.js      # Full CRUD + stats + addField/removeField
│   │   │   ├── dynamicDataRouter.js # ★ Wildcard CRUD for all module data
│   │   │   ├── pageVisitRoutes.js
│   │   │   ├── visitorRoutes.js
│   │   │   └── [auto-generated/]    # Legacy per-module routes (dev only)
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT authenticate + authorize(roles)
│   │   │   ├── upload.js            # Multer + Cloudinary storage config
│   │   │   ├── errorHandler.js      # Global AppError + errorHandler
│   │   │   └── validate.js          # express-validator result handler
│   │   └── utils/
│   │       ├── feFileGenerator.js   # FE page generator (dev-only)
│   │       └── parseUserAgent.js    # UA string → device/browser detection
│   ├── .env.example
│   └── package.json
│
└── fe/                              # Frontend (React + Vite)
    ├── src/
    │   ├── main.jsx                 # React entry — mounts App
    │   ├── App.jsx                  # Router — all routes defined here
    │   ├── index.css                # Global styles, CSS variables
    │   ├── pages/
    │   │   ├── DashboardPage.jsx    # Stats, charts, recent modules, page visits, visitors
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── ModulesPage.jsx      # Module list with search, filter, toggle
    │   │   ├── ModuleFormPage.jsx   # Create/Edit module — two-column layout
    │   │   ├── ModuleDetailPage.jsx # Module schema viewer
    │   │   ├── ModuleDataPage.jsx   # ★ Generic list page for any module
    │   │   ├── ModuleDataFormPage.jsx # ★ Generic form page for any module
    │   │   ├── PageVisitsPage.jsx
    │   │   ├── VisitorsPage.jsx
    │   │   ├── ProfilePage.jsx
    │   │   ├── NotFoundPage.jsx
    │   │   └── modules/             # Legacy per-module pages (dev reference)
    │   ├── components/
    │   │   ├── auth/
    │   │   │   ├── ProtectedRoute.jsx
    │   │   │   └── GuestRoute.jsx
    │   │   ├── layout/
    │   │   │   └── AppLayout.jsx    # Sidebar + topbar layout shell
    │   │   ├── common/
    │   │   │   └── ConfirmDeleteModal.jsx
    │   │   └── modules/
    │   │       ├── FieldEditor.jsx  # Individual field row editor
    │   │       ├── FormPreviewPanel.jsx # Live drag-to-reorder field preview
    │   │       ├── GenericFormPage.jsx
    │   │       └── GenericListPage.jsx
    │   ├── context/                 # Zustand stores
    │   │   ├── authStore.js         # user, token, login/logout/register
    │   │   ├── moduleStore.js       # modules, stats, CRUD actions
    │   │   ├── moduleDataStore.js   # records, pagination, CRUD for any module
    │   │   ├── pageVisitStore.js
    │   │   └── visitorStore.js
    │   ├── hooks/
    │   │   └── useVisitorTrack.js   # Tracks page visits on route change
    │   └── utils/
    │       ├── api.js               # Axios instance with auth interceptors
    │       ├── dateUtils.js         # date-fns wrappers
    │       └── fieldTypes.js        # Field type definitions + icons
    ├── .env.example
    ├── vite.config.js
    └── package.json
```

---

## 📡 API Reference

### Auth Endpoints
```
POST   /api/auth/register          Register new user
POST   /api/auth/login             Login → returns accessToken + refreshToken
POST   /api/auth/refresh           Rotate refresh token
POST   /api/auth/logout            Invalidate refresh token
GET    /api/auth/me                Get current user
PUT    /api/auth/me                Update profile (name)
PUT    /api/auth/change-password   Change password
```

### Module Endpoints
```
GET    /api/modules                List modules (search, filter, paginate, sort)
POST   /api/modules                Create module
GET    /api/modules/stats          Get stats (total/active/inactive + field type counts)
GET    /api/modules/:id            Get single module
PUT    /api/modules/:id            Update module
DELETE /api/modules/:id            Delete module + drop collection
PATCH  /api/modules/:id/toggle     Toggle active/inactive
POST   /api/modules/:id/fields     Add a field
DELETE /api/modules/:id/fields/:fieldId   Remove a field
```

### Dynamic Data Endpoints
```
GET    /api/:moduleSlug            List records (page, limit, search)
POST   /api/:moduleSlug            Create record (supports file upload)
GET    /api/:moduleSlug/:id        Get single record
PUT    /api/:moduleSlug/:id        Update record (supports file upload)
DELETE /api/:moduleSlug/:id        Delete record
GET    /api/:moduleSlug/export/excel  Download Excel
GET    /api/:moduleSlug/export/pdf    Download PDF
```

### Analytics Endpoints
```
POST   /api/page-visits            Record a page visit
GET    /api/page-visits            List page visits (paginated)
GET    /api/page-visits/top        Top visited pages
POST   /api/visitors               Record a visitor
GET    /api/visitors               List visitors
GET    /api/visitors/stats         Visitor stats (total, today, week, month, byDevice)
```

> All endpoints except `/api/auth/register`, `/api/auth/login`, and `/health` require `Authorization: Bearer <token>` header.

---

## 🗃️ Database Design

### `modules` Collection
```js
{
  moduleName:   String,           // "Student Information"
  moduleSlug:   String,           // "student-information" (auto-generated)
  description:  String,
  icon:         String,           // Tabler icon name
  permissions: {
    canView:   Boolean,
    canEdit:   Boolean,
    canDelete: Boolean,
  },
  fields: [{
    fieldLabel:    String,        // "First Name"
    fieldName:     String,        // "first_name" (auto-generated)
    fieldType:     String,        // "text" | "email" | "checkbox" | ...
    placeholder:   String,
    defaultValue:  Mixed,
    options:       [{ label, value }],   // for select/radio/checkbox
    validations:   { required, minLength, maxLength, min, max, pattern },
    order:         Number,
    isVisible:     Boolean,
    showInTable:   Boolean,
    selectionType: String,        // "single" | "multiple" (checkbox only)
    colSpan:       String,        // "full" | "half"
  }],
  isActive:   Boolean,
  createdBy:  ObjectId → User,
  updatedBy:  ObjectId → User,
  createdAt:  Date,
  updatedAt:  Date,
}
```

### Dynamic Module Collections
Each module gets its own MongoDB collection named after its `moduleSlug`. The schema is built dynamically:

| Field Type | Mongoose Type |
|---|---|
| `text`, `email`, `textarea`, `select`, `radio`, `url`, `tel`, `color`, `password` | `String` |
| `number`, `range` | `Number` |
| `checkbox` | `[String]` (array of selected values) |
| `date`, `datetime-local` | `Date` |
| `file` | `String` (Cloudinary URL) |

Every dynamic record also gets `_createdBy`, `_updatedBy` (ObjectId refs), and `createdAt`/`updatedAt` timestamps.

### `users` Collection
```js
{
  name:          String,
  email:         String (unique, lowercase),
  password:      String (bcrypt, hidden from queries),
  role:          "admin" | "user",
  isActive:      Boolean,
  lastLogin:     Date,
  refreshTokens: [{ token, createdAt }],  // max 5 stored
}
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js **18+**
- npm or yarn
- MongoDB Atlas account (free tier works)
- Cloudinary account (free tier: 25GB storage)

### 1. Clone & Install

```bash
# Clone the repo
git clone https://github.com/your-username/dynamic-module-generator.git
cd dynamic-module-generator

# Install backend dependencies
cd be && npm install

# Install frontend dependencies
cd ../fe && npm install
```

### 2. Configure Environment Variables

**Backend** (`be/.env`):
```env
PORT=5000
NODE_ENV=development

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/dynamic_module_gen?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret_key_min_32_chars
JWT_REFRESH_EXPIRES_IN=30d

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# CORS
CLIENT_URL=http://localhost:5173
```

**Frontend** (`fe/.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Seed the Database (Optional)
```bash
cd be
npm run seed
```

### 4. Start Development Servers

```bash
# Terminal 1 — Backend (with nodemon)
cd be && npm run dev

# Terminal 2 — Frontend (Vite)
cd fe && npm run dev
```

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`
- Health check: `http://localhost:5000/health`

---

## 🔧 Environment Variables

### Backend

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 5000) |
| `NODE_ENV` | Yes | `development` or `production` |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Min 32 chars — signs access tokens |
| `JWT_EXPIRES_IN` | No | Access token TTL (default: `7d`) |
| `JWT_REFRESH_SECRET` | Yes | Min 32 chars — signs refresh tokens |
| `JWT_REFRESH_EXPIRES_IN` | No | Refresh token TTL (default: `30d`) |
| `CLOUDINARY_CLOUD_NAME` | Yes* | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes* | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes* | Cloudinary API secret |
| `FE_DIST_DIR` | No | Custom path to frontend build folder |

> *Required only if you use `file` type fields in modules.

### Frontend

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Backend API base URL |

---

## 🌐 Deployment

### Deploy to Render

**Backend (Web Service)**
```
Build Command:  npm install
Start Command:  node src/server.js
Root Directory: be
```
> ⚠️ Use `node src/server.js` — **not** `nodemon`. Nodemon causes restart loops in production when `writeModuleFiles()` writes to disk.

**Frontend (Static Site)**
```
Build Command:  npm install && npm run build
Publish Dir:    dist
Root Directory: fe
```
Set environment variable `VITE_API_URL` to your backend Render URL before building.

**Monorepo on Single Render Service**
Set `FE_DIST_DIR` env var on the backend service to point to the built frontend folder. The backend will serve the React SPA and fall back to `index.html` for client-side routes.

### MongoDB Atlas
- Create a free cluster (M0)
- Whitelist Render's IP (or use `0.0.0.0/0` for simplicity)
- Create a DB user with read/write access
- Copy the connection string into `MONGODB_URI`

### Cloudinary
- Create a free account at cloudinary.com
- Copy Cloud Name, API Key, API Secret from Dashboard

---

## 🔒 Security

| Layer | Implementation |
|---|---|
| **HTTP Headers** | Helmet.js — disables X-Powered-By, sets CSP, HSTS, etc. |
| **CORS** | Configured for all Render subdomains + localhost |
| **Rate Limiting** | Auth routes: 20 req/15min · API routes: 200 req/15min |
| **Passwords** | Bcrypt with 12 salt rounds |
| **JWT** | Short-lived access tokens (7d) + rotating refresh tokens (30d) |
| **Refresh Tokens** | Max 5 stored per user — oldest dropped on overflow |
| **Input Validation** | express-validator on all POST/PUT bodies |
| **File Uploads** | Extension whitelist + 10MB limit + Cloudinary CDN (no local disk) |
| **Trust Proxy** | Enabled for correct IP detection behind Render/Heroku reverse proxy |
| **Production Guard** | `writeModuleFiles()` / `registerDynamicModel()` skipped in production |

---

## 🧩 Supported Field Types

| Type | Input | Storage | Notes |
|---|---|---|---|
| `text` | Text input | String | General purpose |
| `email` | Email input | String | Browser validation |
| `password` | Password input | String | Masked input |
| `number` | Number input | Number | Supports min/max |
| `range` | Slider | Number | Supports min/max |
| `textarea` | Multi-line text | String | |
| `select` | Dropdown | String | Requires options |
| `radio` | Radio buttons | String | Requires options |
| `checkbox` | Checkboxes | [String] | Multi or single-select mode |
| `date` | Date picker | Date | |
| `datetime-local` | Date+time picker | Date | |
| `file` | File upload | String | Cloudinary URL |
| `url` | URL input | String | |
| `tel` | Phone input | String | |
| `color` | Color picker | String | Hex value |

---

## 🤝 Contributing

1. Fork the repo
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

<div align="center">

Built with ❤️ using React, Node.js, MongoDB, and Express

</div>