# Finance Data Processing and Access Control Backend

A clean TypeScript backend for a finance dashboard system with:

This project is a backend application developed using TypeScript for managing financial data and user access control in a dashboard system. It focuses on building a clean, scalable, and well-structured backend with proper role-based access and data handling.

The application supports user management, financial record operations, and dashboard analytics, while ensuring that each user can only access data based on their role

- user and role management
- financial records CRUD
- dashboard summary analytics
- backend-enforced role-based access control
- validation, pagination, and consistent error responses
- SQLite persistence with seeded sample data

## Tech Stack

- Node.js + Express
- TypeScript
- SQLite using `better-sqlite3`
- Zod for request validation
- Supertest + Node test runner for API checks

## Why This Approach

The main goal of this project was to keep the backend simple, clean, and easy to understand while still following good design practices.

I chose Express + TypeScript + SQLite because it keeps the assignment focused on backend design rather than framework ceremony.

- Express keeps route flow easy to review.
- TypeScript improves clarity and reduces accidental mistakes.
- SQLite gives real persistence with very little setup overhead.
- `better-sqlite3` keeps data access straightforward and predictable for a take-home assignment.

The codebase is intentionally split into:

- `routes/` for HTTP concerns
- `services/` for business logic and database interaction
- `middleware/` for authentication, authorization, and error handling
- `db/` for schema setup and mapping
- `utils/` for reusable validation and error helpers

## Role Model

- `viewer`
  Can only access dashboard summary data.
- `analyst`
  Can view records and dashboard insights.
- `admin`
  Can manage users and perform full record CRUD.

Authentication is mocked with the `x-user-id` request header. This keeps the assignment simple while still demonstrating real backend authorization.

## Seeded Users

The app automatically seeds three users on first run:

- `1` Admin User
- `2` Analyst User
- `3` Viewer User

Use these ids in the `x-user-id` header when calling the API.

## Getting Started

```bash
npm install
npm run dev
```

The server starts on `http://localhost:3000`.

You can change the defaults with:

- `PORT`
- `DATABASE_PATH`

Example:

```bash
PORT=4000 DATABASE_PATH=./data/custom-finance.db npm run dev
```

## Scripts

```bash
npm run dev
npm run build
npm start
npm test
```

## API Overview

### Health

- `GET /health`

### Users

- `GET /api/users`
  Admin only. List all users.
- `GET /api/users/me`
  Any authenticated user. Show current authenticated user.
- `GET /api/users/:id`
  Admin only. Get one user.
- `POST /api/users`
  Admin only. Create a user.
- `PATCH /api/users/:id`
  Admin only. Update role, status, or name.

### Financial Records

- `GET /api/records`
  Analyst and admin only.
  Supports query params:
  - `type`
  - `category` (case-insensitive partial match)
  - `dateFrom`
  - `dateTo`
  - `page`
  - `pageSize`
  Returns pagination metadata with `total` and `totalPages`.
- `GET /api/records/:id`
  Analyst and admin only.
- `POST /api/records`
  Admin only.
- `PATCH /api/records/:id`
  Admin only.
- `DELETE /api/records/:id`
  Admin only.

### Dashboard

- `GET /api/dashboard/summary`
  Viewer, analyst, and admin can access this.
  Returns:
  - total income
  - total expenses
  - net balance
  - category breakdown
  - monthly trends
  - recent activity

## Example Requests

Get dashboard summary as viewer:

```bash
curl -H "x-user-id: 3" http://localhost:3000/api/dashboard/summary
```

List expense records as analyst:

```bash
curl -H "x-user-id: 2" "http://localhost:3000/api/records?type=expense&page=1&pageSize=5"
```

Create a record as admin:

```bash
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -d '{
    "amount": 4500,
    "type": "expense",
    "category": "Travel",
    "recordDate": "2026-04-02",
    "notes": "Airport pickup"
  }'
```

Create a user as admin:

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -d '{
    "name": "Priya Sharma",
    "email": "priya@example.com",
    "role": "analyst",
    "status": "active"
  }'
```

## Validation and Error Handling

The backend includes:

- schema validation for request payloads and filters
- consistent JSON error responses
- proper HTTP status codes
- invalid role/action protection through middleware
- inactive-user access blocking
- strict positive-integer validation for route ids
- date range guard (`dateFrom` cannot be after `dateTo`)

Error response shape:

```json
{
  "error": {
    "message": "Validation failed",
    "details": {}
  }
}
```

## Main Design Decisions

### 1. Mock Authentication, Real Authorization

The assignment says mock authentication is acceptable. So the app uses a lightweight request header for identity, but still enforces role permissions on the backend in a realistic way.

### 2. Thin Routes, Service-Led Logic

Routes mostly handle request/response flow. Business logic and persistence are pushed into services to keep the code more maintainable.

### 3. SQLite for Practical Persistence

SQLite keeps setup extremely simple for reviewers while still giving real database persistence, SQL querying, and aggregate reporting.

### 4. Aggregation at the Data Layer

Dashboard summaries are calculated with SQL aggregates instead of application-side loops. This keeps the code efficient and clear.

## Assumptions

- amounts are stored as non-negative numbers
- `type` determines whether an amount affects income or expense totals
- deleting a record is a hard delete for simplicity
- authorization is role-based only, not record-owner-based
- one request header is enough to simulate logged-in users for this assignment

## Possible Future Improvements

- JWT authentication
- soft delete and audit log support
- Swagger or OpenAPI documentation
- record ownership or team-based permissions
- more advanced analytics filters
- Docker setup and deployment config

## Submission Notes

This project is intentionally scoped to show backend thinking clearly:

- clean API design
- explicit access control
- maintainable code organization
- meaningful validation and error handling
- practical persistence and aggregation logic
