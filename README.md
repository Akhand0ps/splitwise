# Splitwise Backend

A RESTful API backend for a Splitwise-like expense sharing application built with Node.js, Express, TypeScript, and Prisma ORM.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js 5
- **Language:** TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
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
│   ├── routes/             # API routes
│   ├── middlewares/        # Express middlewares
│   ├── models/             # Data models
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

| Field | Type   | Description         |
| ----- | ------ | ------------------- |
| id    | Int    | Primary key         |
| email | String | Unique email        |
| name  | String | User's display name |

## API Endpoints

*Documentation coming soon as endpoints are developed.*

## License

ISC
