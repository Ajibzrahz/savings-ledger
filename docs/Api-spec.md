# API Specification

Base URL: `/api/v1` (for example `http://localhost:5000/api/v1`)

> The paths below are the intended public contract. Confirm each one against `src/route/index.ts` and adjust either the code or this file so they match.

## Conventions

- **Format:** JSON requests and responses (`Content-Type: application/json`).
- **Auth:** httpOnly cookies `accessToken` (15 min) and `refreshToken` (7 days) set at login. Browser clients must send credentials; Postman keeps cookies automatically. A route marked **Auth** needs a valid session.
- **Money:** integer kobo. NGN 10,000 is `1000000`.
- **Dates:** ISO 8601 in UTC (`2026-11-01` or `2026-11-01T09:00:00.000Z`).
- **IDs:** 24-character hex MongoDB ObjectIds. A malformed id returns 400.
- **Ownership:** a resource that belongs to another organizer returns **404**, the same as a resource that doesn't exist.
- **Unknown body fields** are rejected with 400 (strict validation).

### Error format

```json
{ "message": "Group not found" }
```

Validation errors list each failing field:

```json
{
  "message": "Validation failed",
  "errors": [
    { "field": "body.passwordConfirmation", "message": "passwords do not match" }
  ]
}
```

| Status | Meaning |
| --- | --- |
| 200 / 201 / 204 | Success / created / success with no body |
| 400 | Validation failed or malformed id |
| 401 | Not logged in, or invalid credentials |
| 404 | Not found (or not yours) |
| 409 | Conflict with current state (duplicate email, group already started) |
| 500 | Unexpected error; details are logged, not returned |

## Endpoints

| Area | Method and path | Auth | Status |
| --- | --- | --- | --- |
| Health | `GET /health` | No | Built |
| Users | `POST /users` | No | Built |
| Auth | `POST /auth/login` | No | Built |
| Auth | `DELETE /auth/logout` | Yes | Built |
| Users | `PATCH /users/me` | Yes | In progress |
| Users | `DELETE /users/me` | Yes | In progress |
| Groups | `POST /groups` | Yes | In progress |
| Groups | `GET /groups` | Yes | Planned |
| Groups | `GET /groups/:groupId` | Yes | Planned |
| Groups | `PATCH /groups/:groupId` | Yes | In progress |
| Groups | `DELETE /groups/:groupId` | Yes | Planned |
| Groups | `POST /groups/:groupId/start` | Yes | Planned |
| Groups | `GET /groups/:groupId/summary` | Yes | Planned |
| Members | `POST /groups/:groupId/members` | Yes | In progress |
| Members | `GET /groups/:groupId/members` | Yes | Planned |
| Members | `PATCH /groups/:groupId/members/:memberId` | Yes | Planned |
| Members | `DELETE /groups/:groupId/members/:memberId` | Yes | Planned |
| Members | `PUT /groups/:groupId/members/order` | Yes | Planned |
| Cycles | `GET /groups/:groupId/cycles` | Yes | Planned |
| Cycles | `POST /groups/:groupId/cycles/:number/close` | Yes | Planned |
| Contributions | `PATCH /groups/:groupId/cycles/:number/contributions/:memberId` | Yes | Planned |

---

### Health

`GET /health` -> `200`
```json
{ "success": true, "message": "Server is healthy" }
```

### Register

`POST /users`
```json
{
  "name": "Ajibona Basirat",
  "email": "user@example.com",
  "password": "at-least-6-chars",
  "passwordConfirmation": "at-least-6-chars"
}
```
`201` -> `{ "message": "user created", "user": { "_id": "...", "name": "...", "email": "..." } }`
Errors: `400` validation (including mismatched passwords), `409` email already registered.

### Login

`POST /auth/login` with `{ "email": "...", "password": "..." }`
`200` sets `accessToken` and `refreshToken` cookies. Errors: `400` validation, `401` invalid email or password (the same message for both, so emails can't be probed).

### Logout

`DELETE /auth/logout` (Auth) -> `200 { "status": "success" }`. Invalidates the session and clears both cookies.

### Update my account

`PATCH /users/me` (Auth). Send one or both fields; anything else is rejected.
```json
{ "name": "New Name", "email": "new@example.com" }
```
`200` -> `{ "user": { ... } }`. Errors: `400` (empty body or unknown field), `409` email taken.

### Delete my account

`DELETE /users/me` (Auth) -> `204`. Planned behavior: soft delete plus invalidating every session, because a user owns financial records.

### Create group

`POST /groups` (Auth)
```json
{
  "name": "Market Women Ajo",
  "contributionAmount": 1000000,
  "frequency": "weekly",
  "startDate": "2026-11-01"
}
```
`frequency` is `weekly` or `monthly`; `startDate` is optional. `201` -> `{ "message": "group created", "group": { ... } }`. The organizer is the logged-in user; sending `organizer` or `status` returns `400`.

### Update group

`PATCH /groups/:groupId` (Auth). Any of `name`, `contributionAmount`, `frequency`, `startDate`.
Errors: `404` not found or not yours, `409` group is no longer a draft.

### Start group

`POST /groups/:groupId/start` (Auth). Moves a draft to `active`, creates one cycle per member in payout order, and opens the first.
Errors: `400` no start date or fewer than 2 members, `404`, `409` already started.

### Add member

`POST /groups/:groupId/members` (Auth)
```json
{ "name": "Amina Yusuf", "phone": "08012345678" }
```
`201` -> the member with its server-assigned `payoutPosition` (next in line). Errors: `404`, `409` group already started.

### Reorder members

`PUT /groups/:groupId/members/order` (Auth)
```json
{ "memberIds": ["<id3>", "<id1>", "<id2>"] }
```
The list must contain every member of the group exactly once. Draft groups only.

### Record a payment

`PATCH /groups/:groupId/cycles/:number/contributions/:memberId` (Auth)
```json
{ "status": "paid", "paidAt": "2026-11-02T10:00:00.000Z" }
```
`paidAt` is optional and defaults to now. Errors: `404`, `409` cycle is not open.

### Close a cycle

`POST /groups/:groupId/cycles/:number/close` (Auth). Fails with `400` while anyone has not paid. On success the next cycle opens; closing the last cycle sets the group to `completed`.

### Group summary

`GET /groups/:groupId/summary` (Auth)
```json
{
  "group": { "name": "...", "status": "active" },
  "currentCycle": {
    "number": 3,
    "dueDate": "2026-11-15",
    "payoutMember": { "name": "..." },
    "paid": 7,
    "outstanding": [{ "memberId": "...", "name": "...", "late": true }]
  },
  "next": { "number": 4, "payoutMember": { "name": "..." } }
}
```

### Lists and pagination (planned)

List endpoints accept `?page=1&limit=20` and return `{ "data": [...], "page": 1, "limit": 20, "total": 42 }`.