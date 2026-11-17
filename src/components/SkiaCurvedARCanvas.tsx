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
 * 1. SKIA DECAL STAMP (170 x 170 px)
 * 100% Solid, High-Contrast Physical Inspection Stamp.
 * Rendered on GPU with 3D Projective Homography Matrix (Perspective + Foreshortening).
 */
export interface SkiaDecalStampProps {
  isSafe: boolean;
  curvaturePercent: number; // 0 to 100
  scaleMultiplier?: number; // 0.5 to 2.0 (default 1.0)
  relativePitch?: number; // Radians of pitch tilt for 3D projective homography
}

export const SkiaDecalStamp: React.FC<SkiaDecalStampProps> = ({
  isSafe,
  curvaturePercent,
  scaleMultiplier = 1.0,
  relativePitch = 0.35,
}) => {
  const curveNorm = Math.min(1, Math.max(0, curvaturePercent / 100));

  // Canvas dimensions: 170x170, centered at (85, 85)
  const cx = 85;
  const cy = 85;

  // Base decal radius scaled dynamically
  const r = 44 * Math.max(0.5, Math.min(1.8, scaleMultiplier));

  // 3D Perspective Homography Parameters:
  // Clamped pitch tilt in radians (avoids singularity / extreme inversion)
  const pitchAngle = Math.max(-0.72, Math.min(0.72, relativePitch));
  // Horizontal cylindrical compression factor
  const cylScaleX = 1.0 - 0.14 * curveNorm;

  // Solid, 100% Opaque Colors (Reduced transparency for high contrast & punchy look)
  const baseColor = isSafe ? '#10b981' : '#ef4444';
  const darkColor = isSafe ? '#064e3b' : '#7f1d1d';
  const midColor = isSafe ? '#059669' : '#dc2626';
  const lightColor = isSafe ? '#6ee7b7' : '#fca5a5';

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
    <Canvas style={{ width: 170, height: 170 }}>
      {/* 3D Projective Homography Group: Perspective keystoning + cylindrical scale */}
      <Group
        origin={vec(cx, cy)}
        transform={[
          { perspective: 420 },
          { rotateX: pitchAngle },
          { scaleX: cylScaleX },
        ]}
      >
        {/* 1. Surface Contact Drop Shadow (Physical Depth on Real Object) */}
        <Oval
          rect={rect(cx - r * 1.05, cy - r * 0.95 + 6, r * 2.1, r * 1.9)}
          color="rgba(0, 0, 0, 0.48)"
          style="fill"
        />

        {/* 2. Conformal Surface Contour Arcs */}
        {surfaceTangentArcs.map((arcStr, i) => (
          <Path
            key={`tangent-${i}`}
            path={arcStr}
            color={baseColor}
            style="stroke"
            strokeWidth={1.8}
            opacity={0.65}
          />
        ))}

        {/* 3. 100% Solid Opaque Decal Base (No see-through transparency!) */}
        <Path path={outerRimPath} style="fill">
          <RadialGradient
            c={vec(cx - r * 0.3, cy - r * 0.3)}
            r={r * 1.25}
            colors={[baseColor, midColor, darkColor]}
          />
        </Path>

        {/* 4. Outer Stamped Certification Rim (Crisp, Embossed Boundary) */}
        <Path
          path={outerRimPath}
          color={darkColor}
          style="stroke"
          strokeWidth={3.5}
        />
        <Path
          path={outerRimPath}
          color={lightColor}
          style="stroke"
          strokeWidth={1.5}
        />
        <Path
          path={innerRimPath}
          color="rgba(255, 255, 255, 0.4)"
          style="stroke"
          strokeWidth={1.2}
        />

        {/* 5. Subtle Top Rim Bevel Highlight (No milky film over the center!) */}
        <Oval
          rect={rect(cx - r * 0.75, cy - r * 0.9, r * 1.5, r * 0.45)}
          style="fill"
        >
          <RadialGradient
            c={vec(cx, cy - r * 0.85)}
            r={r * 0.65}
            colors={['rgba(255, 255, 255, 0.35)', 'rgba(255, 255, 255, 0)']}
          />
        </Oval>

        {/* 6. Solid Pure White Stamped Vector Sign: Curved `✓` or `✖` */}
        {isSafe ? (
          <Group>
            {/* Embossed Drop Shadow for 3D Inlay Depth */}
            <Path
              path={checkPathStr}
              color={darkColor}
              style="stroke"
              strokeWidth={7.5}
              strokeCap="round"
              strokeJoin="round"
            />
            {/* 100% Solid Pure White Pigment Inlay */}
            <Path
              path={checkPathStr}
              color="#ffffff"
              style="stroke"
              strokeWidth={5.5}
              strokeCap="round"
              strokeJoin="round"
            />
          </Group>
        ) : (
          <Group>
            {/* Embossed Drop Shadow for 3D Inlay Depth */}
            <Path
              path={crossPaths.arm1}
              color={darkColor}
              style="stroke"
              strokeWidth={7.5}
              strokeCap="round"
            />
            <Path
              path={crossPaths.arm2}
              color={darkColor}
              style="stroke"
              strokeWidth={7.5}
              strokeCap="round"
            />
            {/* 100% Solid Pure White Pigment Inlay */}
            <Path
              path={crossPaths.arm1}
              color="#ffffff"
              style="stroke"
              strokeWidth={5.5}
              strokeCap="round"
            />
            <Path
              path={crossPaths.arm2}
              color="#ffffff"
              style="stroke"
              strokeWidth={5.5}
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
