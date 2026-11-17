import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Canvas,
  Path,
  RadialGradient,
  vec,
  Group,
  Circle,
  Oval,
  rect,
} from '@shopify/react-native-skia';

/**
 * 1. SKIA DECAL STAMP (200 x 200 px)
 * Professional Translucent AR Inspection Lens:
 * - Color-matched luminous translucent vector glyphs (Emerald `✓` / Ruby `✖`).
 * - Sleek glassmorphism concentric rims with zero stray whisker lines.
 * - 100% background legibility for nutrition labels, ingredients, and barcodes.
 * - 3D Projective Homography Matrix (Perspective + Cylindrical foreshortening).
 */
export interface SkiaDecalStampProps {
  isSafe: boolean;
  curvaturePercent: number; // 0 to 100
  targetRadius?: number; // Base radius directly matching framed reticle
  scaleMultiplier?: number; // 0.5 to 2.0 (default 1.0)
  anchorPitch?: number; // Radians of pitch tilt for 3D projective homography
}

export const SkiaDecalStamp: React.FC<SkiaDecalStampProps> = ({
  isSafe,
  curvaturePercent,
  targetRadius = 46,
  scaleMultiplier = 1.0,
  anchorPitch = 0.42,
}) => {
  const curveNorm = Math.min(1, Math.max(0, curvaturePercent / 100));

  // Canvas dimensions: 200x200, centered at (100, 100)
  const cx = 100;
  const cy = 100;

  // Proportional radius directly matching the framed reticle (clamped safely inside canvas)
  const effectiveRadius = targetRadius ?? (48 * scaleMultiplier);
  const r = Math.max(32, Math.min(84, effectiveRadius));

  // 3D Perspective Homography Parameters:
  const pitchAngle = Math.max(-0.65, Math.min(0.65, anchorPitch));
  // Horizontal cylindrical compression factor
  const cylScaleX = 1.0 - 0.12 * curveNorm;

  // Luminous Translucent Theme Colors
  const accentColor = isSafe ? '#10b981' : '#ef4444';
  const glowColor = isSafe ? 'rgba(16, 185, 129, 0.38)' : 'rgba(239, 68, 68, 0.38)';
  const glyphStrokeColor = isSafe ? 'rgba(52, 211, 153, 0.92)' : 'rgba(248, 113, 113, 0.92)';
  const innerRimColor = isSafe ? 'rgba(110, 231, 183, 0.55)' : 'rgba(252, 165, 165, 0.55)';

  // 1. Curved Checkmark `✓` Path
  const checkPathStr = useMemo(() => {
    const p1 = { x: cx - r * 0.48, y: cy + r * 0.04 };
    const p2 = { x: cx - r * 0.12, y: cy + r * 0.46 };
    const p3 = { x: cx + r * 0.52, y: cy - r * 0.42 };
    const sagitta = 8 * curveNorm;

    const cp1x = (p1.x + p2.x) / 2 - sagitta * 0.25;
    const cp1y = (p1.y + p2.y) / 2 + sagitta * 0.4;
    const cp2x = (p2.x + p3.x) / 2 + sagitta * 0.35;
    const cp2y = (p2.y + p3.y) / 2 - sagitta * 0.6;

    return `M ${p1.x} ${p1.y} Q ${cp1x} ${cp1y} ${p2.x} ${p2.y} Q ${cp2x} ${cp2y} ${p3.x} ${p3.y}`;
  }, [cx, cy, r, curveNorm]);

  // 2. Curved Cross `✖` Paths
  const crossPaths = useMemo(() => {
    const arm = r * 0.44;
    const sagitta = 7 * curveNorm;
    const arm1 = `M ${cx - arm} ${cy - arm} Q ${cx + sagitta} ${cy - sagitta * 0.3} ${cx + arm} ${cy + arm}`;
    const arm2 = `M ${cx + arm} ${cy - arm} Q ${cx - sagitta} ${cy - sagitta * 0.3} ${cx - arm} ${cy + arm}`;
    return { arm1, arm2 };
  }, [cx, cy, r, curveNorm]);

  // 3. Circular Stamp Rims
  const outerRimPath = useMemo(() => {
    return `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
  }, [cx, cy, r]);

  const innerRimPath = useMemo(() => {
    const ir = r * 0.88;
    return `M ${cx - ir} ${cy} A ${ir} ${ir} 0 1 0 ${cx + ir} ${cy} A ${ir} ${ir} 0 1 0 ${cx - ir} ${cy} Z`;
  }, [cx, cy, r]);

  return (
    <Canvas style={{ width: 200, height: 200 }}>
      {/* 3D Projective Homography Group: Perspective keystoning + cylindrical scale */}
      <Group
        origin={vec(cx, cy)}
        transform={[
          { perspective: 450 },
          { rotateX: pitchAngle },
          { scaleX: cylScaleX },
        ]}
      >
        {/* 1. Soft Perimeter Contact Shadow (Subtle optical grounding) */}
        <Oval
          rect={rect(cx - r * 1.02, cy - r * 0.96 + 3, r * 2.04, r * 1.92)}
          color="rgba(0, 0, 0, 0.18)"
          style="fill"
        />

        {/* 2. Translucent Glassmorphism AR Lens Fill */}
        <Path path={outerRimPath} style="fill">
          <RadialGradient
            c={vec(cx - r * 0.2, cy - r * 0.2)}
            r={r * 1.25}
            colors={[
              isSafe ? 'rgba(52, 211, 153, 0.16)' : 'rgba(248, 113, 113, 0.16)',
              isSafe ? 'rgba(16, 185, 129, 0.26)' : 'rgba(239, 68, 68, 0.26)',
              isSafe ? 'rgba(5, 150, 105, 0.38)' : 'rgba(220, 38, 38, 0.38)',
            ]}
          />
        </Path>

        {/* 3. Dual Concentric Lens Rims */}
        <Path
          path={outerRimPath}
          color={accentColor}
          style="stroke"
          strokeWidth={2.2}
          opacity={0.88}
        />
        <Path
          path={innerRimPath}
          color={innerRimColor}
          style="stroke"
          strokeWidth={1.0}
        />

        {/* 4. Subtle Top Edge Bevel Gleam */}
        <Oval
          rect={rect(cx - r * 0.65, cy - r * 0.86, r * 1.3, r * 0.32)}
          style="fill"
        >
          <RadialGradient
            c={vec(cx, cy - r * 0.85)}
            r={r * 0.65}
            colors={['rgba(255, 255, 255, 0.24)', 'rgba(255, 255, 255, 0)']}
          />
        </Oval>

        {/* 5. Professional Translucent Vector Signs (Emerald `✓` / Ruby `✖`) */}
        {/* Color-matched translucent glow + crisp luminous core */}
        {isSafe ? (
          <Group>
            {/* Soft Ambient Glow */}
            <Path
              path={checkPathStr}
              color={glowColor}
              style="stroke"
              strokeWidth={6.2}
              strokeCap="round"
              strokeJoin="round"
            />
            {/* Luminous Translucent Core Stroke */}
            <Path
              path={checkPathStr}
              color={glyphStrokeColor}
              style="stroke"
              strokeWidth={3.6}
              strokeCap="round"
              strokeJoin="round"
            />
          </Group>
        ) : (
          <Group>
            {/* Soft Ambient Glow */}
            <Path
              path={crossPaths.arm1}
              color={glowColor}
              style="stroke"
              strokeWidth={6.2}
              strokeCap="round"
            />
            <Path
              path={crossPaths.arm2}
              color={glowColor}
              style="stroke"
              strokeWidth={6.2}
              strokeCap="round"
            />
            {/* Luminous Translucent Core Stroke */}
            <Path
              path={crossPaths.arm1}
              color={glyphStrokeColor}
              style="stroke"
              strokeWidth={3.6}
              strokeCap="round"
            />
            <Path
              path={crossPaths.arm2}
              color={glyphStrokeColor}
              style="stroke"
              strokeWidth={3.6}
              strokeCap="round"
            />
          </Group>
        )}
      </Group>
    </Canvas>
  );
};

/**
 * 2. SKIA AIMING RETICLE & LASER SCANNER
 * Full-screen HUD layer for object framing and rapid laser sweep.
 */
export interface SkiaAimingReticleProps {
  width: number;
  height: number;
  isScanning: boolean;
  scanProgress: number; // 0 to 1
  boxWidth: number;
  boxHeight: number;
  curvaturePercent: number;
}

export const SkiaAimingReticle: React.FC<SkiaAimingReticleProps> = ({
  width,
  height,
  isScanning,
  scanProgress,
  boxWidth,
  boxHeight,
  curvaturePercent,
}) => {
  const cx = width / 2;
  const cy = height / 2;
  const curveNorm = Math.min(1, Math.max(0, curvaturePercent / 100));

  const hudColor = isScanning ? '#06b6d4' : '#38bdf8';
  const halfW = boxWidth / 2;
  const halfH = boxHeight / 2;
  const left = cx - halfW;
  const right = cx + halfW;
  const top = cy - halfH;
  const bottom = cy + halfH;

  // 4 Corner Brackets
  const cornerBrackets = useMemo(() => {
    const len = 28;
    return {
      tl: `M ${left} ${top + len} L ${left} ${top} L ${left + len} ${top}`,
      tr: `M ${right - len} ${top} L ${right} ${top} L ${right} ${top + len}`,
      bl: `M ${left} ${bottom - len} L ${left} ${bottom} L ${left + len} ${bottom}`,
      br: `M ${right - len} ${bottom} L ${right} ${bottom} L ${right} ${bottom - len}`,
    };
  }, [left, right, top, bottom]);

  // Sweeping Laser Arc
  const laserPathStr = useMemo(() => {
    if (!isScanning) return '';
    const currentY = top + scanProgress * boxHeight;
    const arcDeflection = halfH * 0.25 * curveNorm;
    return `M ${left} ${currentY} Q ${cx} ${currentY + arcDeflection} ${right} ${currentY}`;
  }, [isScanning, cx, top, scanProgress, boxHeight, left, right, halfH, curveNorm]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={{ width, height }}>
        {/* Center Aim Target */}
        <Circle c={vec(cx, cy)} r={4} color={hudColor} style="fill" />
        <Circle
          c={vec(cx, cy)}
          r={14}
          color={hudColor}
          style="stroke"
          strokeWidth={1.5}
          opacity={0.65}
        />

        {/* 4 Framing Corner Brackets */}
        <Path path={cornerBrackets.tl} color={hudColor} style="stroke" strokeWidth={3} strokeCap="round" />
        <Path path={cornerBrackets.tr} color={hudColor} style="stroke" strokeWidth={3} strokeCap="round" />
        <Path path={cornerBrackets.bl} color={hudColor} style="stroke" strokeWidth={3} strokeCap="round" />
        <Path path={cornerBrackets.br} color={hudColor} style="stroke" strokeWidth={3} strokeCap="round" />

        {/* Rapid Laser Arc (When scanning actively) */}
        {isScanning && laserPathStr !== '' && (
          <Group>
            <Path path={laserPathStr} color="rgba(6, 182, 212, 0.45)" style="stroke" strokeWidth={6} />
            <Path path={laserPathStr} color="#38bdf8" style="stroke" strokeWidth={2.5} />
          </Group>
        )}
      </Canvas>
    </View>
  );
};
