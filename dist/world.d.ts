export declare const WORLD_SIZE = 48;
export declare const WORLD_SEED = 7391;
/** Bump whenever terrain geometry or resource placement changes; the server migrates explicitly. */
export declare const WORLD_VERSION = 2;
export declare const SPAWN: {
    readonly x: 22;
    readonly y: 24;
};
export type Point = {
    x: number;
    y: number;
};
export type Terrain = 'grass' | 'forest' | 'dirt' | 'cobble' | 'stone' | 'water' | 'bridge';
export type RegionId = 'vila' | 'sombria' | 'montanhas' | 'campos' | 'bosque' | 'lago' | 'vale';
export declare const REGIONS: Record<RegionId, {
    name: string;
    description: string;
}>;
export type Landmark = Point & {
    id: string;
    kind: 'inn' | 'forge' | 'market' | 'well' | 'garden' | 'tent' | 'campfire';
    name: string;
    w: number;
    h: number;
};
export declare const LANDMARKS: Landmark[];
export type NpcRole = 'smith' | 'merchant';
export declare const NPCS: (Point & {
    id: string;
    name: string;
    role: NpcRole;
    title: string;
})[];
export declare const CAMPS: readonly [{
    readonly id: "nw";
    readonly x: 8;
    readonly y: 8;
    readonly radius: 3.4;
    readonly kind: "goblin";
    readonly count: 5;
}, {
    readonly id: "sombria";
    readonly x: 14;
    readonly y: 14;
    readonly radius: 2.2;
    readonly kind: "goblin";
    readonly count: 3;
}, {
    readonly id: "se";
    readonly x: 40;
    readonly y: 38;
    readonly radius: 3;
    readonly kind: "warrior";
    readonly count: 3;
}];
export declare const key: (p: Point) => string;
export declare const distance: (a: Point, b: Point) => number;
export declare function noise(x: number, y: number, seed?: number): number;
export declare const riverX: (y: number) => number;
export declare function region(x: number, y: number): RegionId;
export declare function terrain(x: number, y: number): Terrain;
export declare const isRoad: (t: Terrain) => t is "dirt" | "cobble" | "bridge";
export declare function landmarkCells(landmark: Landmark): Point[];
export declare const LANDMARK_CELLS: Set<string>;
export declare function campAt(p: Point): {
    readonly id: "nw";
    readonly x: 8;
    readonly y: 8;
    readonly radius: 3.4;
    readonly kind: "goblin";
    readonly count: 5;
} | {
    readonly id: "sombria";
    readonly x: 14;
    readonly y: 14;
    readonly radius: 2.2;
    readonly kind: "goblin";
    readonly count: 3;
} | {
    readonly id: "se";
    readonly x: 40;
    readonly y: 38;
    readonly radius: 3;
    readonly kind: "warrior";
    readonly count: 3;
} | undefined;
export declare function toIso(p: Point): Point;
export declare function fromIso(p: Point): Point;
export declare function walkable(p: Point, occupied: Set<string>): boolean;
export declare const neighbors: (p: Point) => {
    x: number;
    y: number;
}[];
/** Bounded A*: orthogonal steps, Manhattan heuristic, no corner cutting. */
export declare function findPath(start: Point, goal: Point, occupied: Set<string>, limit?: number): Point[];
/** Shortest route to any free tile orthogonally adjacent to a target. */
export declare function pathToAdjacent(start: Point, target: Point, occupied: Set<string>): Point[] | null;
