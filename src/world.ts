export const WORLD_SIZE = 48;
export const WORLD_SEED = 7391;
/** Bump whenever terrain geometry or resource placement changes; the server migrates explicitly. */
export const WORLD_VERSION = 2;
export const SPAWN = { x: 22, y: 24 } as const;
export type Point = { x: number; y: number };
export type Terrain = 'grass' | 'forest' | 'dirt' | 'cobble' | 'stone' | 'water' | 'bridge';
export type RegionId = 'vila' | 'sombria' | 'montanhas' | 'campos' | 'bosque' | 'lago' | 'vale';
export const REGIONS: Record<RegionId, { name: string; description: string }> = {
  vila: { name: 'Vila do Rio', description: 'Praça, ferreiro e mercado' },
  sombria: { name: 'Floresta Sombria', description: 'Pinheiros densos e goblins' },
  montanhas: { name: 'Montanhas Cinzentas', description: 'Pedra e veios de ferro' },
  campos: { name: 'Campos do Sol', description: 'Prados e arbustos de frutas' },
  bosque: { name: 'Bosque Rubro', description: 'Acampamento de guerreiros' },
  lago: { name: 'Lago Espelhado', description: 'Águas calmas ao sul' },
  vale: { name: 'Vale do Carvalho', description: 'Carvalhos e clareiras' },
};
export type Landmark = Point & {
  id: string;
  kind: 'inn' | 'forge' | 'market' | 'well' | 'garden' | 'tent' | 'campfire';
  name: string;
  w: number;
  h: number;
};
export const LANDMARKS: Landmark[] = [
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
export type NpcRole = 'smith' | 'merchant';
export const NPCS: (Point & { id: string; name: string; role: NpcRole; title: string })[] = [
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
export const CAMPS = [
  { id: 'nw', x: 8, y: 8, radius: 3.4, kind: 'goblin', count: 5 },
  { id: 'sombria', x: 14, y: 14, radius: 2.2, kind: 'goblin', count: 3 },
  { id: 'se', x: 40, y: 38, radius: 3, kind: 'warrior', count: 3 },
] as const;

export const key = (p: Point) => `${p.x},${p.y}`;
export const distance = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
export function noise(x: number, y: number, seed = WORLD_SEED): number {
  let n = Math.imul(x + seed, 374761393) + Math.imul(y, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
export const riverX = (y: number) => 31 + Math.sin(y * 0.19) * 2.4 + Math.sin(y * 0.53) * 0.6;
const BRIDGES = [9, 10, 24, 25];
const inCamp = (x: number, y: number) => CAMPS.find((c) => Math.hypot(x - c.x, y - c.y) < c.radius);
const onRoad = (x: number, y: number) =>
  (y === 24 && x >= 3 && x <= 44) ||
  (x === 22 && y >= 4 && y <= 44) ||
  (y === 9 && x >= 9 && x <= 42) ||
  (x === 36 && y >= 9 && y <= 24);
const inPlaza = (x: number, y: number) =>
  x >= 18 && x <= 26 && y >= 20 && y <= 28 && !((x === 18 || x === 26) && (y === 20 || y === 28));

export function region(x: number, y: number): RegionId {
  if (Math.max(Math.abs(x - SPAWN.x), Math.abs(y - SPAWN.y)) <= 6) return 'vila';
  if (Math.hypot(x - 12, y - 37) < 6.5) return 'lago';
  if (x < 20 && y < 19) return 'sombria';
  if (x > riverX(y) && y < 22) return 'montanhas';
  if (x > riverX(y)) return 'bosque';
  if (y > 29) return 'campos';
  return 'vale';
}
function computeTerrain(x: number, y: number): Terrain {
  if (x < 0 || y < 0 || x >= WORLD_SIZE || y >= WORLD_SIZE) return 'water';
  const edge = Math.min(x, y, WORLD_SIZE - 1 - x, WORLD_SIZE - 1 - y);
  if (edge < 2 + (Math.sin(x * 0.6 + 1) + Math.sin(y * 0.5 + 2) + 2) * 0.5) return 'water';
  if (Math.abs(x - riverX(y)) < 1.7) return BRIDGES.includes(y) ? 'bridge' : 'water';
  if (((x - 12) / 4.2) ** 2 + ((y - 37) / 3) ** 2 < 1) return 'water';
  if (inPlaza(x, y)) return 'cobble';
  if (onRoad(x, y) || inCamp(x, y)) return 'dirt';
  const n = noise(x, y),
    r = region(x, y);
  if (r === 'vila') return 'grass';
  if (r === 'sombria') return n < 0.78 ? 'forest' : 'grass';
  if (r === 'montanhas') return n < 0.62 ? 'stone' : n < 0.8 ? 'grass' : 'forest';
  if (r === 'campos' || r === 'lago') return n < 0.16 ? 'forest' : 'grass';
  if (r === 'bosque') return n < 0.55 ? 'forest' : 'grass';
  return n > 0.93 ? 'stone' : n < 0.4 ? 'forest' : 'grass';
}
const TERRAIN = Array.from({ length: WORLD_SIZE * WORLD_SIZE }, (_, i) =>
  computeTerrain(i % WORLD_SIZE, Math.floor(i / WORLD_SIZE)),
);
export function terrain(x: number, y: number): Terrain {
  if (x < 0 || y < 0 || x >= WORLD_SIZE || y >= WORLD_SIZE) return 'water';
  return TERRAIN[y * WORLD_SIZE + x];
}
export const isRoad = (t: Terrain) => t === 'dirt' || t === 'cobble' || t === 'bridge';
export function landmarkCells(landmark: Landmark): Point[] {
  return Array.from({ length: landmark.w * landmark.h }, (_, i) => ({
    x: landmark.x + (i % landmark.w),
    y: landmark.y + Math.floor(i / landmark.w),
  }));
}
export const LANDMARK_CELLS = new Set(LANDMARKS.flatMap(landmarkCells).map(key));
export function campAt(p: Point) {
  return CAMPS.find((c) => Math.hypot(p.x - c.x, p.y - c.y) < c.radius + 2.5);
}
export function toIso(p: Point): Point {
  return { x: (p.x - p.y) * 32, y: (p.x + p.y) * 16 };
}
export function fromIso(p: Point): Point {
  return { x: Math.round(p.x / 64 + p.y / 32), y: Math.round(p.y / 32 - p.x / 64) };
}
export function walkable(p: Point, occupied: Set<string>): boolean {
  return terrain(p.x, p.y) !== 'water' && !occupied.has(key(p));
}
const DIRECTIONS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];
export const neighbors = (p: Point) => DIRECTIONS.map((d) => ({ x: p.x + d.x, y: p.y + d.y }));
/** Bounded A*: orthogonal steps, Manhattan heuristic, no corner cutting. */
export function findPath(start: Point, goal: Point, occupied: Set<string>, limit = 5000): Point[] {
  if (!walkable(goal, occupied)) return [];
  const open = [start],
    costs = new Map([[key(start), 0]]),
    previous = new Map<string, Point>();
  let expanded = 0;
  while (open.length && expanded++ < limit) {
    let best = 0;
    for (let i = 1; i < open.length; i++)
      if (
        costs.get(key(open[i]))! + distance(open[i], goal) <
        costs.get(key(open[best]))! + distance(open[best], goal)
      )
        best = i;
    const current = open.splice(best, 1)[0];
    if (key(current) === key(goal)) {
      const path: Point[] = [];
      let p = current;
      while (key(p) !== key(start)) {
        path.unshift(p);
        p = previous.get(key(p))!;
      }
      return path;
    }
    for (const next of neighbors(current)) {
      const cost = costs.get(key(current))! + 1;
      if (walkable(next, occupied) && cost < (costs.get(key(next)) ?? Infinity)) {
        costs.set(key(next), cost);
        previous.set(key(next), current);
        if (!open.some((p) => key(p) === key(next))) open.push(next);
      }
    }
  }
  return [];
}
/** Shortest route to any free tile orthogonally adjacent to a target. */
export function pathToAdjacent(start: Point, target: Point, occupied: Set<string>): Point[] | null {
  if (distance(start, target) === 1) return [];
  return (
    neighbors(target)
      .filter((p) => walkable(p, occupied))
      .sort((a, b) => distance(start, a) - distance(start, b))
      .map((p) => findPath(start, p, occupied, 1500))
      .filter((path) => path.length)
      .sort((a, b) => a.length - b.length)[0] ?? null
  );
}
