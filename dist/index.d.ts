import { z } from 'zod';
export declare const WORLD_SIZE = 38;
export declare const WORLD_SEED = 7391;
export declare const TICK_MS = 100;
export declare const STEP_MS = 300;
export declare const GATHER_MS = 1500;
export declare const REGEN_MS = 45000;
export type Point = {
    x: number;
    y: number;
};
export type Terrain = 'grass' | 'forest' | 'dirt' | 'stone' | 'water';
export type Resource = 'wood' | 'stone';
export type Inventory = Record<Resource, number>;
export declare const RECIPES: {
    readonly house: {
        readonly name: "Casa de madeira";
        readonly wood: 12;
        readonly stone: 4;
        readonly size: 2;
        readonly description: "Um teto para ambições nada modestas.";
    };
    readonly lumber: {
        readonly name: "Serraria";
        readonly wood: 8;
        readonly stone: 2;
        readonly size: 2;
        readonly description: "O começo de um império de gravetos.";
    };
    readonly storage: {
        readonly name: "Depósito de pedra";
        readonly wood: 6;
        readonly stone: 8;
        readonly size: 2;
        readonly description: "Pedras organizadas também são progresso.";
    };
    readonly tower: {
        readonly name: "Torre de vigia";
        readonly wood: 16;
        readonly stone: 12;
        readonly size: 1;
        readonly description: "Uma vista à altura dos seus planos.";
    };
};
export type BuildingKind = keyof typeof RECIPES;
export type Building = Point & {
    id: string;
    kind: BuildingKind;
    ownerId: string;
    durability: number;
};
export type ResourceNode = Point & {
    id: string;
    kind: Resource;
    quantity: number;
    capacity: number;
    regeneratesAt: number | null;
};
export type Player = Point & {
    id: string;
    name: string;
    facing: number;
    gathering: null | {
        nodeId: string;
        endsAt: number;
    };
};
export type Snapshot = {
    time: number;
    players: Player[];
    nodes: ResourceNode[];
    buildings: Building[];
    inventory: Inventory;
    selfId: string;
    seed: number;
};
export type ActionResult = {
    ok: boolean;
    message: string;
    actionId?: string;
};
export declare const pointSchema: z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    x: number;
    y: number;
}, {
    x: number;
    y: number;
}>;
export declare const gatherSchema: z.ZodObject<{
    nodeId: z.ZodString;
    actionId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    nodeId: string;
    actionId: string;
}, {
    nodeId: string;
    actionId: string;
}>;
export declare const buildSchema: z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
} & {
    kind: z.ZodEnum<["house", "lumber", "storage", "tower"]>;
    actionId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    x: number;
    y: number;
    actionId: string;
    kind: "house" | "lumber" | "storage" | "tower";
}, {
    x: number;
    y: number;
    actionId: string;
    kind: "house" | "lumber" | "storage" | "tower";
}>;
export declare const sessionSchema: z.ZodObject<{
    name: z.ZodString;
}, "strict", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>;
export type BuildRequest = z.infer<typeof buildSchema>;
export interface ClientEvents {
    move: (data: Point) => void;
    gather: (data: z.infer<typeof gatherSchema>) => void;
    build: (data: BuildRequest) => void;
    resync: () => void;
}
export interface ServerEvents {
    snapshot: (data: Snapshot) => void;
    result: (data: ActionResult) => void;
    activity: (message: string) => void;
}
export declare const key: (p: Point) => string;
export declare const distance: (a: Point, b: Point) => number;
export declare function noise(x: number, y: number, seed?: number): number;
export declare function terrain(x: number, y: number): Terrain;
export declare function initialNodes(): ResourceNode[];
export declare function footprint(p: Point, kind: BuildingKind): Point[];
export declare function blockers(nodes: ResourceNode[], buildings: Building[]): Set<string>;
export declare function walkable(p: Point, occupied: Set<string>): boolean;
export declare function placementError(p: Point, kind: BuildingKind, occupied: Set<string>, players: Point[]): string | null;
export declare function gatheringError(player: Point, node: ResourceNode | undefined): string | null;
export declare function canAfford(inventory: Inventory, kind: BuildingKind): boolean;
export declare function toIso(p: Point): Point;
export declare function fromIso(p: Point): Point;
/** Bounded A*: orthogonal steps, Manhattan heuristic, no corner cutting. */
export declare function findPath(start: Point, goal: Point, occupied: Set<string>): Point[];
