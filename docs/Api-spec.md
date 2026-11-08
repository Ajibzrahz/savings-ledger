# Savings Ledger API Specification

**Base path:** `/api/v1`

**Health-check path:** `/health` (mounted at the root, not under `/api/v1`)

All request bodies use JSON unless otherwise stated. Field names use camelCase.

This document describes what the code does **today**. Where the behavior is wrong or unfinished it says so and points to a numbered item in section 10. Update the status columns and section 10 as you build and fix things.

**Status legend:**

- **Done:** Implemented.
- **Planned:** Not implemented.

---

## 1. Conventions

### 1.1 Authentication

Users authenticate with an email address and password.

On successful login the API sets two HTTP-only cookies:

| Cookie         | Purpose                     | Default lifetime |
| -------------- | --------------------------- | ---------------- |
| `accessToken`  | Authenticates API requests  | 15 minutes       |
| `refreshToken` | Allows access-token renewal | 7 days           |

Both are signed with different secrets. In production the cookies use the `secure` option. The current implementation uses `sameSite=strict`.

Each login creates a `Session` record, and both tokens carry its id. If a request arrives with a missing or expired access token but a valid refresh token whose session is still valid, the API issues a new `accessToken` cookie and the request continues. Logging out marks the session invalid, so the refresh token stops working.

A route that needs a login returns `403` when there is no valid session (see 10.7).

### 1.2 Access model

There is one kind of account. Whoever creates a group is its **organizer**, and group and member actions are limited to the organizer unless section 3 says otherwise. Members of a group are records, not accounts.

### 1.3 Standard error response

Most errors use this structure:

```json
{ "message": "Group not found" }
```

Request validation failures list each failing field:

```json
{
  "message": "Validation failed",
  "errors": [
    { "field": "body.passwordConfirmation", "message": "passwords do not match" }
  ]
}
```

Common HTTP status codes:

| Status | Meaning                                                              |
| ------ | -------------------------------------------------------------------- |
| 400    | Validation failure, malformed id, or an action the group state blocks |
| 403    | Not logged in (see 10.7)                                             |
| 404    | Resource not found, or not yours                                     |
| 409    | Duplicate value or invalid state                                     |
| 500    | Unexpected server error (generic message, details are logged)        |

Two responses are not JSON today: a failed login (10.2) and an unauthenticated request (`Forbidden` text). Both are on the fix list.

### 1.4 Pagination

**Planned.** No list endpoint exists yet. When one is added it will use:

| Parameter | Type    | Default | Description                            |
| --------- | ------- | ------- | -------------------------------------- |
| `page`    | Integer | 1       | Page number                            |
| `limit`   | Integer | 10      | Number of records per page; maximum 50 |

### 1.5 Resource identifiers, money and dates

- Responses return MongoDB documents as stored: the identifier is `_id` and the version field `__v` is included.
- **Money** is an integer number of kobo. NGN 10,000 is `1000000`.
- **Dates** are ISO 8601 in UTC (`2026-11-01` or `2026-11-01T09:00:00.000Z`).
- A malformed id returns `400`.

---

## 2. Data models

### 2.1 User

| Field       | Type   | Description                                            |
| ----------- | ------ | ------------------------------------------------------ |
| `_id`       | String | User identifier                                        |
| `name`      | String | User's name                                            |
| `email`     | String | Unique email address                                   |
| `createdAt` | Date   | Creation timestamp                                     |
| `updatedAt` | Date   | Last update timestamp                                  |

The password hash is never returned (see 10.1 for the login check that uses it).

### 2.2 Session (internal)

Not returned by any endpoint yet.

| Field       | Type    | Description                  |
| ----------- | ------- | ---------------------------- |
| `user`      | String  | Owning user                  |
| `valid`     | Boolean | `false` after logout         |
| `userAgent` | String  | Client that logged in        |

### 2.3 Group

| Field                | Type   | Description                                               |
| -------------------- | ------ | --------------------------------------------------------- |
| `_id`                | String | Group identifier                                          |
| `name`               | String | Group name                                                |
| `contributionAmount` | Number | Amount each member pays per cycle, in kobo                |
| `frequency`          | String | `weekly` or `monthly`                                     |
| `status`             | String | `draft`, `active` or `completed`                          |
| `organizer`          | String | Identifier of the user who created the group              |
| `startDate`          | Date   | Optional start date                                       |
| `createdAt`          | Date   | Creation timestamp                                        |
| `updatedAt`          | Date   | Last update timestamp                                     |

New groups are always `draft`. `status` and `organizer` are set by the server and cannot be sent by the client.

### 2.4 Member

| Field            | Type   | Description                                              |
| ---------------- | ------ | -------------------------------------------------------- |
| `_id`            | String | Member identifier                                        |
| `name`           | String | Member's name                                            |
| `phone`          | String | Member's phone number                                    |
| `group`          | String | Identifier of the group the member belongs to            |
| `payoutPosition` | Number | Position in the payout order, assigned by the server     |

Members do not store timestamps yet (10.4).

### 2.5 Cycle and Contribution

**Planned.** See `docs/erd.png` for the intended shape: a cycle names who collects that round, and a contribution records whether a member has paid in a cycle.

---

## 3. Access rules

| Resource | Action                | Rule in the code today                                         |
| -------- | --------------------- | -------------------------------------------------------------- |
| Users    | Register              | Anyone                                                         |
| Users    | View by id            | Anyone, no login required (10.1)                               |
| Users    | Update by id          | Any logged-in user, for any user id (10.1)                     |
| Groups   | Create                | Logged in                                                      |
| Groups   | View by id            | Any logged-in user, not limited to the organizer (10.1)        |
| Groups   | Update                | Organizer only, while the group is `draft`                     |
| Groups   | Delete                | Organizer only, while the group is `completed`                 |
| Members  | Add                   | Organizer only, while the group is `draft`                     |

A group that exists but belongs to someone else returns `404 Group not found` on update, delete and add-member, the same as a group that does not exist.

---

## 4. Health

### GET `/health`

**Access:** Public

Checks whether the application is running.

**Success: 200**

```json
{
  "status": "ok",
  "uptime": 123.4
}
```

---

## 5. Authentication

### Endpoint summary

| Method | Endpoint               | Purpose             | Access        | Success | Status  |
| ------ | ---------------------- | ------------------- | ------------- | ------- | ------- |
| POST   | `/api/v1/auth`         | Register an account | Public        | 201     | Done    |
| POST   | `/api/v1/auth/login`   | Log in              | Public        | 200     | Done    |
| DELETE | `/api/v1/auth/logout`  | Log out             | Authenticated | 200     | Done    |
| GET    | `/api/v1/auth/me`      | Current user        | Authenticated | 200     | Planned |

Registration lives at the root of the auth router (`POST /api/v1/auth`). `POST /api/v1/auth/register` would be clearer (10.10).

### 5.1 POST `/api/v1/auth`

Creates a new account.

**Request body:**

```json
{
  "name": "Ajibona Basirat",
  "email": "user@example.com",
  "password": "at-least-6-chars",
  "passwordConfirmation": "at-least-6-chars"
}
```

All four fields are required. The password must be at least six characters and match `passwordConfirmation`.

**Success: 201**

```json
{
  "message": "user created",
  "user": {
    "_id": "6710ef00a1b2c3d4e5f60002",
    "name": "Ajibona Basirat",
    "email": "user@example.com",
    "createdAt": "2026-11-08T09:30:00.000Z",
    "updatedAt": "2026-11-08T09:30:00.000Z",
    "__v": 0
  }
}
```

**Errors:**

- `400` validation failure
- `409` email already registered (`Duplicate value entered for email, please choose another value`)

**Known issue:** the schema lowercases and trims `email` and `name`, but the validation middleware does not store its parsed result, so the raw values are saved (10.3). `Ada@x.com` and `ada@x.com` are different accounts today.

### 5.2 POST `/api/v1/auth/login`

Authenticates a user.

**Request body:**

```json
{
  "email": "user@example.com",
  "password": "at-least-6-chars"
}
```

**Success: 200**

Sets the `accessToken` and `refreshToken` cookies. The body is the plain text `Login successful`, not JSON.

**Errors:**

- `400` validation failure
- `400` plain text `invalid email or password`, returned only when no account has that email

**Known issues:**

- **The password is not actually checked** (10.1). The comparison is not awaited, so any password works for an existing email.
- A wrong email returns `400` as plain text. `401` with the standard JSON error is the intended behavior (10.2).

### 5.3 DELETE `/api/v1/auth/logout`

Logs out the authenticated user. The session is marked invalid and both cookies are cleared.

**Success: 200**

```json
{
  "status": "success"
}
```

**Errors:**

- `403` not logged in (plain text `Forbidden`)

An access token that was already issued keeps working until it expires, at most 15 minutes (10.9).

---

## 6. Users

### Endpoint summary

| Method | Endpoint             | Purpose             | Access (today)  | Success | Status  |
| ------ | -------------------- | ------------------- | --------------- | ------- | ------- |
| GET    | `/api/v1/users/:id`  | Retrieve a user     | Public          | 200     | Done    |
| PATCH  | `/api/v1/users/:id`  | Update a user       | Authenticated   | 200     | Done    |
| DELETE | `/api/v1/users/:id`  | Delete an account   | Authenticated   | 204     | Planned |

### 6.1 GET `/api/v1/users/:id`

Returns a user's public fields.

**Success: 200** → `{ "user": { ...User } }`

**Errors:**

- `400` malformed id (`Invalid user ID`)
- `404` `user not found`

**Known issue:** this route needs no login, so anyone can read any user's name and email by id (10.1).

### 6.2 PATCH `/api/v1/users/:id`

Updates a user.

**Request body** (one or both fields; any other field is rejected):

```json
{
  "name": "New Name",
  "email": "new@example.com"
}
```

**Success: 200** → `{ "user": { ...User } }`

**Errors:**

- `400` validation failure (empty body or an unknown field), or malformed id
- `403` not logged in
- `404` `user not found`
- `409` email already used

**Known issue:** the route checks that you are logged in but not that `:id` is your own id, so any logged-in user can change another user's name or email (10.1).

---

## 7. Groups

### Endpoint summary

| Method | Endpoint                       | Purpose             | Access        | Success | Status  |
| ------ | ------------------------------ | ------------------- | ------------- | ------- | ------- |
| POST   | `/api/v1/groups`               | Create a group      | Authenticated | 201     | Done    |
| GET    | `/api/v1/groups/:id`           | Retrieve a group    | Authenticated | 200     | Done    |
| PATCH  | `/api/v1/groups/:groupId`      | Update a group      | Organizer     | 200     | Done    |
| DELETE | `/api/v1/groups/:groupId`      | Delete a group      | Organizer     | 204     | Done    |
| GET    | `/api/v1/groups`               | List my groups      | Authenticated | 200     | Planned |
| POST   | `/api/v1/groups/:groupId/start`| Start a group       | Organizer     | 200     | Planned |
| GET    | `/api/v1/groups/:groupId/summary` | Group summary    | Organizer     | 200     | Planned |

### 7.1 POST `/api/v1/groups`

Creates a group. The organizer is the logged-in user.

**Request body:**

```json
{
  "name": "Market Women Ajo",
  "contributionAmount": 1000000,
  "frequency": "weekly",
  "startDate": "2026-11-01"
}
```

Required: `name`, `contributionAmount` (positive integer, in kobo), `frequency` (`weekly` or `monthly`). Optional: `startDate`. Unknown fields, including `organizer` and `status`, are rejected.

**Success: 201**

```json
{
  "message": "group created",
  "group": {
    "_id": "6710efa1a1b2c3d4e5f60010",
    "name": "Market Women Ajo",
    "contributionAmount": 1000000,
    "frequency": "weekly",
    "status": "draft",
    "organizer": "6710ef00a1b2c3d4e5f60002",
    "startDate": "2026-11-01T00:00:00.000Z",
    "createdAt": "2026-11-08T09:30:00.000Z",
    "updatedAt": "2026-11-08T09:30:00.000Z",
    "__v": 0
  }
}
```

**Errors:**

- `400` validation failure
- `403` not logged in

### 7.2 GET `/api/v1/groups/:id`

Retrieves a group.

**Success: 200** → `{ "group": { ...Group } }`

**Errors:**

- `400` malformed id
- `403` not logged in
- `404` `group does not exist`

**Known issue:** any logged-in user can read any group by id; it is not limited to the organizer (10.1).

### 7.3 PATCH `/api/v1/groups/:groupId`

Updates a group. Only the organizer can do this, and only while the group is a `draft`.

**Request body:** at least one of `name`, `contributionAmount`, `frequency`, `startDate`.

**Success: 200** → `{ "group": { ...Group } }`

**Errors:**

- `400` validation failure
- `400` `Only draft group can be updated`
- `403` not logged in
- `404` `Group not found` (not found, or not yours)

### 7.4 DELETE `/api/v1/groups/:groupId`

Deletes a group. Only the organizer can do this, and only when the group is `completed`.

**Success: 204**

No response body.

**Errors:**

- `400` `Only completed group can be deleted`
- `403` not logged in
- `404` `Group not found`

A draft group cannot be deleted today, and deleting a group does not remove its members (10.5).

---

## 8. Members

### Endpoint summary

| Method | Endpoint                                 | Purpose              | Access    | Success | Status  |
| ------ | ---------------------------------------- | -------------------- | --------- | ------- | ------- |
| POST   | `/api/v1/members/:groupId`               | Add a member         | Organizer | 201     | Done    |
| GET    | `/api/v1/groups/:groupId/members`        | List members         | Organizer | 200     | Planned |
| PATCH  | `/api/v1/groups/:groupId/members/:memberId` | Update a member   | Organizer | 200     | Planned |
| DELETE | `/api/v1/groups/:groupId/members/:memberId` | Remove a member   | Organizer | 204     | Planned |
| PUT    | `/api/v1/groups/:groupId/members/order`  | Reorder members      | Organizer | 200     | Planned |

Members are added at `POST /api/v1/members/:groupId`. Moving this under `/groups/:groupId/members` is on the list (10.10).

### 8.1 POST `/api/v1/members/:groupId`

Adds a member to a draft group. The server puts the member at the end of the payout order.

**Request body:**

```json
{
  "name": "Amina Yusuf",
  "phone": "08012345678"
}
```

Both fields are required. Unknown fields are rejected.

**Success: 201**

The response is the member itself, with no wrapper:

```json
{
  "_id": "6710efa1a1b2c3d4e5f60020",
  "name": "Amina Yusuf",
  "phone": "08012345678",
  "group": "6710efa1a1b2c3d4e5f60010",
  "payoutPosition": 1,
  "__v": 0
}
```

**Errors:**

- `400` validation failure
- `403` not logged in
- `404` `Group not found` (not found, or not yours)
- `409` `Members can't be added after the group starts`

---

## 9. Design decisions

- **Feature modules:** each area (`auth`, `user`, `group`, `member`, `session`) has its own route, controller, service, schema and model.
- **Services throw, one handler responds:** services throw `AppError`, and a single error handler turns errors into responses. Express 5 forwards rejected promises, so controllers need no try/catch.
- **Strict request bodies:** group and member bodies use strict schemas, so a client cannot send `organizer` or `status`.
- **Server-controlled fields:** the organizer comes from the login, and `status` and `payoutPosition` are set by the server.
- **Cookie authentication with stored sessions:** tokens live in HTTP-only cookies, and a session record lets logout cut off the refresh path.
- **Other people's groups look missing:** update, delete and add-member return `404` for a group that is not yours.
- **Money as integer kobo:** avoids floating-point errors and matches what a payment provider uses.
- **Members are separate from users:** a member is a record in a group, not an account, so member accounts can be added later without reshaping the data.
- **Ownership checks live in the service:** the group is looked up together with its organizer in one query.

---

## 10. Known issues and limitations

### 10.1 Fix before sharing the link

1. **Wrong passwords are accepted.** In `validatePassword`, `user.comparePassword(password)` returns a promise that is never awaited, so `!isValid` is never true. Add `await`.
2. **Any logged-in user can edit any user.** `PATCH /users/:id` never compares `:id` with the logged-in user. Use `res.locals.user._id` (for example a `/users/me` route).
3. **`GET /users/:id` needs no login** and returns a user's name and email.
4. **`GET /groups/:id` is not limited to the organizer.** Look the group up with `organizer: userId`, as `updateGroup` does.

### 10.2 Auth responses

- A failed login returns `400` with plain text. It should be `401` with the standard JSON error, with the same message for an unknown email and a wrong password.
- A successful login returns plain text. A JSON body such as `{ "message": "Login successful", "user": { ... } }` is more useful to a client.

### 10.3 Validation results are discarded

The `validate` middleware parses the request but never saves the parsed result. As a result, `.trim()`, `.toLowerCase()` and `z.coerce` have no effect on the data that reaches the controller. Emails are stored in their original case, so `Ada@x.com` and `ada@x.com` can both register and then fail to log in with the other form. Assign the parsed `body` back to `req.body`. (`req.query` is read-only in Express 5, so store cleaned query values in `res.locals`.)

### 10.4 Member model

- `group` references `"User"`; it should reference `"Group"`.
- The schema has no `{ timestamps: true }`, and the interface has a typo (`updateAt`).
- There is no unique index on `(group, payoutPosition)`, and `payoutPosition` is `count + 1`, so two simultaneous adds can receive the same position.

### 10.5 Group deletion

Only a `completed` group can be deleted, so a draft created by mistake cannot be removed. Deleting a group also leaves its members behind.

### 10.6 Errors

- Malformed JSON in a request body returns `500`; it should be `400`.
- The malformed-id message always says `Invalid user ID`, even for a group id.
- A group update on a non-draft group returns `400`; `409` fits better.

### 10.7 Unauthenticated requests

`requireUser` returns `403` with the text `Forbidden`. A missing or invalid login should be `401` with the standard JSON error.

### 10.8 Environment

`.env.example` lists only `JWT_SECRET`, but the code reads `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `ACCESS_TOKEN_TTL` and `REFRESH_TOKEN_TTL`. A missing secret defaults to an empty string and login fails with a `500`. The app should refuse to start when a required value is missing.

### 10.9 Security hardening not yet done

- `cors()` allows every origin, so browser clients cannot use credentialed requests safely.
- No security headers (`helmet`), no rate limiting, and no request body size limit.
- An access token issued before logout works until it expires (at most 15 minutes).
- There is no CSRF-token implementation (`sameSite=strict` covers same-site use).

### 10.10 Routes to tidy

- Register: `POST /api/v1/auth` → `POST /api/v1/auth/register`.
- Add member: `POST /api/v1/members/:groupId` → `POST /api/v1/groups/:groupId/members`.
- `GET /api/v1/auth/me` for the current user, and `/users/me` for self-service updates.

### 10.11 Tests

`tests/health.test.ts` expects `GET /api/v1/health` with `{ success, message }`, but the app serves `GET /health` with `{ status, uptime }`, so the test fails. There are no tests yet for auth, groups or members.