import {
    CANVAS_WIDTH, CANVAS_HEIGHT, CONSTANTS, SCORES, HazardState,
    NPCType, BehaviorType, BEHAVIORS, LEVELS, DialogData, DialogOption
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

    // Movement
    target: Vector2D | null = null;
    speed: number = 50;

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

export type GameScreenState = "START" | "PLAYING" | "LEVEL_COMPLETE" | "GAME_OVER" | "VICTORY";

export class GameState {
    screen: GameScreenState = "START";
    score: number = 0;
    accidents: number = 0;

    currentLevelIndex: number = 0;
    levelTimer: number = 0;
    maxLevelTimer: number = 0;
    totalTime: number = 0; // for wave sync

    player: Player = new Player();
    npcs: NPC[] = [];

    activeDialog: ActiveDialog | null = null;

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

        this.player = new Player();

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
            return;
        }

        if (this.accidents >= config.allowedAccidents) {
            this.screen = "GAME_OVER";
            return;
        }

        this.updateMovement(this.player, dt, 0, 0);

        this.npcs.forEach(npc => {
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

    private updateMovement(entity: { x: number, y: number, speed: number, target: Vector2D | null }, dt: number, rockingModifier: number, totalTime: number): boolean {
        if (rockingModifier > 0 && "state" in entity) {
            // Only drift NPCs, not player
            const npc = entity as any;
            if (npc.state === "SAFE") {
                const driftPower = rockingModifier * 30;
                entity.y += Math.sin(totalTime * 2) * driftPower * dt;

                // Keep in bounds
                entity.y = Math.max(70, Math.min(entity.y, CANVAS_HEIGHT - 70));
            }
        }

        if (!entity.target) return true;

        const dx = entity.target.x - entity.x;
        const dy = entity.target.y - entity.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 5) {
            const moveDist = entity.speed * dt;
            if (moveDist >= dist) {
                entity.x = entity.target.x;
                entity.y = entity.target.y;
                entity.target = null;
                return true;
            } else {
                entity.x += (dx / dist) * moveDist;
                entity.y += (dy / dist) * moveDist;
                return false;
            }
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
