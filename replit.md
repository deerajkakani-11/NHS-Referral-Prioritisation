# NHS Referral Prioritisation

An explainable, clinician-led workspace for reviewing NHS-style referrals and allocating appointment slots using synthetic data.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/nhs-referral-prioritisation/src/` — clinician dashboard, referral queue/detail, appointments, and settings UI
- `artifacts/api-server/src/routes/referrals.ts` — referral, dashboard summary, review, appointment slots, and booking routes
- `lib/api-spec/openapi.yaml` — source-of-truth API contract
- `lib/db/src/schema/referrals.ts` — Drizzle schema for referrals and appointment slots
- `lib/api-client-react/src/generated/` — generated React Query hooks

## Architecture decisions

- Prioritisation is advisory rather than autonomous: each recommendation includes evidence, confidence, and a clinician override path.
- The first build uses synthetic NHS-style data to avoid handling real patient information.
- OpenAPI is the API contract; the React client and Zod server schemas are generated from it.
- Confidence is stored as an integer percentage in the database and exposed as a decimal in API responses.

## Product

- Review live referral workload and urgent cases
- Filter and search referrals by status, priority, and specialty
- Inspect traceable prioritisation evidence and confidence
- Record a clinician decision with notes
- Browse appointment slots and book reviewed referrals
- View safety and advisory-mode settings

## User preferences

No preferences recorded.

## Gotchas

- Regenerate the API client after changing `lib/api-spec/openapi.yaml`.
- Use the managed workflows for the API server and web preview so `PORT` and `BASE_PATH` are supplied.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
