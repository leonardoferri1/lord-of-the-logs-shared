# Lord of the Logs — shared domain

Deterministic rules and typed wire contracts for the persistent multiplayer game [Lord of the Logs](https://github.com/leonardoferri1/lord-of-the-logs). This is an independent package repository, consumed by the [server](https://github.com/leonardoferri1/lord-of-the-logs) and [browser client](https://github.com/leonardoferri1/lord-of-the-logs-web).

## What belongs here

- `world.ts` — seeded 48 × 48 terrain (`WORLD_VERSION` 2), seven named regions, village landmarks, villagers, goblin camps, isometric conversion and bounded four-neighbor A*.
- `rules.ts` — resources and items, tool tiers and yields, building recipes with level gates, production and farm timers, prices, experience curve, goblin stats and spawns, the 13-quest chain, resource placement, collision and placement/gathering/build validation.
- `contracts.ts` — strict Zod request schemas and the TypeScript Socket.IO contracts, including snapshots, effects and chat.

There is no database, rendering engine, HTTP server or browser state here. Clients use these rules for previews; the server independently validates every action. Importing this package does not make client data authoritative.

## Develop and verify

Node.js 22 LTS and pnpm 9.15.9:

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm test
pnpm build
```

Eleven tests cover every tile's coordinate round trip, deterministic resource placement, reachability of every camp and villager from the spawn, A* obstacles, placement rules (roads, camps, villagers, level, range), affordability, gathering and tool yields, production/crop/rest timers, level-ups and quest progression.

## Dependency distribution

Consumers pin this Git repository to a **full commit SHA** in `package.json` and commit their lockfiles. This avoids requiring npm registry credentials for the public demo. The small compiled `dist` distribution is versioned alongside its source, so Git installation does not depend on lifecycle-script execution. CI rebuilds it and checks for drift. Consumers need no compiler at runtime.

Rule changes require coordinated dependency updates in both applications. Changes to terrain geometry additionally require an explicit world-version/data migration in the server. Do not silently regenerate a persistent world with different geometry.

Full setup, architecture diagrams and screenshots live in the [server repository](https://github.com/leonardoferri1/lord-of-the-logs).
