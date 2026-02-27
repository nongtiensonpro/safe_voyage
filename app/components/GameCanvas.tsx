"use client";

import React, { useEffect, useRef, useState } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, CONSTANTS, LEVELS, DialogOption, NPC_EMOJIS, OBSTACLES, UPGRADE_STORE } from "./GameConsts";
import { GameState, ActiveDialog } from "./GameLogic";
import { audioSystem } from "./AudioSystem";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { Button } from "@heroui/button";

// Particle system interface
interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    text: string;
    color: string;
    size: number;
}

export default function GameCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [screen, setScreen] = useState<"START" | "PLAYING" | "LEVEL_COMPLETE" | "SHOP" | "GAME_OVER" | "VICTORY">("START");
    const [score, setScore] = useState(0);
    const [coins, setCoins] = useState(0);
    const [accidents, setAccidents] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [whistleCd, setWhistleCd] = useState(0);
    const [level, setLevel] = useState(1);
    const [levelName, setLevelName] = useState("");
    const [allowedAccidents, setAllowedAccidents] = useState(3);
    const [activeDialog, setActiveDialog] = useState<ActiveDialog | null>(null);
    const [isMuted, setIsMuted] = useState(false);

    const gameStateRef = useRef(new GameState());
    const particlesRef = useRef<Particle[]>([]);
    const waveOffsetRef = useRef(0);

    useEffect(() => {
        // Initialize audio system on mount (requires user interaction to actually play)
        audioSystem.init();
        setIsMuted(audioSystem.getIsMuted());

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let lastTime = performance.now();

        const renderLoop = (currentTime: number) => {
            const state = gameStateRef.current;
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;

            // Update Engine
            state.update(deltaTime);
            updateParticles(deltaTime);
            waveOffsetRef.current += deltaTime * 20;

            // Check state transitions for Audio
            if (screen !== state.screen) {
                if (state.screen === "GAME_OVER") {
                    audioSystem.playErrorBuzz();
                } else if (state.screen === "VICTORY" || state.screen === "LEVEL_COMPLETE") {
                    audioSystem.playSuccessChime();
                }
                setScreen(state.screen);
            }

            // Check score changes to spawn particles
            if (score !== state.score) {
                if (state.score < score) { // Accident
                    audioSystem.playAccidentSplash();
                }
                setScore(state.score);
            }
            if (coins !== state.coins) setCoins(state.coins);
            if (whistleCd !== state.whistleCooldown) setWhistleCd(state.whistleCooldown);

            if (accidents !== state.accidents) setAccidents(state.accidents);

            if (activeDialog !== state.activeDialog) {
                if (!activeDialog && state.activeDialog) {
                    audioSystem.playWarningBlip();
                }
                setActiveDialog(state.activeDialog);
            }

            const newTimeRemaining = Math.max(0, state.maxLevelTimer - state.levelTimer);
            if (Math.abs(timeRemaining - newTimeRemaining) > 0.5) {
                setTimeRemaining(newTimeRemaining);
            }

            // Render
            draw(ctx, state);

            animationFrameId = requestAnimationFrame(renderLoop);
        };

        animationFrameId = requestAnimationFrame(renderLoop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [screen, score, accidents, activeDialog, timeRemaining]); // Dependencies mainly for Audio triggers checking

    useEffect(() => {
        const state = gameStateRef.current;
        if (LEVELS[state.currentLevelIndex]) {
            setLevel(LEVELS[state.currentLevelIndex].level);
            setLevelName(LEVELS[state.currentLevelIndex].name);
            setAllowedAccidents(LEVELS[state.currentLevelIndex].allowedAccidents);
        }
    }, [screen]);

    const spawnParticles = (x: number, y: number, text: string, color: string, count: number = 5) => {
        for (let i = 0; i < count; i++) {
            particlesRef.current.push({
                x, y,
                vx: (Math.random() - 0.5) * 100,
                vy: Math.random() * -100 - 50,
                life: 1.0,
                maxLife: 1.0,
                text: i === 0 ? text : ["✨", "🌟", "💧"][Math.floor(Math.random() * 3)], // Main text then fluff
                color,
                size: i === 0 ? 20 : 12
            });
        }
    };

    const updateParticles = (dt: number) => {
        const pCounter = particlesRef.current;
        for (let i = pCounter.length - 1; i >= 0; i--) {
            const p = pCounter[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) {
                pCounter.splice(i, 1);
            }
        }
    };

    // Global Keyboard Hook for Whistle
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === "Space" && gameStateRef.current.screen === "PLAYING") {
                e.preventDefault();
                const state = gameStateRef.current;

                // Only try to use if we have it and it's not on cooldown
                if (state.upgrades.whistle > 0 && state.whistleCooldown <= 0) {
                    const success = state.useWhistle();
                    if (success) {
                        audioSystem.playSuccessChime(); // Whistle sound placeholder
                        spawnParticles(state.player.x, state.player.y - 20, "📯", "#FFD700", 8);
                    } else {
                        audioSystem.playErrorBuzz(); // Nothing to stun
                    }
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const state = gameStateRef.current;
        if (state.screen !== "PLAYING") return;
        audioSystem.resume();

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const interacted = state.handleIntervention(clickX, clickY);

        if (!interacted && !state.activeDialog) {
            state.player.target = { x: clickX, y: clickY };
            audioSystem.playClick();
        }
    };

    const draw = (ctx: CanvasRenderingContext2D, state: GameState) => {
        const config = LEVELS[state.currentLevelIndex];
        const rockingModifier = config ? (config.rockingModifier || 0) : 0;

        // 1. Clear & Background (Water with waves)
        ctx.fillStyle = rockingModifier > 0 ? (rockingModifier === 2 ? "#1A2530" : "#2C3E50") : COLORS.WATER;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
            for (let x = 0; x < CANVAS_WIDTH; x += 20) {
                const drift = Math.sin(x * 0.05 + waveOffsetRef.current) * 10;
                if (x === 0) ctx.moveTo(x, y + drift);
                else ctx.lineTo(x, y + drift);
            }
        }
        ctx.stroke();

        ctx.save();
        if (rockingModifier > 0) {
            const tiltAngle = Math.sin(state.totalTime) * (rockingModifier * 2) * (Math.PI / 180);
            ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
            ctx.rotate(tiltAngle);
            ctx.translate(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2);
        }

        // 2. Draw Deck (Wooden Planks)
        const deckMargin = 80;
        ctx.fillStyle = COLORS.DECK;
        ctx.beginPath();
        ctx.roundRect(deckMargin, deckMargin / 2, CANVAS_WIDTH - deckMargin * 2, CANVAS_HEIGHT - deckMargin, 20);
        ctx.fill();

        // Plank lines
        ctx.strokeStyle = "rgba(0,0,0,0.1)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = deckMargin; i < CANVAS_WIDTH - deckMargin; i += 30) {
            ctx.moveTo(i, deckMargin / 2);
            ctx.lineTo(i, CANVAS_HEIGHT - deckMargin / 2);
        }
        ctx.stroke();

        // 3. Draw Hazard Zones (Caution Stripes around Deck Edge)
        drawWarningStripes(ctx, deckMargin, deckMargin / 2, CANVAS_WIDTH - deckMargin * 2, 15); // Top
        drawWarningStripes(ctx, deckMargin, CANVAS_HEIGHT - deckMargin / 2 - 15, CANVAS_WIDTH - deckMargin * 2, 15); // Bottom
        drawWarningStripes(ctx, deckMargin, deckMargin / 2, 15, CANVAS_HEIGHT - deckMargin); // Left
        drawWarningStripes(ctx, CANVAS_WIDTH - deckMargin - 15, deckMargin / 2, 15, CANVAS_HEIGHT - deckMargin); // Right

        // Handrails (Posts)
        ctx.fillStyle = "#A1887F"; // Brown rail color
        const drawPosts = (xStart: number, yStart: number, xEnd: number, yEnd: number, isHoriz: boolean) => {
            const count = 15;
            ctx.fillRect(xStart, yStart, xEnd - xStart + (isHoriz ? 0 : 5), yEnd - yStart + (isHoriz ? 5 : 0)); // Top rail
            for (let i = 0; i <= count; i++) {
                if (isHoriz) {
                    const px = xStart + (xEnd - xStart) * (i / count);
                    ctx.fillRect(px, yStart, 5, 15);
                } else {
                    const py = yStart + (yEnd - yStart) * (i / count);
                    ctx.fillRect(xStart, py, 15, 5);
                }
            }
        };
        drawPosts(deckMargin, deckMargin / 2 - 5, CANVAS_WIDTH - deckMargin, deckMargin / 2 - 5, true);
        drawPosts(deckMargin, CANVAS_HEIGHT - deckMargin / 2, CANVAS_WIDTH - deckMargin, CANVAS_HEIGHT - deckMargin / 2, true);
        drawPosts(deckMargin - 5, deckMargin / 2, deckMargin - 5, CANVAS_HEIGHT - deckMargin / 2, false);
        drawPosts(CANVAS_WIDTH - deckMargin, deckMargin / 2, CANVAS_WIDTH - deckMargin, CANVAS_HEIGHT - deckMargin / 2, false);

        // 3.5 Draw Obstacles
        OBSTACLES.forEach(obs => {
            if (obs.type === "WHISTLE_ZONE") return; // Don't draw the whistle zone, it's just for collision
            // Shadow
            ctx.fillStyle = "rgba(0,0,0,0.3)";
            ctx.fillRect(obs.x + 5, obs.y + 5, obs.w, obs.h);

            if (obs.type === "BAR") {
                ctx.fillStyle = "#5D4037"; // Dark brown wood
                ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
                ctx.fillStyle = "#8D6E63"; // Lighter top
                ctx.fillRect(obs.x + 2, obs.y + 2, obs.w - 4, obs.h - 4);
                // Bartender hint
                ctx.font = "20px Arial";
                ctx.fillText("🍹", obs.x + obs.w / 2 - 10, obs.y + obs.h / 2 + 5);
            } else if (obs.type === "CHAIRS") {
                ctx.fillStyle = "#1E88E5"; // Blue chairs/table
                ctx.beginPath();
                ctx.arc(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.w / 2 - 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#90CAF9";
                ctx.beginPath();
                ctx.arc(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.w / 2 - 5, 0, Math.PI * 2);
                ctx.fill();
            } else if (obs.type === "EQUIPMENT") {
                ctx.fillStyle = "#607D8B"; // Gray metal
                ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
                // Stripes
                ctx.fillStyle = "#37474F";
                for (let i = 10; i < obs.w; i += 20) {
                    ctx.fillRect(obs.x + i, obs.y, 5, obs.h);
                }
            }
        });

        if (state.screen !== "PLAYING") return;

        // 4. Draw NPCs
        state.npcs.forEach((npc) => {
            // Draw Shadow
            ctx.fillStyle = "rgba(0,0,0,0.2)";
            ctx.beginPath();
            ctx.ellipse(npc.x, npc.y + 15, 12, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Background Color Disc
            if (npc.state !== "SAFE" && npc.state !== "ACCIDENT") {
                ctx.fillStyle = COLORS[npc.state as keyof typeof COLORS];
                ctx.beginPath();
                ctx.arc(npc.x, npc.y, npc.width / 2 + 5, 0, Math.PI * 2);
                ctx.fill();

                // Radar Upgrade Effect
                if (state.upgrades.radar > 0) {
                    ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.arc(npc.x, npc.y, npc.width / 2 + 15 + Math.sin(state.totalTime * 5) * 5, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.setLineDash([]); // reset
                }
            } else if (npc.state === "ACCIDENT") {
                ctx.font = "30px Arial";
                ctx.fillText("💀", npc.x - 15, npc.y + 10);
                return; // Skip normal drawing
            }

            // --- Draw Animated NPC Sprite ---
            ctx.save();
            ctx.translate(npc.x, npc.y);

            // Wobble animation if moving
            if (npc.target) {
                const wobble = Math.sin(state.totalTime * 15) * 0.15;
                ctx.rotate(npc.facing + wobble);
            } else {
                ctx.rotate(npc.facing);
            }

            // Body
            const bodyColor = COLORS[npc.type === "PHOTO_JUNKIE" ? "NPC_PHOTO" :
                (npc.type === "CURIOUS" ? "NPC_CURIOUS" :
                    (npc.type === "FAMILY" ? "NPC_FAMILY" :
                        (npc.type === "TRENDY" ? "NPC_TRENDY" :
                            (npc.type === "PARTY_GUEST" ? "NPC_PARTY" : "NPC_VIP"))))];

            ctx.fillStyle = bodyColor;
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.fill();

            // Shoulders/Backpack based on type
            ctx.fillStyle = "rgba(0,0,0,0.2)";
            ctx.fillRect(-12, -8, 24, 8); // Back

            // Head (Skin tone)
            ctx.fillStyle = "#FFCDB2";
            ctx.beginPath();
            ctx.arc(4, 0, 8, 0, Math.PI * 2); // Shifted slightly forward
            ctx.fill();

            // Accessories based on type
            if (npc.type === "PHOTO_JUNKIE") {
                // Camera
                ctx.fillStyle = "#333";
                ctx.fillRect(8, -4, 6, 8); // Camera body
                ctx.fillStyle = "#FFF";
                ctx.beginPath();
                ctx.arc(14, 0, 3, 0, Math.PI * 2); // Lens
                ctx.fill();
            } else if (npc.type === "VIP") {
                // Top Hat
                ctx.fillStyle = "#222";
                ctx.fillRect(0, -6, 10, 12); // Brim
                ctx.fillRect(2, -4, 12, 8); // Top
            } else if (npc.type === "PARTY_GUEST") {
                // Drink cup
                ctx.fillStyle = "#F44336"; // Red cup
                ctx.beginPath();
                ctx.arc(8, 8, 4, 0, Math.PI * 2);
                ctx.fill();
            }

            // Nose/Direction indicator
            ctx.fillStyle = "#E59866";
            ctx.beginPath();
            ctx.arc(12, 0, 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
            // --- End Animated NPC Sprite ---

            // Warning Icon if in Hazard State
            if (npc.state === "YELLOW" || npc.state === "ORANGE" || npc.state === "RED") {
                ctx.font = "20px Arial";
                ctx.fillText("⚠️", npc.x, npc.y - 15);
            }
            // Stun Icon if Whistled
            if (npc.stunTimer > 0) {
                ctx.font = "24px Arial";
                ctx.fillText("⏸️", npc.x, npc.y - 25 - Math.sin(state.totalTime * 10) * 3);
            }
            // Timer bar
            if ((npc.state === "YELLOW" || npc.state === "ORANGE" || npc.state === "RED") && npc.maxStateTimer > 0) {
                const ratio = Math.max(0, npc.stateTimer / npc.maxStateTimer);
                const barWidth = npc.width * 1.5;

                ctx.fillStyle = "#444";
                ctx.fillRect(npc.x - barWidth / 2, npc.y - 25, barWidth, 6);

                ctx.fillStyle = COLORS[npc.state as keyof typeof COLORS];
                ctx.fillRect(npc.x - barWidth / 2, npc.y - 25, barWidth * ratio, 6);
            }
        });

        // 5. Draw Player
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.beginPath();
        ctx.ellipse(state.player.x, state.player.y + 15, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // --- Draw Animated Player Sprite ---
        ctx.save();
        ctx.translate(state.player.x, state.player.y);

        // Wobble animation if moving
        if (state.player.target) {
            const wobble = Math.sin(state.totalTime * 20) * 0.15; // Player walks faster
            ctx.rotate(state.player.facing + wobble);
        } else {
            ctx.rotate(state.player.facing);
        }

        // Body (Uniform)
        ctx.fillStyle = COLORS.PLAYER;
        ctx.beginPath();
        ctx.arc(0, 0, state.player.radius, 0, Math.PI * 2);
        ctx.fill();

        // Shoulders (Epaulettes)
        ctx.fillStyle = "#FFF"; // White stripes
        ctx.fillRect(-state.player.radius + 2, -10, 6, 20);

        // Head
        ctx.fillStyle = "#FFCDB2";
        ctx.beginPath();
        ctx.arc(6, 0, 10, 0, Math.PI * 2); // Shifted slightly forward
        ctx.fill();

        // Security Hat
        ctx.fillStyle = "#1A2530"; // Dark blue hat
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(8, -8);
        ctx.lineTo(14, -12); // Brim
        ctx.lineTo(14, 12);
        ctx.lineTo(8, 8);
        ctx.lineTo(0, 8);
        ctx.closePath();
        ctx.fill();

        // Gold Badge on Hat
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        ctx.arc(8, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        // --- End Animated Player Sprite ---

        if (state.player.target) {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
            ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.moveTo(state.player.x, state.player.y);
            ctx.lineTo(state.player.target.x, state.player.target.y);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(state.player.target.x, state.player.target.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.fill();
            ctx.setLineDash([]);
        }

        // --- 6. Dynamic Lighting / Night Mode ---
        const levelConfig = LEVELS[state.currentLevelIndex];
        if (levelConfig && levelConfig.isNight) {
            // Need to save so we can safely draw without affecting future strokes
            ctx.save();

            // Create a temporary off-screen canvas for the lighting mask
            const shadowCanvas = document.createElement('canvas');
            shadowCanvas.width = CANVAS_WIDTH;
            shadowCanvas.height = CANVAS_HEIGHT;
            const shadowCtx = shadowCanvas.getContext('2d')!;

            // Fill shadow canvas with darkness
            shadowCtx.fillStyle = "rgba(10, 15, 30, 0.9)"; // Deep maritime night
            shadowCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            // Set blend mode to 'punch holes' out of the dark shadow
            shadowCtx.globalCompositeOperation = "destination-out";

            // Helper to draw a glowing light circle
            const drawLight = (x: number, y: number, radius: number, intensity: number = 1.0) => {
                const gradient = shadowCtx.createRadialGradient(x, y, 0, x, y, radius);
                gradient.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
                gradient.addColorStop(0.5, `rgba(255, 255, 255, ${intensity * 0.7})`);
                gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

                shadowCtx.fillStyle = gradient;
                shadowCtx.beginPath();
                shadowCtx.arc(x, y, radius, 0, Math.PI * 2);
                shadowCtx.fill();
            };

            // 1. Player Flashlight (Pulsing)
            const flicker = Math.sin(state.totalTime * 15) * 5;
            drawLight(state.player.x, state.player.y, 160 + flicker, 1.0);

            // 2. Dangerous NPCs glow slightly
            state.npcs.forEach(npc => {
                if (npc.state === "YELLOW" || npc.state === "ORANGE") {
                    drawLight(npc.x, npc.y, 80, 0.5);
                } else if (npc.state === "RED") {
                    drawLight(npc.x, npc.y, 120, 0.8);
                }
            });

            // 3. Ambient Environment Lights (Lamps along the rails)
            drawLight(80, 50, 100, 0.6); // Top left
            drawLight(CANVAS_WIDTH - 80, 50, 100, 0.6); // Top right
            drawLight(80, CANVAS_HEIGHT - 50, 100, 0.6); // Bottom left
            drawLight(CANVAS_WIDTH - 80, CANVAS_HEIGHT - 50, 100, 0.6); // Bottom right

            // 4. Party Level (Level 8) - Fireworks flashing
            if (levelConfig.isParty) {
                const fxIntensity = Math.max(0, Math.sin(state.totalTime * 3)); // Pulses 0 to 1
                if (fxIntensity > 0.1) {
                    // Random-ish position based on time
                    const fxX = (Math.sin(state.totalTime * 5) * 0.5 + 0.5) * CANVAS_WIDTH;
                    const fxY = (Math.cos(state.totalTime * 7) * 0.5 + 0.5) * (CANVAS_HEIGHT / 2);
                    drawLight(fxX, fxY, 250 * fxIntensity, fxIntensity * 0.4);
                }
            }

            // Draw shadow mask onto main canvas
            // IMPORTANT: We must reset global matrix before drawing the fullscreen shadow
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.drawImage(shadowCanvas, 0, 0);

            ctx.restore();
        }

        ctx.restore(); // Restore tilt transform

        // 7. Draw Particles (Drawn ON TOP of darkness to glow)
        particlesRef.current.forEach(p => {
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.font = `${p.size}px Arial`;
            ctx.fillStyle = p.color;
            ctx.textAlign = "center";
            ctx.fillText(p.text, p.x, p.y);
            ctx.globalAlpha = 1.0;
        });
    };

    const drawWarningStripes = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
        ctx.fillStyle = "#FFC107"; // Yellow base
        ctx.fillRect(x, y, w, h);

        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();

        ctx.fillStyle = "#212121"; // Black stripes
        const size = 15;
        for (let i = -size; i < Math.max(w, h) + size; i += size * 2) {
            ctx.beginPath();
            if (w > h) {
                ctx.moveTo(x + i, y);
                ctx.lineTo(x + i + size, y);
                ctx.lineTo(x + i + size - h, y + h);
                ctx.lineTo(x + i - h, y + h);
            } else {
                ctx.moveTo(x, y + i);
                ctx.lineTo(x + w, y + i + w);
                ctx.lineTo(x + w, y + i + size + w);
                ctx.lineTo(x, y + i + size);
            }
            ctx.fill();
        }
        ctx.restore();
    }

    // --- UI Handlers ---
    const startGame = () => {
        audioSystem.init();
        audioSystem.resume();
        audioSystem.playClick();
        const state = gameStateRef.current;
        state.score = 0;
        // Do not reset coins/upgrades, those are persistent.
        state.startLevel(0);
        setScreen("PLAYING");
    };

    const goToShop = () => {
        audioSystem.playClick();
        setScreen("SHOP");
        gameStateRef.current.screen = "SHOP";
    };

    const nextLevel = () => {
        audioSystem.playClick();
        const state = gameStateRef.current;
        state.startLevel(state.currentLevelIndex + 1);
        setScreen(state.screen);
    };

    const buyUpgrade = (upgradeId: "speed" | "whistle" | "radar") => {
        const state = gameStateRef.current;
        const config = UPGRADE_STORE.find(u => u.id === upgradeId)!;
        const currentLevel = state.upgrades[upgradeId];

        if (currentLevel < config.maxLevel) {
            const cost = config.costs[currentLevel];
            if (state.coins >= cost) {
                state.coins -= cost;
                state.upgrades[upgradeId] += 1;
                state.saveProgress();
                audioSystem.playSuccessChime(); // Ka-ching sound
                setCoins(state.coins); // Force re-render immediately for UI feedback
            } else {
                audioSystem.playErrorBuzz();
            }
        }
    };

    const handleDialogSelect = (option: DialogOption) => {
        const state = gameStateRef.current;
        const prevScore = state.score;
        state.resolveDialog(option);
        setActiveDialog(null);

        if (option.isCorrect) {
            audioSystem.playSuccessChime();
            const p = state.player.target || state.player;
            spawnParticles(p.x, p.y - 20, "+Bonus", "#4CAF50", 10);
        } else {
            audioSystem.playErrorBuzz();
            const p = state.player.target || state.player;
            spawnParticles(p.x, p.y - 20, "Trượt Xong!", "#F44336", 3);
        }
    };

    const renderDialog = () => {
        if (!activeDialog) return null;

        const state = gameStateRef.current;
        const npc = state.npcs.find(n => n.id === activeDialog.npcId);
        if (!npc) return null;

        return (
            <Modal
                isOpen={!!activeDialog}
                onOpenChange={() => { }} // User must make a choice to close
                hideCloseButton={true}
                isDismissable={false}
                placement="center"
                classNames={{
                    base: "bg-slate-800 border-2 border-blue-400 text-white shadow-2xl",
                }}
            >
                <ModalContent>
                    {() => (
                        <>
                            <ModalHeader className="flex items-center gap-2 pb-0">
                                <span className="text-2xl">⚠️</span>
                                <span className="font-bold text-yellow-500 uppercase tracking-wider text-sm flex-1 break-words">
                                    {activeDialog.dialogData.actionName}
                                </span>
                            </ModalHeader>
                            <ModalBody className="p-6 overflow-hidden relative">
                                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/50 via-slate-800/10 to-slate-900/50 pointer-events-none" />
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <h2 className="text-xl font-bold mb-4 bg-slate-800/80 p-3 rounded">{activeDialog?.dialogData.excuse}</h2>
                                    <div className="flex flex-col gap-3">
                                        {activeDialog?.dialogData.options.map((opt, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleDialogSelect(opt)}
                                                className="w-full text-left px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded text-white font-semibold transition"
                                            >
                                                {opt.text}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </ModalBody>
                        </>
                    )}
                </ModalContent>
            </Modal>
        );
    };

    const renderOverlay = () => {
        return (
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10">
                {/* Primary Popup Overlay */}
                {screen !== "PLAYING" && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center flex-col text-white z-20 p-8 text-center backdrop-blur-sm pointer-events-auto">
                        {screen === "START" && (
                            <>
                                <div className="text-7xl mb-4">🚢</div>
                                <h2 className="text-5xl font-bold mb-4 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">Safe Voyage</h2>
                                <p className="text-xl mb-8 max-w-lg opacity-90">
                                    Bạn là nhân viên an toàn duy nhất trên tàu. Hãy ngăn chặn những hành khách
                                    vô kỷ luật thực hiện các hành động nguy hiểm!
                                </p>
                                <button onClick={startGame} className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-full font-bold text-xl transition transform hover:scale-105 shadow-[0_0_15px_rgba(34,211,238,0.5)] cursor-pointer text-black">
                                    Bắt đầu Ca Làm Việc
                                </button>
                            </>
                        )}
                        {screen === "LEVEL_COMPLETE" && (
                            <>
                                <div className="text-7xl mb-4">✅</div>
                                <h2 className="text-4xl font-bold mb-4 text-green-400">Hoàn Thành Ca Trực!</h2>
                                <p className="text-2xl mb-2">Điểm kinh nghiệm: {score}</p>
                                <p className="text-2xl mb-2 font-bold text-yellow-400">Tiền Vàng đang có: {coins} 🪙</p>
                                <button onClick={goToShop} className="px-8 py-3 mt-8 bg-blue-600 hover:bg-blue-500 rounded-full font-bold text-xl transition transform hover:scale-105 cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.6)]">
                                    Vào Cửa Hàng Safe-Mart 🛒
                                </button>
                            </>
                        )}
                        {screen === "SHOP" && (
                            <div className="w-full max-w-2xl bg-cyan-950/80 p-6 rounded-2xl border-2 border-cyan-500 flex flex-col items-center">
                                <h2 className="text-4xl font-bold mb-2 text-cyan-300">Safe-Mart 🏪</h2>
                                <p className="text-xl mb-6 text-yellow-400 font-bold">Số dư: {coins} 🪙</p>

                                <div className="flex flex-col gap-4 w-full mb-8">
                                    {UPGRADE_STORE.map(upgrade => {
                                        const currentLevel = gameStateRef.current.upgrades[upgrade.id];
                                        const isMaxed = currentLevel >= upgrade.maxLevel;
                                        const cost = isMaxed ? 0 : upgrade.costs[currentLevel];
                                        const canAfford = !isMaxed && coins >= cost;

                                        return (
                                            <div key={upgrade.id} className="flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-600">
                                                <div className="flex items-center gap-4 text-left">
                                                    <div className="text-4xl">{upgrade.icon}</div>
                                                    <div>
                                                        <h3 className="font-bold text-lg text-white">
                                                            {upgrade.name} <span className="text-sm text-cyan-300 ml-2">Lv {currentLevel}/{upgrade.maxLevel}</span>
                                                        </h3>
                                                        <p className="text-sm text-slate-400">{upgrade.description}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => buyUpgrade(upgrade.id)}
                                                    disabled={isMaxed || !canAfford}
                                                    className={`px-4 py-2 rounded font-bold min-w-[100px] transition ${isMaxed ? "bg-slate-700 text-slate-500 cursor-not-allowed" :
                                                        canAfford ? "bg-yellow-600 hover:bg-yellow-500 text-black cursor-pointer shadow-lg" :
                                                            "bg-red-900/50 text-red-300 cursor-not-allowed border border-red-800"
                                                        }`}
                                                >
                                                    {isMaxed ? "Đã Tối Đa" : `${cost} 🪙`}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                <button onClick={nextLevel} className="px-8 py-3 bg-green-600 hover:bg-green-500 rounded-full font-bold text-xl transition transform hover:scale-105 cursor-pointer shadow-[0_0_15px_rgba(34,197,94,0.6)]">
                                    {gameStateRef.current.currentLevelIndex >= LEVELS.length - 1 ? "Đến màn cuối!" : "Màn Tiếp Theo"} ➡️
                                </button>
                            </div>
                        )}
                        {screen === "GAME_OVER" && (
                            <>
                                <div className="text-7xl mb-4">❌</div>
                                <h2 className="text-5xl font-bold mb-4 text-red-500">Bị Sa Thải!</h2>
                                <p className="text-xl mb-2">Đã có {accidents} tai nạn xảy ra dưới sự giám sát của bạn.</p>
                                <p className="text-2xl mb-8 font-mono">Final Score: {score}</p>
                                <button onClick={startGame} className="px-8 py-3 bg-red-600 hover:bg-red-500 rounded-full font-bold text-xl transition transform hover:scale-105 cursor-pointer">
                                    Chơi Lại Từ Đầu
                                </button>
                            </>
                        )}
                        {screen === "VICTORY" && (
                            <>
                                <div className="text-7xl mb-4">🎖️</div>
                                <h2 className="text-5xl font-bold mb-4 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]">NHÂN VIÊN XUẤT SẮC!</h2>
                                <p className="text-xl mb-4 max-w-lg">
                                    Xin chúc mừng! Chuyến tàu đã đến bến an toàn. Không ai bị tổn hại.
                                </p>
                                <p className="text-3xl mb-8 relative font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">
                                    Final Score: {score}
                                </p>
                                <button onClick={startGame} className="px-8 py-3 bg-yellow-600 hover:bg-yellow-500 text-black rounded-full font-bold text-xl transition transform hover:scale-105 cursor-pointer">
                                    Chơi Lại
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center gap-4 w-full relative p-2 md:p-4">
            {/* Dashboard */}
            <div className="flex flex-wrap md:flex-nowrap justify-between items-center w-full max-w-[800px] px-4 py-3 md:px-6 md:py-3 bg-slate-800 text-white rounded-xl shadow-lg border border-slate-700 gap-y-3">
                <div className="w-1/2 md:w-auto">
                    <div className="text-[10px] md:text-sm opacity-70 uppercase tracking-wider font-bold">
                        {screen === "PLAYING" ? `${levelName} (Lvl ${level})` : "Safe Voyage"}
                    </div>
                    <div className="text-lg md:text-2xl font-bold font-mono text-cyan-300">
                        {screen === "PLAYING" ? <>Time: <span className="text-white">{Math.ceil(timeRemaining)}s</span></> : <span>--:--</span>}
                    </div>
                </div>

                <div className="text-center w-1/4 md:w-auto">
                    <div className="text-[10px] md:text-sm opacity-70 uppercase tracking-wider font-bold">Kinh nghiệm</div>
                    <div className={`text-lg md:text-xl font-bold font-mono ${score < 0 ? "text-red-400" : "text-green-400"}`}>
                        {score}
                    </div>
                </div>

                <div className="text-center bg-yellow-900/30 px-2 py-1 md:px-4 md:py-1 rounded border border-yellow-700/50 w-1/4 md:w-auto">
                    <div className="text-[10px] md:text-xs opacity-70 uppercase tracking-wider font-bold text-yellow-400">Thưởng</div>
                    <div className="text-lg md:text-2xl font-bold font-mono text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]">
                        {coins} 🪙
                    </div>
                </div>

                <div className="text-right flex items-center justify-between md:justify-end w-full md:w-auto pt-2 border-t border-slate-700 md:border-none md:pt-0">
                    <div>
                        <div className="text-[10px] md:text-sm opacity-70 uppercase tracking-wider font-bold text-red-300">Tai nạn</div>
                        <div className="text-lg md:text-2xl font-bold font-mono text-red-500">
                            {screen === "PLAYING" ? `${accidents} / ${allowedAccidents}` : `- / -`}
                        </div>
                    </div>
                    <button
                        onClick={() => setIsMuted(audioSystem.toggleMute())}
                        className="ml-4 p-2 md:p-3 bg-slate-700 hover:bg-slate-600 rounded-full cursor-pointer transition w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shrink-0"
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted ? "🔇" : "🔈"}
                    </button>
                </div>
            </div>

            {/* Game Canvas */}
            <div className="relative w-full max-w-[800px] rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-700 bg-sky-900 border-t-sky-400 border-b-sky-950 flex-shrink-0">
                <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    onPointerDown={handlePointerDown}
                    className={`block w-full h-auto aspect-[4/3] object-contain ${screen === "PLAYING" ? "cursor-crosshair" : ""}`}
                    style={{ filter: screen !== "PLAYING" || !!activeDialog ? "blur(4px) brightness(0.6)" : "none", transition: "filter 0.5s ease" }}
                />

                {/* Whistle Tool Overlay placed top-right to avoid taking external space */}
                {screen === "PLAYING" && gameStateRef.current.upgrades.whistle > 0 && (
                    <div
                        className="absolute top-2 right-2 md:top-4 md:right-4 z-20 flex flex-col items-center gap-1 bg-slate-900/80 p-2 md:p-3 rounded-xl border border-slate-600 shadow-xl cursor-pointer hover:bg-slate-800 active:scale-95 transition pointer-events-auto backdrop-blur-sm"
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            // Trigger whistle logic manually here
                            const state = gameStateRef.current;
                            if (state.useWhistle()) {
                                audioSystem.playSuccessChime();
                            }
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-2xl drop-shadow-md">📯</span>
                            <div className="w-16 h-3 bg-slate-800 rounded-full relative overflow-hidden border border-slate-600">
                                <div
                                    className={`absolute top-0 left-0 h-full transition-all duration-300 ${whistleCd === 0 ? "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]" : "bg-red-500"}`}
                                    style={{ width: whistleCd === 0 ? '100%' : `${((15 - whistleCd) / 15) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                        <span className="text-[10px] md:text-xs font-bold text-white uppercase text-center drop-shadow-md tracking-wider">
                            {whistleCd === 0 ? "THỔI (SPACE)" : `${Math.ceil(whistleCd)}s COOLDOWN`}
                        </span>
                    </div>
                )}

                {renderOverlay()}
                {renderDialog()}
            </div>
        </div>
    );
}
