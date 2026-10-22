import {
  CAMPS,
  LANDMARK_CELLS,
  NPCS,
  WORLD_SIZE,
  campAt,
  distance,
  isRoad,
  key,
  noise,
  region,
  terrain,
  walkable,
  type Point,
} from './world';

export const TICK_MS = 100;
export const STEP_MS = 300;
export const GATHER_MS = 1500;
export const REGEN_MS = 45000;
export const ATTACK_MS = 800;
export const MOB_RESPAWN_MS = 30000;
export const REST_MS = 120000;
export const GROW_MS = 60000;
export const BUILD_RANGE = 6;
export const NPC_RANGE = 2;
export const MAX_ENERGY = 100;
export const MAX_LEVEL = 30;
export const MAX_TOOL_TIER = 4;

export type Resource = 'wood' | 'stone' | 'iron' | 'food';
export type Item = Resource | 'gold';
export type Inventory = Record<Item, number>;
export const ITEMS: Record<Item, { name: string; plural: string }> = {
  wood: { name: 'Madeira', plural: 'madeiras' },
  stone: { name: 'Pedra', plural: 'pedras' },
  iron: { name: 'Ferro', plural: 'ferros' },
  food: { name: 'Comida', plural: 'comidas' },
  gold: { name: 'Ouro', plural: 'moedas de ouro' },
};
export const emptyInventory = (): Inventory => ({ wood: 0, stone: 0, iron: 0, food: 0, gold: 0 });

export type Tool = 'sword' | 'axe' | 'pickaxe';
export type Tools = Record<Tool, number>;
export const TOOLS: Record<Tool, { name: string; use: string }> = {
  sword: { name: 'Espada', use: 'Dano contra goblins' },
  axe: { name: 'Machado', use: 'Madeira por coleta' },
  pickaxe: { name: 'Picareta', use: 'Pedra e ferro por coleta' },
};
export const TIER_NAMES = ['', 'Rústico', 'de Ferro', 'de Aço', 'Lendário'];
export const toolForResource = (r: Resource): Tool | null =>
  r === 'wood' ? 'axe' : r === 'stone' || r === 'iron' ? 'pickaxe' : null;
export function gatherYield(r: Resource, tools: Tools): number {
  if (r === 'wood') return 2 + tools.axe;
  if (r === 'stone') return 2 + tools.pickaxe;
  if (r === 'iron') return 1 + Math.floor(tools.pickaxe / 2);
  return 3;
}
export const GATHER_ENERGY = 5;
export const ATTACK_ENERGY = 2;
export const GATHER_XP: Record<Resource, number> = { wood: 3, stone: 3, iron: 8, food: 3 };
export function upgradeCost(tier: number): Partial<Inventory> {
  return { wood: 6 * tier, iron: 3 * tier, gold: 25 * tier };
}
export function swordDamage(tier: number, level: number, roll: number): number {
  return Math.round(6 + tier * 5 + level * 0.8 + roll * 4);
}

export const RECIPES = {
  house: {
    name: 'Casa de madeira',
    cost: { wood: 12, stone: 4 },
    size: 2,
    level: 1,
    description: 'Descanse para recuperar energia e vida a cada 2 minutos.',
  },
  farm: {
    name: 'Plantação',
    cost: { wood: 6, stone: 2 },
    size: 2,
    level: 2,
    description: 'Plante trigo e colha 5 comidas depois de 1 minuto.',
  },
  lumber: {
    name: 'Serraria',
    cost: { wood: 10, stone: 4 },
    size: 2,
    level: 3,
    description: 'Produz 1 madeira a cada 12 s, até 20 em estoque.',
  },
  storage: {
    name: 'Armazém de pedra',
    cost: { wood: 8, stone: 8 },
    size: 2,
    level: 4,
    description: 'Pedreiros lapidam 1 pedra a cada 18 s, até 15 em estoque.',
  },
  tower: {
    name: 'Torre de vigia',
    cost: { wood: 16, stone: 12, iron: 2 },
    size: 1,
    level: 5,
    description: 'Dispara flechas em goblins a até 5 passos.',
  },
} as const satisfies Record<
  string,
  { name: string; cost: Partial<Inventory>; size: number; level: number; description: string }
>;
export type BuildingKind = keyof typeof RECIPES;
export const BUILDING_KINDS = Object.keys(RECIPES) as BuildingKind[];
export const PRODUCTION: Partial<
  Record<BuildingKind, { item: Resource; every: number; cap: number }>
> = {
  lumber: { item: 'wood', every: 12000, cap: 20 },
  storage: { item: 'stone', every: 18000, cap: 15 },
};
export const TOWER = { range: 5, damage: 8, every: 2000 };
export type Building = Point & {
  id: string;
  kind: BuildingKind;
  ownerId: string;
  durability: number;
  producedAt: number;
  plantedAt: number | null;
};
export function produced(b: Building, now: number): number {
  const p = PRODUCTION[b.kind];
  return p ? Math.min(p.cap, Math.floor((now - b.producedAt) / p.every)) : 0;
}
export type BuildingState =
  | { action: 'collect'; amount: number; item: Resource }
  | { action: 'plant' }
  | { action: 'growing'; progress: number }
  | { action: 'harvest' }
  | { action: 'rest'; ready: boolean; progress: number }
  | { action: 'none' };
export function buildingState(b: Building, now: number): BuildingState {
  const p = PRODUCTION[b.kind];
  if (p) return { action: 'collect', amount: produced(b, now), item: p.item };
  if (b.kind === 'farm') {
    if (b.plantedAt === null) return { action: 'plant' };
    const progress = Math.min(1, (now - b.plantedAt) / GROW_MS);
    return progress >= 1 ? { action: 'harvest' } : { action: 'growing', progress };
  }
  if (b.kind === 'house') {
    const progress = Math.min(1, (now - b.producedAt) / REST_MS);
    return { action: 'rest', ready: progress >= 1, progress };
  }
  return { action: 'none' };
}

export const PRICES: Partial<Record<Item, { sell?: number; buy?: number }>> = {
  wood: { sell: 2 },
  stone: { sell: 3 },
  iron: { sell: 9, buy: 20 },
  food: { sell: 3, buy: 8 },
};

export const xpToNext = (level: number) => Math.round((80 * level ** 1.3) / 10) * 10;
export const maxHp = (level: number) => 100 + 12 * (level - 1);
export function applyXp(level: number, xp: number, gain: number) {
  let gained = 0;
  xp += gain;
  while (level < MAX_LEVEL && xp >= xpToNext(level)) {
    xp -= xpToNext(level);
    level++;
    gained++;
  }
  if (level >= MAX_LEVEL) xp = Math.min(xp, xpToNext(level) - 1);
  return { level, xp, gained };
}

export const MOBS = {
  goblin: {
    name: 'Goblin',
    level: 2,
    hp: 40,
    damage: [3, 6],
    xp: 25,
    gold: [5, 12],
    iron: 0.3,
    aggro: 3,
    attackMs: 1600,
    stepMs: 520,
  },
  warrior: {
    name: 'Goblin Guerreiro',
    level: 5,
    hp: 110,
    damage: [7, 11],
    xp: 70,
    gold: [15, 32],
    iron: 0.8,
    aggro: 5,
    attackMs: 1500,
    stepMs: 560,
  },
} as const;
export type MobKind = keyof typeof MOBS;
export const LEASH = 9;
export type Mob = Point & {
  id: string;
  kind: MobKind;
  hp: number;
  maxHp: number;
  facing: number;
  targetId: string | null;
  dead: boolean;
};
export function mobSpawns(): { id: string; kind: MobKind; home: Point }[] {
  return CAMPS.flatMap((camp) =>
    Array.from({ length: camp.count }, (_, i) => {
      const angle = (i / camp.count) * Math.PI * 2 + camp.x;
      const home = {
        x: Math.round(camp.x + Math.cos(angle) * (camp.radius - 1)),
        y: Math.round(camp.y + Math.sin(angle) * (camp.radius - 1)),
      };
      if (LANDMARK_CELLS.has(key(home))) home.y++;
      return { id: `mob-${camp.id}-${i}`, kind: camp.kind, home };
    }),
  );
}

export type Stats = {
  wood: number;
  stone: number;
  iron: number;
  food: number;
  goblins: number;
  warriors: number;
  harvests: number;
  upgrades: number;
  trades: number;
};
export const emptyStats = (): Stats => ({
  wood: 0,
  stone: 0,
  iron: 0,
  food: 0,
  goblins: 0,
  warriors: 0,
  harvests: 0,
  upgrades: 0,
  trades: 0,
});
type Objective =
  { type: 'stat'; stat: keyof Stats } | { type: 'build'; kind: BuildingKind } | { type: 'level' };
export type Quest = {
  id: string;
  title: string;
  goal: string;
  objective: Objective;
  target: number;
  reward: { xp: number; gold: number };
};
export const QUESTS: Quest[] = [
  {
    id: 'troncos',
    title: 'Primeiros troncos',
    goal: 'Colete madeiras',
    objective: { type: 'stat', stat: 'wood' },
    target: 10,
    reward: { xp: 60, gold: 20 },
  },
  {
    id: 'pedras',
    title: 'Pedra sobre pedra',
    goal: 'Colete pedras',
    objective: { type: 'stat', stat: 'stone' },
    target: 6,
    reward: { xp: 60, gold: 20 },
  },
  {
    id: 'casa',
    title: 'Um teto no vale',
    goal: 'Construa uma casa',
    objective: { type: 'build', kind: 'house' },
    target: 1,
    reward: { xp: 150, gold: 40 },
  },
  {
    id: 'goblins',
    title: 'Ameaça na floresta',
    goal: 'Derrote goblins',
    objective: { type: 'stat', stat: 'goblins' },
    target: 5,
    reward: { xp: 250, gold: 80 },
  },
  {
    id: 'frutas',
    title: 'Sabor do campo',
    goal: 'Colete comida',
    objective: { type: 'stat', stat: 'food' },
    target: 9,
    reward: { xp: 100, gold: 30 },
  },
  {
    id: 'ferro',
    title: 'Ferro para o ferreiro',
    goal: 'Extraia ferro',
    objective: { type: 'stat', stat: 'iron' },
    target: 6,
    reward: { xp: 160, gold: 40 },
  },
  {
    id: 'forja',
    title: 'Ferramentas melhores',
    goal: 'Aprimore uma ferramenta',
    objective: { type: 'stat', stat: 'upgrades' },
    target: 1,
    reward: { xp: 200, gold: 30 },
  },
  {
    id: 'colheita',
    title: 'Colheita farta',
    goal: 'Colha na sua plantação',
    objective: { type: 'stat', stat: 'harvests' },
    target: 2,
    reward: { xp: 220, gold: 40 },
  },
  {
    id: 'serraria',
    title: 'Indústria do vale',
    goal: 'Construa uma serraria',
    objective: { type: 'build', kind: 'lumber' },
    target: 1,
    reward: { xp: 260, gold: 60 },
  },
  {
    id: 'guerreiros',
    title: 'O acampamento rubro',
    goal: 'Derrote goblins guerreiros',
    objective: { type: 'stat', stat: 'warriors' },
    target: 3,
    reward: { xp: 400, gold: 150 },
  },
  {
    id: 'torre',
    title: 'Olhos no horizonte',
    goal: 'Construa uma torre de vigia',
    objective: { type: 'build', kind: 'tower' },
    target: 1,
    reward: { xp: 450, gold: 120 },
  },
  {
    id: 'cacador',
    title: 'Caçador de goblins',
    goal: 'Derrote goblins',
    objective: { type: 'stat', stat: 'goblins' },
    target: 25,
    reward: { xp: 700, gold: 250 },
  },
  {
    id: 'lenda',
    title: 'Lenda do vale',
    goal: 'Alcance o nível 10',
    objective: { type: 'level' },
    target: 10,
    reward: { xp: 1000, gold: 500 },
  },
];
export type QuestContext = {
  stats: Stats;
  level: number;
  owned: Partial<Record<BuildingKind, number>>;
};
export function questProgress(quest: Quest, ctx: QuestContext): number {
  const o = quest.objective;
  const value =
    o.type === 'stat'
      ? ctx.stats[o.stat]
      : o.type === 'build'
        ? (ctx.owned[o.kind] ?? 0)
        : ctx.level;
  return Math.min(quest.target, value);
}
/** The next three unclaimed quests of the chain are active at once. */
export const activeQuests = (claimed: string[]) =>
  QUESTS.filter((q) => !claimed.includes(q.id)).slice(0, 3);

export type ResourceNode = Point & {
  id: string;
  kind: Resource;
  quantity: number;
  capacity: number;
  regeneratesAt: number | null;
};
const CAPACITY: Record<Resource, number> = { wood: 24, stone: 24, iron: 12, food: 9 };
export function initialNodes(): ResourceNode[] {
  const nodes: ResourceNode[] = [];
  for (let y = 2; y < WORLD_SIZE - 2; y++)
    for (let x = 2; x < WORLD_SIZE - 2; x++) {
      const t = terrain(x, y),
        r = region(x, y);
      if (r === 'vila' || campAt({ x, y }) || LANDMARK_CELLS.has(key({ x, y }))) continue;
      if (NPCS.some((n) => distance(n, { x, y }) < 2)) continue;
      let kind: Resource | null = null;
      if (t === 'forest' && noise(x, y, 123) > (r === 'sombria' ? 0.25 : 0.34)) kind = 'wood';
      else if (t === 'stone' && noise(x, y, 55) > 0.32)
        kind = r === 'montanhas' && noise(x, y, 77) > 0.6 ? 'iron' : 'stone';
      else if (t === 'grass' && (r === 'campos' || r === 'lago') && noise(x, y, 41) > 0.86)
        kind = 'food';
      if (kind)
        nodes.push({
          id: `node-${x}-${y}`,
          x,
          y,
          kind,
          capacity: CAPACITY[kind],
          quantity: CAPACITY[kind],
          regeneratesAt: null,
        });
    }
  return nodes;
}

export function footprint(p: Point, kind: BuildingKind): Point[] {
  return Array.from({ length: RECIPES[kind].size ** 2 }, (_, i) => ({
    x: p.x + (i % RECIPES[kind].size),
    y: p.y + Math.floor(i / RECIPES[kind].size),
  }));
}
export function blockers(nodes: ResourceNode[], buildings: Building[]): Set<string> {
  return new Set([
    ...LANDMARK_CELLS,
    ...nodes.map(key),
    ...buildings.flatMap((b) => footprint(b, b.kind).map(key)),
  ]);
}
export function placementError(
  p: Point,
  kind: BuildingKind,
  occupied: Set<string>,
  players: Point[],
): string | null {
  const cells = footprint(p, kind);
  if (cells.some((t) => !walkable(t, occupied))) return 'Local ocupado ou terreno inválido.';
  if (cells.some((t) => isRoad(terrain(t.x, t.y)))) return 'Mantenha estradas e a praça livres.';
  if (cells.some((t) => players.some((player) => key(player) === key(t))))
    return 'Há um viajante neste local.';
  if (cells.some((t) => NPCS.some((n) => distance(n, t) <= 1))) return 'Muito perto de um morador.';
  if (cells.some((t) => campAt(t))) return 'Território goblin. Escolha outro local.';
  return null;
}
export function buildError(
  p: Point,
  kind: BuildingKind,
  position: Point,
  level: number,
): string | null {
  if (level < RECIPES[kind].level) return `Requer nível ${RECIPES[kind].level}.`;
  if (distance(position, p) > BUILD_RANGE)
    return `Construa a até ${BUILD_RANGE} passos de distância.`;
  return null;
}
export function gatheringError(player: Point, node: ResourceNode | undefined): string | null {
  if (!node) return 'Recurso inexistente.';
  if (distance(player, node) > 1) return 'Aproxime-se do recurso primeiro.';
  if (node.quantity <= 0) return 'Recurso esgotado. Aguarde a regeneração.';
  return null;
}
export function canAfford(inventory: Inventory, cost: Partial<Inventory>): boolean {
  return (Object.entries(cost) as [Item, number][]).every(([item, n]) => inventory[item] >= n);
}
export function nearBuilding(p: Point, b: Building, range = 2): boolean {
  return footprint(b, b.kind).some((cell) => distance(p, cell) <= range);
}
export const npcInRange = (p: Point, role: string) =>
  NPCS.some((n) => n.role === role && distance(p, n) <= NPC_RANGE);
