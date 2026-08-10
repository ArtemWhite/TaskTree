import React, { useEffect, useRef } from 'react';
import type { StageConfig, RGBA } from '../../stages/types';
import { getInterpolatedConfig } from '../../stages/registry';
import { ProgressService } from '../../services/ProgressService';

let animTime = 0;

interface TreeVisualizerProps {
  viewFractionalStage: number;
  size: number;
  zoom?: number;
}

interface TreeLayout {
  cx: number;
  cy: number;
  groundY: number;
  trBaseW: number;
  trTopW: number;
  trTopY: number;
  trH: number;
  crownTop: number;
  crownH: number;
  maxHalfWidth: number;
  scaleFactor: number;
}

export const TreeVisualizer: React.FC<TreeVisualizerProps> = ({
  viewFractionalStage,
  size,
  zoom = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      animTime += 0.016;

      const dpr = window.devicePixelRatio || 1;
      const drawSize = size * zoom;
      const w = drawSize;
      const h = drawSize;

      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const cfg = getInterpolatedConfig(viewFractionalStage);
      const s = viewFractionalStage;

      const baseTrunkH = drawSize * (0.08 + cfg.trunkHeight * 0.20);
      const baseCrownH = drawSize * (0.12 + cfg.crownHeight * 0.42);
      const baseMaxW = drawSize * (0.10 + cfg.crownWidth * 0.38);

      const totalH = baseTrunkH + baseCrownH;
      const availableH = drawSize * 0.78;
      const scaleFactor = totalH > availableH ? availableH / totalH : 1;

      const trunkH = baseTrunkH * scaleFactor;
      const crownH = baseCrownH * scaleFactor;
      const maxHalfWidth = baseMaxW * scaleFactor;

      const groundY = drawSize * 0.85;
      const cx = drawSize * 0.5;

      const trBaseW = drawSize * (0.018 + cfg.trunkBaseWidth * 0.065) * scaleFactor;
      const trTopW = trBaseW * (0.35 + (1 - Math.min((cfg.canopyFrontPuffs + cfg.canopyBackPuffs) * 0.08, 0.6)) * 0.3);

      const trTopY = groundY - trunkH;
      const crownTop = trTopY - crownH;

      const layout: TreeLayout = {
        cx,
        cy: groundY - trunkH / 2,
        groundY,
        trBaseW,
        trTopW,
        trTopY,
        trH: trunkH,
        crownTop,
        crownH,
        maxHalfWidth,
        scaleFactor,
      };

      drawGlow(ctx, layout, cfg);
      drawGrass(ctx, layout, cfg, s, drawSize);
      drawMushrooms(ctx, layout, cfg, s, drawSize);
      drawTrunk(ctx, layout, cfg);
      drawBranches(ctx, layout, cfg, s);
      drawRoots(ctx, layout, cfg);
      drawFoliage(ctx, layout, cfg);
      drawFlowers(ctx, layout, cfg);
      drawFruits(ctx, layout, cfg);
      drawSparkles(ctx, layout, cfg);
      drawParticles(ctx, cfg, s, layout);

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [viewFractionalStage, size, zoom]);

  return <canvas ref={canvasRef} style={{ width: `${size * zoom}px`, height: `${size * zoom}px`, display: 'block' }} />;
};

function rgbaToString(c: RGBA, alphaMultiplier = 1): string {
  return `rgba(${c.r},${c.g},${c.b},${(c.a * alphaMultiplier).toFixed(2)})`;
}

function drawGlow(ctx: CanvasRenderingContext2D, L: TreeLayout, cfg: StageConfig) {
  if (cfg.glowOpacity <= 0) return;
  const radius = L.maxHalfWidth * 1.5 + cfg.glowOpacity * 20;
  const grad = ctx.createRadialGradient(L.cx, L.crownTop + L.crownH * 0.4, 0, L.cx, L.crownTop + L.crownH * 0.4, radius);
  const color = cfg.glowColor;

  grad.addColorStop(0, color);
  grad.addColorStop(0.5, color.replace(/[\d.]+\)$/, '0.12)'));
  grad.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(L.cx, L.crownTop + L.crownH * 0.4, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawTrunk(ctx: CanvasRenderingContext2D, L: TreeLayout, cfg: StageConfig) {
  const grad = ctx.createLinearGradient(L.cx - L.trBaseW, L.groundY, L.cx + L.trBaseW, L.groundY);
  grad.addColorStop(0, cfg.trunkColorDark);
  grad.addColorStop(0.35, cfg.trunkColor);
  grad.addColorStop(1, cfg.barkColor);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(L.cx - L.trBaseW / 2, L.groundY);
  ctx.bezierCurveTo(
    L.cx - L.trBaseW * 0.4, L.groundY - L.trH * 0.5,
    L.cx - L.trTopW * 0.6, L.trTopY + L.trH * 0.2,
    L.cx - L.trTopW / 2, L.trTopY
  );
  ctx.lineTo(L.cx + L.trTopW / 2, L.trTopY);
  ctx.bezierCurveTo(
    L.cx + L.trTopW * 0.6, L.trTopY + L.trH * 0.2,
    L.cx + L.trBaseW * 0.4, L.groundY - L.trH * 0.5,
    L.cx + L.trBaseW / 2, L.groundY
  );
  ctx.closePath();
  ctx.fill();
}

function drawBranches(ctx: CanvasRenderingContext2D, L: TreeLayout, cfg: StageConfig, s: number) {
  const count = cfg.branchCount;
  if (count <= 0) return;

  for (let i = 0; i < count; i++) {
    const seed = i * 137 + s * 31;
    const side = i % 2 === 0 ? -1 : 1;
    const heightFrac = 0.2 + (i / Math.max(count, 1)) * 0.65;
    const branchY = L.groundY - L.trH * heightFrac;
    const len = L.maxHalfWidth * (0.35 + ProgressService.pseudoRandom(seed) * 0.5);

    const startX = L.cx + side * (L.trTopW * 0.3);
    const endX = startX + side * len;
    const endY = branchY - L.trH * 0.15 - ProgressService.pseudoRandom(seed + 1) * L.trH * 0.1;

    const cpX = startX + side * len * 0.5;
    const cpY = branchY - L.trH * 0.05;

    ctx.strokeStyle = cfg.branchColor;
    ctx.lineWidth = Math.max(1, L.trTopW * 0.3 * (1 - heightFrac * 0.5));
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(startX, branchY);
    ctx.quadraticCurveTo(cpX, cpY, endX, endY);
    ctx.stroke();
  }
}

function drawRoots(ctx: CanvasRenderingContext2D, L: TreeLayout, cfg: StageConfig) {
  const count = Math.min(cfg.rootCount, 5);
  if (count <= 0) return;

  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const len = L.trBaseW * (0.8 + i * 0.4);
    const startX = L.cx + side * (L.trBaseW * 0.3);
    const endX = startX + side * len;
    const endY = L.groundY + len * 0.25;

    ctx.strokeStyle = cfg.rootColor;
    ctx.lineWidth = Math.max(1, L.trBaseW * 0.25);
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(startX, L.groundY);
    ctx.quadraticCurveTo(startX + side * len * 0.5, L.groundY + len * 0.1, endX, endY);
    ctx.stroke();
  }
}

function drawFoliage(ctx: CanvasRenderingContext2D, L: TreeLayout, cfg: StageConfig) {
  const count = cfg.canopyFrontPuffs + cfg.canopyBackPuffs;
  if (count <= 0) return;

  for (let i = 0; i < count; i++) {
    const angle = i * 2.399963;
    const distRatio = Math.sqrt(i / count);
    const rx = L.maxHalfWidth * distRatio;
    const ry = (L.crownH / 2) * distRatio;

    const px = L.cx + Math.cos(angle) * rx;
    const py = L.crownTop + L.crownH / 2 + Math.sin(angle) * ry;

    const leafR = Math.max(4, L.maxHalfWidth * (0.18 + (1 - distRatio) * 0.22));

    const colorIdx = i % 3;
    const c = colorIdx === 0 ? cfg.canopyFrontColor : colorIdx === 1 ? cfg.canopyBackColor : cfg.highlightColor;

    const grad = ctx.createRadialGradient(px - leafR * 0.3, py - leafR * 0.3, 0, px, py, leafR);
    grad.addColorStop(0, rgbaToString(c, 1));
    grad.addColorStop(0.7, rgbaToString(c, 0.85));
    grad.addColorStop(1, rgbaToString(c, 0.6));

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, leafR, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFlowers(ctx: CanvasRenderingContext2D, L: TreeLayout, cfg: StageConfig) {
  const count = cfg.flowerCount;
  if (count <= 0) return;

  const c1 = cfg.flowerColor;
  const c2 = cfg.flowerColorAlt;

  for (let i = 0; i < count; i++) {
    const angle = i * 2.1 + 0.5;
    const hFrac = 0.2 + (i / Math.max(count, 1)) * 0.6;
    const y = L.crownTop + hFrac * L.crownH;
    const dist = L.maxHalfWidth * (1 - hFrac * 0.8) * 0.6;
    const r = cfg.flowerRadius;

    const px = L.cx + Math.cos(angle) * dist;
    const py = y;
    const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
    const c = i % 2 === 0 ? c1 : c2;

    grad.addColorStop(0, rgbaToString(c, 1));
    grad.addColorStop(1, rgbaToString(c, 0));

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFruits(ctx: CanvasRenderingContext2D, L: TreeLayout, cfg: StageConfig) {
  const count = cfg.fruitCount;
  if (count <= 0) return;

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

    grad.addColorStop(0, rgbaToString(c, 1));
    grad.addColorStop(0.5, rgbaToString(c, 0.41));
    grad.addColorStop(1, rgbaToString(c, 0));

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSparkles(ctx: CanvasRenderingContext2D, L: TreeLayout, cfg: StageConfig) {
  const count = cfg.sparkleCount;
  if (count <= 0) return;

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

function drawParticles(ctx: CanvasRenderingContext2D, cfg: StageConfig, s: number, L: TreeLayout) {
  const count = cfg.particleCount;
  if (count <= 0) return;

  for (let i = 0; i < count; i++) {
    const seed = i * 199 + s * 47;
    const orbitAngle = ProgressService.pseudoRandom(seed) * Math.PI * 2;
    const orbitR = L.maxHalfWidth * (0.5 + ProgressService.pseudoRandom(seed + 31) * 1.1);
    const baseY = L.crownTop + ProgressService.pseudoRandom(seed + 67) * L.crownH * 1.2;

    const floatX = Math.cos(animTime * 0.7 + orbitAngle) * orbitR;
    const floatY = Math.sin(animTime * 0.9 + orbitAngle * 1.3) * L.crownH * 0.25;
    const px = L.cx + floatX;
    const py = baseY + floatY;

    const r = 0.8 + ProgressService.pseudoRandom(seed + 101) * 1.5;
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

function drawGrass(ctx: CanvasRenderingContext2D, L: TreeLayout, cfg: StageConfig, s: number, drawSize: number) {
  const bladeCount = cfg.grassCount;
  if (bladeCount <= 0) return;

  ctx.lineCap = 'round';

  for (let i = 0; i < bladeCount; i++) {
    const seed = i * 173 + s * 59;
    const side = i % 2 === 0 ? -1 : 1;
    const baseX = L.cx + side * L.trBaseW * (0.6 + ProgressService.pseudoRandom(seed) * 1.2);
    const bladeH = drawSize * 0.015 + ProgressService.pseudoRandom(seed + 13) * drawSize * 0.03;
    const lean = side * (0.15 + ProgressService.pseudoRandom(seed + 29) * 0.4);
    const sway = Math.sin(animTime * 2.5 + i * 1.3) * bladeH * 0.12;

    const tipX = baseX + lean * bladeH + sway;
    const tipY = L.groundY - bladeH;
    const cpX = baseX + lean * bladeH * 0.5 + sway * 0.5;
    const cpY = L.groundY - bladeH * 0.6;

    const bladeGrad = ctx.createLinearGradient(baseX, L.groundY, tipX, tipY);
    bladeGrad.addColorStop(0, cfg.grassColorBottom);
    bladeGrad.addColorStop(1, cfg.grassColorTop);

    ctx.strokeStyle = bladeGrad;
    ctx.lineWidth = 1 + ProgressService.pseudoRandom(seed + 41) * 0.8;
    ctx.beginPath();
    ctx.moveTo(baseX, L.groundY);
    ctx.quadraticCurveTo(cpX, cpY, tipX, tipY);
    ctx.stroke();
  }
}

function drawMushrooms(ctx: CanvasRenderingContext2D, L: TreeLayout, cfg: StageConfig, s: number, drawSize: number) {
  const count = cfg.mushroomCount;
  if (count <= 0) return;

  for (let i = 0; i < count; i++) {
    const seed = i * 251 + s * 83;
    const side = i % 2 === 0 ? -1 : 1;
    const mx = L.cx + side * L.trBaseW * (0.8 + ProgressService.pseudoRandom(seed) * 0.6);
    const my = L.groundY - 1;

    const stemH = drawSize * 0.015 + ProgressService.pseudoRandom(seed + 17) * drawSize * 0.018;
    const stemW = 1 + ProgressService.pseudoRandom(seed + 31) * 1;
    ctx.fillStyle = cfg.mushroomStemColor;
    ctx.beginPath();
    ctx.roundRect(mx - stemW / 2, my - stemH, stemW, stemH, stemW / 2);
    ctx.fill();

    const capR = stemW + 1.5 + ProgressService.pseudoRandom(seed + 47) * 2;
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
