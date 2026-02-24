# SPL — Splitwise Backend

A Splitwise-inspired expense splitting backend built with **Node.js + Express + Prisma** for the core API, and **Django** for admin panel and analytics. Both services share the same **PostgreSQL (Neon)** database.

---

## Architecture

```
React (frontend — coming soon)
         |
         ↓
Node.js (Express)  ←——————→  PostgreSQL (Neon)
Core API, Auth,                    ↑
Business Logic,                    |
Expense Splitting           (same DB, read-only)
                                   |
Django (Admin + Analytics) ←———————┘
Admin Panel, Reports,
Analytics API
```

**Why two services?**
- Node.js handles high-performance transactional API work
- Django was chosen for its superior admin interface and Python's data ecosystem for analytics — both pointing to the same PostgreSQL instance

---

## Tech Stack

| Layer | Technology |
|---|---|
| Core API | Node.js, Express, TypeScript |
| ORM (Node) | Prisma |
| Admin + Analytics | Django, Django REST Framework |
| Database | PostgreSQL (Neon) |
| Auth | JWT (jsonwebtoken + bcrypt) |
| Deployment | Render (both services) |

---

## Project Structure

```
/
├── node-api/                  # Node.js service
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── controller/
│   │   │   ├── auth.controller.ts
│   │   │   ├── group.controller.ts
│   │   │   ├── expense.controller.ts
│   │   │   ├── settlement.controller.ts
│   │   │   └── balance.controller.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── group.routes.ts
│   │   │   ├── expense.routes.ts
│   │   │   ├── settlement.routes.ts
│   │   │   └── balance.routes.ts
│   │   ├── middlewares/
│   │   │   └── auth.middleware.ts
│   │   ├── utils/
│   │   │   └── balance.ts
│   │   ├── lib/
│   │   │   └── prisma.ts
│   │   ├── app.ts
│   │   └── index.ts
│   ├── .env
│   └── package.json
│
└── django-admin/              # Django service
    ├── core/
    │   ├── settings.py
    │   └── urls.py
    ├── analytics/
    │   ├── models.py
    │   ├── views.py
    │   ├── urls.py
    │   └── admin.py
    ├── .env
    └── manage.py
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- A Neon DB account (or any PostgreSQL instance)

---

### Node.js API

```bash
cd node-api
npm install
```

Create `.env`:
```
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require
JWT_SECRET=your_super_secret_key
PORT=3001
```

Run migrations and start:
```bash
npx prisma migrate dev --name init
npm run dev
```

API runs at `http://localhost:3001`

---

### Django Admin

```bash
cd django-admin
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install django djangorestframework psycopg2-binary python-dotenv dj-database-url
```

Create `.env`:
```
DJANGO_SECRET_KEY=your-django-secret-key
DEBUG=True
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require
```

Run and create admin user:
```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8001
```

Admin panel at `http://localhost:8001/admin`

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | Yes | Get current user |

**Register**
```json
POST /api/auth/register
{
  "name": "Rahul",
  "email": "rahul@example.com",
  "password": "secret123",
  "phone": "9999999999"
}
```

**Login**
```json
POST /api/auth/login
{
  "email": "rahul@example.com",
  "password": "secret123"
}
```
Returns: `{ user, token }`

> All protected routes require `Authorization: Bearer <token>` header

---

### Groups

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/groups` | Create a group |
| GET | `/api/groups` | Get my groups |
| GET | `/api/groups/:groupId` | Get group details |
| POST | `/api/groups/:groupId/members` | Add member by email (admin only) |
| DELETE | `/api/groups/:groupId/members/:userId` | Remove member (admin only) |
| DELETE | `/api/groups/:groupId/leave` | Leave a group |

**Create Group**
```json
POST /api/groups
{
  "name": "Goa Trip",
  "description": "Trip expenses"
}
```

**Add Member**
```json
POST /api/groups/1/members
{
  "email": "priya@example.com"
}
```

---

### Expenses

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/expenses` | Add an expense |
| GET | `/api/expenses/group/:groupId` | Get group expenses (paginated) |
| GET | `/api/expenses/:expenseId` | Get single expense |
| DELETE | `/api/expenses/:expenseId` | Delete expense (payer or admin) |

**Add Expense — Equal Split**
```json
POST /api/expenses
{
  "description": "Hotel",
  "amount": 900,
  "groupId": 1,
  "splitType": "EQUAL"
}
```

**Add Expense — Exact Split**
```json
{
  "description": "Dinner",
  "amount": 500,
  "groupId": 1,
  "splitType": "EXACT",
  "customSplits": [
    { "userId": 1, "value": 300 },
    { "userId": 2, "value": 200 }
  ]
}
```

**Add Expense — Percentage Split**
```json
{
  "description": "Cab",
  "amount": 500,
  "groupId": 1,
  "splitType": "PERCENTAGE",
  "customSplits": [
    { "userId": 1, "value": 60 },
    { "userId": 2, "value": 40 }
  ]
}
```

**Get Expenses** supports pagination: `?page=1&limit=20`

---

### Settlements

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/settlements` | Record a payment |
| GET | `/api/settlements/group/:groupId` | Get group settlements |
| PATCH | `/api/settlements/:settlementId/complete` | Receiver confirms payment |

**Create Settlement**
```json
POST /api/settlements
{
  "toUserId": 1,
  "groupId": 1,
  "amount": 300,
  "note": "Paid via UPI"
}
```

**Flow:** Payer creates settlement (PENDING) → Receiver confirms (COMPLETED) → Balance updates automatically

---

### Balances

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/balances/group/:groupId` | Group balances + suggested transactions |
| GET | `/api/balances/me` | My net balance across all groups |

**Group Balance Response**
```json
{
  "balances": [
    { "user": { "id": 1, "name": "Rahul" }, "amount": 600, "status": "owed" },
    { "user": { "id": 2, "name": "Priya" }, "amount": -300, "status": "owes" }
  ],
  "transactions": [
    { "from": { "name": "Priya" }, "to": { "name": "Rahul" }, "amount": 300 }
  ]
}
```

**My Balances Response**
```json
{
  "overall": -500,
  "groups": [
    { "group": { "id": 1, "name": "Goa Trip" }, "balance": -300, "status": "owes" },
    { "group": { "id": 2, "name": "Flat" }, "balance": -200, "status": "owes" }
  ]
}
```

---

### Analytics (Django)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/analytics/summary/` | Platform overview |
| GET | `/api/analytics/top-spenders/` | Top paying users |
| GET | `/api/analytics/group-activity/` | Most active groups |
| GET | `/api/analytics/unsettled-debts/` | All pending settlements |

Optional query params: `?limit=10`

---

## Deployment on Render

### Node.js Service

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New → **Web Service**
3. Connect your repo, select the `node-api` folder
4. Set:
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `node dist/index.js`
5. Add environment variables:
   ```
   DATABASE_URL=...
   JWT_SECRET=...
   PORT=3001
   ```

---

### Django Service

1. Go to Render → New → **Web Service**
2. Connect your repo, select the `django-admin` folder
3. Set:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn core.wsgi:application`
4. Add environment variables:
   ```
   DATABASE_URL=...
   DJANGO_SECRET_KEY=...
   DEBUG=False
   ```
5. Install gunicorn:
   ```bash
   pip install gunicorn
   pip freeze > requirements.txt
   ```

After deploy, create superuser via Render shell:
```bash
python manage.py createsuperuser
```

---

## Database Schema

```
User ──────────────────────────────────────────┐
 │                                             │
 ├─── GroupMember ───── Group                  │
 │                        │                    │
 │                        ├─── Expense ────────┤
 │                        │       │            │
 │                        │       └─── ExpenseSplit
 │                        │
 │                        └─── Settlement
 │                                 │
 └─────────────────────────────────┘
```

---

## Key Design Decisions

**Balances are never stored** — always calculated live from expenses and settlements. This keeps data consistent and avoids sync issues.

**Django uses `managed = False`** — Django reads the same Postgres tables Node.js created. It never runs migrations on those tables, just reads them for admin and analytics.

**Settlement flow is two-step** — payer records it as PENDING, receiver confirms as COMPLETED. This prevents fake settlements.

**Split types** — EQUAL auto-divides among all group members. EXACT and PERCENTAGE require explicit per-user values that must sum to total/100%.
