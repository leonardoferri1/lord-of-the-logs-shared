"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.distance = exports.key = exports.sessionSchema = exports.buildSchema = exports.gatherSchema = exports.pointSchema = exports.RECIPES = exports.REGEN_MS = exports.GATHER_MS = exports.STEP_MS = exports.TICK_MS = exports.WORLD_SEED = exports.WORLD_SIZE = void 0;
exports.noise = noise;
exports.terrain = terrain;
exports.initialNodes = initialNodes;
exports.footprint = footprint;
exports.blockers = blockers;
exports.walkable = walkable;
exports.placementError = placementError;
exports.gatheringError = gatheringError;
exports.canAfford = canAfford;
exports.toIso = toIso;
exports.fromIso = fromIso;
exports.findPath = findPath;
const zod_1 = require("zod");
exports.WORLD_SIZE = 38;
exports.WORLD_SEED = 7391;
exports.TICK_MS = 100;
exports.STEP_MS = 300;
exports.GATHER_MS = 1500;
exports.REGEN_MS = 45000;
exports.RECIPES = {
    house: {
        name: 'Casa de madeira',
        wood: 12,
        stone: 4,
        size: 2,
        description: 'Um teto para ambições nada modestas.',
    },
    lumber: {
        name: 'Serraria',
        wood: 8,
        stone: 2,
        size: 2,
        description: 'O começo de um império de gravetos.',
    },
    storage: {
        name: 'Depósito de pedra',
        wood: 6,
        stone: 8,
        size: 2,
        description: 'Pedras organizadas também são progresso.',
    },
    tower: {
        name: 'Torre de vigia',
        wood: 16,
        stone: 12,
        size: 1,
        description: 'Uma vista à altura dos seus planos.',
    },
};
exports.pointSchema = zod_1.z
    .object({
    x: zod_1.z
        .number()
        .int()
        .min(0)
        .max(exports.WORLD_SIZE - 1),
    y: zod_1.z
        .number()
        .int()
        .min(0)
        .max(exports.WORLD_SIZE - 1),
})
    .strict();
exports.gatherSchema = zod_1.z
    .object({ nodeId: zod_1.z.string().max(80), actionId: zod_1.z.string().uuid() })
    .strict();
exports.buildSchema = exports.pointSchema.extend({
    kind: zod_1.z.enum(['house', 'lumber', 'storage', 'tower']),
    actionId: zod_1.z.string().uuid(),
});
exports.sessionSchema = zod_1.z
    .object({
    name: zod_1.z
        .string()
        .trim()
        .min(2)
        .max(20)
        .regex(/^[\p{L}\p{N} _-]+$/u),
})
    .strict();
const key = (p) => `${p.x},${p.y}`;
exports.key = key;
const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
exports.distance = distance;
function noise(x, y, seed = exports.WORLD_SEED) {
    let n = Math.imul(x + seed, 374761393) + Math.imul(y, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
function terrain(x, y) {
    if (x < 0 || y < 0 || x >= exports.WORLD_SIZE || y >= exports.WORLD_SIZE)
        return 'water';
    const river = 27 + Math.sin(y * 0.23) * 2;
    if (x < 2 || y < 2 || x > 35 || y > 35 || (Math.abs(x - river) < 1.65 && y !== 17 && y !== 18))
        return 'water';
    if ((x >= 17 && x <= 18 && y >= 13 && y <= 14) ||
        x === 18 ||
        y === 18 ||
        (x >= 15 && x <= 21 && y >= 15 && y <= 21))
        return 'dirt';
    const n = noise(x, y);
    return n > 0.87 ? 'stone' : n < 0.48 ? 'forest' : 'grass';
}
function initialNodes() {
    const nodes = [];
    for (let y = 2; y < exports.WORLD_SIZE - 2; y++)
        for (let x = 2; x < exports.WORLD_SIZE - 2; x++) {
            const t = terrain(x, y);
            if ((t === 'forest' && noise(x, y, 123) > 0.32) || (t === 'stone' && noise(x, y, 55) > 0.3))
                nodes.push({
                    id: `node-${x}-${y}`,
                    x,
                    y,
                    kind: t === 'forest' ? 'wood' : 'stone',
                    capacity: 24,
                    quantity: 24,
                    regeneratesAt: null,
                });
        }
    return nodes;
}
function footprint(p, kind) {
    return Array.from({ length: exports.RECIPES[kind].size ** 2 }, (_, i) => ({
        x: p.x + (i % exports.RECIPES[kind].size),
        y: p.y + Math.floor(i / exports.RECIPES[kind].size),
    }));
}
function blockers(nodes, buildings) {
    return new Set([
        '17,13',
        '18,13',
        '17,14',
        '18,14',
        ...nodes.map(exports.key),
        ...buildings.flatMap((b) => footprint(b, b.kind).map(exports.key)),
    ]);
}
function walkable(p, occupied) {
    return terrain(p.x, p.y) !== 'water' && !occupied.has((0, exports.key)(p));
}
function placementError(p, kind, occupied, players) {
    if (footprint(p, kind).some((t) => !walkable(t, occupied)))
        return 'Local ocupado ou terreno inválido.';
    if (footprint(p, kind).some((t) => players.some((player) => (0, exports.key)(player) === (0, exports.key)(t))))
        return 'Há um viajante neste local.';
    if (footprint(p, kind).some((t) => t.x === 18 || t.y === 18))
        return 'Mantenha os caminhos livres.';
    return null;
}
function gatheringError(player, node) {
    if (!node)
        return 'Recurso inexistente.';
    if ((0, exports.distance)(player, node) > 1)
        return 'Aproxime-se do recurso primeiro.';
    if (node.quantity <= 0)
        return 'Recurso esgotado. Aguarde a regeneração.';
    return null;
}
function canAfford(inventory, kind) {
    return inventory.wood >= exports.RECIPES[kind].wood && inventory.stone >= exports.RECIPES[kind].stone;
}
function toIso(p) {
    return { x: (p.x - p.y) * 32, y: (p.x + p.y) * 16 };
}
function fromIso(p) {
    return { x: Math.round(p.x / 64 + p.y / 32), y: Math.round(p.y / 32 - p.x / 64) };
}
/** Bounded A*: orthogonal steps, Manhattan heuristic, no corner cutting. */
function findPath(start, goal, occupied) {
    if (!walkable(goal, occupied))
        return [];
    const open = [start], costs = new Map([[(0, exports.key)(start), 0]]), previous = new Map();
    while (open.length) {
        open.sort((a, b) => costs.get((0, exports.key)(a)) + (0, exports.distance)(a, goal) - costs.get((0, exports.key)(b)) - (0, exports.distance)(b, goal));
        const current = open.shift();
        if ((0, exports.key)(current) === (0, exports.key)(goal)) {
            const path = [];
            let p = current;
            while ((0, exports.key)(p) !== (0, exports.key)(start)) {
                path.unshift(p);
                p = previous.get((0, exports.key)(p));
            }
            return path;
        }
        for (const d of [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 },
        ]) {
            const next = { x: current.x + d.x, y: current.y + d.y }, cost = costs.get((0, exports.key)(current)) + 1;
            if (walkable(next, occupied) && cost < (costs.get((0, exports.key)(next)) ?? Infinity)) {
                costs.set((0, exports.key)(next), cost);
                previous.set((0, exports.key)(next), current);
                if (!open.some((p) => (0, exports.key)(p) === (0, exports.key)(next)))
                    open.push(next);
            }
        }
    }
    return [];
}
//# sourceMappingURL=index.js.map