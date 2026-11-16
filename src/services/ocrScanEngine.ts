import { FoodDetectionResult } from '../types';
import { PACKED_FOOD_DATASET } from '../data/packedFoodDataset';

export class OCRScanEngine {
  private static currentIndex = 0;

  /**
   * Simulates real-time OCR text recognition & safety extraction on packed food labels
   */
  public static async scanPackedFoodLabel(imageUri?: string): Promise<FoodDetectionResult> {
    // Artificial latency to emulate OCR & text parsing engine
    await new Promise((resolve) => setTimeout(resolve, 750));

    if (imageUri && imageUri.includes('unsafe')) {
      const unsafeItems = PACKED_FOOD_DATASET.filter(item => item.safetyStatus === 'UNSAFE');
      return unsafeItems[Math.floor(Math.random() * unsafeItems.length)];
    }

    const result = PACKED_FOOD_DATASET[this.currentIndex % PACKED_FOOD_DATASET.length];
    this.currentIndex++;

    const jitteredBox = {
      x: Math.max(10, Math.min(25, result.boundingBox.x + (Math.random() * 2 - 1))),
      y: Math.max(15, Math.min(30, result.boundingBox.y + (Math.random() * 2 - 1))),
      width: result.boundingBox.width,
      height: result.boundingBox.height,
    };

    return {
      ...result,
      boundingBox: jitteredBox,
      confidence: parseFloat((0.94 + Math.random() * 0.05).toFixed(2))
    };
  }

  /**
   * Get specific item by ID
   */
  public static getItemById(id: string): FoodDetectionResult | undefined {
    return PACKED_FOOD_DATASET.find(item => item.id === id);
  }

  /**
   * Filter dataset by safety status
   */
  public static filterBySafety(isSafe: boolean): FoodDetectionResult[] {
    return PACKED_FOOD_DATASET.filter(item => item.safetyStatus === (isSafe ? 'SAFE' : 'UNSAFE'));
  }
}
