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
 * Translucent AR Lens Decal:
 * - High-contrast vector checkmark (`✓`) / cross (`✖`) with dark contrast outline.
 * - Translucent tinted glassmorphism base that lets text, nutrition tables, and barcodes
 *   remain 100% readable directly behind the decal!
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

  // Auto-sized radius matching framed bounding box (clamped safely inside canvas)
  const r = Math.max(26, Math.min(78, targetRadius * scaleMultiplier));

  // 3D Perspective Homography Parameters:
  const pitchAngle = Math.max(-0.65, Math.min(0.65, anchorPitch));
  // Horizontal cylindrical compression factor
  const cylScaleX = 1.0 - 0.12 * curveNorm;

  // Translucent Theme Colors
  const accentColor = isSafe ? '#10b981' : '#ef4444';
  const rimHighlight = isSafe ? '#6ee7b7' : '#fca5a5';

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

  // 4. Conformal Surface Tangent Arcs (Visible on curved surfaces)
  const surfaceTangentArcs = useMemo(() => {
    if (curveNorm < 0.2) return [];
    const arcH = r * 0.32 * curveNorm;
    const l = cx - r * 1.35;
    const right = cx + r * 1.35;
    return [
      `M ${l} ${cy - r * 0.55} Q ${cx} ${cy - r * 0.55 + arcH} ${right} ${cy - r * 0.55}`,
      `M ${l} ${cy + r * 0.55} Q ${cx} ${cy + r * 0.55 + arcH} ${right} ${cy + r * 0.55}`,
    ];
  }, [cx, cy, r, curveNorm]);

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
        {/* 1. Subtle Perimeter Contact Shadow (Gentle depth without obscuring underlying text) */}
        <Oval
          rect={rect(cx - r * 1.02, cy - r * 0.96 + 4, r * 2.04, r * 1.92)}
          color="rgba(0, 0, 0, 0.22)"
          style="fill"
        />

        {/* 2. Conformal Surface Contour Arcs */}
        {surfaceTangentArcs.map((arcStr, i) => (
          <Path
            key={`tangent-${i}`}
            path={arcStr}
            color={accentColor}
            style="stroke"
            strokeWidth={1.8}
            opacity={0.65}
          />
        ))}

        {/* 3. Translucent AR Tinted Lens Fill (Lets underlying text and graphics remain 100% legible!) */}
        <Path path={outerRimPath} style="fill">
          <RadialGradient
            c={vec(cx - r * 0.2, cy - r * 0.2)}
            r={r * 1.25}
            colors={[
              isSafe ? 'rgba(52, 211, 153, 0.22)' : 'rgba(248, 113, 113, 0.22)',
              isSafe ? 'rgba(16, 185, 129, 0.34)' : 'rgba(239, 68, 68, 0.34)',
              isSafe ? 'rgba(5, 150, 105, 0.44)' : 'rgba(220, 38, 38, 0.44)',
            ]}
          />
        </Path>

        {/* 4. Outer Certification Rims (Crisp, High-Contrast Boundary) */}
        <Path
          path={outerRimPath}
          color={accentColor}
          style="stroke"
          strokeWidth={2.8}
          opacity={0.92}
        />
        <Path
          path={innerRimPath}
          color="rgba(255, 255, 255, 0.72)"
          style="stroke"
          strokeWidth={1.2}
        />

        {/* 5. Subtle Top Edge Bevel Gleam */}
        <Oval
          rect={rect(cx - r * 0.7, cy - r * 0.88, r * 1.4, r * 0.35)}
          style="fill"
        >
          <RadialGradient
            c={vec(cx, cy - r * 0.85)}
            r={r * 0.65}
            colors={['rgba(255, 255, 255, 0.30)', 'rgba(255, 255, 255, 0)']}
          />
        </Oval>

        {/* 6. High-Contrast Vector Sign: Dark Contrast Outline + Pure White Inlay */}
        {/* Stroke-only vector leaves >85% of the interior area clear for reading text! */}
        {isSafe ? (
          <Group>
            {/* Dark Contrast Outline (Ensures visibility on bright white paper) */}
            <Path
              path={checkPathStr}
              color="rgba(0, 0, 0, 0.75)"
              style="stroke"
              strokeWidth={6.5}
              strokeCap="round"
              strokeJoin="round"
            />
            {/* Pure White Inlay */}
            <Path
              path={checkPathStr}
              color="#ffffff"
              style="stroke"
              strokeWidth={4.8}
              strokeCap="round"
              strokeJoin="round"
            />
          </Group>
        ) : (
          <Group>
            {/* Dark Contrast Outline (Ensures visibility on bright white paper) */}
            <Path
              path={crossPaths.arm1}
              color="rgba(0, 0, 0, 0.75)"
              style="stroke"
              strokeWidth={6.5}
              strokeCap="round"
            />
            <Path
              path={crossPaths.arm2}
              color="rgba(0, 0, 0, 0.75)"
              style="stroke"
              strokeWidth={6.5}
              strokeCap="round"
            />
            {/* Pure White Inlay */}
            <Path
              path={crossPaths.arm1}
              color="#ffffff"
              style="stroke"
              strokeWidth={4.8}
              strokeCap="round"
            />
            <Path
              path={crossPaths.arm2}
              color="#ffffff"
              style="stroke"
              strokeWidth={4.8}
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
