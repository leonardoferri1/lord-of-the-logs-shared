import { z } from 'zod';
import { type Point } from './world';
import { type Building, type Inventory, type Mob, type ResourceNode, type Stats, type Tools } from './rules';
export type Player = Point & {
    id: string;
    name: string;
    facing: number;
    level: number;
    hp: number;
    maxHp: number;
    gathering: null | {
        nodeId: string;
        endsAt: number;
    };
    attacking: string | null;
};
export type Profile = {
    level: number;
    xp: number;
    xpNext: number;
    hp: number;
    maxHp: number;
    energy: number;
    maxEnergy: number;
    tools: Tools;
    stats: Stats;
    claimed: string[];
};
export type Effect = {
    id: number;
    kind: 'damage' | 'hurt' | 'heal' | 'xp' | 'gold' | 'loot' | 'level' | 'arrow' | 'death';
    x: number;
    y: number;
    amount: number;
    text?: string;
    from?: Point;
    at: number;
};
/** Static collections are only sent when their revision changes; clients keep the last copy. */
export type Snapshot = {
    time: number;
    players: Player[];
    mobs: Mob[];
    nodes?: ResourceNode[];
    buildings?: Building[];
    revision: number;
    effects: Effect[];
    inventory: Inventory;
    me: Profile;
    selfId: string;
    seed: number;
};
export type ChatMessage = {
    id: string;
    channel: 'global' | 'system';
    name: string;
    text: string;
    at: number;
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
    kind: z.ZodEnum<["house" | "farm" | "lumber" | "storage" | "tower", ...("house" | "farm" | "lumber" | "storage" | "tower")[]]>;
    actionId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    kind: "house" | "farm" | "lumber" | "storage" | "tower";
    x: number;
    y: number;
    actionId: string;
}, {
    kind: "house" | "farm" | "lumber" | "storage" | "tower";
    x: number;
    y: number;
    actionId: string;
}>;
export declare const attackSchema: z.ZodObject<{
    mobId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    mobId: string;
}, {
    mobId: string;
}>;
export declare const interactSchema: z.ZodObject<{
    buildingId: z.ZodString;
    actionId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    actionId: string;
    buildingId: string;
}, {
    actionId: string;
    buildingId: string;
}>;
export declare const upgradeSchema: z.ZodObject<{
    tool: z.ZodEnum<["sword", "axe", "pickaxe"]>;
    actionId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    actionId: string;
    tool: "sword" | "axe" | "pickaxe";
}, {
    actionId: string;
    tool: "sword" | "axe" | "pickaxe";
}>;
export declare const tradeSchema: z.ZodObject<{
    item: z.ZodEnum<["wood", "stone", "iron", "food"]>;
    mode: z.ZodEnum<["sell", "buy"]>;
    amount: z.ZodNumber;
    actionId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    item: "stone" | "wood" | "iron" | "food";
    amount: number;
    actionId: string;
    mode: "sell" | "buy";
}, {
    item: "stone" | "wood" | "iron" | "food";
    amount: number;
    actionId: string;
    mode: "sell" | "buy";
}>;
export declare const eatSchema: z.ZodObject<{
    actionId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    actionId: string;
}, {
    actionId: string;
}>;
export declare const claimSchema: z.ZodObject<{
    questId: z.ZodString;
    actionId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    actionId: string;
    questId: string;
}, {
    actionId: string;
    questId: string;
}>;
export declare const chatSchema: z.ZodObject<{
    text: z.ZodString;
}, "strict", z.ZodTypeAny, {
    text: string;
}, {
    text: string;
}>;
export declare const sessionSchema: z.ZodObject<{
    name: z.ZodString;
}, "strict", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>;
export type BuildRequest = z.infer<typeof buildSchema>;
export type TradeRequest = z.infer<typeof tradeSchema>;
export interface ClientEvents {
    move: (data: Point) => void;
    gather: (data: z.infer<typeof gatherSchema>) => void;
    build: (data: BuildRequest) => void;
    attack: (data: z.infer<typeof attackSchema>) => void;
    interact: (data: z.infer<typeof interactSchema>) => void;
    upgrade: (data: z.infer<typeof upgradeSchema>) => void;
    trade: (data: TradeRequest) => void;
    eat: (data: z.infer<typeof eatSchema>) => void;
    claim: (data: z.infer<typeof claimSchema>) => void;
    chat: (data: z.infer<typeof chatSchema>) => void;
    stop: () => void;
    resync: () => void;
}
export interface ServerEvents {
    snapshot: (data: Snapshot) => void;
    result: (data: ActionResult) => void;
    activity: (message: string) => void;
    chat: (data: ChatMessage) => void;
    chatHistory: (data: ChatMessage[]) => void;
}
