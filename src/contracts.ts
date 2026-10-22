import { z } from 'zod';
import { WORLD_SIZE, type Point } from './world';
import {
  BUILDING_KINDS,
  type Building,
  type BuildingKind,
  type Inventory,
  type Mob,
  type ResourceNode,
  type Stats,
  type Tools,
} from './rules';

export type Player = Point & {
  id: string;
  name: string;
  facing: number;
  level: number;
  hp: number;
  maxHp: number;
  gathering: null | { nodeId: string; endsAt: number };
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
export type ActionResult = { ok: boolean; message: string; actionId?: string };

const coordinate = z
  .number()
  .int()
  .min(0)
  .max(WORLD_SIZE - 1);
const actionId = z.string().uuid();
export const pointSchema = z.object({ x: coordinate, y: coordinate }).strict();
export const gatherSchema = z.object({ nodeId: z.string().max(80), actionId }).strict();
export const buildSchema = pointSchema.extend({
  kind: z.enum(BUILDING_KINDS as [BuildingKind, ...BuildingKind[]]),
  actionId,
});
export const attackSchema = z.object({ mobId: z.string().max(80) }).strict();
export const interactSchema = z.object({ buildingId: z.string().max(80), actionId }).strict();
export const upgradeSchema = z
  .object({ tool: z.enum(['sword', 'axe', 'pickaxe']), actionId })
  .strict();
export const tradeSchema = z
  .object({
    item: z.enum(['wood', 'stone', 'iron', 'food']),
    mode: z.enum(['sell', 'buy']),
    amount: z.number().int().min(1).max(50),
    actionId,
  })
  .strict();
export const eatSchema = z.object({ actionId }).strict();
export const claimSchema = z.object({ questId: z.string().max(40), actionId }).strict();
export const chatSchema = z
  .object({
    text: z
      .string()
      .trim()
      .min(1)
      .max(140)
      .regex(/^[^\p{Cc}]+$/u),
  })
  .strict();
export const sessionSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(20)
      .regex(/^[\p{L}\p{N} _-]+$/u),
  })
  .strict();
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
