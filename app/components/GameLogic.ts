import {
    CANVAS_WIDTH, CANVAS_HEIGHT, CONSTANTS, SCORES, HazardState,
    NPCType, BehaviorType, BEHAVIORS, LEVELS, DialogData, DialogOption,
    OBSTACLES, Obstacle
} from "./GameConsts";

export interface Vector2D {
    x: number;
    y: number;
}

export interface ActiveDialog {
    npcId: number;
    dialogData: DialogData;
}

export class Player implements Vector2D {
    x: number = CANVAS_WIDTH / 2;
    y: number = CANVAS_HEIGHT / 2;
    radius: number = 15;
    speed: number = CONSTANTS.PLAYER_SPEED;
    target: Vector2D | null = null;
    facing: number = 0; // Angle in radians
}

export class NPC implements Vector2D {
    id: number;
    x: number;
    y: number;
    width: number = 30;
    height: number = 30;

    type: NPCType;
    state: HazardState = "SAFE";
    currentBehavior: BehaviorType | null = null;

    // Timer states
    stateTimer: number = 0;
    maxStateTimer: number = 0;
    stunTimer: number = 0;

    // Movement
    target: Vector2D | null = null;
    speed: number = 50;
    facing: number = 0; // Angle in radians

    constructor(id: number) {
        this.id = id;
        this.x = 150 + Math.random() * (CANVAS_WIDTH - 300);
        this.y = 100 + Math.random() * (CANVAS_HEIGHT - 200);

        const types: NPCType[] = ["PHOTO_JUNKIE", "CURIOUS", "FAMILY", "TRENDY", "PARTY_GUEST", "VIP"];
        this.type = types[Math.floor(Math.random() * types.length)];

        this.pickNewRandomTarget();
    }

    pickNewRandomTarget() {
        this.target = {
            x: 120 + Math.random() * (CANVAS_WIDTH - 240),
            y: 70 + Math.random() * (CANVAS_HEIGHT - 140),
        };
    }

    startHazardBehavior(multiplier: number) {
        if (this.state !== "SAFE") return;

        const r = Math.random();
        // Different NPC types prefer different behaviors
        if (this.type === "PHOTO_JUNKIE") {
            this.currentBehavior = r > 0.3 ? "SELFIE_RAIL" : "TAKE_OFF_LIFEJACKET";
        } else if (this.type === "FAMILY") {
            this.currentBehavior = r > 0.4 ? "KIDS_RUNNING" : "LEANING_RAIL";
        } else if (this.type === "PARTY_GUEST") {
            this.currentBehavior = r > 0.2 ? "DRINKING_NEAR_EDGE" : "SELFIE_RAIL";
        } else if (this.type === "TRENDY") {
            this.currentBehavior = r > 0.5 ? "TAKE_OFF_LIFEJACKET" : "SELFIE_RAIL";
        } else {
            const behaviors: BehaviorType[] = ["SELFIE_RAIL", "LEANING_RAIL", "TAKE_OFF_LIFEJACKET", "KIDS_RUNNING", "DRINKING_NEAR_EDGE"];
            this.currentBehavior = behaviors[Math.floor(Math.random() * behaviors.length)];
        }

        const behaviorDef = BEHAVIORS[this.currentBehavior];

        if (behaviorDef.requiresEdge) {
            const edge = Math.floor(Math.random() * 4);
            let tx = this.x, ty = this.y;
            const margin = CONSTANTS.HAZARD_ZONE_MARGIN;

            if (edge === 0) { ty = 50 + margin / 2; tx = 100 + Math.random() * (CANVAS_WIDTH - 200); } // Top
            else if (edge === 1) { ty = CANVAS_HEIGHT - 50 - margin / 2; tx = 100 + Math.random() * (CANVAS_WIDTH - 200); } // Bottom
            else if (edge === 2) { tx = 100 + margin / 2; ty = 50 + Math.random() * (CANVAS_HEIGHT - 100); } // Left
            else if (edge === 3) { tx = CANVAS_WIDTH - 100 - margin / 2; ty = 50 + Math.random() * (CANVAS_HEIGHT - 100); } // Right

            this.target = { x: tx, y: ty };
        } else {
            this.transitionToState("YELLOW");
        }
    }

    transitionToState(newState: HazardState, rockingModifier: number = 0) {
        this.state = newState;
        if (newState === "SAFE") {
            this.currentBehavior = null;
            this.stateTimer = 0;
            this.maxStateTimer = 0;
            this.pickNewRandomTarget();
            return;
        }

        if (!this.currentBehavior) return;
        const behaviorDef = BEHAVIORS[this.currentBehavior];

        // Reduce timer based on rocking modifier (more rock = less time to react)
        let timerMult = 1.0;
        if (rockingModifier === 1) timerMult = 0.8; // 20% faster
        if (rockingModifier === 2) timerMult = 0.6; // 40% faster

        if (newState === "YELLOW") {
            this.stateTimer = behaviorDef.durationYellow * timerMult;
            this.maxStateTimer = behaviorDef.durationYellow * timerMult;
        } else if (newState === "ORANGE") {
            this.stateTimer = behaviorDef.durationOrange * timerMult;
            this.maxStateTimer = behaviorDef.durationOrange * timerMult;
        } else if (newState === "RED") {
            this.stateTimer = behaviorDef.durationRed * timerMult;
            this.maxStateTimer = behaviorDef.durationRed * timerMult;
        }

        this.target = null;
    }
}

export type GameScreenState = "START" | "PLAYING" | "LEVEL_COMPLETE" | "SHOP" | "GAME_OVER" | "VICTORY";

export class GameState {
    screen: GameScreenState = "START";
    score: number = 0;
    coins: number = 0; // The persistent currency
    accidents: number = 0;

    // Skill Tree Upgrades
    upgrades = {
        speed: 0,       // Movement speed/dash multiplier
        whistle: 0,     // Stun duration/unlocked
        radar: 0        // Map visibility
    };

    whistleCooldown: number = 0;

    public useWhistle() {
        if (this.upgrades.whistle === 0) return false;
        if (this.whistleCooldown > 0) return false;

        const stunDurationSeconds = this.upgrades.whistle === 1 ? 2.0 : 4.0;

        let stunnedAny = false;
        this.npcs.forEach(npc => {
            if (npc.state !== "SAFE" && npc.state !== "ACCIDENT") {
                npc.stunTimer = stunDurationSeconds; // Stun lasts in seconds
                stunnedAny = true;
            }
        });

        if (stunnedAny) {
            this.whistleCooldown = 15.0; // 15 seconds cooldown
            return true;
        }
        return false;
    }

    currentLevelIndex: number = 0;
    levelTimer: number = 0;
    maxLevelTimer: number = 0;
    totalTime: number = 0; // for wave sync

    player: Player = new Player();
    npcs: NPC[] = [];

    activeDialog: ActiveDialog | null = null;

    constructor() {
        this.loadProgress();

        if (typeof window !== "undefined") {
            (window as any).__gameState = this;
        }
    }

    public saveProgress() {
        if (typeof window !== "undefined") {
            const data = {
                currentLevelIndex: this.currentLevelIndex,
                score: this.score,
                coins: this.coins,
                upgrades: this.upgrades
            };
            localStorage.setItem("safeVoyageProgress", JSON.stringify(data));
        }
    }

    public loadProgress() {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("safeVoyageProgress");
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    // Don't auto-load level if it was game over, we handle new game start separately.
                    this.score = data.score || 0;
                    this.coins = data.coins || 0;
                    if (data.upgrades) this.upgrades = data.upgrades;
                    // Optional: could restore level progress if wanted
                } catch (e) {
                    console.error("Failed to load progress", e);
                }
            }
        }
    }

    public startLevel(index: number) {
        this.currentLevelIndex = index;
        const config = LEVELS[index];

        if (!config) {
            this.screen = "VICTORY";
            return;
        }

        this.screen = "PLAYING";
        this.accidents = 0;
        this.levelTimer = 0;
        this.maxLevelTimer = config.durationSeconds;
        this.activeDialog = null;
        this.whistleCooldown = 0;

        this.player = new Player();
        // Apply Speed Upgrade
        this.player.speed = CONSTANTS.PLAYER_SPEED * (1 + 0.2 * this.upgrades.speed);

        this.npcs = [];
        for (let i = 0; i < config.npcCount; i++) {
            this.npcs.push(new NPC(i));
        }
    }

    public update(dt: number) {
        if (this.screen !== "PLAYING") return;
        if (this.activeDialog) return; // Pause game logic during dialog

        const config = LEVELS[this.currentLevelIndex];
        const rockingModifier = config.rockingModifier || 0;
        this.levelTimer += dt;
        this.totalTime += dt;

        if (this.levelTimer >= this.maxLevelTimer) {
            this.screen = "LEVEL_COMPLETE";

            // Calculate coined earned this level (Base + 10% of Score + Bonus for no accidents)
            const baseCoins = 50;
            const scoreCoins = Math.max(0, Math.floor(this.score * 0.1));
            const perfectBonus = this.accidents === 0 ? 100 : 0;

            this.coins += (baseCoins + scoreCoins + perfectBonus);
            this.saveProgress();

            return;
        }

        if (this.accidents >= config.allowedAccidents) {
            this.screen = "GAME_OVER";
            return;
        }

        this.updateMovement(this.player, dt, 0, 0);

        if (this.whistleCooldown > 0) {
            this.whistleCooldown = Math.max(0, this.whistleCooldown - dt);
        }

        this.npcs.forEach(npc => {
            if (npc.stunTimer > 0) {
                npc.stunTimer -= dt;
                // Stunned NPCs stand still and their danger timer doesn't drop
                return;
            }

            if (npc.target) {
                const arrived = this.updateMovement(npc, dt, rockingModifier, this.totalTime);
                if (arrived) {
                    if (npc.state === "SAFE" && npc.currentBehavior && BEHAVIORS[npc.currentBehavior].requiresEdge) {
                        npc.transitionToState("YELLOW", rockingModifier);
                    } else if (npc.state === "SAFE" && Math.random() < 0.3) {
                        npc.pickNewRandomTarget();
                    }
                }
            }

            if (npc.state === "SAFE" && !npc.currentBehavior) {
                const spawnChance = (0.005 * dt * 60) * config.hazardSpawnRateMultiplier;
                if (Math.random() < spawnChance) {
                    npc.startHazardBehavior(config.hazardSpawnRateMultiplier);
                }
            }

            if (npc.state === "YELLOW" || npc.state === "ORANGE" || npc.state === "RED") {
                npc.stateTimer -= dt * 1000;
                if (npc.stateTimer <= 0) {
                    if (npc.state === "YELLOW") npc.transitionToState("ORANGE", rockingModifier);
                    else if (npc.state === "ORANGE") npc.transitionToState("RED", rockingModifier);
                    else if (npc.state === "RED") {
                        npc.state = "ACCIDENT";
                        this.score += SCORES.ACCIDENT;
                        this.accidents += 1;

                        setTimeout(() => {
                            if (this.screen === "PLAYING") {
                                const found = this.npcs.find(n => n.id === npc.id);
                                if (found) found.transitionToState("SAFE", rockingModifier);
                            }
                        }, 3000);
                    }
                }
            }
        });
    }

    // Helper: Circle vs Rectangle collision
    private checkCollision(cx: number, cy: number, radius: number): boolean {
        for (const obs of OBSTACLES) {
            // Find the closest point to the circle within the rectangle
            const testX = Math.max(obs.x, Math.min(cx, obs.x + obs.w));
            const testY = Math.max(obs.y, Math.min(cy, obs.y + obs.h));

            // Calculate distance from closest point to circle center
            const distX = cx - testX;
            const distY = cy - testY;
            const distance = Math.sqrt(distX * distX + distY * distY);

            if (distance < radius) {
                return true; // Collision detected
            }
        }
        return false;
    }

    private updateMovement(entity: { x: number, y: number, speed: number, target: Vector2D | null, radius?: number }, dt: number, rockingModifier: number, totalTime: number): boolean {
        if (rockingModifier > 0 && "state" in entity) {
            // Only drift NPCs, not player
            const npc = entity as any;
            if (npc.state === "SAFE") {
                const driftPower = rockingModifier * 30;
                const newY = entity.y + Math.sin(totalTime * 2) * driftPower * dt;

                // Drift bounds & collision
                if (!this.checkCollision(entity.x, newY, entity.radius || 15)) {
                    entity.y = newY;
                }
                entity.y = Math.max(70, Math.min(entity.y, CANVAS_HEIGHT - 70));
            }
        }

        if (!entity.target) return true;

        const dx = entity.target.x - entity.x;
        const dy = entity.target.y - entity.y;

        // Update facing direction if moving
        if (dx !== 0 || dy !== 0) {
            (entity as any).facing = Math.atan2(dy, dx);
        }

        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 5) {
            const moveDist = Math.min(entity.speed * dt, dist);
            const moveX = (dx / dist) * moveDist;
            const moveY = (dy / dist) * moveDist;
            const radius = entity.radius || 15; // default radius

            // Try moving both axes
            if (!this.checkCollision(entity.x + moveX, entity.y + moveY, radius)) {
                entity.x += moveX;
                entity.y += moveY;
            } else if (!this.checkCollision(entity.x + moveX, entity.y, radius)) {
                // Slide horizontally
                entity.x += moveX;
            } else if (!this.checkCollision(entity.x, entity.y + moveY, radius)) {
                // Slide vertically
                entity.y += moveY;
            } else {
                // Stuck
                if ("state" in entity) {
                    // It's an NPC, pick a new target if stuck for a bit
                    // For simply, just clear target and let loop handle it
                    entity.target = null;
                    return true;
                }
            }

            // Check if arrived after move
            const newDist = Math.sqrt(Math.pow(entity.target.x - entity.x, 2) + Math.pow(entity.target.y - entity.y, 2));
            if (newDist <= 5) {
                entity.target = null;
                return true;
            }
            return false;
        } else {
            entity.target = null;
            return true;
        }
    }

    public handleIntervention(clickX: number, clickY: number): boolean {
        if (this.activeDialog) return false;

        let interacted = false;

        for (const npc of this.npcs) {
            const dx = clickX - npc.x;
            const dy = clickY - npc.y;
            if (Math.sqrt(dx * dx + dy * dy) < 40) {
                const pDx = this.player.x - npc.x;
                const pDy = this.player.y - npc.y;
                if (Math.sqrt(pDx * pDx + pDy * pDy) <= CONSTANTS.INTERACTION_DISTANCE) {
                    interacted = true;

                    if (npc.state !== "SAFE" && npc.state !== "ACCIDENT") {
                        if (npc.state === "YELLOW") this.score += SCORES.INTERVENE_YELLOW;
                        else if (npc.state === "ORANGE") this.score += SCORES.INTERVENE_ORANGE;
                        else if (npc.state === "RED") this.score += SCORES.INTERVENE_RED;

                        const behaviorDef = BEHAVIORS[npc.currentBehavior!];
                        if (behaviorDef && behaviorDef.dialogs.length > 0) {
                            const dialog = behaviorDef.dialogs[Math.floor(Math.random() * behaviorDef.dialogs.length)];
                            this.activeDialog = {
                                npcId: npc.id,
                                dialogData: dialog
                            };
                        } else {
                            npc.transitionToState("SAFE");
                        }
                    }
                }
                break;
            }
        }
        return interacted;
    }

    public resolveDialog(option: DialogOption) {
        if (!this.activeDialog) return;

        const npc = this.npcs.find(n => n.id === this.activeDialog!.npcId);
        this.activeDialog = null;

        if (!npc) return;

        if (option.isCorrect) {
            if (option.isBonus) this.score += 50;
            npc.transitionToState("SAFE");
        } else {
            if (npc.type === "VIP" || npc.type === "PARTY_GUEST") {
                npc.stateTimer = Math.min(npc.stateTimer + 1500, npc.maxStateTimer);
            } else {
                npc.transitionToState("SAFE");
            }
        }
    }
}
