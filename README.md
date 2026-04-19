# Expense Tracker

Personal expense tracking with a **Django REST API** (JWT + PostgreSQL) and a **React** web app (**Vite**, TypeScript, Tailwind CSS, Framer Motion).

## Features

- Register and sign in; **JWT** access and refresh tokens
- **Categories** per user (create, list, delete)
- **Expenses** with amount, currency, datetime, optional category, note (CRUD + filters)
- Paginated expense list; filters by category and date range (`date_from` / `date_to`)
- Responsive dashboard UI with animations

## Repository layout

| Path | Purpose |
|------|---------|
| `expense_tracker/` | Django project (`manage.py`), settings, **`expenses`** app (models, API) |
| `frontend/` | React SPA; dev server proxies `/api` to the backend |

## Prerequisites

- **Python 3.12+** (recommended)
- **Node.js 20+** and npm (for the frontend)
- **PostgreSQL** (runtime database; tests use SQLite in memory)

## Backend setup

From the repo root:

```bash
cd expense_tracker
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create a **`.env`** file in the **repository root** and/or under **`expense_tracker/`** (both are loaded). Typical variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | Yes | Long random string; Django refuses to start without it. |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | Yes (normal run) | PostgreSQL connection. Not used when running **`manage.py test`** (SQLite in memory). |
| `DEBUG` | No | Default `True`; use `False` in production. |
| `ALLOWED_HOSTS` | No | Comma-separated; default `localhost,127.0.0.1`. |
| `CORS_ALLOWED_ORIGINS` | No | Comma-separated origins for browser clients. Defaults include `http://localhost:5173` (Vite). |
| `CORS_ALLOW_ALL` | No | Set to `1` only for debugging (allows any origin). |

Apply migrations and run the server:

```bash
python manage.py migrate
python manage.py runserver
```

API base URL: **`http://127.0.0.1:8000/api/v1/`**  
Django admin: **`http://127.0.0.1:8000/admin/`** (create a superuser with `createsuperuser` if needed).

### API overview (all under `/api/v1/`)

| Method | Path | Notes |
|--------|------|--------|
| POST | `auth/register/` | Body: `username`, `password` (min 8 chars), optional `email`. |
| POST | `auth/token/` | Body: `username`, `password` → `access`, `refresh`. |
| POST | `auth/token/refresh/` | Body: `refresh` → new `access`. |
| CRUD | `categories/` | Authenticated; categories are scoped to the user. |
| CRUD | `expenses/` | Authenticated; query: `page`, `category`, `date_from`, `date_to` (ISO datetimes). |

List endpoints return paginated JSON (`count`, `next`, `previous`, `results`).

### Backend tests

```bash
cd expense_tracker
SECRET_KEY=test-secret-not-for-production python manage.py test
```

`SECRET_KEY` must be set (tests do not load your full `.env` unless you export it).

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Open **`http://localhost:5173`**. In development, Vite proxies **`/api`** to **`http://127.0.0.1:8000`**, so keep Django running on port **8000** or adjust `frontend/vite.config.ts`.

### Production build

```bash
cd frontend
npm run build
```

Output: `frontend/dist/`. Set **`VITE_API_URL`** to your deployed API base URL **including** `/api/v1`, for example:

```bash
VITE_API_URL=https://your-api.example.com/api/v1 npm run build
```

See `frontend/.env.example`.

## Tech stack

**Backend:** Django, Django REST Framework, SimpleJWT, django-cors-headers, PostgreSQL (psycopg2), python-dotenv.

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query, Axios, React Router, Framer Motion, Lucide icons.

## License

Specify your license here if applicable.
