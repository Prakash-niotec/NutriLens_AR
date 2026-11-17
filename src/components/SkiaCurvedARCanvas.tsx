import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Canvas,
  Path,
  LinearGradient,
  RadialGradient,
  vec,
  Group,
  Circle,
  Oval,
  rect,
} from '@shopify/react-native-skia';

export interface SkiaCurvedARCanvasProps {
  width: number;
  height: number;
  isScanning: boolean;
  scanProgress: number; // 0 to 1
  isLocked: boolean;
  isSafe: boolean;
  centerX: number;
  centerY: number;
  roll: number; // Roll angle in degrees
  pitch: number; // Pitch angle in radians
  boxWidth: number;
  boxHeight: number;
  curvaturePercent: number; // 0 to 100
  geometry: 'SPHERICAL' | 'CYLINDRICAL' | 'PLANAR';
  sizePreset: 'SMALL' | 'MEDIUM' | 'LARGE';
}

export const SkiaCurvedARCanvas: React.FC<SkiaCurvedARCanvasProps> = ({
  width,
  height,
  isScanning,
  scanProgress,
  isLocked,
  isSafe,
  centerX,
  centerY,
  roll,
  pitch,
  boxWidth,
  boxHeight,
  curvaturePercent,
  geometry,
  sizePreset,
}) => {
  const curveNorm = Math.min(1, Math.max(0, curvaturePercent / 100));

  // Stamp Colors (Realistic pigment / seal stamp)
  const stampColor = isSafe ? '#10b981' : '#ef4444';
  const stampDarkColor = isSafe ? '#065f46' : '#991b1b';
  const stampLightColor = isSafe ? '#6ee7b7' : '#fca5a5';
  const hudColor = isScanning ? '#06b6d4' : '#38bdf8';

  // Physical decal sizing (compact and proportional to target item)
  const baseRadius = sizePreset === 'SMALL' ? 38 : sizePreset === 'MEDIUM' ? 46 : 56;

  // 3D Perspective Foreshortening based on camera pitch (viewing angle)
  // Looking at a horizontal surface at 45 degrees foreshortens height by ~0.78
  const foreshortenFactor = Math.max(0.68, Math.min(0.96, Math.abs(Math.sin(pitch || 0.8))));
  const decalRadiusY = baseRadius * foreshortenFactor;
  // Cylindrical/spherical horizontal compression
  const decalRadiusX = baseRadius * (1 - 0.14 * curveNorm);

  // Reticle framing dimensions for aiming mode
  const halfW = boxWidth / 2;
  const halfH = boxHeight / 2;
  const left = centerX - halfW;
  const right = centerX + halfW;
  const top = centerY - halfH;
  const bottom = centerY + halfH;

  // 1. Curved Checkmark `✓` Path (Curved along the surface geometry)
  const curvedCheckPathStr = useMemo(() => {
    const p1 = { x: centerX - decalRadiusX * 0.52, y: centerY + decalRadiusY * 0.05 };
    const p2 = { x: centerX - decalRadiusX * 0.12, y: centerY + decalRadiusY * 0.48 };
    const p3 = { x: centerX + decalRadiusX * 0.56, y: centerY - decalRadiusY * 0.42 };

    const sagitta = 10 * curveNorm;

    // Short stroke (p1 -> p2)
    const cp1x = (p1.x + p2.x) / 2 - sagitta * 0.3;
    const cp1y = (p1.y + p2.y) / 2 + sagitta * 0.5;

    // Long stroke (p2 -> p3) with continuous curvature
    const cp2x = (p2.x + p3.x) / 2 + sagitta * 0.4;
    const cp2y = (p2.y + p3.y) / 2 - sagitta * 0.7;

    return `M ${p1.x} ${p1.y} Q ${cp1x} ${cp1y} ${p2.x} ${p2.y} Q ${cp2x} ${cp2y} ${p3.x} ${p3.y}`;
  }, [centerX, centerY, decalRadiusX, decalRadiusY, curveNorm]);

  // 2. Curved Cross `✖` Paths (Curved along the surface geometry)
  const curvedCrossPaths = useMemo(() => {
    const armX = decalRadiusX * 0.48;
    const armY = decalRadiusY * 0.48;
    const sagitta = 8 * curveNorm;

    const arm1 = `M ${centerX - armX} ${centerY - armY} Q ${centerX + sagitta} ${centerY - sagitta * 0.4} ${centerX + armX} ${centerY + armY}`;
    const arm2 = `M ${centerX + armX} ${centerY - armY} Q ${centerX - sagitta} ${centerY - sagitta * 0.4} ${centerX - armX} ${centerY + armY}`;

    return { arm1, arm2 };
  }, [centerX, centerY, decalRadiusX, decalRadiusY, curveNorm]);

  // 3. Stamped Serrated / Grooved Seal Rim
  const stampRingPath = useMemo(() => {
    const rx = decalRadiusX;
    const ry = decalRadiusY;
    return `M ${centerX - rx} ${centerY} A ${rx} ${ry} 0 1 0 ${centerX + rx} ${centerY} A ${rx} ${ry} 0 1 0 ${centerX - rx} ${centerY} Z`;
  }, [centerX, centerY, decalRadiusX, decalRadiusY]);

  const innerRingPath = useMemo(() => {
    const rx = decalRadiusX * 0.88;
    const ry = decalRadiusY * 0.88;
    return `M ${centerX - rx} ${centerY} A ${rx} ${ry} 0 1 0 ${centerX + rx} ${centerY} A ${rx} ${ry} 0 1 0 ${centerX - rx} ${centerY} Z`;
  }, [centerX, centerY, decalRadiusX, decalRadiusY]);

  // 4. Subtle Surface Conformal Contours (Only right under the sticker)
  const surfaceAdhesionArcs = useMemo(() => {
    if (!isLocked || curveNorm < 0.2) return [];
    const arcH = decalRadiusY * 0.35 * curveNorm;
    const l = centerX - decalRadiusX * 1.35;
    const r = centerX + decalRadiusX * 1.35;

    return [
      `M ${l} ${centerY - decalRadiusY * 0.5} Q ${centerX} ${centerY - decalRadiusY * 0.5 + arcH} ${r} ${centerY - decalRadiusY * 0.5}`,
      `M ${l} ${centerY + decalRadiusY * 0.5} Q ${centerX} ${centerY + decalRadiusY * 0.5 + arcH} ${r} ${centerY + decalRadiusY * 0.5}`,
    ];
  }, [centerX, centerY, decalRadiusX, decalRadiusY, isLocked, curveNorm]);

  // 5. Aiming Reticle (Clean & Minimalist during framing)
  const cornerBrackets = useMemo(() => {
    const len = 28;
    return {
      tl: `M ${left} ${top + len} L ${left} ${top} L ${left + len} ${top}`,
      tr: `M ${right - len} ${top} L ${right} ${top} L ${right} ${top + len}`,
      bl: `M ${left} ${bottom - len} L ${left} ${bottom} L ${left + len} ${bottom}`,
      br: `M ${right - len} ${bottom} L ${right} ${bottom} L ${right} ${bottom - len}`,
    };
  }, [left, right, top, bottom]);

  // 6. Sweeping Laser Arc (During Scan)
  const laserPathStr = useMemo(() => {
    if (!isScanning) return '';
    const currentY = centerY - halfH + scanProgress * boxHeight;
    const arcDeflection = halfH * 0.25 * curveNorm;
    return `M ${left} ${currentY} Q ${centerX} ${currentY + arcDeflection} ${right} ${currentY}`;
  }, [isScanning, centerX, centerY, halfH, scanProgress, boxHeight, left, right, curveNorm]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={{ width, height }}>
        {/* ============================================================== */}
        {/*  PHYSICAL AR DECAL / INSPECTION STAMP (WHEN LOCKED)            */}
        {/* ============================================================== */}
        {isLocked && (
          <Group
            origin={vec(centerX, centerY)}
            transform={[{ rotate: (roll * Math.PI) / 180 }]}
          >
            {/* 1. Surface Contact Drop Shadow (Physical Depth on Material) */}
            <Oval
              rect={rect(
                centerX - decalRadiusX * 1.05,
                centerY - decalRadiusY * 0.95 + 6,
                decalRadiusX * 2.1,
                decalRadiusY * 1.9
              )}
              color="rgba(0, 0, 0, 0.42)"
              style="fill"
            />

            {/* 2. Surface Conformal Curve Arcs (Hugging physical geometry) */}
            {surfaceAdhesionArcs.map((arcStr, i) => (
              <Path
                key={`adh-${i}`}
                path={arcStr}
                color={stampColor}
                style="stroke"
                strokeWidth={1.5}
                opacity={0.4}
              />
            ))}

            {/* 3. Translucent Decal Resin Base (Lets underlying material show through) */}
            <Path path={stampRingPath} style="fill">
              <RadialGradient
                c={vec(centerX - decalRadiusX * 0.35, centerY - decalRadiusY * 0.35)}
                r={decalRadiusX * 1.3}
                colors={[
                  isSafe ? 'rgba(52, 211, 153, 0.92)' : 'rgba(248, 113, 113, 0.92)',
                  isSafe ? 'rgba(5, 150, 105, 0.88)' : 'rgba(220, 38, 38, 0.88)',
                  isSafe ? 'rgba(4, 120, 87, 0.95)' : 'rgba(185, 28, 28, 0.95)',
                ]}
              />
            </Path>

            {/* 4. Outer Stamped Certification Rim (Embossed Grooved Seal) */}
            <Path
              path={stampRingPath}
              color={stampLightColor}
              style="stroke"
              strokeWidth={3}
              opacity={0.9}
            />
            <Path
              path={innerRingPath}
              color="rgba(255, 255, 255, 0.55)"
              style="stroke"
              strokeWidth={1.2}
            />

            {/* 5. Top Specular Glaze (Curved Adhesive Surface Reflection) */}
            <Oval
              rect={rect(
                centerX - decalRadiusX * 0.7,
                centerY - decalRadiusY * 0.8,
                decalRadiusX * 1.4,
                decalRadiusY * 0.7
              )}
              style="fill"
            >
              <LinearGradient
                start={vec(centerX, centerY - decalRadiusY * 0.8)}
                end={vec(centerX, centerY)}
                colors={['rgba(255, 255, 255, 0.65)', 'rgba(255, 255, 255, 0)']}
              />
            </Oval>

            {/* 6. Physical Stamped Vector Sign: Curved `✓` or `✖` */}
            {isSafe ? (
              <Group>
                {/* Stamp Impression Depressed Shadow */}
                <Path
                  path={curvedCheckPathStr}
                  color={stampDarkColor}
                  style="stroke"
                  strokeWidth={6.5}
                  strokeCap="round"
                  strokeJoin="round"
                />
                {/* White Pigment Inlay */}
                <Path
                  path={curvedCheckPathStr}
                  color="#ffffff"
                  style="stroke"
                  strokeWidth={5}
                  strokeCap="round"
                  strokeJoin="round"
                />
              </Group>
            ) : (
              <Group>
                {/* Stamp Impression Depressed Shadow */}
                <Path
                  path={curvedCrossPaths.arm1}
                  color={stampDarkColor}
                  style="stroke"
                  strokeWidth={6.5}
                  strokeCap="round"
                />
                <Path
                  path={curvedCrossPaths.arm2}
                  color={stampDarkColor}
                  style="stroke"
                  strokeWidth={6.5}
                  strokeCap="round"
                />
                {/* White Pigment Inlay */}
                <Path
                  path={curvedCrossPaths.arm1}
                  color="#ffffff"
                  style="stroke"
                  strokeWidth={5}
                  strokeCap="round"
                />
                <Path
                  path={curvedCrossPaths.arm2}
                  color="#ffffff"
                  style="stroke"
                  strokeWidth={5}
                  strokeCap="round"
                />
              </Group>
            )}

            {/* 7. Bottom Rim Contact Shadow */}
            <Oval
              rect={rect(
                centerX - decalRadiusX * 0.8,
                centerY + decalRadiusY * 0.65,
                decalRadiusX * 1.6,
                decalRadiusY * 0.25
              )}
              style="fill"
            >
              <LinearGradient
                start={vec(centerX, centerY + decalRadiusY * 0.65)}
                end={vec(centerX, centerY + decalRadiusY * 0.9)}
                colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.45)']}
              />
            </Oval>
          </Group>
        )}

        {/* ============================================================== */}
        {/*  AIMING HUD RETICLE & LASER (ONLY WHEN UNLOCKED OR SCANNING)   */}
        {/* ============================================================== */}
        {!isLocked && (
          <Group>
            {/* Center Aim Target */}
            <Circle c={vec(centerX, centerY)} r={4} color={hudColor} style="fill" />
            <Circle
              c={vec(centerX, centerY)}
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
          </Group>
        )}

        {/* Scanning Laser Arc (Only while scan is actively firing) */}
        {isScanning && laserPathStr !== '' && (
          <Group>
            <Path path={laserPathStr} color="rgba(6, 182, 212, 0.5)" style="stroke" strokeWidth={7} />
            <Path path={laserPathStr} color="#38bdf8" style="stroke" strokeWidth={2.5} />
          </Group>
        )}
      </Canvas>
    </View>
  );
};
