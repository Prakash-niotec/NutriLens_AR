import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  ScrollView,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { ScanMode, FoodDetectionResult, ScanHistoryItem } from './src/types';
import { FRUIT_VEG_DATASET } from './src/data/fruitVegDataset';
import { PACKED_FOOD_DATASET } from './src/data/packedFoodDataset';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function App() {
  const [scanMode, setScanMode] = useState<ScanMode>('VEG_FRUIT');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [result, setResult] = useState<FoodDetectionResult | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  const scanAnim = useRef(new Animated.Value(0)).current;

  // Animated laser scan effect top-to-bottom
  useEffect(() => {
    if (isScanning) {
      scanAnim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanAnim.stopAnimation();
    }
  }, [isScanning]);

  // STEP 1: Point camera & tap Scan -> STEP 2: Scan for 1.5s -> STEP 3: Display Safe (Green Arrow) / Unsafe (Red Cross)
  const triggerFoodScan = (forcedStatus?: 'safe' | 'unsafe') => {
    if (isScanning) return;

    setIsScanning(true);
    setResult(null);
    setShowModal(false);

    setTimeout(() => {
      const dataset = scanMode === 'VEG_FRUIT' ? FRUIT_VEG_DATASET : PACKED_FOOD_DATASET;
      let selected: FoodDetectionResult;

      if (forcedStatus === 'safe') {
        selected = dataset.find(item => item.safetyStatus === 'SAFE') || dataset[0];
      } else if (forcedStatus === 'unsafe') {
        selected = dataset.find(item => item.safetyStatus === 'UNSAFE') || dataset[1];
      } else {
        selected = dataset[Math.floor(Math.random() * dataset.length)];
      }

      setIsScanning(false);
      setResult(selected);
      // Clean AR mode: keep result on display in AR view without popping up modal text sheet
    }, 1500);
  };

  const isSafe = result?.safetyStatus === 'SAFE';

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Top Header & Mode Tabs */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>AR</Text>
          </View>
          <Text style={styles.headerTitle}>NUTRILENS <Text style={styles.headerSubtitle}>EXPO</Text></Text>
        </View>

        {/* Mode Selector */}
        <View style={styles.modeTabs}>
          <TouchableOpacity
            onPress={() => { setScanMode('VEG_FRUIT'); setResult(null); }}
            style={[styles.tabBtn, scanMode === 'VEG_FRUIT' && styles.tabBtnActiveProduce]}
          >
            <Text style={[styles.tabBtnText, scanMode === 'VEG_FRUIT' && styles.tabBtnTextActive]}>
              Veg/Fruit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { setScanMode('PACKED_FOOD'); setResult(null); }}
            style={[styles.tabBtn, scanMode === 'PACKED_FOOD' && styles.tabBtnActiveOCR]}
          >
            <Text style={[styles.tabBtnText, scanMode === 'PACKED_FOOD' && styles.tabBtnTextActive]}>
              Packed Food
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main AR Reticle Camera Stream Viewport */}
      <View style={styles.cameraViewport}>
        
        {/* Simulated Camera Viewfinder Grid */}
        <View style={styles.cameraGrid}>
          <Text style={styles.cameraGridIcon}>📷</Text>
          <Text style={styles.cameraGridText}>
            {scanMode === 'VEG_FRUIT' ? 'Point Camera at Fruit or Vegetable' : 'Point Camera at Packed Food Label'}
          </Text>
        </View>

        {/* HUD Target Reticle Frame */}
        <View style={styles.hudReticle}>
          <View style={[styles.cornerTL, { borderColor: isScanning ? '#06b6d4' : (result ? (isSafe ? '#10b981' : '#ef4444') : '#06b6d4') }]} />
          <View style={[styles.cornerTR, { borderColor: isScanning ? '#06b6d4' : (result ? (isSafe ? '#10b981' : '#ef4444') : '#06b6d4') }]} />
          <View style={[styles.cornerBL, { borderColor: isScanning ? '#06b6d4' : (result ? (isSafe ? '#10b981' : '#ef4444') : '#06b6d4') }]} />
          <View style={[styles.cornerBR, { borderColor: isScanning ? '#06b6d4' : (result ? (isSafe ? '#10b981' : '#ef4444') : '#06b6d4') }]} />

          {/* Vertical Scanning Laser Line */}
          {isScanning && (
            <Animated.View
              style={[
                styles.laserLine,
                {
                  transform: [
                    {
                      translateY: scanAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 240],
                      }),
                    },
                  ],
                },
              ]}
            />
          )}
        </View>

        {/* Product AR Mark Overlay Floating on Object AFTER Scan */}
        {result && !isScanning && (
          <View style={[styles.arProductBox, isSafe ? styles.arProductBoxSafe : styles.arProductBoxUnsafe]}>
            <View style={[styles.badgeIconCircleLarge, isSafe ? styles.iconBgSafe : styles.iconBgUnsafe]}>
              <Text style={styles.badgeIconSymbolLarge}>{isSafe ? '✓' : '✖'}</Text>
            </View>
            <View style={[styles.arFloatingBadgePill, isSafe ? styles.arBadgeSafe : styles.arBadgeUnsafe]}>
              <Text style={styles.arBadgeTitle}>{isSafe ? '✓ SAFE PRODUCT' : '✖ UNSAFE WARNING'}</Text>
              <Text style={styles.arBadgeSub}>{result.name} ({result.safetyScore}%)</Text>
            </View>
          </View>
        )}

      </View>

      {/* Bottom Shutter Panel */}
      <View style={styles.shutterPanel}>
        <TouchableOpacity
          onPress={() => triggerFoodScan()}
          disabled={isScanning}
          style={[styles.shutterBtn, scanMode === 'VEG_FRUIT' ? styles.shutterProduce : styles.shutterOCR]}
        >
          <View style={styles.shutterInner}>
            <Text style={styles.shutterText}>
              {isScanning ? 'SCANNING...' : 'SCAN'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Detailed Analysis Modal */}
      {showModal && result && (
        <Modal animationType="slide" transparent visible={showModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              
              <View style={styles.modalHeader}>
                <View style={[styles.badgePill, isSafe ? styles.pillSafe : styles.pillUnsafe]}>
                  <Text style={styles.pillIcon}>{isSafe ? '➔' : '✖'}</Text>
                  <Text style={styles.pillText}>{isSafe ? 'SAFE PRODUCT' : 'UNSAFE HAZARD'} ({result.safetyScore}%)</Text>
                </View>
                <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.resultTitle}>{result.name}</Text>
              {result.brand && <Text style={styles.resultBrand}>Brand: {result.brand}</Text>}

              <View style={styles.verdictBox}>
                <Text style={styles.verdictLabel}>SAFETY VERDICT:</Text>
                <Text style={styles.verdictText}>{result.recommendation}</Text>
              </View>

              {result.warnings && result.warnings.length > 0 && (
                <View style={styles.warningList}>
                  <Text style={styles.warningHeading}>HEALTH WARNINGS:</Text>
                  {result.warnings.map((w, i) => (
                    <Text key={i} style={styles.warningItem}>⚠️ {w}</Text>
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
  header: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#090d16', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  logoBadge: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#06b6d4', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  logoBadgeText: { fontWeight: '900', color: '#090d16', fontSize: 12 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#ffffff' },
  headerSubtitle: { fontSize: 12, color: '#06b6d4' },
  modeTabs: { flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 12, padding: 3, borderWidth: 1, borderColor: '#1e293b' },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabBtnActiveProduce: { backgroundColor: '#059669' },
  tabBtnActiveOCR: { backgroundColor: '#7c3aed' },
  tabBtnText: { fontSize: 11, fontWeight: '700', color: '#94a3b8' },
  tabBtnTextActive: { color: '#ffffff' },

  cameraViewport: { flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  cameraGrid: { alignItems: 'center', padding: 24 },
  cameraGridIcon: { fontSize: 48, marginBottom: 12 },
  cameraGridText: { color: '#94a3b8', fontSize: 13, textAlign: 'center', fontWeight: '600' },

  hudReticle: { width: 260, height: 260, position: 'relative', justifyContent: 'center' },
  cornerTL: { position: 'absolute', top: 0, left: 0, width: 32, height: 32, borderTopWidth: 4, borderLeftWidth: 4 },
  cornerTR: { position: 'absolute', top: 0, right: 0, width: 32, height: 32, borderTopWidth: 4, borderRightWidth: 4 },
  cornerBL: { position: 'absolute', bottom: 0, left: 0, width: 32, height: 32, borderBottomWidth: 4, borderLeftWidth: 4 },
  cornerBR: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderBottomWidth: 4, borderRightWidth: 4 },

  laserLine: { width: '100%', height: 3, backgroundColor: '#06b6d4', shadowColor: '#06b6d4', shadowRadius: 10, shadowOpacity: 1 },

  arProductBox: { position: 'absolute', width: 260, height: 260, justifyContent: 'center', alignItems: 'center', borderRadius: 20, borderWidth: 3 },
  arProductBoxSafe: { borderColor: '#10b981' },
  arProductBoxUnsafe: { borderColor: '#ef4444' },
  arFloatingBadgePill: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, alignItems: 'center' },
  arBadgeSafe: { backgroundColor: 'rgba(6, 40, 28, 0.95)', borderColor: '#10b981' },
  arBadgeUnsafe: { backgroundColor: 'rgba(50, 10, 15, 0.95)', borderColor: '#ef4444' },
  badgeIconCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  badgeIconCircleLarge: { width: 84, height: 84, borderRadius: 42, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowRadius: 15, shadowOpacity: 0.8 },
  iconBgSafe: { backgroundColor: '#10b981' },
  iconBgUnsafe: { backgroundColor: '#ef4444' },
  badgeIconSymbol: { color: '#ffffff', fontWeight: '900', fontSize: 14 },
  badgeIconSymbolLarge: { color: '#ffffff', fontWeight: '900', fontSize: 44 },
  arBadgeTitle: { color: '#ffffff', fontWeight: '800', fontSize: 12 },
  arBadgeSub: { color: '#cbd5e1', fontSize: 11, fontWeight: '500', marginTop: 2 },

  shutterPanel: { padding: 20, backgroundColor: '#090d16', borderTopWidth: 1, borderTopColor: '#1e293b', alignItems: 'center' },
  presetRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  presetBtnSafe: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(6, 78, 59, 0.6)', borderWidth: 1, borderColor: '#10b981' },
  presetBtnTextSafe: { color: '#6ee7b7', fontSize: 11, fontWeight: '700' },
  presetBtnUnsafe: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(136, 19, 55, 0.6)', borderWidth: 1, borderColor: '#ef4444' },
  presetBtnTextUnsafe: { color: '#fca5a5', fontSize: 11, fontWeight: '700' },

  shutterBtn: { width: 72, height: 72, borderRadius: 36, padding: 4 },
  shutterProduce: { backgroundColor: '#10b981' },
  shutterOCR: { backgroundColor: '#8b5cf6' },
  shutterInner: { flex: 1, borderRadius: 32, backgroundColor: '#090d16', justifyContent: 'center', alignItems: 'center' },
  shutterText: { color: '#ffffff', fontWeight: '900', fontSize: 10 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(9, 13, 22, 0.85)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, borderWidth: 1, borderColor: '#1e293b' },
  modalHeader: { flexDirection: 'row', justifyBetween: 'space-between', alignItems: 'center', marginBottom: 14 },
  badgePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  pillSafe: { backgroundColor: 'rgba(6, 78, 59, 0.9)' },
  pillUnsafe: { backgroundColor: 'rgba(136, 19, 55, 0.9)' },
  pillIcon: { color: '#ffffff', fontWeight: '900', marginRight: 6 },
  pillText: { color: '#ffffff', fontWeight: '800', fontSize: 12 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { color: '#94a3b8', fontWeight: '700' },
  resultTitle: { fontSize: 20, fontWeight: '900', color: '#ffffff' },
  resultBrand: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  verdictBox: { marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: '#090d16', borderWidth: 1, borderColor: '#1e293b' },
  verdictLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '800' },
  verdictText: { color: '#f1f5f9', fontSize: 13, fontWeight: '600', marginTop: 4 },
  warningList: { marginTop: 14 },
  warningHeading: { color: '#f87171', fontSize: 11, fontWeight: '800', marginBottom: 6 },
  warningItem: { color: '#fca5a5', fontSize: 12, backgroundColor: 'rgba(136, 19, 55, 0.3)', padding: 8, borderRadius: 8, marginBottom: 4 },
  doneBtn: { marginTop: 20, paddingVertical: 14, borderRadius: 12, backgroundColor: '#1e293b', alignItems: 'center' },
  doneBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 13 },
});
