# Security

What is protected, how, and what is still open. "Planned" items are the hardening checklist before any real deployment.

## Controls

| Area | Control | Status |
| --- | --- | --- |
| Passwords | Hashed with bcrypt; the hash is never returned (strip it with `toJSON` or `omit`) | Built |
| Login errors | One message for unknown email and wrong password, so accounts can't be enumerated | Built |
| Tokens | Separate secrets for access and refresh tokens; 15 min and 7 day lifetimes | Built |
| Cookies | `httpOnly`, `sameSite: strict`, `secure` in production; one shared options object so clearing matches setting | Built |
| Sessions | Each login creates a `Session`; logout sets `valid: false`, which stops refresh | Built |
| Input validation | Zod on `body`, `query`, and `params`; body schemas are `strictObject` so unknown fields (including `organizer`, `status`) return 400 | Built |
| Mass assignment | Ownership and lifecycle fields come from the token or server logic, never the body | Built |
| Authorization | Every group query is scoped to the organizer; other users' resources return 404 | Built |
| ID validation | Malformed ObjectIds are rejected with 400 before querying | Built |
| Error handling | Central handler; unexpected errors return a generic 500 and are logged, never echoed | Built |
| NoSQL injection | Zod string types reject operator objects such as `{ "$gt": "" }` | Built |
| Secrets | In `.env` (gitignored), with `.env.example` committed; fail at startup if any required value is empty | Built |
| Dependency hygiene | `npm audit` run regularly | Planned |

## Known gaps

| Gap | Risk | Fix |
| --- | --- | --- |
| `cors()` is open to every origin | Any site can call the API from a browser | `cors({ origin: [<allowed origins>], credentials: true })`; cookie auth needs `credentials: true` anyway |
| No security headers | Clickjacking, MIME sniffing | `helmet()` |
| No rate limiting | Password guessing and spam | `express-rate-limit`, stricter on `/auth/login` and `POST /users` |
| `requireUser` returns 403 | Wrong semantics: 403 means "known but not allowed" | Return 401 when there is no valid session |
| Access token stays valid up to 15 min after logout | Stolen token usable briefly | Accept for the MVP, or shorten the lifetime; checking the session on every request would remove the gap at the cost of one lookup per request |
| Account deletion cascades nothing | Orphaned financial records | Soft delete and invalidate all sessions |
| No audit trail for payments | Disputes can't be traced | Store who recorded each contribution and when (`recordedBy`, `paidAt`); never hard-delete contributions |
| No request body limit set explicitly | Large payloads | `express.json({ limit: "10kb" })` |
| Request logging may capture sensitive data | Secrets in logs | Redact `password`, `authorization`, and `cookie` in the logger config |

## Rules for contributors

1. Never trust the client for identity or ownership: use `res.locals.user._id`.
2. Every query on a user-owned resource includes the owner in its filter.
3. New body schemas use `strictObject`.
4. Never log passwords, tokens, or cookies.
5. Return the same message for "doesn't exist" and "isn't yours".

## Option B additions

Paystack integration adds new surface: verify the webhook signature before trusting any event, make payment handling idempotent (the same event delivered twice must not double-record), and treat the webhook as untrusted input like any other.