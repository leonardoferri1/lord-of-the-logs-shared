"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionSchema = exports.chatSchema = exports.claimSchema = exports.eatSchema = exports.tradeSchema = exports.upgradeSchema = exports.interactSchema = exports.attackSchema = exports.buildSchema = exports.gatherSchema = exports.pointSchema = void 0;
const zod_1 = require("zod");
const world_1 = require("./world");
const rules_1 = require("./rules");
const coordinate = zod_1.z
    .number()
    .int()
    .min(0)
    .max(world_1.WORLD_SIZE - 1);
const actionId = zod_1.z.string().uuid();
exports.pointSchema = zod_1.z.object({ x: coordinate, y: coordinate }).strict();
exports.gatherSchema = zod_1.z.object({ nodeId: zod_1.z.string().max(80), actionId }).strict();
exports.buildSchema = exports.pointSchema.extend({
    kind: zod_1.z.enum(rules_1.BUILDING_KINDS),
    actionId,
});
exports.attackSchema = zod_1.z.object({ mobId: zod_1.z.string().max(80) }).strict();
exports.interactSchema = zod_1.z.object({ buildingId: zod_1.z.string().max(80), actionId }).strict();
exports.upgradeSchema = zod_1.z
    .object({ tool: zod_1.z.enum(['sword', 'axe', 'pickaxe']), actionId })
    .strict();
exports.tradeSchema = zod_1.z
    .object({
    item: zod_1.z.enum(['wood', 'stone', 'iron', 'food']),
    mode: zod_1.z.enum(['sell', 'buy']),
    amount: zod_1.z.number().int().min(1).max(50),
    actionId,
})
    .strict();
exports.eatSchema = zod_1.z.object({ actionId }).strict();
exports.claimSchema = zod_1.z.object({ questId: zod_1.z.string().max(40), actionId }).strict();
exports.chatSchema = zod_1.z
    .object({
    text: zod_1.z
        .string()
        .trim()
        .min(1)
        .max(140)
        .regex(/^[^\p{Cc}]+$/u),
})
    .strict();
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
//# sourceMappingURL=contracts.js.map