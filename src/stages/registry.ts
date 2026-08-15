import type { StageConfig, RGBA } from './types';
import { stages00_05 } from './definitions/00-seed';
import { stages06_11 } from './definitions/01-sprout';
import { stages12_16 } from './definitions/02-sapling';
import { stages17_21 } from './definitions/03-young-tree';
import { stages22_27 } from './definitions/04-growing-tree';
import { stages28_31 } from './definitions/05-flowering';
import { stages32_35 } from './definitions/06-fruiting';
import { stages36_39 } from './definitions/07-mature';
import { stages40_44 } from './definitions/08-mystical';
import { stages45_49 } from './definitions/09-divine';

/** All 50 stage configs indexed by stage number */
const STAGES: StageConfig[] = [
  ...stages00_05,
  ...stages06_11,
  ...stages12_16,
  ...stages17_21,
  ...stages22_27,
  ...stages28_31,
  ...stages32_35,
  ...stages36_39,
  ...stages40_44,
  ...stages45_49,
];

/* ── Color interpolation utilities ── */

/** Parse hex color to {r,g,b} */
function hexToRGB(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** Convert {r,g,b} back to hex */
function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
}

/** Linear interpolation */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Interpolate between two hex colors */
function lerpHex(a: string, b: string, t: number): string {
  const ca = hexToRGB(a);
  const cb = hexToRGB(b);
  return rgbToHex(lerp(ca.r, cb.r, t), lerp(ca.g, cb.g, t), lerp(ca.b, cb.b, t));
}

/** Interpolate between two RGBA colors */
function lerpRGBA(a: RGBA, b: RGBA, t: number): RGBA {
  return {
    r: Math.round(lerp(a.r, b.r, t)),
    g: Math.round(lerp(a.g, b.g, t)),
    b: Math.round(lerp(a.b, b.b, t)),
    a: +(lerp(a.a, b.a, t)).toFixed(3),
  };
}

/** Interpolate between two StageConfigs for smooth transitions */
export function lerpStageConfig(a: StageConfig, b: StageConfig, t: number): StageConfig {
  const lt = Math.max(0, Math.min(1, t)); // clamp
  // Use a for non-interpolatable fields, interpolate numbers and colors
  return {
    stage: a.stage,
    name: lt < 0.5 ? a.name : b.name,
    emoji: lt < 0.5 ? a.emoji : b.emoji,
    description: lt < 0.5 ? a.description : b.description,

    /* Layout */
    viewZoom: lerp(a.viewZoom, b.viewZoom, lt),
    groundY: lerp(a.groundY, b.groundY, lt),

    /* Trunk */
    trunkHeight: lerp(a.trunkHeight, b.trunkHeight, lt),
    trunkBaseWidth: lerp(a.trunkBaseWidth, b.trunkBaseWidth, lt),
    trunkColor: lerpHex(a.trunkColor, b.trunkColor, lt),
    trunkColorDark: lerpHex(a.trunkColorDark, b.trunkColorDark, lt),
    barkColor: lerpHex(a.barkColor, b.barkColor, lt),
    barkDetail: lerp(a.barkDetail, b.barkDetail, lt),
    wrinkleCount: lerp(a.wrinkleCount, b.wrinkleCount, lt),
    bumpCount: lerp(a.bumpCount, b.bumpCount, lt),

    /* Roots */
    rootCount: lerp(a.rootCount, b.rootCount, lt),
    rootColor: lerpHex(a.rootColor, b.rootColor, lt),

    /* Branches */
    branchCount: lerp(a.branchCount, b.branchCount, lt),
    branchWidth: lerp(a.branchWidth, b.branchWidth, lt),
    branchColor: lerpHex(a.branchColor, b.branchColor, lt),
    swayAmount: lerp(a.swayAmount, b.swayAmount, lt),

    /* Canopy */
    crownHeight: lerp(a.crownHeight, b.crownHeight, lt),
    crownWidth: lerp(a.crownWidth, b.crownWidth, lt),
    canopyBackPuffs: lerp(a.canopyBackPuffs, b.canopyBackPuffs, lt),
    canopyFrontPuffs: lerp(a.canopyFrontPuffs, b.canopyFrontPuffs, lt),
    canopyPuffRadius: lerp(a.canopyPuffRadius, b.canopyPuffRadius, lt),
    canopyBackColor: lerpRGBA(a.canopyBackColor, b.canopyBackColor, lt),
    canopyFrontColor: lerpRGBA(a.canopyFrontColor, b.canopyFrontColor, lt),

    /* Highlights */
    highlightCount: lerp(a.highlightCount, b.highlightCount, lt),
    highlightRadius: lerp(a.highlightRadius, b.highlightRadius, lt),
    highlightColor: lerpRGBA(a.highlightColor, b.highlightColor, lt),

    /* Flowers */
    flowerCount: lerp(a.flowerCount, b.flowerCount, lt),
    flowerRadius: lerp(a.flowerRadius, b.flowerRadius, lt),
    flowerColor: lerpRGBA(a.flowerColor, b.flowerColor, lt),
    flowerColorAlt: lerpRGBA(a.flowerColorAlt, b.flowerColorAlt, lt),

    /* Fruits */
    fruitCount: lerp(a.fruitCount, b.fruitCount, lt),
    fruitRadius: lerp(a.fruitRadius, b.fruitRadius, lt),
    fruitColor: lerpRGBA(a.fruitColor, b.fruitColor, lt),
    fruitColorAlt: lerpRGBA(a.fruitColorAlt, b.fruitColorAlt, lt),

    /* Sparkles */
    sparkleCount: lerp(a.sparkleCount, b.sparkleCount, lt),
    sparkleRadius: lerp(a.sparkleRadius, b.sparkleRadius, lt),
    sparkleColor: lerpHex(a.sparkleColor, b.sparkleColor, lt),

    /* Particles */
    particleCount: lerp(a.particleCount, b.particleCount, lt),
    particleColor: lerpHex(a.particleColor, b.particleColor, lt),

    /* Glow */
    glowOpacity: lerp(a.glowOpacity, b.glowOpacity, lt),
    glowColor: lerpHex(a.glowColor, b.glowColor, lt),

    /* Ground */
    grassCount: lerp(a.grassCount, b.grassCount, lt),
    grassColorBottom: lerpHex(a.grassColorBottom, b.grassColorBottom, lt),
    grassColorTop: lerpHex(a.grassColorTop, b.grassColorTop, lt),
    mushroomCount: lerp(a.mushroomCount, b.mushroomCount, lt),
    mushroomStemColor: lerpHex(a.mushroomStemColor, b.mushroomStemColor, lt),
    mushroomCapColor: lerpHex(a.mushroomCapColor, b.mushroomCapColor, lt),
    mushroomCapEdgeColor: lerpHex(a.mushroomCapEdgeColor, b.mushroomCapEdgeColor, lt),

    /* Ground mound */
    hasMound: lt < 0.5 ? a.hasMound : b.hasMound,
  };
}

/**
 * Get interpolated stage config for a fractional stage value.
 * E.g., stageFraction=5.3 → interpolate between stage 5 (70%) and stage 6 (30%).
 */
export function getInterpolatedConfig(stageFraction: number): StageConfig {
  const lo = Math.max(0, Math.min(49, Math.floor(stageFraction)));
  const hi = Math.max(0, Math.min(49, Math.ceil(stageFraction)));
  if (lo === hi) return STAGES[lo];
  const t = stageFraction - lo;
  return lerpStageConfig(STAGES[lo], STAGES[hi], t);
}
