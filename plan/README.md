# Todo Learning Project — Roadmap

You are building a real backend from an empty folder, one small step at a time.

**Where the code goes:** `C:\Users\ashwa\projects\todo-learning\` (this folder)
**Detailed steps:** `plan/IMPLEMENTATION_PLAN.md`
**Concepts reference:** `plan/DEVELOPER_HANDBOOK.html` — open in a browser when a term confuses you

---

## The rules

1. **One step at a time.** Do not read ahead. Do not skip.
2. **Every step ends with something you can see.** If you can't see it, stop and fix it before moving on.
3. **Type the code, don't paste it.** You learn what you type.
4. **When something breaks, read the error before doing anything else.** Errors are the fastest teacher in this whole project.

---

## Progress

### Part A — From nothing to a running server (Steps 1–6)

*Goal: by the end you have a server answering HTTP requests, backed by a real database.*

- [ ] **Step 1** — Create the project and understand `package.json`
- [ ] **Step 2** — Add TypeScript and understand `tsconfig.json`
- [ ] **Step 3** — Your first Express server (`GET /health`)
- [ ] **Step 4** — Run PostgreSQL in Docker
- [ ] **Step 5** — Connect Drizzle to the database
- [ ] **Step 6** — Your first table and first migration

### Part B — Your first feature, layer by layer (Steps 7–13)

*Goal: full CRUD for todos, built one layer at a time so you see what each layer is for.*

- [ ] **Step 7** — The repository layer (all the SQL lives here)
- [ ] **Step 8** — The service layer (all the decisions live here)
- [ ] **Step 9** — The routes layer — **first working endpoint**
- [ ] **Step 10** — Input validation with Zod (make bad requests fail properly)
- [ ] **Step 11** — Error handling middleware (one consistent error shape)
- [ ] **Step 12** — Listing with pagination and filters
- [ ] **Step 13** — Update, soft delete, and a race-safe "complete" action

### Part C — Relationships and joins (Steps 14–17)

*Goal: the part most tutorials skip. Four tables, and the queries that read across them.*

- [ ] **Step 14** — A parent table and a foreign key (one-to-many)
- [ ] **Step 15** — `LEFT JOIN` vs `INNER JOIN` — watch a row vanish
- [ ] **Step 16** — `GROUP BY`, counting, and the N+1 problem
- [ ] **Step 17** — Many-to-many with a join table

### Part D — Making it real (Steps 18–20)

*Goal: the things that separate a tutorial app from a real one.*

- [ ] **Step 18** — Middleware: request logging and a simple auth check
- [ ] **Step 19** — Tests
- [ ] **Step 20** — Compare what you built to `dv-service`

---

## What you will have at the end

```
todo-learning/
├── docker-compose.yml
├── drizzle.config.ts
├── package.json
├── tsconfig.json
├── drizzle/                     ← generated migrations
├── plan/                        ← this folder
└── src/
    ├── index.ts                 ← starts the server
    ├── app.ts                   ← wires routes + middleware
    ├── db/
    │   ├── client.ts            ← the database connection
    │   └── schema/
    │       ├── todos.ts
    │       ├── todoLists.ts
    │       ├── tags.ts
    │       ├── todoTags.ts
    │       └── index.ts
    ├── models/
    │   └── todo.model.ts        ← Zod schemas (what input is allowed)
    ├── repos/
    │   ├── todo.repo.ts         ← SQL only
    │   └── todoList.repo.ts
    ├── services/
    │   └── todo.service.ts      ← business rules only
    ├── routes/
    │   ├── todo.routes.ts       ← HTTP only
    │   └── todoList.routes.ts
    ├── middleware/
    │   ├── errorHandler.ts
    │   ├── requestLogger.ts
    │   └── auth.ts
    └── errors/
        └── index.ts
```

Eleven endpoints, four tables, two kinds of relationship, and tests.

---

## The endpoints you are building

| Method | Path | Step |
|---|---|---|
| `GET` | `/health` | 3 |
| `POST` | `/api/todos` | 9 |
| `GET` | `/api/todos/:id` | 9 |
| `GET` | `/api/todos` | 12 |
| `PATCH` | `/api/todos/:id` | 13 |
| `DELETE` | `/api/todos/:id` | 13 |
| `POST` | `/api/todos/:id/complete` | 13 |
| `POST` | `/api/lists` | 14 |
| `GET` | `/api/lists` | 14 |
| `GET` | `/api/lists/summary` | 16 |
| `POST` | `/api/todos/:id/tags` | 17 |

---

## Pacing

There is no deadline. But if it helps to have a shape:

| Sitting | Steps | Feels like |
|---|---|---|
| 1 | 1–3 | "I have a server" |
| 2 | 4–6 | "I have a database" |
| 3 | 7–9 | "I built an API" |
| 4 | 10–13 | "It handles mistakes properly" |
| 5 | 14–15 | "I understand joins" |
| 6 | 16–17 | "I understand data modelling" |
| 7 | 18–20 | "I could do this at work" |

Steps 9, 15 and 16 are the three where things click. If you only half-follow the rest, do those three properly.

---

## When you get stuck

1. **Read the whole error message.** Not the first line — the whole thing. The useful part is usually near the bottom.
2. **Check the obvious three:** Is Docker running? Is the server running? Did you save the file?
3. **`console.log` the thing you assume is correct.** It usually isn't.
4. **Look up the concept in the Handbook** before searching the web — it explains it in the context of what you're building.
5. Then ask, with the error text and what you already tried.
