"use client";

import { useEffect, useRef } from "react";
import type { PetStats } from "@/lib/hedera/stats";

interface GentleViewport {
  bg: number[][];
  overlay: number[][];
  tiledim: number;
  tilesetpxw: number;
  tilesPerRow: number;
  transparent: number;
}

const TILE_SIZE = 18;
const TILE_SCALE = 3;
const COLS = 16;
const ROWS = 10;
const CANVAS_W = COLS * TILE_SIZE * TILE_SCALE;
const CANVAS_H = ROWS * TILE_SIZE * TILE_SCALE;
const TS = TILE_SIZE * TILE_SCALE; // pixels per tile

const PET_HOME = { col: 13, row: 5 };

// AI Town 32x32folk.png layout: 4 chars wide × 2 rows, each char 96×128px
// Within each char block: row0=down, row1=left, row2=right, row3=up, 3 frames each
const CHAR_W = 96;    // 3 frames × 32px
const CHAR_H = 128;   // 4 rows × 32px
const FRAME_SIZE = 32;
const NUM_CHARACTERS = 8;
const SPRITE_SCALE = (TS * 0.85) / FRAME_SIZE;
const WALK_SPEED_PX_S = 30; // pixels per second
const FRAME_INTERVAL_MS = 150;
const WANDER_RADIUS = 4;

type WanderState = "idle" | "walking" | "sleeping" | "distressed";
type Direction = "down" | "left" | "right" | "up";

const DIR_ROW: Record<Direction, number> = { down: 0, left: 1, right: 2, up: 3 };

const GRASS_COLOR = 0x4c9900;
const GRASS_DARK = 0x3c7a00;
const FENCE_COLOR = 0x7a4a28;
const FLOWER_YELLOW = 0xffdd00;
const FLOWER_PINK = 0xff6eb4;

export type ReactionType =
  | "fed"
  | "played"
  | "groomed"
  | "sleeping"
  | "dying"
  | "dead"
  | null;

interface WorldProps {
  serial?: number;
  stats?: PetStats;
  reaction?: ReactionType;
  onReactionDone?: () => void;
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function isWalkable(col: number, row: number): boolean {
  // Cols 0-3 are the dense forest wall; cols 4-15, rows 1-8 are open
  return col >= 4 && col <= 15 && row >= 1 && row <= 8;
}

function randomWalkableNeighbor(col: number, row: number) {
  const candidates: { col: number; row: number }[] = [];
  for (let dc = -WANDER_RADIUS; dc <= WANDER_RADIUS; dc++) {
    for (let dr = -WANDER_RADIUS; dr <= WANDER_RADIUS; dr++) {
      if (dc === 0 && dr === 0) continue;
      const c = col + dc, r = row + dr;
      if (isWalkable(c, r)) candidates.push({ col: c, row: r });
    }
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function tileCenter(col: number, row: number) {
  return { x: (col + 0.5) * TS, y: (row + 0.5) * TS };
}

export default function World({ serial, stats, reaction, onReactionDone }: WorldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixiRef = useRef<{ cleanup: () => void } | null>(null);
  const statsRef = useRef(stats);
  const reactionRef = useRef(reaction);
  const onReactionDoneRef = useRef(onReactionDone);
  statsRef.current = stats;
  reactionRef.current = reaction;
  onReactionDoneRef.current = onReactionDone;

  useEffect(() => {
    if (!canvasRef.current) return;
    let mounted = true;

    async function init() {
      const PIXI = await import("pixi.js");
      if (!mounted || !canvasRef.current) return;

      PIXI.TextureSource.defaultOptions.scaleMode = "nearest";

      const app = new PIXI.Application();
      await app.init({
        canvas: canvasRef.current,
        width: CANVAS_W,
        height: CANVAS_H,
        backgroundColor: 0x4a8f2a,
        antialias: false,
        resolution: 1,
      });

      if (!mounted) { app.destroy(false, { children: true }); return; }

      const worldContainer = new PIXI.Container();
      app.stage.addChild(worldContainer);

      // ── Load tileset + character spritesheet in parallel ───────────
      let tilesetSource: import("pixi.js").TextureSource | null = null;
      let tilemapData: GentleViewport | null = null;
      let spriteSource: import("pixi.js").TextureSource | null = null;

      await Promise.allSettled([
        PIXI.Assets.load<import("pixi.js").Texture>("/assets/ai-town/maps/gentle-obj.png")
          .then((t) => { tilesetSource = t.source; }),
        fetch("/assets/ai-town/maps/gentle-viewport.json")
          .then((r) => r.json() as Promise<GentleViewport>)
          .then((d) => { tilemapData = d; }),
        PIXI.Assets.load<import("pixi.js").Texture>("/assets/ai-town/characters/32x32folk.png")
          .then((t) => { spriteSource = t.source; }),
      ]);

      if (!mounted) { app.destroy(false, { children: true }); return; }

      if (tilesetSource && tilemapData) {
        renderTilemap(PIXI, worldContainer, tilesetSource, tilemapData);
      } else {
        drawGarden(PIXI, worldContainer);
      }

      const charIndex = (serial ?? 0) % NUM_CHARACTERS;
      const charBaseX = (charIndex % 4) * CHAR_W;
      const charBaseY = Math.floor(charIndex / 4) * CHAR_H;

      function makeFrameTexture(dir: Direction, frame: number): import("pixi.js").Texture {
        if (!spriteSource) return PIXI.Texture.EMPTY;
        const fx = charBaseX + frame * FRAME_SIZE;
        const fy = charBaseY + DIR_ROW[dir] * FRAME_SIZE;
        return new PIXI.Texture({
          source: spriteSource,
          frame: new PIXI.Rectangle(fx, fy, FRAME_SIZE, FRAME_SIZE),
        });
      }

      const petContainer = new PIXI.Container();
      const petHome = tileCenter(PET_HOME.col, PET_HOME.row);
      petContainer.x = petHome.x;
      petContainer.y = petHome.y;
      worldContainer.addChild(petContainer);

      // Fallback rock body if no spritesheet
      let petSprite: import("pixi.js").Sprite | null = null;
      let rockBody: import("pixi.js").Container | null = null;

      if (spriteSource) {
        petSprite = new PIXI.Sprite(makeFrameTexture("down", 0));
        petSprite.anchor.set(0.5, 1.0);
        petSprite.scale.set(SPRITE_SCALE);
        petContainer.addChild(petSprite);
      } else {
        rockBody = drawRockBody(PIXI, serial);
        petContainer.addChild(rockBody);
      }

      // Distress overlay (exclamation)
      const distressGfx = new PIXI.Graphics();
      distressGfx
        .rect(-4, -TS * 1.4, 8, 22)
        .fill({ color: 0xff2222 });
      distressGfx
        .circle(0, -TS * 1.4 + 28, 4)
        .fill({ color: 0xff2222 });
      distressGfx.visible = false;
      petContainer.addChild(distressGfx);

      // Zzz text
      const zzzStyle = new PIXI.TextStyle({ fontSize: 14, fill: 0x8888ff, fontFamily: "monospace" });
      const zzzText = new PIXI.Text({ text: "Zzz", style: zzzStyle });
      zzzText.anchor.set(0, 1);
      zzzText.x = 10;
      zzzText.y = -TS * 0.5;
      zzzText.visible = false;
      petContainer.addChild(zzzText);

      // Ambient overlay
      const ambientOverlay = new PIXI.Graphics();
      ambientOverlay.rect(0, 0, CANVAS_W, CANVAS_H).fill({ color: 0x000033, alpha: 1 });
      ambientOverlay.alpha = 0;
      app.stage.addChild(ambientOverlay);

      // Fireflies
      const fireflyContainer = new PIXI.Container();
      app.stage.addChild(fireflyContainer);
      const FIREFLY_COLORS = [0xffff88, 0x88ffaa, 0xaaddff, 0xffddaa];
      interface Firefly { g: import("pixi.js").Graphics; x: number; y: number; vx: number; vy: number; phase: number; }
      const fireflies: Firefly[] = [];
      for (let i = 0; i < 10; i++) {
        const fg = new PIXI.Graphics();
        fg.circle(0, 0, 2).fill({ color: FIREFLY_COLORS[i % FIREFLY_COLORS.length] });
        const fx = 20 + Math.random() * (CANVAS_W - 40);
        const fy = 20 + Math.random() * (CANVAS_H - 40);
        fg.x = fx; fg.y = fy;
        fireflyContainer.addChild(fg);
        fireflies.push({ g: fg, x: fx, y: fy, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, phase: Math.random() * Math.PI * 2 });
      }

      // Particles
      const particles = new PIXI.Container();
      app.stage.addChild(particles);

      // ── Wander state machine ────────────────────────────────────────
      let wanderState: WanderState = "idle";
      let idleTimer = 0;
      let idleDuration = randomBetween(3000, 8000);
      let currentTile = { ...PET_HOME };
      let targetTile = { ...PET_HOME };
      let facing: Direction = "down";
      let walkFrame = 0;
      let walkFrameTimer = 0;
      let pixelPos = { ...tileCenter(PET_HOME.col, PET_HOME.row) };

      function setFrame(dir: Direction, frame: number) {
        if (petSprite && spriteSource) {
          petSprite.texture = makeFrameTexture(dir, frame);
        }
      }

      // ── Ticker ─────────────────────────────────────────────────────
      let ambientT = 0;
      let reactionActive: ReactionType = null;
      let reactionT = 0;

      app.ticker.maxFPS = 60;
      app.ticker.add((ticker) => {
        if (document.hidden) return;
        const dt = ticker.deltaMS;
        const currentStats = statsRef.current;
        const currentReaction = reactionRef.current;

        const alive = currentStats?.alive !== false;
        const isDistressed = currentStats?.distressed != null && alive;
        const isSleeping =
          reactionActive === "sleeping" && alive && !isDistressed;

        // ── Determine wander state ──────────────────────────────────
        if (!alive) {
          wanderState = "idle";
          if (petContainer.alpha !== 0.5) petContainer.alpha = 0.5;
          distressGfx.visible = false;
          zzzText.visible = false;
        } else if (isDistressed) {
          wanderState = "distressed";
          petContainer.alpha = 1;
          if (petSprite) petSprite.tint = 0x888888;
          else if (rockBody) rockBody.alpha = 0.6;
          distressGfx.visible = true;
          zzzText.visible = false;
        } else {
          petContainer.alpha = 1;
          if (petSprite) petSprite.tint = 0xffffff;
          else if (rockBody) rockBody.alpha = 1;
          distressGfx.visible = false;
          if (isSleeping && wanderState !== "sleeping") {
            wanderState = "sleeping";
            currentTile = { ...currentTile };
            targetTile = { ...currentTile };
          } else if (!isSleeping && wanderState === "sleeping") {
            wanderState = "idle";
            idleTimer = 0;
            idleDuration = randomBetween(3000, 8000);
          }
          zzzText.visible = wanderState === "sleeping";
        }

        // ── State machine tick ──────────────────────────────────────
        if (wanderState === "idle") {
          idleTimer += dt;
          setFrame(facing, 0);

          if (idleTimer >= idleDuration) {
            idleTimer = 0;
            idleDuration = randomBetween(3000, 8000);
            const target = randomWalkableNeighbor(currentTile.col, currentTile.row);
            if (target) {
              targetTile = target;
              const dx = targetTile.col - currentTile.col;
              const dy = targetTile.row - currentTile.row;
              facing = Math.abs(dx) >= Math.abs(dy)
                ? dx > 0 ? "right" : "left"
                : dy > 0 ? "down" : "up";
              wanderState = "walking";
              walkFrame = 0;
              walkFrameTimer = 0;
            }
          }
        }

        if (wanderState === "walking") {
          const target = tileCenter(targetTile.col, targetTile.row);
          const dx = target.x - pixelPos.x;
          const dy = target.y - pixelPos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const step = (WALK_SPEED_PX_S * dt) / 1000;

          // Update walk animation frame
          walkFrameTimer += dt;
          if (walkFrameTimer >= FRAME_INTERVAL_MS) {
            walkFrameTimer = 0;
            walkFrame = (walkFrame + 1) % 3;
          }
          setFrame(facing, walkFrame);

          if (dist <= step) {
            // Arrived
            pixelPos = { ...target };
            currentTile = { ...targetTile };
            wanderState = "idle";
            idleTimer = 0;
            idleDuration = randomBetween(3000, 8000);
            setFrame(facing, 0);
          } else {
            pixelPos.x += (dx / dist) * step;
            pixelPos.y += (dy / dist) * step;
          }

          petContainer.x = pixelPos.x;
          petContainer.y = pixelPos.y;
        } else {
          // For non-walking states, snap to current tile
          const home = tileCenter(currentTile.col, currentTile.row);
          petContainer.x = home.x;
          petContainer.y = home.y;
          pixelPos = { ...home };
        }

        // Idle bob for sleeping
        if (wanderState === "sleeping") {
          const bob = Math.sin(Date.now() * 0.002) * 2;
          petContainer.y += bob;
          zzzText.y = -TS * 0.5 + Math.sin(Date.now() * 0.001) * 4;
        }

        // ── Ambient + fireflies ─────────────────────────────────────
        ambientT += dt;
        ambientOverlay.alpha = 0.05 * (0.5 + 0.5 * Math.sin((ambientT / 30000) * Math.PI * 2));

        for (const ff of fireflies) {
          ff.phase += dt * 0.002;
          ff.x += ff.vx + 0.25 * Math.sin(ff.phase + fireflies.indexOf(ff) * 1.3);
          ff.y += ff.vy + 0.18 * Math.cos(ff.phase * 0.7);
          if (ff.x < 12 || ff.x > CANVAS_W - 12) ff.vx *= -1;
          if (ff.y < 12 || ff.y > CANVAS_H - 12) ff.vy *= -1;
          ff.x = Math.max(12, Math.min(CANVAS_W - 12, ff.x));
          ff.y = Math.max(12, Math.min(CANVAS_H - 12, ff.y));
          ff.g.x = ff.x; ff.g.y = ff.y;
          ff.g.alpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(ff.phase * 2.5));
        }

        // ── Reactions ───────────────────────────────────────────────
        if (currentReaction && currentReaction !== reactionActive) {
          reactionActive = currentReaction;
          reactionT = 0;
          spawnReactionParticles(PIXI, particles, petContainer, currentReaction);
        }
        if (reactionActive) {
          reactionT += dt;
          if (reactionT > 2500) {
            reactionActive = null;
            reactionT = 0;
            onReactionDoneRef.current?.();
          }
        }
      });

      pixiRef.current = {
        cleanup: () => { app.destroy(false, { children: true }); },
      };
    }

    init().catch(console.error);
    return () => {
      mounted = false;
      pixiRef.current?.cleanup();
      pixiRef.current = null;
    };
  }, [serial]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{ imageRendering: "pixelated", display: "block" }}
    />
  );
}

// ─── Forest tilemap renderer ─────────────────────────────────────────────────

function renderTilemap(
  PIXI: typeof import("pixi.js"),
  container: import("pixi.js").Container,
  tilesetSource: import("pixi.js").TextureSource,
  data: GentleViewport,
) {
  const { bg, overlay, tiledim, tilesPerRow } = data;
  const scale = TS / tiledim;

  for (let pass = 0; pass < 2; pass++) {
    const layer = pass === 0 ? bg : overlay;
    const emptyVal = pass === 0 ? data.transparent : -1;

    for (let row = 0; row < layer.length; row++) {
      for (let col = 0; col < layer[row].length; col++) {
        const tileIdx = layer[row][col];
        if (tileIdx === emptyVal || tileIdx < 0) continue;

        const srcX = (tileIdx % tilesPerRow) * tiledim;
        const srcY = Math.floor(tileIdx / tilesPerRow) * tiledim;

        const tex = new PIXI.Texture({
          source: tilesetSource,
          frame: new PIXI.Rectangle(srcX, srcY, tiledim, tiledim),
        });
        const sprite = new PIXI.Sprite(tex);
        sprite.x = col * TS;
        sprite.y = row * TS;
        sprite.scale.set(scale);
        container.addChild(sprite);
      }
    }
  }
}

// ─── Garden drawing (fallback) ───────────────────────────────────────────────

function drawGarden(PIXI: typeof import("pixi.js"), container: import("pixi.js").Container) {
  const g = new PIXI.Graphics();

  g.rect(0, 0, CANVAS_W, CANVAS_H).fill({ color: GRASS_COLOR });

  const patches: [number, number][] = [[1,1],[3,2],[7,1],[11,2],[14,1],[2,8],[5,8],[10,7],[14,8],[0,5],[15,4]];
  for (const [col, row] of patches) {
    g.rect(col * TS, row * TS, TS, TS).fill({ color: GRASS_DARK });
  }

  for (let col = 5; col <= 10; col++) {
    g.rect(col * TS, 4 * TS, TS, TS).fill({ color: 0x6b4c2a });
    g.rect(col * TS + 2, 4 * TS + 2, TS - 4, TS - 4).fill({ color: 0x7a5a35 });
  }

  g.rect(0, 0, CANVAS_W, 4).fill({ color: FENCE_COLOR });
  g.rect(0, CANVAS_H - 4, CANVAS_W, 4).fill({ color: FENCE_COLOR });
  g.rect(0, 0, 4, CANVAS_H).fill({ color: FENCE_COLOR });
  g.rect(CANVAS_W - 4, 0, 4, CANVAS_H).fill({ color: FENCE_COLOR });
  for (let col = 0; col <= COLS; col += 2) {
    const x = col * TS;
    g.rect(x - 3, 0, 6, 14).fill({ color: FENCE_COLOR });
    g.rect(x - 3, CANVAS_H - 14, 6, 14).fill({ color: FENCE_COLOR });
  }

  const trees: [number, number][] = [[1, 1], [14, 1], [1, 7], [14, 7]];
  for (const [col, row] of trees) {
    const tx = (col + 0.5) * TS, ty = (row + 0.5) * TS;
    g.rect(tx - 3, ty + 4, 6, 12).fill({ color: 0x5a3820 });
    g.circle(tx, ty - 2, 14).fill({ color: 0x2d6e20 });
    g.circle(tx - 6, ty + 2, 10).fill({ color: 0x2d6e20 });
    g.circle(tx + 6, ty + 2, 10).fill({ color: 0x2d6e20 });
  }

  const flowerSpots: [number, number][] = [[3,3],[5,2],[11,3],[13,2],[2,7],[12,7],[6,2],[10,8],[4,8],[9,2]];
  for (const [col, row] of flowerSpots) {
    const x = (col + 0.5) * TS, y = (row + 0.5) * TS;
    const isYellow = (col + row) % 2 === 0;
    g.rect(x - 1, y - 2, 2, 10).fill({ color: 0x2d7a00 });
    g.circle(x, y - 4, 4).fill({ color: isYellow ? FLOWER_YELLOW : FLOWER_PINK });
    g.circle(x - 4, y - 4, 2).fill({ color: isYellow ? 0xffee44 : 0xff88cc });
    g.circle(x + 4, y - 4, 2).fill({ color: isYellow ? 0xffee44 : 0xff88cc });
    g.circle(x, y - 8, 2).fill({ color: isYellow ? 0xffee44 : 0xff88cc });
  }

  container.addChild(g);
}

// ─── Fallback rock body (used if spritesheet fails to load) ─────────────────

function mulberry32(seed: number) {
  return function (): number {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let z = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

function shiftColorNum(color: number, amount: number): number {
  const r = Math.min(255, Math.max(0, ((color >> 16) & 0xff) + amount));
  const gg = Math.min(255, Math.max(0, ((color >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (color & 0xff) + amount));
  return (r << 16) | (gg << 8) | b;
}

function drawRockBody(PIXI: typeof import("pixi.js"), serial?: number): import("pixi.js").Container {
  const container = new PIXI.Container();
  const g = new PIXI.Graphics();
  const rand = mulberry32(serial ?? 1);

  const BODY_COLORS = [0x8B8B8B, 0x6B6B6B, 0xA09080, 0x7A8A7A, 0x5A7060, 0x8090A0, 0x70605A, 0xC0C0B0];
  const bodyColor = BODY_COLORS[Math.floor(rand() * BODY_COLORS.length)];
  const shadowColor = shiftColorNum(bodyColor, -30);
  const highlightColor = shiftColorNum(bodyColor, 40);

  const EMPTY = -1;
  const pixels: number[][] = Array.from({ length: 16 }, () => Array(16).fill(EMPTY));
  function px(x: number, y: number, color: number) {
    if (x >= 0 && x < 16 && y >= 0 && y < 16) pixels[y][x] = color;
  }
  function fillRect(x: number, y: number, w: number, h: number, color: number) {
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) px(x + dx, y + dy, color);
  }

  fillRect(3, 4, 10, 9, bodyColor);
  fillRect(2, 5, 12, 7, bodyColor);
  for (let x = 7; x < 13; x++) px(x, 13, shadowColor);
  for (let y = 8; y < 13; y++) px(13, y, shadowColor);
  for (let x = 3; x < 7; x++) px(x, 4, highlightColor);
  fillRect(4, 6, 2, 2, 0x1A1A2E);
  fillRect(7, 6, 2, 2, 0x1A1A2E);

  const PS = 4, OFFSET = -8 * PS;
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (pixels[y][x] !== EMPTY) g.rect(OFFSET + x * PS, OFFSET + y * PS, PS, PS).fill({ color: pixels[y][x] });
  }

  container.addChild(g);
  return container;
}

// ─── Reaction particles ─────────────────────────────────────────────────────

function spawnReactionParticles(
  PIXI: typeof import("pixi.js"),
  container: import("pixi.js").Container,
  pet: import("pixi.js").Container,
  reaction: ReactionType,
) {
  const rx = pet.x, ry = pet.y;

  function dot(color: number, x: number, y: number, r = 5) {
    const g = new PIXI.Graphics();
    g.circle(0, 0, r).fill({ color });
    g.x = x; g.y = y;
    container.addChild(g);
    animateFloat(g, () => container.removeChild(g));
  }

  switch (reaction) {
    case "fed":
      for (let i = 0; i < 4; i++)
        dot(0x22cc55, rx + (Math.random() - 0.5) * 30, ry - 20 - Math.random() * 20);
      break;
    case "played":
      for (let i = 0; i < 5; i++)
        dot(0xffcc00, rx + (Math.random() - 0.5) * 40, ry - 10 - Math.random() * 30, 4);
      break;
    case "groomed":
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        dot(0xaaddff, rx + Math.cos(a) * 30, ry + Math.sin(a) * 30, 4);
      }
      break;
    case "sleeping":
      for (let i = 0; i < 3; i++)
        dot(0x8888ff, rx + 10 + i * 8, ry - 20 - i * 8, 3 + i);
      break;
    case "dying":
    case "dead":
      for (let i = 0; i < 5; i++)
        dot(0x888888, rx + (Math.random() - 0.5) * 30, ry - Math.random() * 30, 4);
      break;
  }
}

function animateFloat(obj: import("pixi.js").Container, onDone: () => void, duration = 1500) {
  const start = performance.now();
  const startY = obj.y;
  function step(now: number) {
    const t = Math.min((now - start) / duration, 1);
    obj.y = startY - 30 * t;
    obj.alpha = 1 - t;
    if (t < 1) requestAnimationFrame(step); else onDone();
  }
  requestAnimationFrame(step);
}
