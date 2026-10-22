"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.neighbors = exports.LANDMARK_CELLS = exports.isRoad = exports.riverX = exports.distance = exports.key = exports.CAMPS = exports.NPCS = exports.LANDMARKS = exports.REGIONS = exports.SPAWN = exports.WORLD_VERSION = exports.WORLD_SEED = exports.WORLD_SIZE = void 0;
exports.noise = noise;
exports.region = region;
exports.terrain = terrain;
exports.landmarkCells = landmarkCells;
exports.campAt = campAt;
exports.toIso = toIso;
exports.fromIso = fromIso;
exports.walkable = walkable;
exports.findPath = findPath;
exports.pathToAdjacent = pathToAdjacent;
exports.WORLD_SIZE = 48;
exports.WORLD_SEED = 7391;
/** Bump whenever terrain geometry or resource placement changes; the server migrates explicitly. */
exports.WORLD_VERSION = 2;
exports.SPAWN = { x: 22, y: 24 };
exports.REGIONS = {
    vila: { name: 'Vila do Rio', description: 'Praça, ferreiro e mercado' },
    sombria: { name: 'Floresta Sombria', description: 'Pinheiros densos e goblins' },
    montanhas: { name: 'Montanhas Cinzentas', description: 'Pedra e veios de ferro' },
    campos: { name: 'Campos do Sol', description: 'Prados e arbustos de frutas' },
    bosque: { name: 'Bosque Rubro', description: 'Acampamento de guerreiros' },
    lago: { name: 'Lago Espelhado', description: 'Águas calmas ao sul' },
    vale: { name: 'Vale do Carvalho', description: 'Carvalhos e clareiras' },
};
exports.LANDMARKS = [
    { id: 'inn', kind: 'inn', name: 'Pousada do Primeiro Tronco', x: 19, y: 20, w: 2, h: 2 },
    { id: 'forge', kind: 'forge', name: 'Forja do Ferreiro', x: 24, y: 20, w: 2, h: 2 },
    { id: 'market', kind: 'market', name: 'Barraca da Mercadora', x: 19, y: 26, w: 2, h: 2 },
    { id: 'well', kind: 'well', name: 'Poço da vila', x: 25, y: 26, w: 1, h: 1 },
    { id: 'garden', kind: 'garden', name: 'Horta comunitária', x: 14, y: 26, w: 3, h: 2 },
    { id: 'tent-nw-1', kind: 'tent', name: 'Tenda goblin', x: 6, y: 6, w: 1, h: 1 },
    { id: 'tent-nw-2', kind: 'tent', name: 'Tenda goblin', x: 10, y: 6, w: 1, h: 1 },
    { id: 'fire-nw', kind: 'campfire', name: 'Fogueira goblin', x: 8, y: 8, w: 1, h: 1 },
    { id: 'tent-se-1', kind: 'tent', name: 'Tenda de guerra', x: 41, y: 36, w: 1, h: 1 },
    { id: 'tent-se-2', kind: 'tent', name: 'Tenda de guerra', x: 38, y: 39, w: 1, h: 1 },
    { id: 'fire-se', kind: 'campfire', name: 'Fogueira de guerra', x: 40, y: 38, w: 1, h: 1 },
];
exports.NPCS = [
    { id: 'ferreiro', name: 'Ferreiro', title: 'Bruno, o ferreiro', role: 'smith', x: 24, y: 22 },
    {
        id: 'mercadora',
        name: 'Mercadora',
        title: 'Iara, a mercadora',
        role: 'merchant',
        x: 21,
        y: 27,
    },
];
exports.CAMPS = [
    { id: 'nw', x: 8, y: 8, radius: 3.4, kind: 'goblin', count: 5 },
    { id: 'sombria', x: 14, y: 14, radius: 2.2, kind: 'goblin', count: 3 },
    { id: 'se', x: 40, y: 38, radius: 3, kind: 'warrior', count: 3 },
];
const key = (p) => `${p.x},${p.y}`;
exports.key = key;
const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
exports.distance = distance;
function noise(x, y, seed = exports.WORLD_SEED) {
    let n = Math.imul(x + seed, 374761393) + Math.imul(y, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
const riverX = (y) => 31 + Math.sin(y * 0.19) * 2.4 + Math.sin(y * 0.53) * 0.6;
exports.riverX = riverX;
const BRIDGES = [9, 10, 24, 25];
const inCamp = (x, y) => exports.CAMPS.find((c) => Math.hypot(x - c.x, y - c.y) < c.radius);
const onRoad = (x, y) => (y === 24 && x >= 3 && x <= 44) ||
    (x === 22 && y >= 4 && y <= 44) ||
    (y === 9 && x >= 9 && x <= 42) ||
    (x === 36 && y >= 9 && y <= 24);
const inPlaza = (x, y) => x >= 18 && x <= 26 && y >= 20 && y <= 28 && !((x === 18 || x === 26) && (y === 20 || y === 28));
function region(x, y) {
    if (Math.max(Math.abs(x - exports.SPAWN.x), Math.abs(y - exports.SPAWN.y)) <= 6)
        return 'vila';
    if (Math.hypot(x - 12, y - 37) < 6.5)
        return 'lago';
    if (x < 20 && y < 19)
        return 'sombria';
    if (x > (0, exports.riverX)(y) && y < 22)
        return 'montanhas';
    if (x > (0, exports.riverX)(y))
        return 'bosque';
    if (y > 29)
        return 'campos';
    return 'vale';
}
function computeTerrain(x, y) {
    if (x < 0 || y < 0 || x >= exports.WORLD_SIZE || y >= exports.WORLD_SIZE)
        return 'water';
    const edge = Math.min(x, y, exports.WORLD_SIZE - 1 - x, exports.WORLD_SIZE - 1 - y);
    if (edge < 2 + (Math.sin(x * 0.6 + 1) + Math.sin(y * 0.5 + 2) + 2) * 0.5)
        return 'water';
    if (Math.abs(x - (0, exports.riverX)(y)) < 1.7)
        return BRIDGES.includes(y) ? 'bridge' : 'water';
    if (((x - 12) / 4.2) ** 2 + ((y - 37) / 3) ** 2 < 1)
        return 'water';
    if (inPlaza(x, y))
        return 'cobble';
    if (onRoad(x, y) || inCamp(x, y))
        return 'dirt';
    const n = noise(x, y), r = region(x, y);
    if (r === 'vila')
        return 'grass';
    if (r === 'sombria')
        return n < 0.78 ? 'forest' : 'grass';
    if (r === 'montanhas')
        return n < 0.62 ? 'stone' : n < 0.8 ? 'grass' : 'forest';
    if (r === 'campos' || r === 'lago')
        return n < 0.16 ? 'forest' : 'grass';
    if (r === 'bosque')
        return n < 0.55 ? 'forest' : 'grass';
    return n > 0.93 ? 'stone' : n < 0.4 ? 'forest' : 'grass';
}
const TERRAIN = Array.from({ length: exports.WORLD_SIZE * exports.WORLD_SIZE }, (_, i) => computeTerrain(i % exports.WORLD_SIZE, Math.floor(i / exports.WORLD_SIZE)));
function terrain(x, y) {
    if (x < 0 || y < 0 || x >= exports.WORLD_SIZE || y >= exports.WORLD_SIZE)
        return 'water';
    return TERRAIN[y * exports.WORLD_SIZE + x];
}
const isRoad = (t) => t === 'dirt' || t === 'cobble' || t === 'bridge';
exports.isRoad = isRoad;
function landmarkCells(landmark) {
    return Array.from({ length: landmark.w * landmark.h }, (_, i) => ({
        x: landmark.x + (i % landmark.w),
        y: landmark.y + Math.floor(i / landmark.w),
    }));
}
exports.LANDMARK_CELLS = new Set(exports.LANDMARKS.flatMap(landmarkCells).map(exports.key));
function campAt(p) {
    return exports.CAMPS.find((c) => Math.hypot(p.x - c.x, p.y - c.y) < c.radius + 2.5);
}
function toIso(p) {
    return { x: (p.x - p.y) * 32, y: (p.x + p.y) * 16 };
}
function fromIso(p) {
    return { x: Math.round(p.x / 64 + p.y / 32), y: Math.round(p.y / 32 - p.x / 64) };
}
function walkable(p, occupied) {
    return terrain(p.x, p.y) !== 'water' && !occupied.has((0, exports.key)(p));
}
const DIRECTIONS = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
];
const neighbors = (p) => DIRECTIONS.map((d) => ({ x: p.x + d.x, y: p.y + d.y }));
exports.neighbors = neighbors;
/** Bounded A*: orthogonal steps, Manhattan heuristic, no corner cutting. */
function findPath(start, goal, occupied, limit = 5000) {
    if (!walkable(goal, occupied))
        return [];
    const open = [start], costs = new Map([[(0, exports.key)(start), 0]]), previous = new Map();
    let expanded = 0;
    while (open.length && expanded++ < limit) {
        let best = 0;
        for (let i = 1; i < open.length; i++)
            if (costs.get((0, exports.key)(open[i])) + (0, exports.distance)(open[i], goal) <
                costs.get((0, exports.key)(open[best])) + (0, exports.distance)(open[best], goal))
                best = i;
        const current = open.splice(best, 1)[0];
        if ((0, exports.key)(current) === (0, exports.key)(goal)) {
            const path = [];
            let p = current;
            while ((0, exports.key)(p) !== (0, exports.key)(start)) {
                path.unshift(p);
                p = previous.get((0, exports.key)(p));
            }
            return path;
        }
        for (const next of (0, exports.neighbors)(current)) {
            const cost = costs.get((0, exports.key)(current)) + 1;
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
/** Shortest route to any free tile orthogonally adjacent to a target. */
function pathToAdjacent(start, target, occupied) {
    if ((0, exports.distance)(start, target) === 1)
        return [];
    return ((0, exports.neighbors)(target)
        .filter((p) => walkable(p, occupied))
        .sort((a, b) => (0, exports.distance)(start, a) - (0, exports.distance)(start, b))
        .map((p) => findPath(start, p, occupied, 1500))
        .filter((path) => path.length)
        .sort((a, b) => a.length - b.length)[0] ?? null);
}
//# sourceMappingURL=world.js.map