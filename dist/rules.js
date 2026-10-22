"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.npcInRange = exports.activeQuests = exports.QUESTS = exports.emptyStats = exports.LEASH = exports.MOBS = exports.maxHp = exports.xpToNext = exports.PRICES = exports.TOWER = exports.PRODUCTION = exports.BUILDING_KINDS = exports.RECIPES = exports.GATHER_XP = exports.ATTACK_ENERGY = exports.GATHER_ENERGY = exports.toolForResource = exports.TIER_NAMES = exports.TOOLS = exports.emptyInventory = exports.ITEMS = exports.MAX_TOOL_TIER = exports.MAX_LEVEL = exports.MAX_ENERGY = exports.NPC_RANGE = exports.BUILD_RANGE = exports.GROW_MS = exports.REST_MS = exports.MOB_RESPAWN_MS = exports.ATTACK_MS = exports.REGEN_MS = exports.GATHER_MS = exports.STEP_MS = exports.TICK_MS = void 0;
exports.gatherYield = gatherYield;
exports.upgradeCost = upgradeCost;
exports.swordDamage = swordDamage;
exports.produced = produced;
exports.buildingState = buildingState;
exports.applyXp = applyXp;
exports.mobSpawns = mobSpawns;
exports.questProgress = questProgress;
exports.initialNodes = initialNodes;
exports.footprint = footprint;
exports.blockers = blockers;
exports.placementError = placementError;
exports.buildError = buildError;
exports.gatheringError = gatheringError;
exports.canAfford = canAfford;
exports.nearBuilding = nearBuilding;
const world_1 = require("./world");
exports.TICK_MS = 100;
exports.STEP_MS = 300;
exports.GATHER_MS = 1500;
exports.REGEN_MS = 45000;
exports.ATTACK_MS = 800;
exports.MOB_RESPAWN_MS = 30000;
exports.REST_MS = 120000;
exports.GROW_MS = 60000;
exports.BUILD_RANGE = 6;
exports.NPC_RANGE = 2;
exports.MAX_ENERGY = 100;
exports.MAX_LEVEL = 30;
exports.MAX_TOOL_TIER = 4;
exports.ITEMS = {
    wood: { name: 'Madeira', plural: 'madeiras' },
    stone: { name: 'Pedra', plural: 'pedras' },
    iron: { name: 'Ferro', plural: 'ferros' },
    food: { name: 'Comida', plural: 'comidas' },
    gold: { name: 'Ouro', plural: 'moedas de ouro' },
};
const emptyInventory = () => ({ wood: 0, stone: 0, iron: 0, food: 0, gold: 0 });
exports.emptyInventory = emptyInventory;
exports.TOOLS = {
    sword: { name: 'Espada', use: 'Dano contra goblins' },
    axe: { name: 'Machado', use: 'Madeira por coleta' },
    pickaxe: { name: 'Picareta', use: 'Pedra e ferro por coleta' },
};
exports.TIER_NAMES = ['', 'Rústico', 'de Ferro', 'de Aço', 'Lendário'];
const toolForResource = (r) => r === 'wood' ? 'axe' : r === 'stone' || r === 'iron' ? 'pickaxe' : null;
exports.toolForResource = toolForResource;
function gatherYield(r, tools) {
    if (r === 'wood')
        return 2 + tools.axe;
    if (r === 'stone')
        return 2 + tools.pickaxe;
    if (r === 'iron')
        return 1 + Math.floor(tools.pickaxe / 2);
    return 3;
}
exports.GATHER_ENERGY = 5;
exports.ATTACK_ENERGY = 2;
exports.GATHER_XP = { wood: 3, stone: 3, iron: 8, food: 3 };
function upgradeCost(tier) {
    return { wood: 6 * tier, iron: 3 * tier, gold: 25 * tier };
}
function swordDamage(tier, level, roll) {
    return Math.round(6 + tier * 5 + level * 0.8 + roll * 4);
}
exports.RECIPES = {
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
};
exports.BUILDING_KINDS = Object.keys(exports.RECIPES);
exports.PRODUCTION = {
    lumber: { item: 'wood', every: 12000, cap: 20 },
    storage: { item: 'stone', every: 18000, cap: 15 },
};
exports.TOWER = { range: 5, damage: 8, every: 2000 };
function produced(b, now) {
    const p = exports.PRODUCTION[b.kind];
    return p ? Math.min(p.cap, Math.floor((now - b.producedAt) / p.every)) : 0;
}
function buildingState(b, now) {
    const p = exports.PRODUCTION[b.kind];
    if (p)
        return { action: 'collect', amount: produced(b, now), item: p.item };
    if (b.kind === 'farm') {
        if (b.plantedAt === null)
            return { action: 'plant' };
        const progress = Math.min(1, (now - b.plantedAt) / exports.GROW_MS);
        return progress >= 1 ? { action: 'harvest' } : { action: 'growing', progress };
    }
    if (b.kind === 'house') {
        const progress = Math.min(1, (now - b.producedAt) / exports.REST_MS);
        return { action: 'rest', ready: progress >= 1, progress };
    }
    return { action: 'none' };
}
exports.PRICES = {
    wood: { sell: 2 },
    stone: { sell: 3 },
    iron: { sell: 9, buy: 20 },
    food: { sell: 3, buy: 8 },
};
const xpToNext = (level) => Math.round((80 * level ** 1.3) / 10) * 10;
exports.xpToNext = xpToNext;
const maxHp = (level) => 100 + 12 * (level - 1);
exports.maxHp = maxHp;
function applyXp(level, xp, gain) {
    let gained = 0;
    xp += gain;
    while (level < exports.MAX_LEVEL && xp >= (0, exports.xpToNext)(level)) {
        xp -= (0, exports.xpToNext)(level);
        level++;
        gained++;
    }
    if (level >= exports.MAX_LEVEL)
        xp = Math.min(xp, (0, exports.xpToNext)(level) - 1);
    return { level, xp, gained };
}
exports.MOBS = {
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
};
exports.LEASH = 9;
function mobSpawns() {
    return world_1.CAMPS.flatMap((camp) => Array.from({ length: camp.count }, (_, i) => {
        const angle = (i / camp.count) * Math.PI * 2 + camp.x;
        const home = {
            x: Math.round(camp.x + Math.cos(angle) * (camp.radius - 1)),
            y: Math.round(camp.y + Math.sin(angle) * (camp.radius - 1)),
        };
        if (world_1.LANDMARK_CELLS.has((0, world_1.key)(home)))
            home.y++;
        return { id: `mob-${camp.id}-${i}`, kind: camp.kind, home };
    }));
}
const emptyStats = () => ({
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
exports.emptyStats = emptyStats;
exports.QUESTS = [
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
function questProgress(quest, ctx) {
    const o = quest.objective;
    const value = o.type === 'stat'
        ? ctx.stats[o.stat]
        : o.type === 'build'
            ? (ctx.owned[o.kind] ?? 0)
            : ctx.level;
    return Math.min(quest.target, value);
}
/** The next three unclaimed quests of the chain are active at once. */
const activeQuests = (claimed) => exports.QUESTS.filter((q) => !claimed.includes(q.id)).slice(0, 3);
exports.activeQuests = activeQuests;
const CAPACITY = { wood: 24, stone: 24, iron: 12, food: 9 };
function initialNodes() {
    const nodes = [];
    for (let y = 2; y < world_1.WORLD_SIZE - 2; y++)
        for (let x = 2; x < world_1.WORLD_SIZE - 2; x++) {
            const t = (0, world_1.terrain)(x, y), r = (0, world_1.region)(x, y);
            if (r === 'vila' || (0, world_1.campAt)({ x, y }) || world_1.LANDMARK_CELLS.has((0, world_1.key)({ x, y })))
                continue;
            if (world_1.NPCS.some((n) => (0, world_1.distance)(n, { x, y }) < 2))
                continue;
            let kind = null;
            if (t === 'forest' && (0, world_1.noise)(x, y, 123) > (r === 'sombria' ? 0.25 : 0.34))
                kind = 'wood';
            else if (t === 'stone' && (0, world_1.noise)(x, y, 55) > 0.32)
                kind = r === 'montanhas' && (0, world_1.noise)(x, y, 77) > 0.6 ? 'iron' : 'stone';
            else if (t === 'grass' && (r === 'campos' || r === 'lago') && (0, world_1.noise)(x, y, 41) > 0.86)
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
function footprint(p, kind) {
    return Array.from({ length: exports.RECIPES[kind].size ** 2 }, (_, i) => ({
        x: p.x + (i % exports.RECIPES[kind].size),
        y: p.y + Math.floor(i / exports.RECIPES[kind].size),
    }));
}
function blockers(nodes, buildings) {
    return new Set([
        ...world_1.LANDMARK_CELLS,
        ...nodes.map(world_1.key),
        ...buildings.flatMap((b) => footprint(b, b.kind).map(world_1.key)),
    ]);
}
function placementError(p, kind, occupied, players) {
    const cells = footprint(p, kind);
    if (cells.some((t) => !(0, world_1.walkable)(t, occupied)))
        return 'Local ocupado ou terreno inválido.';
    if (cells.some((t) => (0, world_1.isRoad)((0, world_1.terrain)(t.x, t.y))))
        return 'Mantenha estradas e a praça livres.';
    if (cells.some((t) => players.some((player) => (0, world_1.key)(player) === (0, world_1.key)(t))))
        return 'Há um viajante neste local.';
    if (cells.some((t) => world_1.NPCS.some((n) => (0, world_1.distance)(n, t) <= 1)))
        return 'Muito perto de um morador.';
    if (cells.some((t) => (0, world_1.campAt)(t)))
        return 'Território goblin. Escolha outro local.';
    return null;
}
function buildError(p, kind, position, level) {
    if (level < exports.RECIPES[kind].level)
        return `Requer nível ${exports.RECIPES[kind].level}.`;
    if ((0, world_1.distance)(position, p) > exports.BUILD_RANGE)
        return `Construa a até ${exports.BUILD_RANGE} passos de distância.`;
    return null;
}
function gatheringError(player, node) {
    if (!node)
        return 'Recurso inexistente.';
    if ((0, world_1.distance)(player, node) > 1)
        return 'Aproxime-se do recurso primeiro.';
    if (node.quantity <= 0)
        return 'Recurso esgotado. Aguarde a regeneração.';
    return null;
}
function canAfford(inventory, cost) {
    return Object.entries(cost).every(([item, n]) => inventory[item] >= n);
}
function nearBuilding(p, b, range = 2) {
    return footprint(b, b.kind).some((cell) => (0, world_1.distance)(p, cell) <= range);
}
const npcInRange = (p, role) => world_1.NPCS.some((n) => n.role === role && (0, world_1.distance)(p, n) <= exports.NPC_RANGE);
exports.npcInRange = npcInRange;
//# sourceMappingURL=rules.js.map