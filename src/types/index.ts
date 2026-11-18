export type ScanMode = 'VEG_FRUIT' | 'PACKED_FOOD';

export type SafetyStatus = 'SAFE' | 'UNSAFE';

export type SurfaceGeometry = 'SPHERICAL' | 'CYLINDRICAL' | 'PLANAR';

export interface BoundingBox {
  x: number;      // percentage (0-100) or pixel ratio
  y: number;      // percentage (0-100)
  width: number;  // percentage
  height: number; // percentage
}

export interface FoodDetectionResult {
  id: string;
  name: string;
  brand?: string;
  category: 'FRUIT' | 'VEGETABLE' | 'PACKED_FOOD';
  safetyStatus: SafetyStatus;
  safetyScore: number; // 0 to 100
  confidence: number;  // 0 to 1
  surfaceGeometry?: SurfaceGeometry;
  freshnessLevel?: string;
  pesticideRisk?: 'LOW' | 'MEDIUM' | 'HIGH';
  preservativesRisk?: 'NONE' | 'MODERATE' | 'HIGH';
  sugarLevel?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  sodiumLevel?: 'LOW' | 'MODERATE' | 'HIGH';
  extractedText?: string[]; // OCR extracted text lines
  ingredients?: string[];
  allergens?: string[];
  harmfulAdditives?: Array<{
    code: string;
    name: string;
    description: string;
  }>;
  nutritionalHighlights: string[];
  warnings: string[];
  recommendation: string;
  boundingBox: BoundingBox;
}
