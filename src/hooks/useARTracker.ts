import { useRef, useState, useCallback, useEffect } from 'react';
import { Animated } from 'react-native';
import { DeviceMotion, DeviceMotionMeasurement } from 'expo-sensors';
import { FoodDetectionResult, SurfaceGeometry } from '../types';

export type SizePreset = 'SMALL' | 'MEDIUM' | 'LARGE';

export interface ARAnchorState {
  target: FoodDetectionResult | null;
  isLocked: boolean;
  isTracking: boolean;
  surfaceGeometry: SurfaceGeometry;
  curvaturePercent: number; // 0 (Flat) to 100 (Deep Curve)
  sizePreset: SizePreset;
  scaleMultiplier: number; // 0.5 to 2.0 (e.g. 1.0 = 100%)
  centerConfirmed: { x: number; y: number };
}

export const SIZE_PRESETS: Record<SizePreset, { scale: number; widthPct: number; heightPct: number; label: string }> = {
  SMALL: { scale: 0.8, widthPct: 30, heightPct: 30, label: 'Small (Fruit / Adapter)' },
  MEDIUM: { scale: 1.15, widthPct: 44, heightPct: 52, label: 'Medium (Can / Bottle / Pack)' },
  LARGE: { scale: 1.5, widthPct: 62, heightPct: 58, label: 'Large (Nutrition Table / Box)' },
};

function normalizeAngle(rad: number): number {
  let a = rad % (2 * Math.PI);
  if (a > Math.PI) a -= 2 * Math.PI;
  if (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

export function useARTracker() {
  const [anchorState, setAnchorState] = useState<ARAnchorState>({
    target: null,
    isLocked: false,
    isTracking: false,
    surfaceGeometry: 'SPHERICAL',
    curvaturePercent: 75,
    sizePreset: 'SMALL',
    scaleMultiplier: 0.85,
    centerConfirmed: { x: 50, y: 50 },
  });

  // Native animated values for 60-120 FPS zero-lag hardware translation
  const panAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const rollAnim = useRef(new Animated.Value(0)).current;

  // Viewport dimensions reference for calibrated FOV projection
  const viewportSizeRef = useRef<{ width: number; height: number }>({ width: 390, height: 750 });

  // Inertial sensor references for world-space anchoring
  const currentRotationRef = useRef<{ alpha: number; beta: number; gamma: number }>({
    alpha: 0,
    beta: 0,
    gamma: 0,
  });
  const anchorRotationRef = useRef<{ alpha: number; beta: number; gamma: number } | null>(null);
  const currentOffsetRef = useRef<{ x: number; y: number; roll: number }>({ x: 0, y: 0, roll: 0 });

  // Pulsing animation for aiming reticle
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  // Set viewport dimensions
  const setViewportSize = useCallback((width: number, height: number) => {
    if (width > 0 && height > 0) {
      viewportSizeRef.current = { width, height };
    }
  }, []);

  // Subscribe to DeviceMotion sensor (Bosch Gyro + Qualcomm Rotation Vector)
  useEffect(() => {
    let sub: { remove: () => void } | null = null;

    const initMotion = async () => {
      try {
        const isAvailable = await DeviceMotion.isAvailableAsync();
        if (isAvailable) {
          DeviceMotion.setUpdateInterval(16); // 60 FPS update rate

          sub = DeviceMotion.addListener((data: DeviceMotionMeasurement) => {
            if (data.rotation) {
              const { alpha, beta, gamma } = data.rotation;
              currentRotationRef.current = { alpha, beta, gamma };

              // If locked onto an object, compensate for camera movement to keep the decal anchored in world space
              if (anchorRotationRef.current) {
                const anchor = anchorRotationRef.current;

                // Angular difference from the locked moment
                const dYaw = normalizeAngle(alpha - anchor.alpha);
                const dPitch = beta - anchor.beta;
                const dRoll = gamma - anchor.gamma;

                // Calibrated optical projection for portrait mode:
                // Horizontal FOV in portrait is ~42 deg -> factor = 1.35 * viewportWidth
                // Vertical FOV in portrait is ~62 deg -> factor = 0.95 * viewportHeight
                const targetX = -Math.sin(dYaw) * (viewportSizeRef.current.width * 1.35);
                const targetY = Math.sin(dPitch) * (viewportSizeRef.current.height * 0.95);
                const targetRollDeg = -dRoll * (180 / Math.PI);

                // Adaptive 1-Euro responsiveness filter:
                // When moving (> 0.8px): responsiveness = 0.96 (virtually 1.0 = INSTANT 1:1 camera lock, zero latency!)
                // When stationary (< 0.8px): responsiveness = 0.70 to eliminate micro sensor noise/tremor
                const dx = targetX - currentOffsetRef.current.x;
                const dy = targetY - currentOffsetRef.current.y;
                const dist = Math.hypot(dx, dy);
                const alphaSpeed = dist > 0.8 ? 0.96 : 0.72;

                currentOffsetRef.current.x += dx * alphaSpeed;
                currentOffsetRef.current.y += dy * alphaSpeed;
                currentOffsetRef.current.roll += (targetRollDeg - currentOffsetRef.current.roll) * alphaSpeed;

                // Update native driver directly without React state re-rendering (Zero-lag 60-120 FPS!)
                panAnim.setValue({
                  x: currentOffsetRef.current.x,
                  y: currentOffsetRef.current.y,
                });
                rollAnim.setValue(currentOffsetRef.current.roll);
              }
            }
          });
        }
      } catch (err) {
        console.warn('DeviceMotion subscription failed:', err);
      }
    };

    initMotion();

    return () => {
      if (sub) sub.remove();
    };
  }, [panAnim, rollAnim]);

  /**
   * Set Object Size Preset (Small / Medium / Large).
   */
  const setSizePreset = useCallback((preset: SizePreset) => {
    const dimensions = SIZE_PRESETS[preset];
    setAnchorState((prev) => ({
      ...prev,
      sizePreset: preset,
      scaleMultiplier: dimensions.scale,
    }));
  }, []);

  /**
   * Set or increment live scale multiplier (e.g. 0.5 to 2.0).
   */
  const setScaleMultiplier = useCallback((scale: number) => {
    const clamped = Math.max(0.5, Math.min(2.0, Number(scale.toFixed(2))));
    setAnchorState((prev) => ({
      ...prev,
      scaleMultiplier: clamped,
    }));
  }, []);

  const adjustScale = useCallback((delta: number) => {
    setAnchorState((prev) => {
      const next = Math.max(0.5, Math.min(2.0, Number((prev.scaleMultiplier + delta).toFixed(2))));
      return {
        ...prev,
        scaleMultiplier: next,
      };
    });
  }, []);

  /**
   * Adjust Curvature Intensity (0 to 100%).
   */
  const setCurvaturePercent = useCallback((percent: number) => {
    const clamped = Math.max(0, Math.min(100, percent));
    let geom: SurfaceGeometry = 'SPHERICAL';
    if (clamped < 15) geom = 'PLANAR';
    else if (clamped <= 65) geom = 'CYLINDRICAL';
    else geom = 'SPHERICAL';

    setAnchorState((prev) => ({
      ...prev,
      curvaturePercent: clamped,
      surfaceGeometry: geom,
    }));
  }, []);

  /**
   * Increments or decrements curvature by delta.
   */
  const adjustCurvature = useCallback(
    (delta: number) => {
      setCurvaturePercent(anchorState.curvaturePercent + delta);
    },
    [anchorState.curvaturePercent, setCurvaturePercent]
  );

  /**
   * Confirms Center & Sizing on Scan.
   * Locks the 3D world anchor to current physical camera position.
   */
  const lockOnFramedObject = useCallback(
    (detected: FoodDetectionResult) => {
      // Capture current device 3D orientation as the reference anchor
      anchorRotationRef.current = { ...currentRotationRef.current };
      currentOffsetRef.current = { x: 0, y: 0, roll: 0 };
      panAnim.setValue({ x: 0, y: 0 });
      rollAnim.setValue(0);

      const { curvaturePercent } = anchorState;
      let geom: SurfaceGeometry = 'SPHERICAL';
      if (curvaturePercent < 15) geom = 'PLANAR';
      else if (curvaturePercent <= 65) geom = 'CYLINDRICAL';

      setAnchorState((prev) => ({
        ...prev,
        target: detected,
        isLocked: true,
        isTracking: true,
        surfaceGeometry: geom,
        centerConfirmed: { x: 50, y: 50 },
      }));
    },
    [anchorState, panAnim, rollAnim]
  );

  /**
   * Clears the current AR anchor and unlocks camera.
   */
  const clearAnchor = useCallback(() => {
    anchorRotationRef.current = null;
    currentOffsetRef.current = { x: 0, y: 0, roll: 0 };
    panAnim.setValue({ x: 0, y: 0 });
    rollAnim.setValue(0);

    setAnchorState((prev) => ({
      ...prev,
      target: null,
      isLocked: false,
      isTracking: false,
      centerConfirmed: { x: 50, y: 50 },
    }));
  }, [panAnim, rollAnim]);

  return {
    anchorState,
    panAnim,
    rollAnim,
    pulseAnim,
    setViewportSize,
    setSizePreset,
    setScaleMultiplier,
    adjustScale,
    setCurvaturePercent,
    adjustCurvature,
    lockOnFramedObject,
    clearAnchor,
  };
}
