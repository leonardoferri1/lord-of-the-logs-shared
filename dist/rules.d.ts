import { type Point } from './world';
export declare const TICK_MS = 100;
export declare const STEP_MS = 300;
export declare const GATHER_MS = 1500;
export declare const REGEN_MS = 45000;
export declare const ATTACK_MS = 800;
export declare const MOB_RESPAWN_MS = 30000;
export declare const REST_MS = 120000;
export declare const GROW_MS = 60000;
export declare const BUILD_RANGE = 6;
export declare const NPC_RANGE = 2;
export declare const MAX_ENERGY = 100;
export declare const MAX_LEVEL = 30;
export declare const MAX_TOOL_TIER = 4;
export type Resource = 'wood' | 'stone' | 'iron' | 'food';
export type Item = Resource | 'gold';
export type Inventory = Record<Item, number>;
export declare const ITEMS: Record<Item, {
    name: string;
    plural: string;
}>;
export declare const emptyInventory: () => Inventory;
export type Tool = 'sword' | 'axe' | 'pickaxe';
export type Tools = Record<Tool, number>;
export declare const TOOLS: Record<Tool, {
    name: string;
    use: string;
}>;
export declare const TIER_NAMES: string[];
export declare const toolForResource: (r: Resource) => Tool | null;
export declare function gatherYield(r: Resource, tools: Tools): number;
export declare const GATHER_ENERGY = 5;
export declare const ATTACK_ENERGY = 2;
export declare const GATHER_XP: Record<Resource, number>;
export declare function upgradeCost(tier: number): Partial<Inventory>;
export declare function swordDamage(tier: number, level: number, roll: number): number;
export declare const RECIPES: {
    readonly house: {
        readonly name: "Casa de madeira";
        readonly cost: {
            readonly wood: 12;
            readonly stone: 4;
        };
        readonly size: 2;
        readonly level: 1;
        readonly description: "Descanse para recuperar energia e vida a cada 2 minutos.";
    };
    readonly farm: {
        readonly name: "Plantação";
        readonly cost: {
            readonly wood: 6;
            readonly stone: 2;
        };
        readonly size: 2;
        readonly level: 2;
        readonly description: "Plante trigo e colha 5 comidas depois de 1 minuto.";
    };
    readonly lumber: {
        readonly name: "Serraria";
        readonly cost: {
            readonly wood: 10;
            readonly stone: 4;
        };
        readonly size: 2;
        readonly level: 3;
        readonly description: "Produz 1 madeira a cada 12 s, até 20 em estoque.";
    };
    readonly storage: {
        readonly name: "Armazém de pedra";
        readonly cost: {
            readonly wood: 8;
            readonly stone: 8;
        };
        readonly size: 2;
        readonly level: 4;
        readonly description: "Pedreiros lapidam 1 pedra a cada 18 s, até 15 em estoque.";
    };
    readonly tower: {
        readonly name: "Torre de vigia";
        readonly cost: {
            readonly wood: 16;
            readonly stone: 12;
            readonly iron: 2;
        };
        readonly size: 1;
        readonly level: 5;
        readonly description: "Dispara flechas em goblins a até 5 passos.";
    };
};
export type BuildingKind = keyof typeof RECIPES;
export declare const BUILDING_KINDS: BuildingKind[];
export declare const PRODUCTION: Partial<Record<BuildingKind, {
    item: Resource;
    every: number;
    cap: number;
}>>;
export declare const TOWER: {
    range: number;
    damage: number;
    every: number;
};
export type Building = Point & {
    id: string;
    kind: BuildingKind;
    ownerId: string;
    durability: number;
    producedAt: number;
    plantedAt: number | null;
};
export declare function produced(b: Building, now: number): number;
export type BuildingState = {
    action: 'collect';
    amount: number;
    item: Resource;
} | {
    action: 'plant';
} | {
    action: 'growing';
    progress: number;
} | {
    action: 'harvest';
} | {
    action: 'rest';
    ready: boolean;
    progress: number;
} | {
    action: 'none';
};
export declare function buildingState(b: Building, now: number): BuildingState;
export declare const PRICES: Partial<Record<Item, {
    sell?: number;
    buy?: number;
}>>;
export declare const xpToNext: (level: number) => number;
export declare const maxHp: (level: number) => number;
export declare function applyXp(level: number, xp: number, gain: number): {
    level: number;
    xp: number;
    gained: number;
};
export declare const MOBS: {
    readonly goblin: {
        readonly name: "Goblin";
        readonly level: 2;
        readonly hp: 40;
        readonly damage: readonly [3, 6];
        readonly xp: 25;
        readonly gold: readonly [5, 12];
        readonly iron: 0.3;
        readonly aggro: 3;
        readonly attackMs: 1600;
        readonly stepMs: 520;
    };
    readonly warrior: {
        readonly name: "Goblin Guerreiro";
        readonly level: 5;
        readonly hp: 110;
        readonly damage: readonly [7, 11];
        readonly xp: 70;
        readonly gold: readonly [15, 32];
        readonly iron: 0.8;
        readonly aggro: 5;
        readonly attackMs: 1500;
        readonly stepMs: 560;
    };
};
export type MobKind = keyof typeof MOBS;
export declare const LEASH = 9;
export type Mob = Point & {
    id: string;
    kind: MobKind;
    hp: number;
    maxHp: number;
    facing: number;
    targetId: string | null;
    dead: boolean;
};
export declare function mobSpawns(): {
    id: string;
    kind: MobKind;
    home: Point;
}[];
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
export declare const emptyStats: () => Stats;
type Objective = {
    type: 'stat';
    stat: keyof Stats;
} | {
    type: 'build';
    kind: BuildingKind;
} | {
    type: 'level';
};
export type Quest = {
    id: string;
    title: string;
    goal: string;
    objective: Objective;
    target: number;
    reward: {
        xp: number;
        gold: number;
    };
};
export declare const QUESTS: Quest[];
export type QuestContext = {
    stats: Stats;
    level: number;
    owned: Partial<Record<BuildingKind, number>>;
};
export declare function questProgress(quest: Quest, ctx: QuestContext): number;
/** The next three unclaimed quests of the chain are active at once. */
export declare const activeQuests: (claimed: string[]) => Quest[];
export type ResourceNode = Point & {
    id: string;
    kind: Resource;
    quantity: number;
    capacity: number;
    regeneratesAt: number | null;
};
export declare function initialNodes(): ResourceNode[];
export declare function footprint(p: Point, kind: BuildingKind): Point[];
export declare function blockers(nodes: ResourceNode[], buildings: Building[]): Set<string>;
export declare function placementError(p: Point, kind: BuildingKind, occupied: Set<string>, players: Point[]): string | null;
export declare function buildError(p: Point, kind: BuildingKind, position: Point, level: number): string | null;
export declare function gatheringError(player: Point, node: ResourceNode | undefined): string | null;
export declare function canAfford(inventory: Inventory, cost: Partial<Inventory>): boolean;
export declare function nearBuilding(p: Point, b: Building, range?: number): boolean;
export declare const npcInRange: (p: Point, role: string) => boolean;
export {};
