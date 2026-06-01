/** RGBA color with per-channel interpolation support */
export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** All visual parameters that define a tree stage's appearance */
export interface StageConfig {
  /** Stage number 0-49 */
  stage: number;
  /** Stage name in Russian */
  name: string;
  /** Stage emoji */
  emoji: string;
  /** Detailed visual description in Russian */
  description: string;

  /* ── Layout (fractions of canvas size) ── */
  /** Camera zoom factor */
  viewZoom: number;
  /** Ground line Y position (fraction of canvas height) */
  groundY: number;

  /* ── Trunk ── */
  /** Trunk height as fraction of canvas size */
  trunkHeight: number;
  /** Trunk base width as fraction of canvas size */
  trunkBaseWidth: number;
  /** Main trunk gradient color (left side, warm caramel) */
  trunkColor: string;
  /** Dark trunk gradient color (right side, deep brown) */
  trunkColorDark: string;
  /** Bark dash/line stroke color */
  barkColor: string;
  /** Number of horizontal bark dashes (0 = draw based on height) */
  barkDetail: number;
  /** Number of vertical wrinkles at trunk base */
  wrinkleCount: number;
  /** Number of bark bumps/growths on trunk */
  bumpCount: number;

  /* ── Roots ── */
  /** Number of surface roots (-1 = not visible) */
  rootCount: number;
  /** Root stroke color */
  rootColor: string;

  /* ── Branches ── */
  /** Number of branches (-1 = not visible) */
  branchCount: number;
  /** Base branch stroke width */
  branchWidth: number;
  /** Branch color */
  branchColor: string;
  /** Sway animation magnitude */
  swayAmount: number;

  /* ── Canopy / Foliage ── */
  /** Crown height as fraction of canvas size */
  crownHeight: number;
  /** Crown maximum half-width as fraction of canvas size */
  crownWidth: number;
  /** Number of foliage puffs in back layer */
  canopyBackPuffs: number;
  /** Number of foliage puffs in front layer */
  canopyFrontPuffs: number;
  /** Base foliage puff radius as fraction of canvas size */
  canopyPuffRadius: number;
  /** Back foliage base RGB (computed with top-lighting in renderer) */
  canopyBackColor: RGBA;
  /** Front foliage base RGB (computed with top-lighting in renderer) */
  canopyFrontColor: RGBA;

  /* ── Highlights ── */
  /** Number of golden-chartreuse highlight spots (-1 = not visible) */
  highlightCount: number;
  /** Highlight spot radius as fraction of canvas size */
  highlightRadius: number;
  /** Highlight color */
  highlightColor: RGBA;

  /* ── Flowers ── */
  /** Number of flowers (-1 = not visible) */
  flowerCount: number;
  /** Flower dot radius in pixels */
  flowerRadius: number;
  /** Primary flower color */
  flowerColor: RGBA;
  /** Secondary flower color */
  flowerColorAlt: RGBA;

  /* ── Fruits ── */
  /** Number of fruits (-1 = not visible) */
  fruitCount: number;
  /** Fruit dot radius in pixels */
  fruitRadius: number;
  /** Primary fruit color */
  fruitColor: RGBA;
  /** Secondary fruit color */
  fruitColorAlt: RGBA;

  /* ── Sparkles ── */
  /** Number of sparkle dots (-1 = not visible) */
  sparkleCount: number;
  /** Sparkle dot radius in pixels */
  sparkleRadius: number;
  /** Sparkle color (hex) */
  sparkleColor: string;

  /* ── Particles / Fireflies ── */
  /** Number of floating particles (-1 = not visible) */
  particleCount: number;
  /** Particle color (hex, used in rgba with varying alpha) */
  particleColor: string;

  /* ── Glow ── */
  /** Glow opacity (-1 = not visible, 0-1 = visible) */
  glowOpacity: number;
  /** Glow inner color */
  glowColor: string;

  /* ── Ground ── */
  /** Grass blade count (-1 = not visible) */
  grassCount: number;
  /** Grass base color */
  grassColorBottom: string;
  /** Grass tip color */
  grassColorTop: string;
  /** Mushroom count (-1 = not visible) */
  mushroomCount: number;
  /** Mushroom stem color */
  mushroomStemColor: string;
  /** Mushroom cap center color */
  mushroomCapColor: string;
  /** Mushroom cap edge color */
  mushroomCapEdgeColor: string;

  /* ── Ground mound / earth ── */
  /** Whether earth mound is visible */
  hasMound: boolean;
}
