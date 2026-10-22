import { describe, expect, it } from 'vitest';
import {
  LANDMARK_CELLS,
  NPCS,
  QUESTS,
  RECIPES,
  SPAWN,
  WORLD_SIZE,
  activeQuests,
  applyXp,
  blockers,
  buildError,
  buildingState,
  canAfford,
  distance,
  emptyInventory,
  emptyStats,
  findPath,
  footprint,
  fromIso,
  gatherYield,
  gatheringError,
  initialNodes,
  key,
  mobSpawns,
  pathToAdjacent,
  placementError,
  produced,
  questProgress,
  terrain,
  toIso,
  walkable,
  xpToNext,
  type Building,
} from './index';

const occupied = blockers(initialNodes(), []);
describe('deterministic world', () => {
  it('round trips every tile through isometric coordinates', () => {
    for (let x = 0; x < WORLD_SIZE; x++)
      for (let y = 0; y < WORLD_SIZE; y++) expect(fromIso(toIso({ x, y }))).toEqual({ x, y });
  });
  it('generates stable resources on land, away from the village, roads and landmarks', () => {
    expect(initialNodes()).toEqual(initialNodes());
    const kinds = new Set(initialNodes().map((n) => n.kind));
    expect([...kinds].sort()).toEqual(['food', 'iron', 'stone', 'wood']);
    for (const node of initialNodes()) {
      expect(['forest', 'stone', 'grass']).toContain(terrain(node.x, node.y));
      expect(LANDMARK_CELLS.has(key(node))).toBe(false);
      expect(distance(node, SPAWN)).toBeGreaterThan(6);
    }
  });
  it('keeps every camp, villager and bridge reachable from the spawn', () => {
    expect(walkable(SPAWN, occupied)).toBe(true);
    for (const mob of mobSpawns()) {
      expect(walkable(mob.home, occupied)).toBe(true);
      expect(findPath(SPAWN, mob.home, occupied, 100000).length).toBeGreaterThan(0);
    }
    for (const npc of NPCS) expect(pathToAdjacent(SPAWN, npc, occupied)).not.toBeNull();
    expect(terrain(29, 24)).toBe('bridge');
    expect(findPath(SPAWN, { x: 36, y: 20 }, occupied, 100000).length).toBeGreaterThan(0);
  });
  it('finds adjacent, collision-free steps and rejects water', () => {
    const path = findPath(SPAWN, { x: 22, y: 34 }, occupied);
    expect(path).toHaveLength(10);
    path.forEach((p, i) => {
      expect(distance(i ? path[i - 1] : SPAWN, p)).toBe(1);
      expect(walkable(p, occupied)).toBe(true);
    });
    expect(findPath(SPAWN, { x: 0, y: 0 }, occupied)).toEqual([]);
  });
  it('routes around obstacles without stepping diagonally', () => {
    const path = findPath({ x: 22, y: 30 }, { x: 22, y: 32 }, new Set(['22,31']));
    expect(path).toHaveLength(4);
    expect(path.map(key)).not.toContain('22,31');
  });
});
describe('economy and construction', () => {
  it('checks full footprints, players, roads, villagers, camps and level', () => {
    const free = { x: 23, y: 30 };
    expect(footprint(free, 'house')).toHaveLength(4);
    expect(placementError(free, 'house', new Set(['24,31']), [])).toBeTruthy();
    expect(placementError(free, 'house', new Set(), [{ x: 24, y: 30 }])).toBeTruthy();
    expect(placementError({ x: 21, y: 30 }, 'house', new Set(), [])).toMatch('estradas');
    expect(placementError({ x: 22, y: 21 }, 'tower', new Set(), [])).toBeTruthy();
    expect(placementError({ x: 8, y: 12 }, 'tower', new Set(), [])).toMatch('goblin');
    expect(placementError(free, 'house', new Set(), [])).toBeNull();
    expect(buildError(free, 'tower', SPAWN, 1)).toMatch('nível');
    expect(buildError(free, 'house', { x: 23, y: 40 }, 1)).toMatch('passos');
    expect(buildError(free, 'house', { x: 23, y: 33 }, 1)).toBeNull();
  });
  it('requires every listed cost', () => {
    const inventory = { ...emptyInventory(), wood: 12, stone: 4 };
    expect(canAfford(inventory, RECIPES.house.cost)).toBe(true);
    expect(canAfford({ ...inventory, wood: 11 }, RECIPES.house.cost)).toBe(false);
    expect(canAfford({ ...inventory, wood: 99, stone: 99 }, RECIPES.tower.cost)).toBe(false);
  });
  it('checks gathering range, depletion and tool yields', () => {
    const node = initialNodes()[0];
    expect(gatheringError(node, undefined)).toBeTruthy();
    expect(gatheringError({ x: node.x + 1, y: node.y }, node)).toBeNull();
    expect(gatheringError({ x: node.x + 2, y: node.y }, node)).toBeTruthy();
    expect(gatheringError(node, { ...node, quantity: 0 })).toBeTruthy();
    expect(gatherYield('wood', { axe: 1, pickaxe: 1, sword: 1 })).toBe(3);
    expect(gatherYield('wood', { axe: 3, pickaxe: 1, sword: 1 })).toBe(5);
    expect(gatherYield('iron', { axe: 1, pickaxe: 2, sword: 1 })).toBe(2);
  });
  it('accumulates production, crops and rest timers', () => {
    const base: Building = {
      id: 'b',
      x: 0,
      y: 0,
      kind: 'lumber',
      ownerId: 'p',
      durability: 100,
      producedAt: 0,
      plantedAt: null,
    };
    expect(produced(base, 30000)).toBe(2);
    expect(produced(base, 10_000_000)).toBe(20);
    expect(buildingState({ ...base, kind: 'farm' }, 0)).toEqual({ action: 'plant' });
    expect(buildingState({ ...base, kind: 'farm', plantedAt: 0 }, 30000)).toMatchObject({
      action: 'growing',
      progress: 0.5,
    });
    expect(buildingState({ ...base, kind: 'farm', plantedAt: 0 }, 60000)).toEqual({
      action: 'harvest',
    });
    expect(buildingState({ ...base, kind: 'house' }, 120000)).toMatchObject({ ready: true });
  });
});
describe('progression', () => {
  it('levels up across thresholds and keeps the remainder', () => {
    expect(xpToNext(1)).toBe(80);
    expect(xpToNext(12)).toBe(2020);
    expect(applyXp(1, 70, 20)).toEqual({ level: 2, xp: 10, gained: 1 });
    expect(applyXp(1, 0, xpToNext(1) + xpToNext(2) + 5)).toEqual({ level: 3, xp: 5, gained: 2 });
  });
  it('tracks quest progress and exposes three active quests in order', () => {
    const stats = { ...emptyStats(), wood: 14 };
    expect(questProgress(QUESTS[0], { stats, level: 1, owned: {} })).toBe(10);
    expect(questProgress(QUESTS[2], { stats, level: 1, owned: { house: 1 } })).toBe(1);
    expect(activeQuests([]).map((q) => q.id)).toEqual(['troncos', 'pedras', 'casa']);
    expect(activeQuests(['troncos']).map((q) => q.id)).toEqual(['pedras', 'casa', 'goblins']);
    expect(new Set(QUESTS.map((q) => q.id)).size).toBe(QUESTS.length);
  });
});
