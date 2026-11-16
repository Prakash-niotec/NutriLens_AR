import { FoodDetectionResult } from '../types';

export const PACKED_FOOD_DATASET: FoodDetectionResult[] = [
  // --- SAFE PACKED FOODS ---
  {
    id: 'pf-001',
    name: 'Whole Grain Rolled Oats',
    brand: 'NaturePure',
    category: 'PACKED_FOOD',
    safetyStatus: 'SAFE',
    safetyScore: 97,
    confidence: 0.99,
    preservativesRisk: 'NONE',
    sugarLevel: 'LOW',
    sodiumLevel: 'LOW',
    extractedText: [
      'NATUREPURE 100% ORGANIC ROLLED OATS',
      'INGREDIENTS: 100% Organic Whole Grain Oats.',
      'NO ADDED SUGAR | NO ARTIFICIAL PRESERVATIVES | NON-GMO',
      'NET WT 500g (17.6 oz)',
      'NUTRITION: Fiber 10g, Protein 13g, Sugar 0g per 100g'
    ],
    ingredients: ['100% Whole Grain Oats'],
    allergens: ['May contain trace oats (Gluten-free option available)'],
    harmfulAdditives: [],
    nutritionalHighlights: ['High Beta-Glucan Soluble Fiber', 'Zero Added Sugars or Oils', 'Heart-Healthy Certified'],
    warnings: [],
    recommendation: 'Superb health profile! Fully clean label product safe for daily breakfasts.',
    boundingBox: { x: 15, y: 18, width: 70, height: 58 }
  },
  {
    id: 'pf-002',
    name: 'Unsweetened Almond Milk',
    brand: 'Silk & Nut',
    category: 'PACKED_FOOD',
    safetyStatus: 'SAFE',
    safetyScore: 93,
    confidence: 0.96,
    preservativesRisk: 'NONE',
    sugarLevel: 'LOW',
    sodiumLevel: 'LOW',
    extractedText: [
      'SILK & NUT UNSWEETENED ALMOND MILK',
      'INGREDIENTS: Filtered Water, Organic Almonds (2.5%), Calcium Carbonate, Sea Salt, Sunflower Lecithin.',
      '0g ADDED SUGAR | LACTOSE FREE | VEGAN',
      'FORTIFIED WITH VITAMIN E & D2'
    ],
    ingredients: ['Filtered Water', 'Organic Almonds', 'Calcium Carbonate', 'Sea Salt', 'Sunflower Lecithin'],
    allergens: ['Tree Nuts (Almonds)'],
    harmfulAdditives: [],
    nutritionalHighlights: ['Enriched with Calcium & Vitamin D', 'Keto & Low-Calorie Friendly', 'Plant-Based Dairy Alternative'],
    warnings: [],
    recommendation: 'Safe and clean plant-based option. Double-check if you have tree nut allergies.',
    boundingBox: { x: 20, y: 20, width: 60, height: 55 }
  },
  {
    id: 'pf-003',
    name: 'Organic Greek Plain Yogurt',
    brand: 'Olympian Gold',
    category: 'PACKED_FOOD',
    safetyStatus: 'SAFE',
    safetyScore: 95,
    confidence: 0.97,
    preservativesRisk: 'NONE',
    sugarLevel: 'LOW',
    sodiumLevel: 'LOW',
    extractedText: [
      'OLYMPIAN GOLD ORGANIC GREEK YOGURT',
      'INGREDIENTS: Grade A Pasteurized Whole Milk, Live Active Cultures (S. thermophilus, L. bulgaricus, L. acidophilus).',
      '18g PROTEIN PER SERVING | PROBIOTIC RICH'
    ],
    ingredients: ['Pasteurized Whole Milk', 'Live Active Cultures'],
    allergens: ['Milk / Dairy'],
    harmfulAdditives: [],
    nutritionalHighlights: ['Rich in Live Probiotic Cultures', 'High Protein Content (18g)', 'No Gums or Artificial Thickener'],
    warnings: [],
    recommendation: 'Clean protein-dense food. Safe for non-lactose sensitive consumers.',
    boundingBox: { x: 18, y: 22, width: 64, height: 50 }
  },
  {
    id: 'pf-004',
    name: 'Raw Organic Almond Butter',
    brand: 'ArtisanNuts',
    category: 'PACKED_FOOD',
    safetyStatus: 'SAFE',
    safetyScore: 96,
    confidence: 0.98,
    preservativesRisk: 'NONE',
    sugarLevel: 'LOW',
    sodiumLevel: 'LOW',
    extractedText: [
      'ARTISAN NUTS 100% RAW ALMOND BUTTER',
      'INGREDIENTS: 100% Dry Roasted Organic Almonds.',
      'NO ADDED PALM OIL | NO SALT ADDED | NO SUGAR'
    ],
    ingredients: ['Dry Roasted Organic Almonds'],
    allergens: ['Tree Nuts (Almonds)'],
    harmfulAdditives: [],
    nutritionalHighlights: ['Rich in Healthy Monounsaturated Fats', 'High Vitamin E & Magnesium', 'Single Ingredient Clean Label'],
    warnings: [],
    recommendation: 'Pure single-ingredient nut butter. Highly safe and wholesome.',
    boundingBox: { x: 22, y: 20, width: 56, height: 55 }
  },

  // --- UNSAFE PACKED FOODS ---
  {
    id: 'pf-005',
    name: 'Ultra-Processed Chocolate Biscuits',
    brand: 'ChocoCraze',
    category: 'PACKED_FOOD',
    safetyStatus: 'UNSAFE',
    safetyScore: 24,
    confidence: 0.98,
    preservativesRisk: 'HIGH',
    sugarLevel: 'CRITICAL',
    sodiumLevel: 'HIGH',
    extractedText: [
      'CHOCOCRAZE DOUBLE CRISP BISCUITS',
      'INGREDIENTS: Refined Wheat Flour (Maida), High Fructose Corn Syrup, Hydrogenated Palm Oil (Trans Fats), Sugar, Cocoa Powder, Emulsifier (E322), Synthetic Food Color (Tartrazin E102, Allura Red E129), Preservative (E221, Sodium Metabisulfite), Artificial Chocolate Flavor.',
      'CONTAINS PERMITTED SYNTHETIC COLORS & ADDED FLAVORS'
    ],
    ingredients: [
      'Refined Wheat Flour',
      'High Fructose Corn Syrup',
      'Hydrogenated Palm Oil',
      'Sugar',
      'Cocoa Powder',
      'E322 Emulsifier',
      'E102 Synthetic Color',
      'E129 Allura Red',
      'E221 Sodium Metabisulfite'
    ],
    allergens: ['Gluten (Wheat)', 'Sulfites (E221)'],
    harmfulAdditives: [
      { code: 'E102', name: 'Tartrazine', description: 'Linked to hyperactivity in children and asthmatic flare-ups.' },
      { code: 'E129', name: 'Allura Red AC', description: 'Petroleum-derived azo dye associated with hypersensitivity.' },
      { code: 'E221', name: 'Sodium Metabisulfite', description: 'Strong preservative that can trigger severe respiratory discomfort.' }
    ],
    nutritionalHighlights: [],
    warnings: [
      'CRITICAL: Contains High Fructose Corn Syrup (Spikes Blood Glucose)',
      'Contains Hydrogenated Trans Fats (Cardiovascular Health Risk)',
      'Artificial Colorants (E102 & E129) banned in several organic standards'
    ],
    recommendation: 'UNSAFE! Highly processed junk food with toxic additives and high glycemic index.',
    boundingBox: { x: 14, y: 15, width: 72, height: 62 }
  },
  {
    id: 'pf-006',
    name: 'Spicy Instant Ramen Noodle Block',
    brand: 'FieryBowl',
    category: 'PACKED_FOOD',
    safetyStatus: 'UNSAFE',
    safetyScore: 19,
    confidence: 0.96,
    preservativesRisk: 'HIGH',
    sugarLevel: 'MODERATE',
    sodiumLevel: 'HIGH',
    extractedText: [
      'FIERY BOWL EXTRA SPICY NOODLES',
      'INGREDIENTS: Wheat Flour, Palm Oil, Monosodium Glutamate (E621 MSG), Sodium Tripolyphosphate (E451), TBHQ (E319 Preservative), Chili Powder, Disodium Inosinate (E631), Salt (1980mg Sodium per serving).',
      'WARNING: EXCESSIVE SODIUM CONTENT'
    ],
    ingredients: [
      'Wheat Flour',
      'Palm Oil',
      'Monosodium Glutamate (MSG E621)',
      'Sodium Tripolyphosphate E451',
      'TBHQ E319',
      'Chili Powder',
      'Disodium Inosinate E631',
      'Salt'
    ],
    allergens: ['Wheat (Gluten)', 'MSG Sensitivity'],
    harmfulAdditives: [
      { code: 'E319', name: 'TBHQ (Tertiary Butylhydroquinone)', description: 'Synthetic antioxidant linked to stomach tumor risks in high doses.' },
      { code: 'E621', name: 'Monosodium Glutamate (MSG)', description: 'Flavor enhancer that may trigger headache/flushing in sensitive individuals.' },
      { code: 'E451', name: 'Sodium Tripolyphosphate', description: 'Phosphate additive linked to kidney health strain.' }
    ],
    nutritionalHighlights: [],
    warnings: [
      'UNSAFE SODIUM LEVEL: 1,980mg (Nearly 100% Daily Value in one meal!)',
      'Contains TBHQ synthetic preservative',
      'Deep fried in low-grade palm oil'
    ],
    recommendation: 'UNSAFE! Frequent consumption poses severe hypertension and metabolic risks.',
    boundingBox: { x: 16, y: 18, width: 68, height: 58 }
  },
  {
    id: 'pf-007',
    name: 'Fruity Energy Drink Can',
    brand: 'VoltRush',
    category: 'PACKED_FOOD',
    safetyStatus: 'UNSAFE',
    safetyScore: 29,
    confidence: 0.99,
    preservativesRisk: 'MODERATE',
    sugarLevel: 'CRITICAL',
    sodiumLevel: 'LOW',
    extractedText: [
      'VOLTRUSH EXTREME ENERGY DRINK',
      'INGREDIENTS: Carbonated Water, High Fructose Corn Syrup (42g Sugar), Taurine, Synthetic Caffeine (160mg), Sodium Benzoate (E211), Potassium Sorbate (E202), Blue 1 (E133), Niacinamide.',
      'HIGH CAFFEINE CONTENT - NOT RECOMMENDED FOR CHILDREN OR PREGNANT WOMEN'
    ],
    ingredients: ['Carbonated Water', 'HFCS', 'Taurine', 'Synthetic Caffeine', 'Sodium Benzoate E211', 'Blue 1 E133'],
    allergens: ['High Caffeine'],
    harmfulAdditives: [
      { code: 'E211', name: 'Sodium Benzoate', description: 'When combined with Vitamin C, forms benzene (a known carcinogen).' },
      { code: 'E133', name: 'Brilliant Blue FCF', description: 'Synthetic dye linked to neurotoxicity concerns.' }
    ],
    nutritionalHighlights: [],
    warnings: [
      'CRITICAL SUGAR: 42g added sugar per can (168% Daily Maximum)',
      'Hazardous preservative E211 (Sodium Benzoate)',
      'Heavy synthetic caffeine load'
    ],
    recommendation: 'UNSAFE! Extreme sugar crush and nerve stimulant. Avoid.',
    boundingBox: { x: 24, y: 15, width: 52, height: 65 }
  },
  {
    id: 'pf-008',
    name: 'Artificial Flavored Potato Crisps',
    brand: 'CrunchMax',
    category: 'PACKED_FOOD',
    safetyStatus: 'UNSAFE',
    safetyScore: 22,
    confidence: 0.97,
    preservativesRisk: 'HIGH',
    sugarLevel: 'LOW',
    sodiumLevel: 'HIGH',
    extractedText: [
      'CRUNCHMAX CHEESE & ONION CHIPS',
      'INGREDIENTS: Dried Potatoes, Vegetable Oils (Sunflower, Palm), MSG E621, Acidity Regulator E330, Synthetic Colors E110 (Sunset Yellow), Preservative E220.'
    ],
    ingredients: ['Dried Potatoes', 'Palm Oil', 'MSG E621', 'E110 Sunset Yellow', 'E220 Sulfur Dioxide'],
    allergens: ['Sulfites (E220)', 'MSG'],
    harmfulAdditives: [
      { code: 'E110', name: 'Sunset Yellow FCF', description: 'Petroleum-based dye linked to allergic reactions.' },
      { code: 'E621', name: 'MSG', description: 'Excitotoxin flavor enhancer.' }
    ],
    nutritionalHighlights: [],
    warnings: [
      'High Acrylamide compound risk from high-temperature deep frying',
      'Contains E110 synthetic food dye'
    ],
    recommendation: 'UNSAFE snack with synthetic additives and high trans fat content.',
    boundingBox: { x: 18, y: 18, width: 64, height: 60 }
  }
];
