"use client";

import React, { useEffect, useRef, useState } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, CONSTANTS, LEVELS, DialogOption, NPC_EMOJIS } from "./GameConsts";
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

    const [screen, setScreen] = useState<"START" | "PLAYING" | "LEVEL_COMPLETE" | "GAME_OVER" | "VICTORY">("START");
    const [score, setScore] = useState(0);
    const [accidents, setAccidents] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(0);
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
            } else if (npc.state === "ACCIDENT") {
                ctx.font = "30px Arial";
                ctx.fillText("💀", npc.x - 15, npc.y + 10);
                return; // Skip normal drawing
            }

            // Draw Emoji
            ctx.font = "24px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const emoji = NPC_EMOJIS[npc.type] || "👤";
            ctx.fillText(emoji, npc.x, npc.y);

            // Warning Icon if in Hazard State
            if (npc.state === "YELLOW" || npc.state === "ORANGE" || npc.state === "RED") {
                ctx.font = "14px Arial";
                ctx.fillText("❗", npc.x + 10, npc.y - 15);
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

        ctx.fillStyle = COLORS.PLAYER;
        ctx.beginPath();
        ctx.arc(state.player.x, state.player.y, state.player.radius + 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = "24px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("👮‍♂️", state.player.x, state.player.y);

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

        ctx.restore(); // Restore tilt transform

        // 6. Draw Particles
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
        state.startLevel(0);
        setScreen("PLAYING");
    };

    const nextLevel = () => {
        audioSystem.playClick();
        const state = gameStateRef.current;
        state.startLevel(state.currentLevelIndex + 1);
        setScreen(state.screen);
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
                            <ModalBody className="pb-6">
                                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 italic relative mb-4 mt-2">
                                    &quot;{activeDialog.dialogData.excuse}&quot;
                                </div>
                                <div className="flex flex-col gap-2">
                                    <p className="text-xs text-slate-400 mb-2">Chọn cách thuyết phục hợp lý (Click):</p>
                                    {activeDialog.dialogData.options.map((opt, idx) => (
                                        <Button
                                            key={idx}
                                            variant="flat"
                                            className="w-full text-left justify-start h-auto py-3 bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 transition truncate whitespace-normal"
                                            onClick={() => handleDialogSelect(opt)}
                                        >
                                            <span className="break-words">{opt.text}</span>
                                        </Button>
                                    ))}
                                </div>
                            </ModalBody>
                        </>
                    )}
                </ModalContent>
            </Modal>
        );
    };

    const renderOverlay = () => {
        if (screen === "PLAYING") return null;

        return (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center flex-col text-white z-10 p-8 text-center rounded-2xl backdrop-blur-sm">
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
                        <p className="text-2xl mb-2">Điểm số hiện tại: {score}</p>
                        <button onClick={nextLevel} className="px-8 py-3 mt-8 bg-green-600 hover:bg-green-500 rounded-full font-bold text-xl transition transform hover:scale-105 cursor-pointer">
                            Tiếp Tục
                        </button>
                    </>
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
        );
    };

    return (
        <div className="flex flex-col items-center gap-4 w-full relative">
            <div className="flex justify-between items-center w-full max-w-[800px] px-6 py-3 bg-slate-800 text-white rounded-xl shadow-lg border border-slate-700">
                <div>
                    <div className="text-sm opacity-70 uppercase tracking-wider font-bold">
                        {screen === "PLAYING" ? `${levelName} (Level ${level})` : "Safe Voyage Dashboard"}
                    </div>
                    <div className="text-2xl font-bold font-mono text-cyan-300">
                        {screen === "PLAYING" ? <>Time: <span className="text-white">{Math.ceil(timeRemaining)}s</span></> : <span>--:--</span>}
                    </div>
                </div>

                <div className="text-center">
                    <div className="text-sm opacity-70 uppercase tracking-wider font-bold">Điểm</div>
                    <div className={`text-3xl font-bold font-mono ${score < 0 ? "text-red-400" : "text-green-400"}`}>
                        {score}
                    </div>
                </div>

                <div className="text-right flex items-center gap-4">
                    <div>
                        <div className="text-sm opacity-70 uppercase tracking-wider font-bold text-red-300">Tai nạn</div>
                        <div className="text-2xl font-bold font-mono text-red-500">
                            {screen === "PLAYING" ? `${accidents} / ${allowedAccidents}` : `- / -`}
                        </div>
                    </div>
                    <button
                        onClick={() => setIsMuted(audioSystem.toggleMute())}
                        className="ml-4 p-3 bg-slate-700 hover:bg-slate-600 rounded-full cursor-pointer transition"
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted ? "🔇" : "🔈"}
                    </button>
                </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-700 bg-sky-900 border-t-sky-400 border-b-sky-950">
                <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    onPointerDown={handlePointerDown}
                    className={`block ${screen === "PLAYING" ? "cursor-crosshair" : ""}`}
                    style={{ filter: screen !== "PLAYING" || !!activeDialog ? "blur(4px) brightness(0.6)" : "none", transition: "filter 0.5s ease" }}
                />
                {renderOverlay()}
                {renderDialog()}
            </div>
        </div>
    );
}
