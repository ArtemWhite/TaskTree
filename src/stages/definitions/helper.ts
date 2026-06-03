import type { StageConfig } from '../types';

function mk(s: number, overrides: Partial<StageConfig> & { description: string }): StageConfig {
  const ratio = s / 49;
  const z = 1.20 - ratio * 0.40;
  const hasRoots = s >= 30;
  const hasBranches = s >= 8;
  const hasHighlights = s >= 12;
  const hasFlowers = s >= 28;
  const hasFruits = s >= 36;
  const hasSparkles = s >= 44;
  const hasParticles = s >= 40;
  const hasGrass = s >= 15;
  const hasMushrooms = s >= 30;
  const hasGlow = s >= 35;

  const g = (v: number) => v * z;

  const base: StageConfig = {
    stage: s,
    name: '',
    emoji: '',
    description: '',

    /* Layout */
    viewZoom: z,
    groundY: 0.458 + ratio * 0.642,

    /* Trunk */
    trunkHeight: s === 0 ? 0 : g(0.025 + ratio * 0.32),
    trunkBaseWidth: s === 0 ? 0 : g(0.01 + ratio * 0.045),
    trunkColor: '#A06A3B',
    trunkColorDark: '#4A2E15',
    barkColor: '#3D2B1A',
    barkDetail: ratio,
    wrinkleCount: Math.floor(3 + s / 8),
    bumpCount: s >= 25 ? Math.floor(2 + (s - 24) * 0.5) : 0,

    /* Roots */
    rootCount: hasRoots ? Math.floor(2 + (s - 30) / 6) : -1,
    rootColor: '#8B5A3C',

    /* Branches */
    branchCount: hasBranches ? Math.floor(1 + ratio * 7) : -1,
    branchWidth: 0.8 + ratio * 2.2,
    branchColor: '#7A4E2E',
    swayAmount: 0.003 + ratio * 0.007,

    /* Canopy */
    crownHeight: s === 0 ? 0 : g(0.03 + ratio * 0.33),
    crownWidth: s === 0 ? 0 : g(0.03 + ratio * 0.28),
    canopyBackPuffs: Math.floor(0.75 * (3 + s * 0.85)),
    canopyFrontPuffs: Math.floor(0.55 * (3 + s * 0.85)),
    canopyPuffRadius: 0.012 + ratio * 0.028,
    canopyBackColor: { r: 45, g: 100, b: 65, a: 1 },
    canopyFrontColor: { r: 55, g: 115, b: 70, a: 1 },

    /* Highlights */
    highlightCount: hasHighlights ? Math.floor(3 + s * 0.35) : -1,
    highlightRadius: 0.008 + ratio * 0.015,
    highlightColor: { r: 180, g: 210, b: 100, a: 0.45 },

    /* Flowers */
    flowerCount: hasFlowers ? Math.floor((s - 27) * 0.8) : -1,
    flowerRadius: 1.2 + ratio * 2,
    flowerColor: { r: 255, g: 195, b: 160, a: 0.78 },
    flowerColorAlt: { r: 255, g: 215, b: 180, a: 0.72 },

    /* Fruits */
    fruitCount: hasFruits ? Math.floor((s - 35) * 0.7) : -1,
    fruitRadius: 1 + ratio * 1.5,
    fruitColor: { r: 220, g: 100, b: 80, a: 0.73 },
    fruitColorAlt: { r: 200, g: 85, b: 70, a: 0.68 },

    /* Sparkles */
    sparkleCount: hasSparkles ? Math.floor(5 + (s - 43) * 0.8) : -1,
    sparkleRadius: 1.5 + ratio * 1.8,
    sparkleColor: '#F5C542',

    /* Particles */
    particleCount: hasParticles ? Math.floor(6 + (s - 39) * 2) : -1,
    particleColor: '#FFEBB4',

    /* Glow */
    glowOpacity: hasGlow ? 0.08 + ratio * 0.1 : -1,
    glowColor: '#FFD7AA',

    /* Ground */
    grassCount: hasGrass ? Math.floor(3 + (s - 14) * 0.35) : -1,
    grassColorBottom: '#50783C',
    grassColorTop: '#78AA5A',
    mushroomCount: hasMushrooms ? Math.floor(1 + (s - 29) * 0.2) : -1,
    mushroomStemColor: '#E8D5B0',
    mushroomCapColor: '#D4956B',
    mushroomCapEdgeColor: '#A06040',

    hasMound: s >= 5,
  };

  return { ...base, ...overrides, stage: s };
}

export { mk };
