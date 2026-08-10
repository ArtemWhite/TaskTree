import { useEffect, useRef, useState, useCallback } from 'react';
import type { TreeStage } from '../types';
import type { StageConfig } from '../stages/types';
import { getInterpolatedConfig } from '../stages/registry';

interface Props {
  totalXP: number;
  treeStage: TreeStage;
  levelInfo: { current: number; next: number; level: number };
  activeCount: number;
  completedCount: number;
  pomodoroSessions: number;
  workoutsCount?: number;
  workoutsDuration?: number;
  booksCount?: number;
  booksPages?: number;
  large?: boolean;
  zoom?: number;
  sideLayout?: boolean;
  treeSize?: number;
}

export const STAGE_NAMES: string[] = [
  '🌰 Семя',
  '💧 Набухшее семя',
  '🌱 Проклюнувшееся семя',
  '🌱 Корешок',
  '🌱 Первый росток',
  '🌿 Молодой росток',
  '🌿 Крепкий росток',
  '🍃 Первый лист',
  '🍃 Два листа',
  '🍃 Три листа',
  '🌿 Четыре листа',
  '🌿 Маленький саженец',
  '🪴 Саженец',
  '🪴 Крепкий саженец',
  '🪴 Ветвящийся саженец',
  '🪴 Густой саженец',
  '🌳 Молодое деревце',
  '🌳 Растущее деревце',
  '🌳 Крепкое деревце',
  '🌳 Ветвистое деревце',
  '🌳 Маленькое дерево',
  '🌳 Молодое дерево',
  '🌲 Растущее дерево',
  '🌲 Крепкое дерево',
  '🌲 Ветвистое дерево',
  '🌲 Густое дерево',
  '🌲 Большое дерево',
  '🌲 Могучее дерево',
  '🌸 Цветущее дерево',
  '🌸 Плодоносящее дерево',
  '🌸 Пышное дерево',
  '🌸 Благоухающее дерево',
  '🌸 Великое дерево',
  '🌴 Старое дерево',
  '🌴 Мудрое дерево',
  '🌴 Величественное дерево',
  '🏛️ Исполинское дерево',
  '🏛️ Золотое дерево',
  '🏛️ Священное дерево',
  '🏛️ Легендарное дерево',
  '🏛️ Эпическое дерево',
  '✨ Мистическое дерево',
  '✨ Сияющее дерево',
  '✨ Космическое дерево',
  '✨ Звёздное дерево',
  '🌟 Древо жизни',
  '🌟 Древо познания',
  '🌟 Древо мудрости',
  '🌟 Древо вечности',
  '🌟 Древо мироздания',
];

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export default function ProgressSection({
  totalXP, treeStage, levelInfo, activeCount, completedCount, pomodoroSessions,
  workoutsCount = 0, workoutsDuration = 0, booksCount = 0, booksPages = 0,
  large, zoom = 1, sideLayout, treeSize
}: Props) {
  const size = treeSize || (large ? 280 : 160);
  const [viewStage, setViewStage] = useState<number | null>(null);
  const prevTreeStageRef = useRef(treeStage);
  const displayStage = viewStage ?? treeStage;
  const isViewingPastStage = viewStage !== null && viewStage < treeStage;

  useEffect(() => {
    if (treeStage > prevTreeStageRef.current) setViewStage(null);
    prevTreeStageRef.current = treeStage;
  }, [treeStage]);

  const actualFractionalStage = treeStage + (levelInfo.next > 0 ? Math.min(1, levelInfo.current / levelInfo.next) : 0);
  const viewFractionalStage = isViewingPastStage
    ? Math.min(displayStage + 0.95, 49)
    : actualFractionalStage;

  if (sideLayout) {
    return (
      <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Info panel — left side */}
        <div style={{ flex: '0 0 340px', minWidth: '280px' }}>
          <p className="micro-cap" style={{ marginBottom: '8px' }}>ДЕРЕВО ПРОГРЕССА</p>
          <div style={{ position: 'relative', marginBottom: '4px', minHeight: '72px' }}>
            <button
              className="btn-ghost btn-ghost-xs"
              onClick={() => { const prev = displayStage - 1; setViewStage(prev <= 0 ? 0 : prev); }}
              disabled={displayStage <= 0}
              style={{ position: 'absolute', left: 0, top: 4 }}
              title="Предыдущая стадия"
            >◀</button>
            <div style={{ fontSize: '28px', fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif', fontWeight: 700, letterSpacing: '0.96px', textTransform: 'uppercase', lineHeight: '1.25', textAlign: 'center', padding: '0 52px' }}>
              {STAGE_NAMES[displayStage] ?? STAGE_NAMES[0]}
            </div>
            <button
              className="btn-ghost btn-ghost-xs"
              onClick={() => setViewStage(displayStage + 1)}
              disabled={displayStage >= treeStage}
              style={{ position: 'absolute', right: 0, top: 4 }}
              title="Следующая стадия"
            >▶</button>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px', minHeight: '20px' }}>
            {isViewingPastStage ? (
              <><span style={{ color: 'var(--text-soft)' }}>ПРОСМОТР</span> · Стадия {displayStage + 1}/50</>
            ) : (
              <>Стадия {treeStage + 1}/50</>
            )}
            {' · '}Уровень {levelInfo.level} · {totalXP} XP
          </p>
          <button
            className="btn-ghost btn-ghost-xs"
            onClick={() => setViewStage(null)}
            style={{ marginBottom: '16px', visibility: isViewingPastStage ? 'visible' : 'hidden' }}
          >↩ К ТЕКУЩЕЙ</button>
          <div style={{ width: '100%', maxWidth: '300px' }}>
            <div className="progress-bar" style={{ height: '4px' }}>
              <div className="progress-bar-fill" style={{ width: `${levelInfo.next > 0 ? (levelInfo.current / levelInfo.next) * 100 : 100}%`, height: '100%' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.8px' }}>
              <span>{levelInfo.current} XP</span>
              <span>{levelInfo.next} XP</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '24px', marginTop: '24px', flexWrap: 'wrap' }}>
            <StatBox label="АКТИВНЫХ ЗАДАЧ" value={activeCount} />
            <StatBox label="ВЫПОЛНЕНО ЗАДАЧ" value={completedCount} />
            <StatBox label="ПОМОДОРО" value={pomodoroSessions} />
            <StatBox label="ТРЕНИРОВОК" value={workoutsCount} />
            <StatBox label="МИН. СПОРТА" value={workoutsDuration} />
            <StatBox label="ПРОЧИТАНО КНИГ" value={booksCount} />
            <StatBox label="СТРАНИЦ" value={booksPages} />
          </div>
        </div>

        {/* Tree frame — right side */}
        <div style={{ flex: '1 1 400px', minWidth: '340px' }}>
          <TreeFrame fractionalStage={viewFractionalStage} size={size} initialZoom={zoom} />
        </div>
      </div>
    );
  }

  // Default stacked layout
  return (
    <div style={{ display: 'flex', flexDirection: large ? 'column' : 'row', alignItems: 'center', gap: large ? '24px' : '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
      <div className="animate-grow" style={{ width: size, height: size, position: 'relative' }}>
        <TreeCanvas fractionalStage={viewFractionalStage} size={size} zoom={zoom} />
      </div>

      <div style={{ textAlign: large ? 'center' : 'left' }}>
        {large && <p className="micro-cap" style={{ marginBottom: '8px' }}>ДЕРЕВО ПРОГРЕССА</p>}
        <div style={{ position: 'relative', marginBottom: '4px', minHeight: large ? '72px' : '50px', minWidth: large ? '340px' : '220px' }}>
          <button
            className="btn-ghost btn-ghost-xs"
            onClick={() => { const prev = displayStage - 1; setViewStage(prev <= 0 ? 0 : prev); }}
            disabled={displayStage <= 0}
            style={{ position: 'absolute', left: 0, top: large ? 4 : 2 }}
            title="Предыдущая стадия"
          >◀</button>
          <div style={{ fontSize: large ? '28px' : '20px', fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif', fontWeight: 700, letterSpacing: '0.96px', textTransform: 'uppercase', lineHeight: '1.25', textAlign: 'center', padding: large ? '0 52px' : '0 42px' }}>
            {STAGE_NAMES[displayStage] ?? STAGE_NAMES[0]}
          </div>
          <button
            className="btn-ghost btn-ghost-xs"
            onClick={() => setViewStage(displayStage + 1)}
            disabled={displayStage >= treeStage}
            style={{ position: 'absolute', right: 0, top: large ? 4 : 2 }}
            title="Следующая стадия"
          >▶</button>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: large ? '16px' : '8px', minHeight: '20px' }}>
          {isViewingPastStage ? (
            <><span style={{ color: 'var(--text-soft)' }}>ПРОСМОТР</span> · Стадия {displayStage + 1}/50</>
          ) : (
            <>Стадия {treeStage + 1}/50</>
          )}
          {' · '}Уровень {levelInfo.level} · {totalXP} XP
        </p>
        <button
          className="btn-ghost btn-ghost-xs"
          onClick={() => setViewStage(null)}
          style={{ marginBottom: '16px', visibility: isViewingPastStage ? 'visible' : 'hidden' }}
        >↩ К ТЕКУЩЕЙ</button>
        <div style={{ width: large ? '280px' : '180px' }}>
          <div className="progress-bar" style={{ height: large ? '4px' : '3px' }}>
            <div className="progress-bar-fill" style={{ width: `${levelInfo.next > 0 ? (levelInfo.current / levelInfo.next) * 100 : 100}%`, height: '100%' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.8px' }}>
            <span>{levelInfo.current} XP</span>
            <span>{levelInfo.next} XP</span>
          </div>
        </div>
        {large && (
          <div style={{ display: 'flex', gap: '24px', marginTop: '24px', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '600px' }}>
            <StatBox label="АКТИВНЫХ ЗАДАЧ" value={activeCount} />
            <StatBox label="ВЫПОЛНЕНО ЗАДАЧ" value={completedCount} />
            <StatBox label="ПОМОДОРО" value={pomodoroSessions} />
            <StatBox label="ТРЕНИРОВОК" value={workoutsCount} />
            <StatBox label="МИН. СПОРТА" value={workoutsDuration} />
            <StatBox label="ПРОЧИТАНО КНИГ" value={booksCount} />
            <StatBox label="СТРАНИЦ" value={booksPages} />
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '28px', fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif', fontWeight: 700 }}>{value}</div>
      <div className="micro-cap" style={{ fontSize: '10px' }}>{label}</div>
    </div>
  );
}

/* ───────── Tree frame with border, zoom & pan ───────── */

function TreeFrame({ fractionalStage, size, initialZoom }: { fractionalStage: number; size: number; initialZoom: number }) {
  const [zoom, setZoom] = useState(initialZoom);

  return (
    <div style={{
      border: '1px solid var(--hairline)',
      borderRadius: '12px',
      overflow: 'hidden',
      background: 'var(--surface-hover)',
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', gap: '6px', alignItems: 'center', padding: '8px 12px',
        borderBottom: '1px solid var(--hairline)',
      }}>
        <button className="btn-ghost btn-ghost-xs" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} title="Уменьшить">−</button>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.6px', minWidth: '40px', textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button className="btn-ghost btn-ghost-xs" onClick={() => setZoom(z => Math.min(3, z + 0.25))} title="Увеличить">+</button>
        <button className="btn-ghost btn-ghost-xs" onClick={() => setZoom(1)} style={{ marginLeft: '4px' }}>СБРОС</button>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: 'auto', letterSpacing: '0.4px' }}>
          Зажмите для перемещения
        </span>
      </div>

      {/* Canvas area */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: `${size}px` }}>
        <TreeCanvas fractionalStage={fractionalStage} size={size} zoom={zoom} panEnabled />
      </div>
    </div>
  );
}

/* ───────── Canvas tree renderer ───────── */

let animTime = 0;

function TreeCanvas({ fractionalStage, size, zoom = 1, panEnabled = false }: { fractionalStage: number; size: number; zoom?: number; panEnabled?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const fStageRef = useRef(fractionalStage);
  const sizeRef = useRef(size);
  const zoomRef = useRef(zoom);
  const panXRef = useRef(0);
  const panYRef = useRef(0);
  const draggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  fStageRef.current = fractionalStage;
  sizeRef.current = size;
  zoomRef.current = zoom;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!panEnabled) return;
    draggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  }, [panEnabled]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    panXRef.current += dx;
    panYRef.current += dy;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!panEnabled || e.touches.length !== 1) return;
    draggingRef.current = true;
    lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, [panEnabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!draggingRef.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - lastMouseRef.current.x;
    const dy = e.touches[0].clientY - lastMouseRef.current.y;
    panXRef.current += dx;
    panYRef.current += dy;
    lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const handleTouchEnd = useCallback(() => {
    draggingRef.current = false;
  }, []);

  // Reset pan when size changes
  useEffect(() => {
    panXRef.current = 0;
    panYRef.current = 0;
  }, [size]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const sz = sizeRef.current;
      canvas.width = sz * dpr;
      canvas.height = sz * dpr;
      canvas.style.width = `${sz}px`;
      canvas.style.height = `${sz}px`;
    };
    resize();

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      animTime += dt;

      const sz = sizeRef.current;
      const z = zoomRef.current;
      if (canvas.width !== sz * dpr || canvas.height !== sz * dpr) resize();

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, sz, sz);

      // Pan then center-origin zoom
      ctx.translate(sz / 2, sz / 2);
      ctx.translate(panXRef.current, panYRef.current);
      ctx.scale(z, z);
      ctx.translate(-sz / 2, -sz / 2);

      drawTree(ctx, fStageRef.current, sz);
      ctx.restore();

      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const cursor = panEnabled ? (draggingRef.current ? 'grabbing' : 'grab') : 'default';

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ display: 'block', cursor, touchAction: 'none' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
}

interface TreeLayout {
  cx: number;
  groundY: number;
  trH: number;
  trBaseW: number;
  trTopW: number;
  foliageBase: number;
  crownTop: number;
  crownH: number;
  maxHalfWidth: number;
}

function computeLayout(cfg: StageConfig, size: number): TreeLayout {
  const cx = size / 2;
  const groundY = size * cfg.groundY;
  const trH = cfg.trunkHeight * size;
  const foliageBase = groundY - trH;
  const trBaseW = cfg.trunkBaseWidth * size;
  const trTopW = trBaseW * 0.35;

  let crownH = cfg.crownHeight * size;
  const minCrownTop = size * 0.02;
  if (foliageBase - crownH < minCrownTop) {
    crownH = foliageBase - minCrownTop;
  }
  const crownTop = foliageBase - crownH;
  const maxHalfWidth = cfg.crownWidth * size;

  return { cx, groundY, trH, trBaseW, trTopW, foliageBase, crownTop, crownH, maxHalfWidth };
}

function drawTree(ctx: CanvasRenderingContext2D, fractionalStage: number, size: number) {
  ctx.clearRect(0, 0, size, size);

  const clamped = Math.max(0, Math.min(49, fractionalStage));
  const cfg = getInterpolatedConfig(clamped);
  const s = Math.round(clamped); // integer stage for pseudoRandom seeds
  const L = computeLayout(cfg, size);

  // ── Seed (stage ~0) ──
  if (cfg.trunkHeight <= 0) {
    ctx.beginPath();
    ctx.arc(L.cx, L.groundY - 2, size * 0.04, 0, Math.PI * 2);
    ctx.fillStyle = cfg.trunkColor;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(L.cx, L.groundY + 2, size * 0.14, size * 0.022, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(40,25,15,0.5)';
    ctx.fill();
    return;
  }

  // ── Glow behind tree ──
  if (cfg.glowOpacity > 0) {
    const glowCX = L.cx;
    const glowCY = L.crownTop + L.crownH * 0.45;
    const glowR = L.maxHalfWidth * 1.5;
    const glow = ctx.createRadialGradient(glowCX, glowCY, L.maxHalfWidth * 0.3, glowCX, glowCY, glowR);
    const alpha = cfg.glowOpacity;
    glow.addColorStop(0, `rgba(255,215,170,${(0.12 * (alpha / 0.5)).toFixed(2)})`);
    glow.addColorStop(0.5, `rgba(255,200,140,${(0.05 * (alpha / 0.5)).toFixed(2)})`);
    glow.addColorStop(1, 'rgba(255,180,100,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(glowCX, glowCY, glowR, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Ground mound ──
  if (cfg.hasMound) {
    const moundW = L.maxHalfWidth * 0.9;
    const moundH = size * 0.025;
    const moundGrad = ctx.createLinearGradient(L.cx, L.groundY, L.cx, L.groundY + moundH);
    moundGrad.addColorStop(0, 'rgba(60,40,25,0.35)');
    moundGrad.addColorStop(1, 'rgba(60,40,25,0)');
    ctx.fillStyle = moundGrad;
    ctx.beginPath();
    ctx.ellipse(L.cx, L.groundY + moundH * 0.5, moundW, moundH, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Ground shadow ──
  const shadowRX = L.maxHalfWidth * 0.75;
  const shadowGrad = ctx.createRadialGradient(L.cx, L.groundY + 1, 0, L.cx, L.groundY + 1, shadowRX);
  shadowGrad.addColorStop(0, 'rgba(40,25,15,0.40)');
  shadowGrad.addColorStop(0.5, 'rgba(40,25,15,0.12)');
  shadowGrad.addColorStop(1, 'rgba(40,25,15,0)');
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.ellipse(L.cx, L.groundY + 1, shadowRX, size * 0.02, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Layer 1: Back foliage ──
  drawCanopy(ctx, cfg, s, size, L, 'back');

  // ── Layer 2: Trunk + roots ──
  drawTrunk(ctx, L, cfg, s);
  if (cfg.rootCount > 0) drawRoots(ctx, L, cfg, s, size);

  // ── Layer 3: Branches ──
  if (cfg.branchCount > 0) drawBranches(ctx, L, cfg, s, size);

  // ── Layer 4: Front foliage ──
  drawCanopy(ctx, cfg, s, size, L, 'front');

  // ── Layer 5: Highlights ──
  if (cfg.highlightCount > 0) drawHighlights(ctx, cfg, size, L);

  // ── Layer 6: Flowers ──
  if (cfg.flowerCount > 0) drawFlowers(ctx, cfg, L);

  // ── Layer 7: Fruits ──
  if (cfg.fruitCount > 0) drawFruits(ctx, cfg, L);

  // ── Layer 8: Sparkles ──
  if (cfg.sparkleCount > 0) drawSparkles(ctx, cfg, L);

  // ── Floating particles ──
  if (cfg.particleCount > 0) drawParticles(ctx, cfg, s, L);

  // ── Ground details ──
  if (cfg.grassCount > 0) drawGrass(ctx, L, cfg, s, size);
  if (cfg.mushroomCount > 0) drawMushrooms(ctx, L, cfg, s, size);

  // ── Ground line ──
  ctx.beginPath();
  ctx.ellipse(L.cx, L.groundY + 2, size * (0.06 + (s / 49) * 0.08), size * 0.016, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(40,25,15,0.45)';
  ctx.fill();
}

/* ─── Trunk ─── */

function drawTrunk(ctx: CanvasRenderingContext2D, L: TreeLayout, cfg: StageConfig, s: number) {
  const top = L.groundY - L.trH;

  const trGrad = ctx.createLinearGradient(L.cx - L.trBaseW, 0, L.cx + L.trBaseW, 0);
  trGrad.addColorStop(0, cfg.trunkColor);
  trGrad.addColorStop(0.3, cfg.trunkColor);
  trGrad.addColorStop(0.55, cfg.trunkColorDark);
  trGrad.addColorStop(1, cfg.trunkColorDark);

  ctx.fillStyle = trGrad;
  ctx.beginPath();
  ctx.moveTo(L.cx - L.trBaseW, L.groundY);
  ctx.bezierCurveTo(
    L.cx - L.trBaseW * 0.8, L.groundY - L.trH * 0.4,
    L.cx - L.trTopW * 1.1, top + L.trH * 0.3,
    L.cx - L.trTopW, top
  );
  ctx.lineTo(L.cx + L.trTopW, top);
  ctx.bezierCurveTo(
    L.cx + L.trTopW * 1.1, top + L.trH * 0.3,
    L.cx + L.trBaseW * 0.8, L.groundY - L.trH * 0.4,
    L.cx + L.trBaseW, L.groundY
  );
  ctx.closePath();
  ctx.fill();

  if (L.trH > 10) {
    // Horizontal bark dashes
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = cfg.barkColor;
    ctx.lineWidth = 0.55;
    const lines = Math.floor(L.trH / 8);
    for (let i = 0; i < lines; i++) {
      const y = top + 3 + i * (L.trH / lines);
      const frac = (y - top) / L.trH;
      const w = L.trBaseW * (1 - frac * 0.62) * (0.6 + pseudoRandom(i * 31 + s) * 0.8);
      const xOff = (pseudoRandom(i * 47 + s) - 0.5) * w * 0.25;
      ctx.beginPath();
      ctx.moveTo(L.cx + xOff - w / 2, y);
      ctx.bezierCurveTo(L.cx + xOff, y + 0.5, L.cx + xOff, y - 0.5, L.cx + xOff + w / 2, y);
      ctx.stroke();
    }
    ctx.restore();

    // Vertical wrinkles at base (lower 40% of trunk)
    if (cfg.wrinkleCount > 0) {
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = cfg.barkColor;
      ctx.lineWidth = 0.7;
      for (let i = 0; i < cfg.wrinkleCount; i++) {
        const baseH = L.trH * 0.4;
        const yStart = L.groundY - 1;
        const yEnd = yStart - baseH * (0.5 + pseudoRandom(i * 91 + s) * 0.5);
        const xBase = L.cx + (pseudoRandom(i * 73 + s) - 0.5) * L.trBaseW * 1.2;
        ctx.beginPath();
        ctx.moveTo(xBase, yStart);
        ctx.quadraticCurveTo(
          xBase + (pseudoRandom(i * 107 + s) - 0.5) * L.trBaseW * 0.5,
          (yStart + yEnd) / 2,
          xBase, yEnd
        );
        ctx.stroke();
      }
      ctx.restore();
    }

    // Bark bumps / growths
    if (cfg.bumpCount > 0) {
      for (let i = 0; i < cfg.bumpCount; i++) {
        const frac = 0.15 + (i / cfg.bumpCount) * 0.7;
        const bumpY = top + frac * L.trH;
        const side = i % 2 === 0 ? -1 : 1;
        const wAtY = L.trBaseW * (1 - frac * 0.62);
        const bx = L.cx + side * wAtY * (0.5 + pseudoRandom(i * 137 + s) * 0.5);
        const br = L.trBaseW * (0.06 + pseudoRandom(i * 151 + s) * 0.08);
        ctx.fillStyle = 'rgba(61,43,26,0.35)';
        ctx.beginPath();
        ctx.arc(bx, bumpY, br, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(80,55,35,0.2)';
        ctx.beginPath();
        ctx.arc(bx - br * 0.25, bumpY - br * 0.25, br * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

/* ─── Roots ─── */

function drawRoots(ctx: CanvasRenderingContext2D, L: TreeLayout, cfg: StageConfig, s: number, size: number) {
  const rootW = L.trBaseW * 0.5;
  ctx.strokeStyle = cfg.rootColor;
  ctx.lineWidth = Math.max(rootW, 0.8);
  ctx.lineCap = 'round';

  for (let i = 0; i < cfg.rootCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const baseX = L.cx + side * L.trBaseW * 0.55;
    const spread = L.trBaseW * (1.1 + i * 0.35);
    const len = size * 0.03 + pseudoRandom(i * 53 + s) * size * 0.05;
    ctx.beginPath();
    ctx.moveTo(baseX, L.groundY);
    ctx.bezierCurveTo(
      baseX + side * spread * 0.5, L.groundY + len * 0.5,
      baseX + side * spread, L.groundY + len * 0.75,
      baseX + side * spread, L.groundY + len
    );
    ctx.stroke();
  }
}

/* ─── Branches ─── */

function drawBranches(ctx: CanvasRenderingContext2D, L: TreeLayout, cfg: StageConfig, s: number, size: number) {
  const num = cfg.branchCount;
  const top = L.groundY - L.trH;

  for (let i = 0; i < num; i++) {
    const frac = 0.25 + (i / num) * 0.65;
    const branchY = top + frac * L.trH;
    const wAtY = L.trBaseW * (1 - frac * 0.62);
    const side = i % 2 === 0 ? -1 : 1;
    const startX = L.cx + side * wAtY * 0.45;

    const branchLen = size * (0.02 + (s / 49) * 0.07) * (0.7 + pseudoRandom(i * 41 + s) * 0.6);
    const angle = side * 0.35 + (pseudoRandom(i * 59 + s) - 0.5) * 0.45;
    const endX = startX + Math.sin(angle) * branchLen;
    const endY = branchY - Math.cos(angle) * branchLen;

    // Sway animation using cfg.swayAmount
    const swayAmount = frac > 0.5 ? (frac - 0.5) * 2 : 0;
    const swayScale = cfg.swayAmount * 150;
    const swayX = Math.sin(animTime * 1.8 + i * 0.9) * swayAmount * swayScale;
    const swayY = Math.cos(animTime * 2.1 + i * 1.1) * swayAmount * swayScale * 0.6;

    const lw = cfg.branchWidth * (1 - frac * 0.6);
    ctx.strokeStyle = cfg.branchColor;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, branchY);
    ctx.quadraticCurveTo(
      startX + (endX + swayX - startX) * 0.35,
      branchY + (endY + swayY - branchY) * 0.25 - 2,
      endX + swayX, endY + swayY
    );
    ctx.stroke();
  }
}

/* ─── Canopy (foliage puffs with radial gradients) ─── */

function drawCanopy(ctx: CanvasRenderingContext2D, cfg: StageConfig, s: number, size: number, L: TreeLayout, layer: 'back' | 'front') {
  const isBack = layer === 'back';
  const count = isBack ? cfg.canopyBackPuffs : cfg.canopyFrontPuffs;
  const seedOff = isBack ? 100 : 200;

  for (let i = 0; i < count; i++) {
    const spiralAngle = i * 2.399 + (isBack ? 0 : 0.5);
    const hFrac = Math.pow(i / Math.max(count, 1), isBack ? 0.55 : 0.42);
    const y = L.crownTop + hFrac * L.crownH;
    const widthHere = L.maxHalfWidth * (1 - hFrac * 0.82);

    const rnd = pseudoRandom(i * 7 + s * 13 + seedOff);
    const distFrac = 0.12 + rnd * 0.88;
    const dist = widthHere * distFrac;

    const sizeScale = 0.4 + 0.6 * (1 - hFrac);
    const puffR = size * cfg.canopyPuffRadius * sizeScale * 1.2;

    const px = L.cx + Math.cos(spiralAngle + rnd * 0.4) * dist;
    const py = y + (pseudoRandom(i * 83 + s + seedOff) - 0.5) * L.crownH * 0.06;

    // Warm green palette with top-lighting, using config colors
    const topLight = 1 - hFrac;
    const base = isBack ? cfg.canopyBackColor : cfg.canopyFrontColor;
    const g = Math.round(base.g + topLight * 30);
    const r = Math.round(base.r + topLight * 15);
    const b = Math.round(base.b + topLight * 20);
    const inner = `rgba(${r},${g},${b},`;

    const grad = ctx.createRadialGradient(px, py, 0, px, py, puffR);
    grad.addColorStop(0, inner + '0.90)');
    grad.addColorStop(0.25, inner + '0.70)');
    grad.addColorStop(0.55, inner + '0.30)');
    grad.addColorStop(1, inner + '0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, puffR, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ─── Highlights (upper surface glow) ─── */

function drawHighlights(ctx: CanvasRenderingContext2D, cfg: StageConfig, size: number, L: TreeLayout) {
  const count = cfg.highlightCount;
  const hlc = cfg.highlightColor;

  for (let i = 0; i < count; i++) {
    const angle = i * 2.8 + 1.3;
    const hFrac = (i / count) * 0.6;
    const y = L.crownTop + hFrac * L.crownH;
    const dist = L.maxHalfWidth * (1 - hFrac * 0.82) * 0.65;
    const r = size * cfg.highlightRadius;

    const px = L.cx + Math.cos(angle) * dist;
    const py = y;
    const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
    grad.addColorStop(0, `rgba(${hlc.r},${hlc.g},${hlc.b},${hlc.a.toFixed(2)})`);
    grad.addColorStop(1, `rgba(${hlc.r},${hlc.g},${hlc.b},0)`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ─── Flowers (upper crown) ─── */

function drawFlowers(ctx: CanvasRenderingContext2D, cfg: StageConfig, L: TreeLayout) {
  const count = cfg.flowerCount;
  const fc1 = cfg.flowerColor;
  const fc2 = cfg.flowerColorAlt;

  for (let i = 0; i < count; i++) {
    const angle = i * 2.1;
    const hFrac = (i / Math.max(count, 1)) * 0.55;
    const y = L.crownTop + hFrac * L.crownH;
    const dist = L.maxHalfWidth * (1 - hFrac * 0.82) * 0.6;
    const r = cfg.flowerRadius;

    const px = L.cx + Math.cos(angle) * dist;
    const py = y;
    const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
    const c = i % 2 === 0 ? fc1 : fc2;
    grad.addColorStop(0, `rgba(${c.r},${c.g},${c.b},${c.a.toFixed(2)})`);
    grad.addColorStop(0.5, `rgba(${c.r},${Math.round(c.g * 0.92)},${Math.round(c.b * 0.88)},${(c.a * 0.44).toFixed(2)})`);
    grad.addColorStop(1, `rgba(${c.r},${Math.round(c.g * 0.92)},${Math.round(c.b * 0.88)},0)`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ─── Fruits (lower crown) ─── */

function drawFruits(ctx: CanvasRenderingContext2D, cfg: StageConfig, L: TreeLayout) {
  const count = cfg.fruitCount;
  const fc1 = cfg.fruitColor;
  const fc2 = cfg.fruitColorAlt;

  for (let i = 0; i < count; i++) {
    const angle = i * 2.7 + 0.8;
    const hFrac = 0.3 + (i / Math.max(count, 1)) * 0.45;
    const y = L.crownTop + hFrac * L.crownH;
    const dist = L.maxHalfWidth * (1 - hFrac * 0.82) * 0.45;
    const r = cfg.fruitRadius;

    const px = L.cx + Math.cos(angle) * dist;
    const py = y;
    const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
    const c = i % 2 === 0 ? fc1 : fc2;
    grad.addColorStop(0, `rgba(${c.r},${c.g},${c.b},${c.a.toFixed(2)})`);
    grad.addColorStop(0.5, `rgba(${Math.round(c.r * 0.91)},${Math.round(c.g * 0.8)},${Math.round(c.b * 0.75)},${(c.a * 0.41).toFixed(2)})`);
    grad.addColorStop(1, `rgba(${Math.round(c.r * 0.82)},${Math.round(c.g * 0.7)},${Math.round(c.b * 0.69)},0)`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ─── Gold sparkles (outer edges) ─── */

function drawSparkles(ctx: CanvasRenderingContext2D, cfg: StageConfig, L: TreeLayout) {
  const count = cfg.sparkleCount;

  for (let i = 0; i < count; i++) {
    const angle = i * 1.8;
    const hFrac = (i / count) * 0.7;
    const y = L.crownTop + hFrac * L.crownH;
    const dist = L.maxHalfWidth * (1 - hFrac * 0.82) * 0.7;
    const r = cfg.sparkleRadius;

    const px = L.cx + Math.cos(angle) * dist;
    const py = y;
    const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
    grad.addColorStop(0, 'rgba(245,197,66,0.65)');
    grad.addColorStop(0.5, 'rgba(245,180,50,0.25)');
    grad.addColorStop(1, 'rgba(245,180,50,0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();

    // Tiny cross
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = cfg.sparkleColor;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(px - r * 0.6, py);
    ctx.lineTo(px + r * 0.6, py);
    ctx.moveTo(px, py - r * 0.6);
    ctx.lineTo(px, py + r * 0.6);
    ctx.stroke();
    ctx.restore();
  }
}

/* ─── Floating particles / fireflies ─── */

function drawParticles(ctx: CanvasRenderingContext2D, cfg: StageConfig, s: number, L: TreeLayout) {
  const count = cfg.particleCount;

  for (let i = 0; i < count; i++) {
    const seed = i * 199 + s * 47;
    const orbitAngle = pseudoRandom(seed) * Math.PI * 2;
    const orbitR = L.maxHalfWidth * (0.5 + pseudoRandom(seed + 31) * 1.1);
    const baseY = L.crownTop + pseudoRandom(seed + 67) * L.crownH * 1.2;

    const floatX = Math.cos(animTime * 0.7 + orbitAngle) * orbitR;
    const floatY = Math.sin(animTime * 0.9 + orbitAngle * 1.3) * L.crownH * 0.25;
    const px = L.cx + floatX;
    const py = baseY + floatY;

    const r = 0.8 + pseudoRandom(seed + 101) * 1.5;
    const alpha = 0.3 + Math.sin(animTime * 2.5 + seed) * 0.2;

    const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
    grad.addColorStop(0, `rgba(255,240,180,${(0.7 * alpha).toFixed(2)})`);
    grad.addColorStop(0.5, `rgba(255,220,140,${(0.3 * alpha).toFixed(2)})`);
    grad.addColorStop(1, 'rgba(255,200,100,0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ─── Grass blades ─── */

function drawGrass(ctx: CanvasRenderingContext2D, L: TreeLayout, cfg: StageConfig, s: number, size: number) {
  const bladeCount = cfg.grassCount;
  ctx.lineCap = 'round';

  for (let i = 0; i < bladeCount; i++) {
    const seed = i * 173 + s * 59;
    const side = i % 2 === 0 ? -1 : 1;
    const baseX = L.cx + side * L.trBaseW * (0.6 + pseudoRandom(seed) * 1.2);
    const bladeH = size * 0.015 + pseudoRandom(seed + 13) * size * 0.03;
    const lean = side * (0.15 + pseudoRandom(seed + 29) * 0.4);
    const sway = Math.sin(animTime * 2.5 + i * 1.3) * bladeH * 0.12;

    const tipX = baseX + lean * bladeH + sway;
    const tipY = L.groundY - bladeH;
    const cpX = baseX + lean * bladeH * 0.5 + sway * 0.5;
    const cpY = L.groundY - bladeH * 0.6;

    const bladeGrad = ctx.createLinearGradient(baseX, L.groundY, tipX, tipY);
    bladeGrad.addColorStop(0, cfg.grassColorBottom);
    bladeGrad.addColorStop(1, cfg.grassColorTop);

    ctx.strokeStyle = bladeGrad;
    ctx.lineWidth = 1 + pseudoRandom(seed + 41) * 0.8;
    ctx.beginPath();
    ctx.moveTo(baseX, L.groundY);
    ctx.quadraticCurveTo(cpX, cpY, tipX, tipY);
    ctx.stroke();
  }
}

/* ─── Mushrooms at roots ─── */

function drawMushrooms(ctx: CanvasRenderingContext2D, L: TreeLayout, cfg: StageConfig, s: number, size: number) {
  const count = cfg.mushroomCount;

  for (let i = 0; i < count; i++) {
    const seed = i * 251 + s * 83;
    const side = i % 2 === 0 ? -1 : 1;
    const mx = L.cx + side * L.trBaseW * (0.8 + pseudoRandom(seed) * 0.6);
    const my = L.groundY - 1;

    // Stem
    const stemH = size * 0.015 + pseudoRandom(seed + 17) * size * 0.018;
    const stemW = 1 + pseudoRandom(seed + 31) * 1;
    ctx.fillStyle = cfg.mushroomStemColor;
    ctx.beginPath();
    ctx.roundRect(mx - stemW / 2, my - stemH, stemW, stemH, stemW / 2);
    ctx.fill();

    // Cap
    const capR = stemW + 1.5 + pseudoRandom(seed + 47) * 2;
    const capY = my - stemH;
    const capGrad = ctx.createRadialGradient(mx, capY, 0, mx, capY, capR);
    capGrad.addColorStop(0, cfg.mushroomCapColor);
    capGrad.addColorStop(0.6, cfg.mushroomCapEdgeColor);
    capGrad.addColorStop(1, cfg.mushroomCapEdgeColor);
    ctx.fillStyle = capGrad;
    ctx.beginPath();
    ctx.ellipse(mx, capY, capR, capR * 0.45, 0, Math.PI, 0);
    ctx.fill();
  }
}
