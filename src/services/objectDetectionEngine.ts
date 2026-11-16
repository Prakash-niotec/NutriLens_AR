import { FoodDetectionResult, ScanMode } from '../types';
import { FRUIT_VEG_DATASET } from '../data/fruitVegDataset';

export class ObjectDetectionEngine {
  private static currentIndex = 0;

  /**
   * Simulates real-time fruit & vegetable object detection on a camera frame
   */
  public static async detectProduceFrame(imageUri?: string): Promise<FoodDetectionResult> {
    // Artificial latency to emulate neural network inference
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (imageUri && imageUri.includes('unsafe')) {
      // Return an unsafe item if image matches unsafe keywords
      const unsafeItems = FRUIT_VEG_DATASET.filter(item => item.safetyStatus === 'UNSAFE');
      return unsafeItems[Math.floor(Math.random() * unsafeItems.length)];
    }

    // Cycle through dataset for interactive scanning demonstrations
    const result = FRUIT_VEG_DATASET[this.currentIndex % FRUIT_VEG_DATASET.length];
    this.currentIndex++;
    
    // Add micro jitter to bounding box to feel like live AR tracking
    const jitteredBox = {
      x: Math.max(10, Math.min(30, result.boundingBox.x + (Math.random() * 4 - 2))),
      y: Math.max(15, Math.min(35, result.boundingBox.y + (Math.random() * 4 - 2))),
      width: result.boundingBox.width,
      height: result.boundingBox.height,
    };

    return {
      ...result,
      boundingBox: jitteredBox,
      confidence: parseFloat((0.92 + Math.random() * 0.07).toFixed(2))
    };
  }

  /**
   * Get specific item by ID
   */
  public static getItemById(id: string): FoodDetectionResult | undefined {
    return FRUIT_VEG_DATASET.find(item => item.id === id);
  }

  /**
   * Filter dataset by safety status
   */
  public static filterBySafety(isSafe: boolean): FoodDetectionResult[] {
    return FRUIT_VEG_DATASET.filter(item => item.safetyStatus === (isSafe ? 'SAFE' : 'UNSAFE'));
  }
}
