# Lord of the Logs — shared domain

Deterministic rules and typed wire contracts for the persistent multiplayer game [Lord of the Logs](https://github.com/leonardoferri1/lord-of-the-logs). This is an independent package repository, consumed by the [server](https://github.com/leonardoferri1/lord-of-the-logs) and [browser client](https://github.com/leonardoferri1/lord-of-the-logs-web).

## What belongs here

- Seeded 38 × 38 terrain and resource initialization.
- Isometric coordinate conversion and four-neighbor A* pathfinding.
- Collision, building footprints, resource costs and range validation.
- Strict Zod request schemas and TypeScript Socket.IO event contracts.

There is no database, rendering engine, HTTP server or browser state here. Clients use these rules for previews; the server independently validates every action. Importing this package does not make client data authoritative.

## Develop and verify

Node.js 22 LTS and pnpm 9.15.9:

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm test
pnpm build
```

Six tests cover every tile's coordinate round trip, deterministic resource placement, A* obstacles, placement rules, affordability, gathering range and depletion.

## Dependency distribution

Consumers pin this Git repository to a **full commit SHA** in `package.json` and commit their lockfiles. This avoids requiring npm registry credentials for the public demo. The small compiled `dist` distribution is versioned alongside its source, so Git installation does not depend on lifecycle-script execution. CI rebuilds it and checks for drift. Consumers need no compiler at runtime.

Rule changes require coordinated dependency updates in both applications. Changes to terrain geometry additionally require an explicit world-version/data migration in the server. Do not silently regenerate a persistent world with different geometry.

Full setup, architecture diagrams and screenshots live in the [server repository](https://github.com/leonardoferri1/lord-of-the-logs).
