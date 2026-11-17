import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Dimensions,
  Animated,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { ScanMode, FoodDetectionResult } from './src/types';
import { FRUIT_VEG_DATASET } from './src/data/fruitVegDataset';
import { PACKED_FOOD_DATASET } from './src/data/packedFoodDataset';
import { useARTracker, SIZE_PRESETS, SizePreset } from './src/hooks/useARTracker';
import { SkiaDecalStamp, SkiaAimingReticle } from './src/components/SkiaCurvedARCanvas';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function App() {
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  const [scanMode, setScanMode] = useState<ScanMode>('VEG_FRUIT');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [viewportLayout, setViewportLayout] = useState<{ width: number; height: number }>({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.65,
  });

  // AR Tracker Hook with 6-DOF Spatial Motion Tracking & Dynamic Curvature
  const {
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
  } = useARTracker();

  // Keep tracker informed of viewport layout
  useEffect(() => {
    setViewportSize(viewportLayout.width, viewportLayout.height);
  }, [viewportLayout, setViewportSize]);

  // Auto-request camera permissions on launch
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // PanResponder to track object motion smoothly when moving on camera
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: () => {},
    })
  ).current;

  const [scanProgress, setScanProgress] = useState<number>(0);
  const scanLaserAnim = useRef(new Animated.Value(0)).current;

  // Sync laser scan progress for Skia 2D canvas
  useEffect(() => {
    const listenerId = scanLaserAnim.addListener(({ value }) => {
      setScanProgress(value);
    });
    return () => {
      scanLaserAnim.removeListener(listenerId);
    };
  }, [scanLaserAnim]);

  // Animated laser scan effect top-to-bottom (Snappy 260ms duration)
  useEffect(() => {
    if (isScanning) {
      scanLaserAnim.setValue(0);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLaserAnim, {
            toValue: 1,
            duration: 260,
            useNativeDriver: false,
          }),
          Animated.timing(scanLaserAnim, {
            toValue: 0,
            duration: 260,
            useNativeDriver: false,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      scanLaserAnim.stopAnimation();
    }
  }, [isScanning, scanLaserAnim]);

  // Handle Scanning Trigger: Locks to exact framed size & surface curvature with fast 280ms response
  const triggerFoodScan = (forcedStatus?: 'safe' | 'unsafe') => {
    if (isScanning) return;

    setIsScanning(true);
    clearAnchor();
    setShowModal(false);

    // Snappy scan response (280ms)
    setTimeout(() => {
      const dataset = scanMode === 'VEG_FRUIT' ? FRUIT_VEG_DATASET : PACKED_FOOD_DATASET;
      let selected: FoodDetectionResult;

      if (forcedStatus === 'safe') {
        selected = dataset.find((item) => item.safetyStatus === 'SAFE') || dataset[0];
      } else if (forcedStatus === 'unsafe') {
        selected = dataset.find((item) => item.safetyStatus === 'UNSAFE') || dataset[1];
      } else {
        selected = dataset[Math.floor(Math.random() * dataset.length)];
      }

      setIsScanning(false);
      // Lock onto framed object with dynamic size and curvature
      lockOnFramedObject(selected);
    }, 280);
  };

  const isSafe = anchorState.target?.safetyStatus === 'SAFE';

  // Dynamic reticle width & height based on current size preset and scale multiplier
  const presetDims = SIZE_PRESETS[anchorState.sizePreset];
  const reticleWidth = (viewportLayout.width * presetDims.widthPct * anchorState.scaleMultiplier) / 100;
  const reticleHeight = (viewportLayout.height * presetDims.heightPct * anchorState.scaleMultiplier) / 100;
  const targetCenterX = viewportLayout.width / 2;
  const targetCenterY = viewportLayout.height / 2;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header & Mode Tabs */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>AR</Text>
          </View>
          <Text style={styles.headerTitle}>
            NUTRILENS <Text style={styles.headerSubtitle}>EXPO</Text>
          </Text>
        </View>

        {/* Mode Selector */}
        <View style={styles.modeTabs}>
          <TouchableOpacity
            onPress={() => {
              setScanMode('VEG_FRUIT');
              setSizePreset('SMALL');
              setCurvaturePercent(85);
              clearAnchor();
            }}
            style={[styles.tabBtn, scanMode === 'VEG_FRUIT' && styles.tabBtnActiveProduce]}
          >
            <Text style={[styles.tabBtnText, scanMode === 'VEG_FRUIT' && styles.tabBtnTextActive]}>
              Produce (Curved)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setScanMode('PACKED_FOOD');
              setSizePreset('MEDIUM');
              setCurvaturePercent(50);
              clearAnchor();
            }}
            style={[styles.tabBtn, scanMode === 'PACKED_FOOD' && styles.tabBtnActiveOCR]}
          >
            <Text style={[styles.tabBtnText, scanMode === 'PACKED_FOOD' && styles.tabBtnTextActive]}>
              Nutrition Label / Pack
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Live Camera Viewport */}
      <View
        style={styles.cameraViewport}
        {...panResponder.panHandlers}
        onLayout={(e: LayoutChangeEvent) => {
          const { width, height } = e.nativeEvent.layout;
          setViewportLayout({ width, height });
        }}
      >
        {/* Live Camera Stream */}
        {hasPermission && device != null ? (
          <Camera style={StyleSheet.absoluteFill} device={device} isActive={true} />
        ) : (
          <View style={styles.cameraGrid}>
            <Text style={styles.cameraGridIcon}>📷</Text>
            <Text style={styles.cameraGridText}>
              {!hasPermission ? 'Camera access needed to scan produce & labels' : 'Connecting to camera device...'}
            </Text>
            {!hasPermission && (
              <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
                <Text style={styles.permissionBtnText}>Enable Camera Permission</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Object Size Selector (While Aiming) */}
        {!anchorState.isLocked && (
          <View style={styles.sizingBar}>
            <Text style={styles.sizingLabel}>FIT OBJECT SIZE:</Text>
            <View style={styles.sizingRow}>
              {(['SMALL', 'MEDIUM', 'LARGE'] as SizePreset[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setSizePreset(p)}
                  style={[styles.sizeBtn, anchorState.sizePreset === p && styles.sizeBtnActive]}
                >
                  <Text style={[styles.sizeBtnText, anchorState.sizePreset === p && styles.sizeBtnTextActive]}>
                    {p === 'SMALL' ? '🍏 Small' : p === 'MEDIUM' ? '🥫 Medium' : '📦 Large'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Skia Aiming Reticle (Visible when unlocked or scanning) */}
        {!anchorState.isLocked && (
          <SkiaAimingReticle
            width={viewportLayout.width}
            height={viewportLayout.height}
            isScanning={isScanning}
            scanProgress={scanProgress}
            boxWidth={reticleWidth}
            boxHeight={reticleHeight}
            curvaturePercent={anchorState.curvaturePercent}
          />
        )}

        {/* Dynamic Framing Guide Badge */}
        {!anchorState.isLocked && (
          <View
            style={[
              styles.reticleBadge,
              {
                position: 'absolute',
                top: targetCenterY + reticleHeight / 2 + 10,
                alignSelf: 'center',
                zIndex: 20,
              },
            ]}
            pointerEvents="none"
          >
            <Text style={styles.reticleBadgeText}>
              {anchorState.sizePreset === 'SMALL'
                ? '⌖ Frame Fruit / Small Item'
                : anchorState.sizePreset === 'MEDIUM'
                ? '⌖ Frame Can / Bottle'
                : '⌖ Frame Nutrition Table'}
            </Text>
          </View>
        )}

        {/* 3D Curvature & Live Sizing Tuning Bar (When Anchored) */}
        {anchorState.isLocked && !isScanning && (
          <View style={styles.tuningBar}>
            {/* Row 1: Surface Curvature */}
            <View style={styles.tuningRow}>
              <Text style={styles.tuningLabel}>SURFACE:</Text>
              <TouchableOpacity
                onPress={() => setCurvaturePercent(0)}
                style={[styles.curvePresetBtn, anchorState.curvaturePercent === 0 && styles.curvePresetBtnActive]}
              >
                <Text style={styles.curvePresetText}>Flat 0%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setCurvaturePercent(50)}
                style={[styles.curvePresetBtn, anchorState.curvaturePercent === 50 && styles.curvePresetBtnActive]}
              >
                <Text style={styles.curvePresetText}>Can 50%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setCurvaturePercent(90)}
                style={[styles.curvePresetBtn, anchorState.curvaturePercent === 90 && styles.curvePresetBtnActive]}
              >
                <Text style={styles.curvePresetText}>Sphere 90%</Text>
              </TouchableOpacity>

              <View style={styles.stepperContainer}>
                <TouchableOpacity onPress={() => adjustCurvature(-15)} style={styles.stepperBtn}>
                  <Text style={styles.stepperBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.stepperVal}>{anchorState.curvaturePercent}%</Text>
                <TouchableOpacity onPress={() => adjustCurvature(15)} style={styles.stepperBtn}>
                  <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Row 2: Live Dynamic Sizing Stepper */}
            <View style={[styles.tuningRow, { marginTop: 6 }]}>
              <Text style={styles.tuningLabel}>SIZE:</Text>
              {(['SMALL', 'MEDIUM', 'LARGE'] as SizePreset[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setSizePreset(p)}
                  style={[styles.curvePresetBtn, anchorState.sizePreset === p && styles.curvePresetBtnActive]}
                >
                  <Text style={styles.curvePresetText}>
                    {p === 'SMALL' ? 'Small' : p === 'MEDIUM' ? 'Med' : 'Large'}
                  </Text>
                </TouchableOpacity>
              ))}

              <View style={styles.stepperContainer}>
                <TouchableOpacity onPress={() => adjustScale(-0.15)} style={styles.stepperBtn}>
                  <Text style={styles.stepperBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.stepperVal}>{Math.round(anchorState.scaleMultiplier * 100)}%</Text>
                <TouchableOpacity onPress={() => adjustScale(0.15)} style={styles.stepperBtn}>
                  <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Dismiss / Re-aim button */}
        {anchorState.isLocked && !isScanning && (
          <TouchableOpacity style={styles.clearScanBtn} onPress={clearAnchor}>
            <Text style={styles.clearScanBtnText}>✕ Re-aim Center</Text>
          </TouchableOpacity>
        )}

        {/* 100% Solid Skia AR Decal (Hardware-accelerated Zero-Lag tracking via Animated.View) */}
        {anchorState.isLocked && anchorState.target != null && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: targetCenterX - 85,
                top: targetCenterY - 85,
                width: 170,
                height: 170,
                transform: [
                  { translateX: panAnim.x },
                  { translateY: panAnim.y },
                  {
                    rotate: rollAnim.interpolate({
                      inputRange: [-180, 180],
                      outputRange: ['-180deg', '180deg'],
                    }),
                  },
                ],
                zIndex: 24,
              },
            ]}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowModal(true)}
              style={StyleSheet.absoluteFill}
            >
              <SkiaDecalStamp
                isSafe={isSafe}
                curvaturePercent={anchorState.curvaturePercent}
                scaleMultiplier={anchorState.scaleMultiplier}
              />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Floating AR Info Pill - Synchronously anchored with zero lag */}
        {anchorState.isLocked && anchorState.target && !isScanning && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: Math.max(16, targetCenterX - 125),
                top: Math.max(12, targetCenterY - 85 - 76),
                width: 250,
                transform: [
                  { translateX: panAnim.x },
                  { translateY: panAnim.y },
                ],
                zIndex: 26,
              },
            ]}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => setShowModal(true)}
              style={[
                styles.arFloatingBadgePill,
                isSafe ? styles.arBadgeSafe : styles.arBadgeUnsafe,
              ]}
            >
              <View style={styles.badgeStatusRow}>
                <View style={[styles.statusDot, isSafe ? styles.statusDotSafe : styles.statusDotUnsafe]} />
                <Text style={styles.arBadgeTitle}>
                  {isSafe ? 'VERIFIED SAFE' : 'UNSAFE WARNING'}
                </Text>
                <Text style={styles.surfaceTag}>
                  [{anchorState.curvaturePercent}% Skia Curve]
                </Text>
              </View>
              <Text style={styles.arBadgeSub}>
                {anchorState.target.name} ({anchorState.target.safetyScore}%)
              </Text>
              <Text style={styles.arTapHint}>Tap for Full Nutrition Breakdown ➔</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Bottom Shutter & Preset Controls */}
      <View style={styles.shutterPanel}>
        <View style={styles.presetRow}>
          <TouchableOpacity
            onPress={() => {
              setSizePreset('SMALL');
              setCurvaturePercent(85);
              triggerFoodScan('safe');
            }}
            disabled={isScanning}
            style={styles.presetBtnSafe}
          >
            <Text style={styles.presetBtnTextSafe}>✓ Small Curved Fruit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setSizePreset('MEDIUM');
              setCurvaturePercent(50);
              triggerFoodScan('unsafe');
            }}
            disabled={isScanning}
            style={styles.presetBtnUnsafe}
          >
            <Text style={styles.presetBtnTextUnsafe}>✖ Medium Can / Pack</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => triggerFoodScan()}
          disabled={isScanning}
          style={[styles.shutterBtn, scanMode === 'VEG_FRUIT' ? styles.shutterProduce : styles.shutterOCR]}
        >
          <View style={styles.shutterInner}>
            <Text style={styles.shutterText}>{isScanning ? 'LOCKING...' : 'SCAN'}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Detailed Analysis Modal */}
      {showModal && anchorState.target && (
        <Modal animationType="slide" transparent visible={showModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <View style={[styles.badgePill, isSafe ? styles.pillSafe : styles.pillUnsafe]}>
                  <Text style={styles.pillIcon}>{isSafe ? '✓' : '✖'}</Text>
                  <Text style={styles.pillText}>
                    {isSafe ? 'SAFE FOOD' : 'UNSAFE HAZARD'} ({anchorState.target.safetyScore}%)
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.resultTitle}>{anchorState.target.name}</Text>
              {anchorState.target.brand && <Text style={styles.resultBrand}>Brand: {anchorState.target.brand}</Text>}

              <View style={styles.verdictBox}>
                <Text style={styles.verdictLabel}>SAFETY VERDICT:</Text>
                <Text style={styles.verdictText}>{anchorState.target.recommendation}</Text>
              </View>

              {anchorState.target.warnings && anchorState.target.warnings.length > 0 && (
                <View style={styles.warningList}>
                  <Text style={styles.warningHeading}>HEALTH WARNINGS:</Text>
                  {anchorState.target.warnings.map((w, i) => (
                    <Text key={i} style={styles.warningItem}>
                      ⚠️ {w}
                    </Text>
                  ))}
                </View>
              )}

              {anchorState.target.nutritionalHighlights && (
                <View style={styles.nutritionBox}>
                  <Text style={styles.nutritionHeading}>NUTRITIONAL HIGHLIGHTS:</Text>
                  {anchorState.target.nutritionalHighlights.map((n, i) => (
                    <Text key={i} style={styles.nutritionItem}>
                      • {n}
                    </Text>
                  ))}
                </View>
              )}

              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.doneBtn}>
                <Text style={styles.doneBtnText}>Close Analysis</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#090d16',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#06b6d4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logoBadgeText: { fontWeight: '900', color: '#090d16', fontSize: 12 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#ffffff' },
  headerSubtitle: { fontSize: 12, color: '#06b6d4' },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabBtnActiveProduce: { backgroundColor: '#059669' },
  tabBtnActiveOCR: { backgroundColor: '#7c3aed' },
  tabBtnText: { fontSize: 11, fontWeight: '700', color: '#94a3b8' },
  tabBtnTextActive: { color: '#ffffff' },

  cameraViewport: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  cameraGrid: { alignItems: 'center', padding: 24, zIndex: 1 },
  cameraGridIcon: { fontSize: 48, marginBottom: 12 },
  cameraGridText: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
    maxWidth: 260,
  },
  permissionBtn: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#06b6d4',
    borderRadius: 12,
  },
  permissionBtnText: { color: '#090d16', fontWeight: '800', fontSize: 12 },

  // Sizing Bar (While Aiming)
  sizingBar: {
    position: 'absolute',
    top: 12,
    zIndex: 20,
    alignItems: 'center',
  },
  sizingLabel: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  sizingRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 4,
  },
  sizeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sizeBtnActive: {
    backgroundColor: '#0284c7',
  },
  sizeBtnText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
  },
  sizeBtnTextActive: {
    color: '#ffffff',
  },

  // Framing Reticle
  hudReticle: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 10,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 10,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 10,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 10,
  },
  reticleCrosshair: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crosshairDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38bdf8',
  },
  reticleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  reticleBadgeText: { color: '#e2e8f0', fontSize: 10, fontWeight: '700' },

  laserLine: {
    width: '100%',
    height: 3,
    backgroundColor: '#06b6d4',
    shadowColor: '#06b6d4',
    shadowRadius: 10,
    shadowOpacity: 1,
  },

  // Curvature & Size Tuning Bar (When Anchored)
  tuningBar: {
    position: 'absolute',
    top: 8,
    zIndex: 25,
    alignItems: 'center',
    width: '100%',
  },
  tuningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 4,
  },
  tuningLabel: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginRight: 2,
  },
  curvatureTuningBar: {
    position: 'absolute',
    top: 12,
    zIndex: 25,
    alignItems: 'center',
  },
  curvaturePresetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 3,
  },
  curvePresetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  curvePresetBtnActive: {
    backgroundColor: '#0284c7',
  },
  curvePresetText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '700',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginLeft: 4,
  },
  stepperBtn: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  stepperBtnText: {
    color: '#38bdf8',
    fontWeight: '900',
    fontSize: 13,
  },
  stepperVal: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    minWidth: 32,
    textAlign: 'center',
  },

  clearScanBtn: {
    position: 'absolute',
    bottom: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#38bdf8',
    zIndex: 25,
  },
  clearScanBtnText: { color: '#38bdf8', fontSize: 11, fontWeight: '700' },

  // AR Anchored Bounding Box
  arProductBox: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    zIndex: 10,
  },
  arProductBoxSafe: {
    borderColor: 'rgba(16, 185, 129, 0.65)',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  arProductBoxUnsafe: {
    borderColor: 'rgba(239, 68, 68, 0.65)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },

  // 3D Surface Latitude Lines (Wireframe mapping curvature)
  surfaceLatitudeTop: {
    position: 'absolute',
    top: '18%',
    width: '100%',
    height: '22%',
    borderBottomWidth: 1.5,
    borderRadius: 999,
  },
  surfaceLatitudeEquator: {
    position: 'absolute',
    top: '42%',
    width: '100%',
    height: '16%',
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderRadius: 999,
  },
  surfaceLatitudeBottom: {
    position: 'absolute',
    bottom: '18%',
    width: '100%',
    height: '22%',
    borderTopWidth: 1.5,
    borderRadius: 999,
  },
  latitudeSafe: {
    borderColor: 'rgba(52, 211, 153, 0.45)',
  },
  latitudeUnsafe: {
    borderColor: 'rgba(248, 113, 113, 0.45)',
  },

  // Corner Brackets with animated curvature
  cornerBracket: {
    position: 'absolute',
    width: 24,
    height: 24,
  },
  bracketTL: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  bracketTR: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bracketBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bracketBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  bracketSafe: { borderColor: '#10b981' },
  bracketUnsafe: { borderColor: '#ef4444' },

  // 3D Curved Sign Badge
  anchorCenterTouch: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  arCurvedGlowRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowRingSafe: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 2,
    borderColor: '#34d399',
  },
  glowRingUnsafe: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 2,
    borderColor: '#f87171',
  },

  badgeIconCircleLarge: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.85,
    shadowRadius: 14,
    elevation: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  curvedBadgeBorder: {
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  iconBgSafe: { backgroundColor: '#10b981' },
  iconBgUnsafe: { backgroundColor: '#ef4444' },

  specularHighlight: {
    position: 'absolute',
    top: 3,
    left: 8,
    width: 24,
    height: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    transform: [{ rotate: '-25deg' }],
  },
  bottomShadowArc: {
    position: 'absolute',
    bottom: 1,
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
  },
  badgeIconSymbolLarge: { color: '#ffffff', fontWeight: '900', fontSize: 32 },

  // Floating AR Pill
  arFloatingBadgePill: {
    position: 'absolute',
    top: -54,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    minWidth: 180,
    elevation: 8,
  },
  arBadgeSafe: {
    backgroundColor: 'rgba(6, 40, 28, 0.95)',
    borderColor: '#10b981',
  },
  arBadgeUnsafe: {
    backgroundColor: 'rgba(50, 10, 15, 0.95)',
    borderColor: '#ef4444',
  },
  badgeStatusRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  statusDotSafe: { backgroundColor: '#34d399' },
  statusDotUnsafe: { backgroundColor: '#f87171' },
  arBadgeTitle: { color: '#ffffff', fontWeight: '800', fontSize: 11 },
  surfaceTag: { color: '#38bdf8', fontSize: 9, fontWeight: '700', marginLeft: 6 },
  arBadgeSub: { color: '#cbd5e1', fontSize: 10, fontWeight: '600', marginTop: 1 },
  arTapHint: { color: '#38bdf8', fontSize: 9, fontWeight: '700', marginTop: 2 },

  // Bottom Shutter Panel
  shutterPanel: {
    padding: 16,
    backgroundColor: '#090d16',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    alignItems: 'center',
  },
  presetRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  presetBtnSafe: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(6, 78, 59, 0.65)',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  presetBtnTextSafe: { color: '#6ee7b7', fontSize: 11, fontWeight: '700' },
  presetBtnUnsafe: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(136, 19, 55, 0.65)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  presetBtnTextUnsafe: { color: '#fca5a5', fontSize: 11, fontWeight: '700' },

  shutterBtn: { width: 70, height: 70, borderRadius: 35, padding: 4 },
  shutterProduce: { backgroundColor: '#10b981' },
  shutterOCR: { backgroundColor: '#8b5cf6' },
  shutterInner: {
    flex: 1,
    borderRadius: 31,
    backgroundColor: '#090d16',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterText: { color: '#ffffff', fontWeight: '900', fontSize: 10 },

  // Modal Analysis Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.85)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    maxHeight: SCREEN_HEIGHT * 0.75,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pillSafe: { backgroundColor: 'rgba(6, 78, 59, 0.9)' },
  pillUnsafe: { backgroundColor: 'rgba(136, 19, 55, 0.9)' },
  pillIcon: { color: '#ffffff', fontWeight: '900', marginRight: 6 },
  pillText: { color: '#ffffff', fontWeight: '800', fontSize: 12 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: { color: '#94a3b8', fontWeight: '700' },
  resultTitle: { fontSize: 20, fontWeight: '900', color: '#ffffff' },
  resultBrand: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  verdictBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  verdictLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '800' },
  verdictText: { color: '#f1f5f9', fontSize: 13, fontWeight: '600', marginTop: 4 },
  warningList: { marginTop: 14 },
  warningHeading: { color: '#f87171', fontSize: 11, fontWeight: '800', marginBottom: 6 },
  warningItem: {
    color: '#fca5a5',
    fontSize: 12,
    backgroundColor: 'rgba(136, 19, 55, 0.3)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  nutritionBox: { marginTop: 14 },
  nutritionHeading: { color: '#38bdf8', fontSize: 11, fontWeight: '800', marginBottom: 6 },
  nutritionItem: { color: '#cbd5e1', fontSize: 12, marginBottom: 2 },
  doneBtn: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    alignItems: 'center',
  },
  doneBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 13 },
});
