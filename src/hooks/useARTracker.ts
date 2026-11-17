import { useRef, useState, useCallback, useEffect } from 'react';
import { Animated } from 'react-native';
import { DeviceMotion, DeviceMotionMeasurement } from 'expo-sensors';
import { FoodDetectionResult, BoundingBox, SurfaceGeometry } from '../types';

export type SizePreset = 'SMALL' | 'MEDIUM' | 'LARGE';

export interface TrackedPosition {
  x: number; // Viewport percentage (0 to 100)
  y: number; // Viewport percentage (0 to 100)
  roll: number; // Degrees of rotation around camera z-axis
  pitch: number; // Radians of device pitch (tilt angle)
  yaw: number; // Radians of device yaw
}

export interface ARAnchorState {
  target: FoodDetectionResult | null;
  isLocked: boolean;
  isTracking: boolean;
  surfaceGeometry: SurfaceGeometry;
  curvaturePercent: number; // 0 (Flat) to 100 (Deep Curve)
  customSize: { width: number; height: number }; // Percentage of viewport
  sizePreset: SizePreset;
  centerConfirmed: { x: number; y: number };
}

// Preset decal/reticle dimensions to fit different physical items
export const SIZE_PRESETS: Record<SizePreset, { width: number; height: number; radius: number; label: string }> = {
  SMALL: { width: 34, height: 34, radius: 38, label: 'Small (Fruit / Adapter)' },
  MEDIUM: { width: 44, height: 54, radius: 46, label: 'Medium (Can / Bottle / Pack)' },
  LARGE: { width: 64, height: 58, radius: 56, label: 'Large (Nutrition Table / Box)' },
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
    customSize: SIZE_PRESETS.SMALL,
    sizePreset: 'SMALL',
    centerConfirmed: { x: 50, y: 50 },
  });

  // Tracked real-world position (updated at 60 FPS via DeviceMotion)
  const [trackedPosition, setTrackedPosition] = useState<TrackedPosition>({
    x: 50,
    y: 50,
    roll: 0,
    pitch: 0.8, // ~45 deg downward tilt
    yaw: 0,
  });

  // Inertial sensor references for world-space anchoring
  const currentRotationRef = useRef<{ alpha: number; beta: number; gamma: number }>({
    alpha: 0,
    beta: 0,
    gamma: 0,
  });
  const anchorRotationRef = useRef<{ alpha: number; beta: number; gamma: number } | null>(null);
  const smoothOffsetRef = useRef<{ x: number; y: number; roll: number }>({ x: 0, y: 0, roll: 0 });

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

                // Optical projection: camera focal length constant (~100% viewport per radian)
                const focalLengthFactor = 95;

                // Moving phone left (increasing dYaw) shifts real object right in camera feed
                const targetDeltaX = -Math.sin(dYaw) * focalLengthFactor;
                // Tilting phone down (increasing dPitch) shifts real object up in camera feed
                const targetDeltaY = Math.sin(dPitch) * focalLengthFactor;
                const targetRoll = -dRoll * (180 / Math.PI);

                // Smooth exponential filter (removes hand jitter while maintaining immediate tracking)
                smoothOffsetRef.current.x += (targetDeltaX - smoothOffsetRef.current.x) * 0.35;
                smoothOffsetRef.current.y += (targetDeltaY - smoothOffsetRef.current.y) * 0.35;
                smoothOffsetRef.current.roll += (targetRoll - smoothOffsetRef.current.roll) * 0.35;

                const worldX = 50 + smoothOffsetRef.current.x;
                const worldY = 50 + smoothOffsetRef.current.y;

                setTrackedPosition({
                  x: worldX,
                  y: worldY,
                  roll: smoothOffsetRef.current.roll,
                  pitch: beta,
                  yaw: alpha,
                });
              } else {
                setTrackedPosition((prev) => ({
                  ...prev,
                  pitch: beta,
                  yaw: alpha,
                }));
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
  }, []);

  /**
   * Set Object Size Preset (Small / Medium / Large).
   */
  const setSizePreset = useCallback((preset: SizePreset) => {
    const dimensions = SIZE_PRESETS[preset];
    setAnchorState((prev) => ({
      ...prev,
      sizePreset: preset,
      customSize: dimensions,
    }));
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
      smoothOffsetRef.current = { x: 0, y: 0, roll: 0 };

      const { customSize, curvaturePercent } = anchorState;
      let geom: SurfaceGeometry = 'SPHERICAL';
      if (curvaturePercent < 15) geom = 'PLANAR';
      else if (curvaturePercent <= 65) geom = 'CYLINDRICAL';

      const fittedResult: FoodDetectionResult = {
        ...detected,
        boundingBox: {
          x: 50 - customSize.width / 2,
          y: 50 - customSize.height / 2,
          width: customSize.width,
          height: customSize.height,
        },
      };

      setAnchorState((prev) => ({
        ...prev,
        target: fittedResult,
        isLocked: true,
        isTracking: true,
        surfaceGeometry: geom,
        centerConfirmed: { x: 50, y: 50 },
      }));

      setTrackedPosition({
        x: 50,
        y: 50,
        roll: 0,
        pitch: currentRotationRef.current.beta,
        yaw: currentRotationRef.current.alpha,
      });
    },
    [anchorState]
  );

  /**
   * Manual drag adjustment if needed.
   */
  const trackMotionDelta = useCallback((deltaXPercent: number, deltaYPercent: number) => {
    smoothOffsetRef.current.x += deltaXPercent;
    smoothOffsetRef.current.y += deltaYPercent;
  }, []);

  /**
   * Clears the current AR anchor and unlocks camera.
   */
  const clearAnchor = useCallback(() => {
    anchorRotationRef.current = null;
    smoothOffsetRef.current = { x: 0, y: 0, roll: 0 };

    setAnchorState((prev) => ({
      ...prev,
      target: null,
      isLocked: false,
      isTracking: false,
      centerConfirmed: { x: 50, y: 50 },
    }));

    setTrackedPosition({
      x: 50,
      y: 50,
      roll: 0,
      pitch: currentRotationRef.current.beta,
      yaw: currentRotationRef.current.alpha,
    });
  }, []);

  return {
    anchorState,
    trackedPosition,
    pulseAnim,
    setSizePreset,
    setCurvaturePercent,
    adjustCurvature,
    lockOnFramedObject,
    trackMotionDelta,
    clearAnchor,
  };
}
