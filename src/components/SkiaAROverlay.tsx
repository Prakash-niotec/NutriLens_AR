import React, { useEffect, useRef } from 'react';
import { FoodDetectionResult, ScanMode } from '../types';

interface SkiaAROverlayProps {
  mode: ScanMode;
  isScanning: boolean;
  result: FoodDetectionResult | null;
  containerWidth: number;
  containerHeight: number;
}

export const SkiaAROverlay: React.FC<SkiaAROverlayProps> = ({
  mode,
  isScanning,
  result,
  containerWidth,
  containerHeight,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let scanY = 0;
    let scanDirection = 1;

    const render = () => {
      ctx.clearRect(0, 0, containerWidth, containerHeight);

      // --- 1. HUD TARGET FRAME CORNERS ---
      const reticleWidth = Math.min(containerWidth * 0.75, 340);
      const reticleHeight = Math.min(containerHeight * 0.55, 380);
      const reticleX = (containerWidth - reticleWidth) / 2;
      const reticleY = (containerHeight - reticleHeight) / 2;
      const cornerLength = 28;

      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;

      const isSafe = result ? result.safetyStatus === 'SAFE' : true;
      const themeColor = result
        ? isSafe
          ? '#10b981' // Emerald Green
          : '#ef4444' // Rose Red
        : mode === 'VEG_FRUIT'
        ? '#06b6d4' // Cyan Produce
        : '#8b5cf6'; // Violet OCR

      ctx.strokeStyle = themeColor;
      ctx.shadowColor = themeColor;

      // Draw Corner Bracket Top-Left
      ctx.beginPath();
      ctx.moveTo(reticleX, reticleY + cornerLength);
      ctx.lineTo(reticleX, reticleY);
      ctx.lineTo(reticleX + cornerLength, reticleY);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(reticleX + reticleWidth - cornerLength, reticleY);
      ctx.lineTo(reticleX + reticleWidth, reticleY);
      ctx.lineTo(reticleX + reticleWidth, reticleY + cornerLength);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(reticleX + reticleWidth, reticleY + reticleHeight - cornerLength);
      ctx.lineTo(reticleX + reticleWidth, reticleY + reticleHeight);
      ctx.lineTo(reticleX + reticleWidth - cornerLength, reticleY + reticleHeight);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(reticleX + cornerLength, reticleY + reticleHeight);
      ctx.lineTo(reticleX, reticleY + reticleHeight);
      ctx.lineTo(reticleX, reticleY + reticleHeight - cornerLength);
      ctx.stroke();

      // --- 2. ANIMATED VERTICAL LASER SCAN LINE ---
      if (isScanning) {
        scanY += 2.5 * scanDirection;
        if (scanY >= reticleHeight || scanY <= 0) {
          scanDirection *= -1;
        }

        const currentScanY = reticleY + scanY;

        const scanGradient = ctx.createLinearGradient(
          reticleX,
          currentScanY,
          reticleX + reticleWidth,
          currentScanY
        );
        scanGradient.addColorStop(0, 'rgba(6, 182, 212, 0)');
        scanGradient.addColorStop(0.5, themeColor);
        scanGradient.addColorStop(1, 'rgba(6, 182, 212, 0)');

        ctx.strokeStyle = scanGradient;
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 15;
        ctx.shadowColor = themeColor;

        ctx.beginPath();
        ctx.moveTo(reticleX, currentScanY);
        ctx.lineTo(reticleX + reticleWidth, currentScanY);
        ctx.stroke();

        // Subtly fill trailing scan area
        ctx.fillStyle = isSafe ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)';
        ctx.fillRect(reticleX, reticleY, reticleWidth, scanY);
      }

      // --- 3. BOUNDING BOX & AR FLOATING BADGES WHEN RESULT IS PRESENT ---
      if (result) {
        const boxX = (result.boundingBox.x / 100) * containerWidth;
        const boxY = (result.boundingBox.y / 100) * containerHeight;
        const boxW = (result.boundingBox.width / 100) * containerWidth;
        const boxH = (result.boundingBox.height / 100) * containerHeight;

        // Bounding Box Glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = isSafe ? '#10b981' : '#ef4444';
        ctx.strokeStyle = isSafe ? '#10b981' : '#ef4444';
        ctx.lineWidth = 3;

        ctx.strokeRect(boxX, boxY, boxW, boxH);
        ctx.fillStyle = isSafe ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)';
        ctx.fillRect(boxX, boxY, boxW, boxH);

        // Draw Corner Dots on Bounding Box
        ctx.fillStyle = isSafe ? '#34d399' : '#f87171';
        const dotRadius = 4;
        [[boxX, boxY], [boxX + boxW, boxY], [boxX, boxY + boxH], [boxX + boxW, boxY + boxH]].forEach(([dx, dy]) => {
          ctx.beginPath();
          ctx.arc(dx, dy, dotRadius, 0, Math.PI * 2);
          ctx.fill();
        });

        // 1. Large AR Safe/Unsafe Circle Mark DIRECTLY ON THE PRODUCT (Center of Bounding Box)
        const cx = boxX + boxW / 2;
        const cy = boxY + boxH / 2;
        const radius = Math.max(38, Math.min(boxW, boxH) * 0.28);

        // Dark Backdrop Ring on Product
        ctx.fillStyle = isSafe ? 'rgba(4, 30, 20, 0.94)' : 'rgba(40, 6, 10, 0.94)';
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.stroke();

        // Solid Glowing Fill Circle
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = isSafe ? '#10b981' : '#ef4444';
        ctx.fill();

        // Vector Icon (Green Correct Checkmark ✓ or Red Wrong Cross ✕)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(4.5, radius * 0.2);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (isSafe) {
          // GREEN CORRECT CHECKMARK (✓)
          ctx.beginPath();
          ctx.moveTo(cx - radius * 0.42, cy + radius * 0.04);
          ctx.lineTo(cx - radius * 0.08, cy + radius * 0.38);
          ctx.lineTo(cx + radius * 0.42, cy - radius * 0.36);
          ctx.stroke();
        } else {
          // RED WRONG CROSS (✕)
          ctx.beginPath();
          ctx.moveTo(cx - radius * 0.35, cy - radius * 0.35);
          ctx.lineTo(cx + radius * 0.35, cy + radius * 0.35);
          ctx.moveTo(cx + radius * 0.35, cy - radius * 0.35);
          ctx.lineTo(cx - radius * 0.35, cy + radius * 0.35);
          ctx.stroke();
        }

        // 2. Floating AR Product Info Badge Pill Above Bounding Box
        const badgeW = Math.min(220, containerWidth - 20);
        const badgeH = 44;
        const bgx = Math.max(10, Math.min(containerWidth - badgeW - 10, cx - badgeW / 2));
        const bgy = Math.max(10, boxY - badgeH - 12);

        ctx.fillStyle = isSafe ? 'rgba(6, 40, 28, 0.94)' : 'rgba(50, 10, 15, 0.94)';
        ctx.beginPath();
        ctx.roundRect(bgx, bgy, badgeW, badgeH, 22);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(isSafe ? '✓ SAFE PRODUCT' : '✕ UNSAFE WARNING', cx, bgy + 18);

        ctx.fillStyle = isSafe ? '#a7f3d0' : '#fecdd3';
        ctx.font = '500 11px "Outfit", sans-serif';
        const labelText = result.name.length > 22 ? result.name.substring(0, 20) + '...' : result.name;
        ctx.fillText(`${labelText} • ${result.safetyScore}%`, cx, bgy + 34);
        ctx.textAlign = 'left'; // reset text alignment
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [mode, isScanning, result, containerWidth, containerHeight]);

  return (
    <canvas
      ref={canvasRef}
      width={containerWidth}
      height={containerHeight}
      className="absolute inset-0 pointer-events-none z-10"
    />
  );
};
