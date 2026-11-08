# Performance

Nothing here has been measured yet. These are the design choices and the plan for measuring them. Fill in real numbers once the load tests exist.

## Query design

| Concern | Approach |
| --- | --- |
| Ownership lookups | Index on `groups.organizer`; every list query filters by it |
| Duplicate protection | Unique compound indexes (`(group, payoutPosition)`, `(group, number)`, `(cycle, member)`) double as lookup indexes |
| Read endpoints | Use `.lean()` where a Mongoose document isn't needed, and select only the fields returned |
| Group summary | One query for the open cycle's contributions plus one for member names, not a query per member (avoids N+1). A single aggregation is an option later |
| List endpoints | Paginate (`page`, `limit`, a maximum limit) so responses are bounded |
| Writes with conditions | Put the condition in the update (`findOneAndUpdate({ _id, status: "draft" })`) so there is one round trip and no race |
| Growth | No unbounded arrays inside documents; relationships are separate collections |

## Authentication cost

- **JWT verification** is an in-process signature check with no database call, so most requests need no auth query.
- **Token refresh** costs one session lookup, and only when the access token has expired.
- **bcrypt** is deliberately slow. The cost factor trades login latency against resistance to brute force, so measure it on the deployment hardware before settling on a value. Login and register are the only routes that pay it.

## Write path notes

- Starting a group creates several cycles and the first set of contributions. This should be a transaction. Transactions need a replica set, including in tests (`MongoMemoryReplSet` rather than a single-node server). Doing the status flip last also keeps a failed start safe to retry.
- Contributions are created when a cycle opens, not for every cycle up front, so the volume stays at members per open cycle.

## Targets (to validate)

| Metric | Target |
| --- | --- |
| p95 latency, read endpoints | under 200 ms |
| p95 latency, write endpoints | under 400 ms |
| Login (bcrypt) | under 500 ms |
| Error rate under load | under 1% |

## Load-testing plan

1. Seed a realistic dataset (for example 1,000 organizers, 5 groups each, 20 members per group).
2. Use `autocannon` or `k6` against: login, group summary, record payment, list groups.
3. Record p50, p95, and p99 latency and requests per second per endpoint.
4. Inspect slow queries with `.explain("executionStats")` and confirm indexes are used (no collection scans).
5. Re-run after each significant change and keep the results in this file.

## Deliberately not done yet

Caching, read replicas, background jobs, and compression. The workload (a small group of organizers recording payments) doesn't need them, and each one adds a failure mode. Revisit when measurements show a bottleneck.