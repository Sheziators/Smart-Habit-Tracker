# Habit Tracker (React + Node.js + MySQL)
## Quick start (development)

### 1) MySQL
Create a database and run the SQL script:
```bash

mysql -u root -p < db/init.sql
```
or run the SQL statements inside `db/init.sql` in your preferred MySQL client.

Default DB name: `habitdb`

### 2) Backend
```bash
cd backend
cp .env.example .env
# edit .env if needed
npm install
npm run dev
```
Backend runs at http://localhost:4000 by default.

### 3) Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at http://localhost:5173 (Vite default) and talks to the backend.

## What is included
- CRUD habits endpoints
- Mark habit complete endpoint
- Completions fetching
- Basic analytics endpoints (current/longest streak, completion %)
- Minimal React UI: list habits, add habit, mark complete, view analytics

## Notes
This is a minimal educational scaffold. For production:
- Add authentication (per-user data)
- Secure environment variables
- Use migrations instead of raw SQL
- Add input validation and tests

