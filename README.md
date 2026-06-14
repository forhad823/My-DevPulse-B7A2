# DevPulse — Internal Tech Issue & Feature Tracker

> A collaborative REST API platform for software teams to report bugs, suggest features, and coordinate resolutions.

**Live URL:** [https://devpulse-b7a2-iota.vercel.app](https://devpulse-b7a2-iota.vercel.app)

---

## 📌 Features

- **User Authentication** — Secure registration and login with JWT access tokens and HTTP-only refresh token cookies
- **Role-Based Authorization** — Two roles (`contributor`, `maintainer`) with different permission levels enforced at the middleware level
- **Issue Management** — Create, read, update, and delete bug reports or feature requests
- **Dynamic Filtering & Sorting** — Filter issues by `type` and `status`; sort by newest or oldest
- **Reporter Details** — Issue responses include full reporter info fetched via batch queries (no SQL JOINs)
- **Password Security** — All passwords are hashed with bcrypt (salt rounds: 12) and never exposed in any response
- **Custom Logging** — Every request is logged to a `logger.txt` file with method, URL, and timestamp
- **Consistent Response Format** — All endpoints follow a unified success/error response structure
- **Deployed on Vercel** — Serverless deployment with environment-based configuration

---

## 🛠️ Tech Stack

| Technology     | Version  | Purpose                                  |
| -------------- | -------- | ---------------------------------------- |
| Node.js        | 24.x+    | Runtime environment                      |
| TypeScript     | ^6.0.3   | Static typing and type safety            |
| Express.js     | ^5.2.1   | Web framework and routing                |
| PostgreSQL      | —        | Relational database                      |
| `pg`           | ^8.21.0  | Native PostgreSQL driver (raw SQL only)  |
| `bcryptjs`     | ^3.0.3   | Password hashing                         |
| `jsonwebtoken` | ^9.0.3   | JWT generation and verification          |
| `cookie-parser`| ^1.4.7   | HTTP cookie parsing                      |
| `cors`         | ^2.8.6   | Cross-Origin Resource Sharing            |
| `dotenv`       | ^17.4.2  | Environment variable management          |
| `tsup`         | ^8.5.1   | TypeScript bundler for production builds |
| `tsx`          | ^4.22.4  | TypeScript execution for development     |

---

## ⚙️ Local Setup

### Prerequisites

- Node.js 24.x or higher
- A running PostgreSQL database (local or cloud — e.g., NeonDB, Supabase)

### 1. Clone the repository

```bash
git clone https://github.com/forhad823/My-DevPulse-B7A2.git
cd devpulse-b7a2
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory with the following keys:

```env
PORT=5000
CONNECTIONSTRING=your_postgresql_connection_string_here
JWT_SECRET=your_jwt_access_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
```

### 4. Run the development server

```bash
npm run dev
```

The server will start at `http://localhost:5000`.

### 5. Build for production

```bash
npm run build
npm start
```

---

## 🌐 API Endpoints

Base URL (local): `http://localhost:5000`  
Base URL (live): `https://devpulse-b7a2-iota.vercel.app`

### 🔐 Authentication

| Method | Endpoint          | Access  | Description                        |
| ------ | ----------------- | ------- | ---------------------------------- |
| `POST` | `/api/auth/signup`| Public  | Register a new user account        |
| `POST` | `/api/auth/login` | Public  | Authenticate and receive JWT token |

#### POST `/api/auth/signup` — Request Body

```json
{
  "name": "John Doe",
  "email": "john.doe@devpulse.com",
  "password": "securePassword123",
  "role": "contributor"
}
```

#### POST `/api/auth/login` — Request Body

```json
{
  "email": "john.doe@devpulse.com",
  "password": "securePassword123"
}
```

---

### 📋 Issues

All protected routes require the header:
```
Authorization: <JWT_TOKEN>
```

| Method   | Endpoint          | Access                    | Description                              |
| -------- | ----------------- | ------------------------- | ---------------------------------------- |
| `POST`   | `/api/issues`     | Authenticated             | Create a new bug report or feature request |
| `GET`    | `/api/issues`     | Public                    | Get all issues (with optional filters)   |
| `GET`    | `/api/issues/:id` | Public                    | Get full details of a single issue       |
| `PATCH`  | `/api/issues/:id` | Authenticated             | Update issue title, description, or type |
| `DELETE` | `/api/issues/:id` | Maintainer only           | Permanently delete an issue              |

#### GET `/api/issues` — Query Parameters

| Parameter | Allowed Values                    | Default  | Description          |
| --------- | --------------------------------- | -------- | -------------------- |
| `sort`    | `newest`, `oldest`                | `newest` | Sort order by date   |
| `type`    | `bug`, `feature_request`          | (none)   | Filter by issue type |
| `status`  | `open`, `in_progress`, `resolved` | (none)   | Filter by status     |

**Example:** `GET /api/issues?sort=oldest&type=bug&status=open`

#### POST `/api/issues` — Request Body

```json
{
  "title": "Database connection timeout under load",
  "description": "Pool exhausts after 50+ concurrent queries, causing 500 errors",
  "type": "bug"
}
```

---

### 📦 Standard Response Format

**Success**
```json
{
  "success": true,
  "message": "Operation description",
  "data": { }
}
```

**Error**
```json
{
  "success": false,
  "message": "Error description",
  "errors": "Error details"
}
```

---

## 🗄️ Database Schema

### Table: `users`

| Column       | Type          | Constraints                                         |
| ------------ | ------------- | --------------------------------------------------- |
| `id`         | `SERIAL`      | Primary Key, Auto-increment                         |
| `name`       | `VARCHAR(100)`| NOT NULL                                            |
| `email`      | `VARCHAR(255)`| UNIQUE, NOT NULL                                    |
| `password`   | `TEXT`        | NOT NULL (stored as bcrypt hash, never returned)    |
| `role`       | `VARCHAR(20)` | DEFAULT `'contributor'`, CHECK (`contributor` \| `maintainer`) |
| `created_at` | `TIMESTAMP`   | DEFAULT `NOW()`                                     |
| `updated_at` | `TIMESTAMP`   | DEFAULT `NOW()`                                     |

### Table: `issues`

| Column        | Type          | Constraints                                                        |
| ------------- | ------------- | ------------------------------------------------------------------ |
| `id`          | `SERIAL`      | Primary Key, Auto-increment                                        |
| `title`       | `VARCHAR(150)`| NOT NULL                                                           |
| `description` | `TEXT`        | NOT NULL, CHECK (`LENGTH >= 20`)                                   |
| `type`        | `VARCHAR(20)` | NOT NULL, CHECK (`bug` \| `feature_request`)                       |
| `status`      | `VARCHAR(20)` | DEFAULT `'open'`, CHECK (`open` \| `in_progress` \| `resolved`)    |
| `reporter_id` | `INT`         | NOT NULL (references `users.id`, validated in application logic)   |
| `created_at`  | `TIMESTAMP`   | DEFAULT `NOW()`                                                    |
| `updated_at`  | `TIMESTAMP`   | DEFAULT `NOW()`                                                    |

> **Note:** Tables are auto-created on server startup via `initDB()` using `CREATE TABLE IF NOT EXISTS`.  
> There is no formal foreign key constraint on `reporter_id` — referential integrity is enforced at the application level.

---

## 👥 User Roles & Permissions

| Action                          | contributor | maintainer |
| ------------------------------- | :---------: | :--------: |
| Register & Login                | ✅          | ✅         |
| Create issue                    | ✅          | ✅         |
| View all / single issue         | ✅          | ✅         |
| Update **own** issue (status: `open` only) | ✅ | ✅      |
| Update **any** issue            | ❌          | ✅         |
| Change issue status             | ❌          | ✅         |
| Delete any issue                | ❌          | ✅         |

---

## 📁 Project Structure

```
src/
├── app.ts                    # Express app setup, middleware, routes
├── server.ts                 # Entry point — starts server and DB
├── config/
│   └── index.ts              # Environment variable config (dotenv)
├── db/
│   └── index.ts              # PostgreSQL pool + initDB (table creation)
├── middleware/
│   ├── auth.ts               # JWT verification + role-based access control
│   ├── globalErrorHandler.ts # Centralized error handling middleware
│   ├── logger.ts             # Request logger (console + logger.txt)
│   └── index.d.ts            # Express Request type augmentation
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.route.ts
│   │   └── auth.interface.ts
│   ├── issues/
│   │   ├── issues.controller.ts
│   │   ├── issues.service.ts
│   │   ├── issues.route.ts
│   │   └── issues.interface.ts
│   └── user/
│       └── user.service.ts
├── types/
│   └── index.ts              # Shared ROLES constant and ROLES type
└── utility/
    ├── sendResponse.ts       # Reusable success/error response helpers
    ├── validate_issue.ts     # Issue input validation logic
    └── roles.ts              # Roles array for validation
```

---

## 🚀 Deployment

This project is deployed on **Vercel**.  
The database is hosted on a cloud PostgreSQL provider NeonDB .

Configure the same `.env` variables in your Vercel project settings under **Environment Variables**.

---

*Built by **Forhad Uddin** as part of Programming Hero — Level 2, Next Level Web Development (Batch 7, Assignment 2).*
