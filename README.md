# Splitwise Backend

A RESTful API backend for a Splitwise-like expense sharing application built with Node.js, Express, TypeScript, and Prisma ORM.

## Features

- User authentication (register/login) with JWT
- Create and manage expense groups
- Add/remove group members with role-based access (Admin/Member)
- Track expenses with multiple split types (Equal, Exact, Percentage)
- Smart balance calculations across groups
- Debt simplification algorithm for minimal transactions
- Settlement tracking with status management (Pending/Completed)

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js 5
- **Language:** TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Authentication:** JWT + bcrypt

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Akhand0ps/splitwise
cd spl
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/splitwise"
PORT=3001
JWT_SECRET="your-secret-key"
```

### 4. Database Setup

Run Prisma migrations to set up the database schema:

```bash
npx prisma migrate dev
```

Generate Prisma client:

```bash
npx prisma generate
```

### 5. Run the Application

**Development mode:**

```bash
npm run dev
```

**Production build:**

```bash
npm run build
npm start
```

The server will start on `http://localhost:3001` (or the port specified in `.env`).

## Project Structure

```
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Database migrations
├── src/
│   ├── app.ts              # Express app configuration
│   ├── index.ts            # Server entry point
│   ├── controller/         # Route controllers
│   │   ├── auth.controller.ts
│   │   ├── group.controller.ts
│   │   ├── expense.controller.ts
│   │   ├── balance.controller.ts
│   │   └── settlement.controller.ts
│   ├── routes/             # API routes
│   │   ├── auth.routes.ts
│   │   ├── group.routes.ts
│   │   ├── expense.routes.ts
│   │   ├── balance.routes.ts
│   │   └── settlement.routes.ts
│   ├── middlewares/
│   │   └── auth.middleware.ts  # JWT authentication
│   ├── utils/
│   │   └── balance.ts      # Balance calculation & debt simplification
│   ├── lib/
│   │   └── prisma.ts       # Prisma client instance
│   └── generated/          # Prisma generated client
├── package.json
└── tsconfig.json
```

## Scripts

| Command         | Description                              |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript         |
| `npm start`     | Run production build                     |

## Database Schema

### User
| Field     | Type     | Description              |
| --------- | -------- | ------------------------ |
| id        | Int      | Primary key              |
| email     | String   | Unique email             |
| name      | String   | User's display name      |
| phone     | String?  | Optional phone number    |
| password  | String   | Hashed password          |
| createdAt | DateTime | Account creation time    |
| updatedAt | DateTime | Last update time         |

### Group
| Field       | Type     | Description           |
| ----------- | -------- | --------------------- |
| id          | Int      | Primary key           |
| name        | String   | Group name            |
| description | String?  | Optional description  |
| createdAt   | DateTime | Creation time         |
| updatedAt   | DateTime | Last update time      |

### GroupMember
| Field   | Type | Description                  |
| ------- | ---- | ---------------------------- |
| id      | Int  | Primary key                  |
| userId  | Int  | Reference to User            |
| groupId | Int  | Reference to Group           |
| role    | Enum | ADMIN or MEMBER              |

### Expense
| Field       | Type      | Description                         |
| ----------- | --------- | ----------------------------------- |
| id          | Int       | Primary key                         |
| description | String?   | Expense description                 |
| amount      | Decimal   | Total expense amount                |
| splitType   | Enum      | EQUAL, EXACT, or PERCENTAGE         |
| groupId     | Int       | Reference to Group                  |
| paidById    | Int       | User who paid                       |
| createdAt   | DateTime  | Creation time                       |
| updatedAt   | DateTime  | Last update time                    |

### ExpenseSplit
| Field      | Type     | Description                    |
| ---------- | -------- | ------------------------------ |
| id         | Int      | Primary key                    |
| expenseId  | Int      | Reference to Expense           |
| userId     | Int      | User in the split              |
| amount     | Decimal  | Amount owed                    |
| percentage | Decimal? | Percentage (for PERCENTAGE split) |

### Settlement
| Field      | Type     | Description                    |
| ---------- | -------- | ------------------------------ |
| id         | Int      | Primary key                    |
| fromUserId | Int      | User paying                    |
| toUserId   | Int      | User receiving                 |
| groupId    | Int?     | Optional group reference       |
| amount     | Decimal  | Settlement amount              |
| status     | Enum     | PENDING or COMPLETED           |
| note       | String?  | Optional note                  |
| createdAt  | DateTime | Creation time                  |
| updatedAt  | DateTime | Last update time               |

## API Endpoints

### Authentication
| Method | Endpoint         | Description              | Auth |
| ------ | ---------------- | ------------------------ | ---- |
| POST   | `/api/auth/register` | Register a new user      | No   |
| POST   | `/api/auth/login`    | Login user               | No   |
| GET    | `/api/auth/me`       | Get current user profile | Yes  |

### Groups
| Method | Endpoint                          | Description              | Auth |
| ------ | --------------------------------- | ------------------------ | ---- |
| POST   | `/api/groups`                     | Create a new group       | Yes  |
| GET    | `/api/groups`                     | Get all user's groups    | Yes  |
| GET    | `/api/groups/:groupId`            | Get group by ID          | Yes  |
| POST   | `/api/groups/:groupId/members`    | Add member to group      | Yes  |
| DELETE | `/api/groups/:groupId/members/:userId` | Remove member from group | Yes  |
| DELETE | `/api/groups/:groupId/leave`      | Leave a group            | Yes  |

### Expenses
| Method | Endpoint                      | Description                | Auth |
| ------ | ----------------------------- | -------------------------- | ---- |
| POST   | `/api/expenses`               | Add a new expense          | Yes  |
| POST   | `/api/expenses/group/:groupId`| Get all expenses in group  | Yes  |
| POST   | `/api/expenses/:expenseId`    | Get expense by ID          | Yes  |
| DELETE | `/api/expenses/:expenseId`    | Delete an expense          | Yes  |

### Balances
| Method | Endpoint                      | Description                     | Auth |
| ------ | ----------------------------- | ------------------------------- | ---- |
| GET    | `/api/balances/group/:groupId`| Get balances for a group        | Yes  |
| GET    | `/api/balances/me`            | Get current user's all balances | Yes  |

### Settlements
| Method | Endpoint                              | Description              | Auth |
| ------ | ------------------------------------- | ------------------------ | ---- |
| POST   | `/api/settlements`                    | Create a settlement      | Yes  |
| GET    | `/api/settlements/group/:groupId`     | Get settlements in group | Yes  |
| PATCH  | `/api/settlements/:settlementId/complete` | Mark settlement complete | Yes  |

## Environment Variables

| Variable      | Description                    | Required |
| ------------- | ------------------------------ | -------- |
| DATABASE_URL  | PostgreSQL connection string   | Yes      |
| PORT          | Server port (default: 3001)    | No       |
| JWT_SECRET    | Secret key for JWT tokens      | Yes      |

## License

ISC
