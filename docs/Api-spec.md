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

A route that needs a login returns `403` when there is no valid session (see 10.2).

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

| Status | Meaning                                                               |
| ------ | --------------------------------------------------------------------- |
| 400    | Validation failure, malformed id, or an action the group state blocks |
| 403    | Not logged in (see 10.2)                                              |
| 404    | Resource not found, or not yours                                      |
| 409    | Duplicate value or invalid state                                      |
| 500    | Unexpected server error (generic message, details are logged)         |

Two responses are not JSON today: a failed login (10.1) and an unauthenticated request (`Forbidden` text, 10.2).

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

| Field       | Type   | Description           |
| ----------- | ------ | --------------------- |
| `_id`       | String | User identifier       |
| `name`      | String | User's name           |
| `email`     | String | Unique email address  |
| `createdAt` | Date   | Creation timestamp    |
| `updatedAt` | Date   | Last update timestamp |

The password hash is never returned.

### 2.2 Session (internal)

Not returned by any endpoint yet.

| Field       | Type    | Description           |
| ----------- | ------- | --------------------- |
| `user`      | String  | Owning user           |
| `valid`     | Boolean | `false` after logout  |
| `userAgent` | String  | Client that logged in |

### 2.3 Group

| Field                | Type   | Description                                  |
| -------------------- | ------ | -------------------------------------------- |
| `_id`                | String | Group identifier                             |
| `name`               | String | Group name                                   |
| `contributionAmount` | Number | Amount each member pays per cycle, in kobo   |
| `frequency`          | String | `weekly` or `monthly`                        |
| `status`             | String | `draft`, `active` or `completed`             |
| `organizer`          | String | Identifier of the user who created the group |
| `startDate`          | Date   | Optional start date                          |
| `createdAt`          | Date   | Creation timestamp                           |
| `updatedAt`          | Date   | Last update timestamp                        |

New groups are always `draft`. `status` and `organizer` are set by the server and cannot be sent by the client.

### 2.4 Member

| Field            | Type   | Description                                          |
| ---------------- | ------ | ---------------------------------------------------- |
| `_id`            | String | Member identifier                                    |
| `name`           | String | Member's name                                        |
| `phone`          | String | Member's phone number                                |
| `group`          | String | Identifier of the group the member belongs to        |
| `payoutPosition` | Number | Position in the payout order, assigned by the server |
| `createdAt`      | Date   | Creation timestamp                                   |
| `updatedAt`      | Date   | Last update timestamp                                |

Within one group, no two members share a `payoutPosition`.

### 2.5 Cycle and Contribution

**Planned.** See `docs/erd.png` for the intended shape: a cycle names who collects that round, and a contribution records whether a member has paid in a cycle.

---

## 3. Access rules

| Resource | Action       | Rule                                                      |
| -------- | ------------ | --------------------------------------------------------- |
| Users    | Register     | Anyone                                                    |
| Users    | View, update | The logged-in user, for their own account only (`/me`)    |
| Groups   | Create       | Logged in                                                 |
| Groups   | View         | The group's organizer only                                |
| Groups   | Update       | The organizer only, while the group is `draft`            |
| Groups   | Delete       | The organizer only, while the group is `draft`            |
| Members  | Add          | The organizer only, while the group is `draft`            |

A group that exists but belongs to someone else returns `404 Group not found`, the same as a group that does not exist.

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

| Method | Endpoint              | Purpose             | Access        | Success | Status |
| ------ | --------------------- | ------------------- | ------------- | ------- | ------ |
| POST   | `/api/v1/auth`        | Register an account | Public        | 201     | Done   |
| POST   | `/api/v1/auth/login`  | Log in              | Public        | 200     | Done   |
| DELETE | `/api/v1/auth/logout` | Log out             | Authenticated | 200     | Done   |

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

All four fields are required. The password must be at least six characters and match `passwordConfirmation`. The email is trimmed and lowercased.

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

Sets the `accessToken` and `refreshToken` cookies. The body is currently the plain text `Login successful` (10.1).

**Errors:**

- `400` validation failure
- `400` plain text `invalid email or password` (10.1)

### 5.3 DELETE `/api/v1/auth/logout`

Logs out the authenticated user. The session is marked invalid and both cookies are cleared.

**Success: 200**

```json
{
  "status": "success"
}
```

**Errors:**

- `403` not logged in (plain text `Forbidden`, 10.2)

An access token that was already issued keeps working until it expires, at most 15 minutes (10.4).

---

## 6. Users

### Endpoint summary

| Method | Endpoint           | Purpose            | Access        | Success | Status  |
| ------ | ------------------ | ------------------ | ------------- | ------- | ------- |
| GET    | `/api/v1/users/me` | Retrieve my account | Authenticated | 200     | Done    |
| PATCH  | `/api/v1/users/me` | Update my account  | Authenticated | 200     | Done    |
| DELETE | `/api/v1/users/me` | Delete my account  | Authenticated | 204     | Planned |

There is no `:id` in these paths. The account is always the logged-in user's own, taken from the session.

### 6.1 GET `/api/v1/users/me`

Returns the logged-in user's public fields.

**Success: 200** → `{ "user": { ...User } }`

**Errors:**

- `403` not logged in
- `404` `user not found`

### 6.2 PATCH `/api/v1/users/me`

Updates the logged-in user.

**Request body** (one or both fields; any other field is rejected):

```json
{
  "name": "New Name",
  "email": "new@example.com"
}
```

**Success: 200** → `{ "user": { ...User } }`

**Errors:**

- `400` validation failure (empty body or an unknown field)
- `403` not logged in
- `404` `user not found`
- `409` email already used

### 6.3 DELETE `/api/v1/users/me`

**Planned.** The intended behavior is to mark the account deleted and invalidate all of its sessions, because a user owns financial records.

---

## 7. Groups

### Endpoint summary

| Method | Endpoint                          | Purpose          | Access        | Success | Status  |
| ------ | --------------------------------- | ---------------- | ------------- | ------- | ------- |
| POST   | `/api/v1/groups`                  | Create a group   | Authenticated | 201     | Done    |
| GET    | `/api/v1/groups/:groupId`         | Retrieve a group | Organizer     | 200     | Done    |
| PATCH  | `/api/v1/groups/:groupId`         | Update a group   | Organizer     | 200     | Done    |
| DELETE | `/api/v1/groups/:groupId`         | Delete a group   | Organizer     | 204     | Done    |
| GET    | `/api/v1/groups`                  | List my groups   | Authenticated | 200     | Planned |
| POST   | `/api/v1/groups/:groupId/start`   | Start a group    | Organizer     | 200     | Planned |
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

### 7.2 GET `/api/v1/groups/:groupId`

Retrieves a group. Only the organizer can read it.

**Success: 200** → `{ "group": { ...Group } }`

**Errors:**

- `400` malformed id
- `403` not logged in
- `404` `Group not found` (not found, or not yours)


### 7.3 PATCH `/api/v1/groups/:groupId`

Updates a group. Only the organizer can do this, and only while the group is a `draft`.

**Request body:** at least one of `name`, `contributionAmount`, `frequency`, `startDate`.

**Success: 200** → `{ "group": { ...Group } }`

**Errors:**

- `400` validation failure
- `400` `Only draft group can be updated` (`409` would fit better, 10.3)
- `403` not logged in
- `404` `Group not found` (not found, or not yours)

### 7.4 DELETE `/api/v1/groups/:groupId`

Deletes a group and all of its members. Only the organizer can do this, and only while the group is a `draft`. Completed groups are kept as a record.

**Success: 204**

No response body.

**Errors:**

- `403` not logged in
- `404` `Group not found` (not found, or not yours)
- `409` `Only draft groups can be deleted`


---

## 8. Members

### Endpoint summary

| Method | Endpoint                                    | Purpose         | Access    | Success | Status  |
| ------ | ------------------------------------------- | --------------- | --------- | ------- | ------- |
| POST   | `/api/v1/members/:groupId`                  | Add a member    | Organizer | 201     | Done    |
| GET    | `/api/v1/groups/:groupId/members`           | List members    | Organizer | 200     | Planned |
| PATCH  | `/api/v1/groups/:groupId/members/:memberId` | Update a member | Organizer | 200     | Planned |
| DELETE | `/api/v1/groups/:groupId/members/:memberId` | Remove a member | Organizer | 204     | Planned |
| PUT    | `/api/v1/groups/:groupId/members/order`     | Reorder members | Organizer | 200     | Planned |

### 8.1 POST `/api/v1/members/:groupId`

Adds a member to a draft group. The server puts the member at the end of the payout order (the highest existing position plus one).

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
  "createdAt": "2026-11-08T09:30:00.000Z",
  "updatedAt": "2026-11-08T09:30:00.000Z",
  "__v": 0
}
```

**Errors:**

- `400` validation failure
- `403` not logged in
- `404` `Group not found` (not found, or not yours)
- `409` `Members can't be added after the group starts`
- `409` `Could not add the member, please try again` (two members were added at the same moment and the retries ran out)


---

## 9. Design decisions

- **Feature modules:** each area (`auth`, `user`, `group`, `member`, `session`) has its own route, controller, service, schema and model.
- **Services throw, one handler responds:** services throw `AppError`, and a single error handler turns errors into responses. Express 5 forwards rejected promises, so controllers need no try/catch.
- **Strict request bodies:** group and member bodies use strict schemas, so a client cannot send `organizer` or `status`.
- **Server-controlled fields:** the organizer comes from the login, and `status` and `payoutPosition` are set by the server.
- **No ids for your own account:** user routes use `/me`, so there is no way to point at someone else's account.
- **Cookie authentication with stored sessions:** tokens live in HTTP-only cookies, and a session record lets logout cut off the refresh path.
- **Other people's groups look missing:** group routes return `404` for a group that is not yours, so ids cannot be probed.
- **Ownership checks live in the service:** the group is looked up together with its organizer in one query, and conditions such as `status: "draft"` go in the same query so there is no gap between check and write.
- **Unique payout positions are enforced by the database:** a unique index on `(group, payoutPosition)` is the real guarantee, and the service retries when two adds collide.
- **Money as integer kobo:** avoids floating-point errors and matches what a payment provider uses.
- **Members are separate from users:** a member is a record in a group, not an account, so member accounts can be added later without reshaping the data.
- **Completed groups are kept:** only drafts can be deleted, because a completed group is the record of who paid whom.

---

## 10. Known issues and limitations

### 10.1 Security hardening not yet done

- `cors()` allows every origin, so browser clients cannot use credentialed requests safely.
- No security headers (`helmet`), no rate limiting, and no request body size limit.
- An access token issued before logout works until it expires (at most 15 minutes).
- There is no CSRF-token implementation (`sameSite=strict` covers same-site use).