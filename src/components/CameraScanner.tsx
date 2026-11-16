import React, { useState, useEffect, useRef } from 'react';
import { FoodDetectionResult, ScanMode } from '../types';
import { SkiaAROverlay } from './SkiaAROverlay';
import { ObjectDetectionEngine } from '../services/objectDetectionEngine';
import { OCRScanEngine } from '../services/ocrScanEngine';
import { Camera, RefreshCw, Zap, Image as ImageIcon, Sparkles, CheckCircle2, XCircle } from 'lucide-react';

interface CameraScannerProps {
  mode: ScanMode;
  onResultDetected: (result: FoodDetectionResult) => void;
  onReset: () => void;
  currentResult: FoodDetectionResult | null;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  mode,
  onResultDetected,
  onReset,
  currentResult,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [flashOn, setFlashOn] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState({ width: 360, height: 640 });

  // Update container size dynamically for responsive AR overlay sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Initialize Web Camera Stream
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
      } catch (err) {
        console.warn('Web Camera access failed or denied, utilizing simulated feed:', err);
        setHasCameraPermission(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Trigger Scanner Execution
  const triggerScan = async (sampleUri?: string) => {
    if (isScanning) return;

    setIsScanning(true);
    onReset();

    try {
      let detectedResult: FoodDetectionResult;
      if (mode === 'VEG_FRUIT') {
        detectedResult = await ObjectDetectionEngine.detectProduceFrame(sampleUri);
      } else {
        detectedResult = await OCRScanEngine.scanPackedFoodLabel(sampleUri);
      }
      onResultDetected(detectedResult);
    } catch (err) {
      console.error('Scanning error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[500px] bg-slate-950 overflow-hidden flex flex-col justify-between select-none"
    >
      {/* Background Camera Feed / WebRTC Video */}
      <div className="absolute inset-0 z-0 bg-slate-900 flex items-center justify-center">
        {hasCameraPermission ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          /* Simulated Animated AR Background Grid when hardware camera is unattached */
          <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4 animate-pulse">
              <Camera className="w-10 h-10 text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">
              {mode === 'VEG_FRUIT' ? 'Produce Camera Grid' : 'Packed Food Camera Grid'}
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              Tap the Scan button or click a preset sample below to simulate scanning fruits, vegetables, or packed labels.
            </p>
          </div>
        )}
      </div>

      {/* Dark Vignette AR Camera Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(9,13,22,0.85)_100%)]" />

      {/* Skia 2D Canvas Overlay (Laser, Frame Reticle, Bounding Box & Badges) */}
      <SkiaAROverlay
        mode={mode}
        isScanning={isScanning}
        result={currentResult}
        containerWidth={dimensions.width}
        containerHeight={dimensions.height}
      />

      {/* Top Floating Controls Bar */}
      <div className="relative z-20 flex items-center justify-between p-4 bg-gradient-to-b from-slate-950/90 to-transparent">
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-full px-3.5 py-1.5 text-xs text-slate-200 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{mode === 'VEG_FRUIT' ? 'Veg/Fruit active' : 'Packed Food active'}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setFlashOn(!flashOn)}
            className={`p-2.5 rounded-full border backdrop-blur-md transition-all ${
              flashOn
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_15px_#f59e0b]'
                : 'bg-slate-900/80 text-slate-300 border-slate-700/60 hover:bg-slate-800'
            }`}
            title="Toggle Flash Torch"
          >
            <Zap className="w-4 h-4" />
          </button>
          
          <button
            onClick={onReset}
            className="p-2.5 rounded-full bg-slate-900/80 text-slate-300 border border-slate-700/60 backdrop-blur-md hover:bg-slate-800 transition-all"
            title="Clear & Reset Reticle"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Floating Control Panel */}
      <div className="relative z-20 p-5 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent flex flex-col gap-4">
        {/* Main Shutter / Trigger Scan Button */}
        <div className="flex items-center justify-center">
          <button
            onClick={() => triggerScan()}
            disabled={isScanning}
            className={`group relative flex items-center justify-center w-20 h-20 rounded-full transition-all transform active:scale-95 ${
              isScanning
                ? 'opacity-80 scale-95'
                : 'hover:scale-105'
            }`}
          >
            {/* Outer Glowing Ring */}
            <span
              className={`absolute inset-0 rounded-full blur-md transition-all ${
                mode === 'VEG_FRUIT'
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-70 group-hover:opacity-100'
                  : 'bg-gradient-to-r from-purple-500 to-indigo-500 opacity-70 group-hover:opacity-100'
              }`}
            />
            
            {/* Outer Ring Border */}
            <span className="absolute inset-0 rounded-full border-4 border-slate-900/80" />

            {/* Inner Shutter Circle */}
            <span className="relative w-16 h-16 rounded-full bg-slate-950 border-2 border-white/80 flex items-center justify-center shadow-inner">
              {isScanning ? (
                <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin" />
              ) : (
                <span
                  className={`w-12 h-12 rounded-full transition-all ${
                    mode === 'VEG_FRUIT'
                      ? 'bg-gradient-to-tr from-emerald-500 to-teal-400'
                      : 'bg-gradient-to-tr from-violet-500 to-indigo-400'
                  }`}
                />
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
