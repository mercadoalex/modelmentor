/**
 * Synthetic Dataset Generator Service
 *
 * Provides client-side synthetic dataset generation for all supported model types.
 * Ensures guided tours can complete end-to-end without depending on external data.
 *
 * Features:
 * - Deterministic generation with optional seeding
 * - Offline capability (no network calls)
 * - Synchronous operation
 * - Unified API across all model types
 */

import type { ModelType } from '@/types/types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Standard output format for tabular data generators (text, classification, regression)
 */
export interface GeneratedDataset {
  headers: string[];
  rows: string[][];
}

/**
 * Options for dataset generation
 */
export interface GeneratorOptions {
  /** Number of rows to generate (default varies by generator) */
  rowCount?: number;
  /** Optional seed for deterministic generation */
  seed?: number;
}

/**
 * Single image entry in an image classification dataset
 */
export interface ImageDatasetRow {
  /** Base64 data URI, e.g., 'data:image/png;base64,...' */
  imageDataUri: string;
  /** Class label for this image */
  label: string;
  /** Suggested filename, e.g., 'circle_001.png' */
  filename: string;
}

/**
 * Output format for image classification generator
 */
export interface ImageGeneratedDataset {
  images: ImageDatasetRow[];
  /** Unique class labels, e.g., ['circle', 'square'] */
  labels: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Errors
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Error thrown when an unsupported model type is requested
 */
export class UnsupportedModelTypeError extends Error {
  constructor(modelType: string) {
    super(
      `Model type "${modelType}" is not supported. Supported types: text_classification, classification, regression, image_classification`
    );
    this.name = 'UnsupportedModelTypeError';
  }
}

/**
 * Error thrown when invalid options are provided
 */
export class InvalidOptionsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidOptionsError';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Seeded Random Number Generator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Deterministic pseudo-random number generator using Linear Congruential Generator algorithm.
 * Provides reproducible random sequences when given the same seed.
 */
export class SeededRandom {
  private seed: number;

  constructor(seed?: number) {
    // Use current timestamp if no seed provided
    this.seed = seed ?? Date.now();
  }

  /**
   * Generate next random number between 0 and 1
   */
  next(): number {
    // Linear congruential generator constants (same as glibc)
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  /**
   * Generate random number between min and max
   */
  between(min: number, max: number, decimals = 0): number {
    const val = min + this.next() * (max - min);
    return decimals > 0 ? parseFloat(val.toFixed(decimals)) : Math.round(val);
  }

  /**
   * Pick a random element from an array
   */
  choice<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  /**
   * Shuffle an array in place using Fisher-Yates algorithm
   */
  shuffle<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Generate a random number from a normal distribution using Box-Muller transform
   */
  gaussian(mean = 0, stdDev = 1): number {
    const u1 = this.next();
    const u2 = this.next();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Text Classification Generator
// ─────────────────────────────────────────────────────────────────────────────

// Phrase templates for sentiment analysis - 50+ unique phrases per class
const POSITIVE_PHRASES = [
  'Absolutely love this product! Works perfectly.',
  'Great quality, fast shipping. Highly recommend!',
  'Exceeded my expectations. Will buy again.',
  'Perfect fit, looks exactly like the picture.',
  'Amazing value for the price. Very happy!',
  'Fantastic product, my family loves it.',
  'Super easy to use and works great.',
  'Best purchase I made this year!',
  'Outstanding quality and quick delivery.',
  'Five stars! Would definitely recommend.',
  'Incredible product, exceeded all expectations.',
  'So happy with this purchase, works flawlessly.',
  'Top notch quality, worth every penny.',
  'Exactly what I needed, perfect condition.',
  'Wonderful product, fast delivery too.',
  'Love it! Better than I expected.',
  'Great product, great price, great service.',
  'Highly satisfied with this purchase.',
  'This is exactly what I was looking for.',
  'Impressed with the quality and durability.',
  'Excellent product, will order again.',
  'Very pleased with my purchase.',
  'Works like a charm, highly recommend.',
  'Beautiful product, arrived quickly.',
  'Superb quality, very well made.',
  'Absolutely fantastic, no complaints.',
  'Perfect in every way, love it.',
  'Great value, excellent quality.',
  'Very happy customer here!',
  'This product is amazing, thank you!',
  'Brilliant product, fast shipping.',
  'Exceeded expectations in every way.',
  'So glad I bought this, works great.',
  'Wonderful quality, highly recommend.',
  'Best product I have purchased online.',
  'Fantastic quality for the price.',
  'Very impressed with this item.',
  'Love everything about this product.',
  'Great purchase, no regrets at all.',
  'Excellent value and quality.',
  'Perfect product, arrived on time.',
  'Really happy with this purchase.',
  'Outstanding product, will buy more.',
  'Highly recommend this to everyone.',
  'Great product, exceeded expectations.',
  'Very satisfied customer, thank you!',
  'Amazing quality, fast delivery.',
  'Love this product so much!',
  'Best decision I made, great product.',
  'Wonderful item, highly satisfied.',
];

const NEGATIVE_PHRASES = [
  'Terrible quality, broke after one week.',
  'Does not match the description at all.',
  'Very disappointed. Waste of money.',
  'Arrived damaged and customer service was unhelpful.',
  'Poor quality materials, fell apart quickly.',
  'Completely different from the photo shown.',
  'Stopped working after 3 days. Awful.',
  'Not worth the price at all.',
  'Worst product I have ever bought.',
  'Would give zero stars if I could.',
  'Extremely disappointed with this purchase.',
  'Product arrived broken, very frustrating.',
  'Cheap quality, not as advertised.',
  'Total waste of money, do not buy.',
  'Very poor quality, fell apart immediately.',
  'Nothing like the pictures, very misleading.',
  'Defective product, returning immediately.',
  'Horrible experience, never buying again.',
  'Product does not work as described.',
  'Very unhappy with this purchase.',
  'Terrible product, complete disappointment.',
  'Arrived late and was damaged.',
  'Poor craftsmanship, very flimsy.',
  'Not what I ordered, very upset.',
  'Cheaply made, broke right away.',
  'Awful quality, requesting refund.',
  'Does not function properly at all.',
  'Extremely poor quality materials.',
  'Biggest regret, do not recommend.',
  'Product is a complete scam.',
  'Terrible experience from start to finish.',
  'Very low quality, not worth it.',
  'Disappointed with the product quality.',
  'Arrived in terrible condition.',
  'Does not work, waste of time.',
  'Poor quality, broke within days.',
  'Not as described, very misleading.',
  'Horrible product, avoid at all costs.',
  'Cheapest quality I have ever seen.',
  'Very frustrated with this purchase.',
  'Product failed after first use.',
  'Terrible value for money.',
  'Would not recommend to anyone.',
  'Extremely poor customer service too.',
  'Product is completely useless.',
  'Very disappointed, expected better.',
  'Awful product, returning for refund.',
  'Not functional, total disappointment.',
  'Worst purchase I have ever made.',
  'Stay away from this product.',
];

/**
 * Generate a text classification dataset for sentiment analysis
 */
export function generateTextClassification(options?: GeneratorOptions): GeneratedDataset {
  const rowCount = options?.rowCount ?? 100;

  if (rowCount < 1) {
    throw new InvalidOptionsError(`Row count must be at least 1, received: ${rowCount}`);
  }

  const rng = new SeededRandom(options?.seed);
  const rows: string[][] = [];

  // Generate balanced classes
  for (let i = 0; i < rowCount; i++) {
    const isPositive = i % 2 === 0;
    const phrases = isPositive ? POSITIVE_PHRASES : NEGATIVE_PHRASES;
    const text = rng.choice(phrases);
    const sentiment = isPositive ? 'positive' : 'negative';
    rows.push([text, sentiment]);
  }

  // Shuffle to avoid predictable ordering
  const shuffledRows = rng.shuffle(rows);

  return {
    headers: ['review_text', 'sentiment'],
    rows: shuffledRows,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Numeric Classification Generator
// ─────────────────────────────────────────────────────────────────────────────

// Class definitions for Iris-like dataset with distinct but overlapping ranges
const CLASSIFICATION_CLASSES = [
  {
    name: 'setosa',
    sepalLength: [4.3, 5.8],
    sepalWidth: [2.3, 4.4],
    petalLength: [1.0, 1.9],
    petalWidth: [0.1, 0.6],
  },
  {
    name: 'versicolor',
    sepalLength: [4.9, 7.0],
    sepalWidth: [2.0, 3.4],
    petalLength: [3.0, 5.1],
    petalWidth: [1.0, 1.8],
  },
  {
    name: 'virginica',
    sepalLength: [4.9, 7.9],
    sepalWidth: [2.2, 3.8],
    petalLength: [4.5, 6.9],
    petalWidth: [1.4, 2.5],
  },
];

/**
 * Generate a numeric classification dataset (Iris-like)
 */
export function generateClassification(options?: GeneratorOptions): GeneratedDataset {
  const rowCount = options?.rowCount ?? 150;

  if (rowCount < 1) {
    throw new InvalidOptionsError(`Row count must be at least 1, received: ${rowCount}`);
  }

  const rng = new SeededRandom(options?.seed);
  const rows: string[][] = [];

  // Generate balanced classes
  for (let i = 0; i < rowCount; i++) {
    const classIdx = i % CLASSIFICATION_CLASSES.length;
    const cls = CLASSIFICATION_CLASSES[classIdx];

    const sepalLength = rng.between(cls.sepalLength[0], cls.sepalLength[1], 1);
    const sepalWidth = rng.between(cls.sepalWidth[0], cls.sepalWidth[1], 1);
    const petalLength = rng.between(cls.petalLength[0], cls.petalLength[1], 1);
    const petalWidth = rng.between(cls.petalWidth[0], cls.petalWidth[1], 1);

    rows.push([
      sepalLength.toString(),
      sepalWidth.toString(),
      petalLength.toString(),
      petalWidth.toString(),
      cls.name,
    ]);
  }

  // Shuffle to avoid predictable ordering
  const shuffledRows = rng.shuffle(rows);

  return {
    headers: ['sepal_length', 'sepal_width', 'petal_length', 'petal_width', 'species'],
    rows: shuffledRows,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Regression Generator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a regression dataset (house prices-like)
 */
export function generateRegression(options?: GeneratorOptions): GeneratedDataset {
  const rowCount = options?.rowCount ?? 200;

  if (rowCount < 1) {
    throw new InvalidOptionsError(`Row count must be at least 1, received: ${rowCount}`);
  }

  const rng = new SeededRandom(options?.seed);
  const rows: string[][] = [];

  for (let i = 0; i < rowCount; i++) {
    // Generate features with realistic ranges
    const sqft = rng.between(600, 4000);
    const bedrooms = rng.between(1, 6);
    const bathrooms = rng.between(1, 4);
    const ageYears = rng.between(0, 60);
    const garage = rng.between(0, 2);

    // Price formula with realistic weights + noise
    // This creates a clear linear relationship that models can learn
    const basePrice =
      sqft * 150 +
      bedrooms * 10000 +
      bathrooms * 8000 -
      ageYears * 1000 +
      garage * 15000;

    // Add Gaussian noise (stdDev ~10% of typical price)
    const noise = rng.gaussian(0, 15000);
    const price = Math.max(50000, Math.round(basePrice + noise));

    rows.push([
      sqft.toString(),
      bedrooms.toString(),
      bathrooms.toString(),
      ageYears.toString(),
      garage.toString(),
      price.toString(),
    ]);
  }

  return {
    headers: ['sqft', 'bedrooms', 'bathrooms', 'age_years', 'garage', 'price'],
    rows,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Image Classification Generator
// ─────────────────────────────────────────────────────────────────────────────

import { BUNDLED_IMAGES, type BundledImage } from '@/data/bundledImages';

/**
 * Generate an image classification dataset using bundled images
 * Uses pre-generated SVG shapes from the bundledImages module
 */
export function generateImageClassification(options?: GeneratorOptions): ImageGeneratedDataset {
  const rng = new SeededRandom(options?.seed);

  // Get shapes dataset from bundled images
  const shapesDataset = BUNDLED_IMAGES.shapes;

  if (!shapesDataset || shapesDataset.length === 0) {
    // Fallback: generate inline SVG shapes if bundled images not available
    return generateFallbackImageDataset(rng);
  }

  // Convert BundledImage to ImageDatasetRow
  const images: ImageDatasetRow[] = shapesDataset.map((img: BundledImage) => ({
    imageDataUri: img.dataUri,
    label: img.label,
    filename: img.filename,
  }));

  // Shuffle images for variety
  const shuffledImages = rng.shuffle(images);

  // Get unique labels
  const labels = [...new Set(shuffledImages.map(img => img.label))];

  return {
    images: shuffledImages,
    labels,
  };
}

/**
 * Fallback image generator if bundled images are not available
 */
function generateFallbackImageDataset(rng: SeededRandom): ImageGeneratedDataset {
  const images: ImageDatasetRow[] = [];
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];

  // Generate circles (class 1)
  for (let i = 0; i < 10; i++) {
    const color = rng.choice(colors);
    const radius = rng.between(15, 25);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <rect width="64" height="64" fill="#f5f5f5"/>
      <circle cx="32" cy="32" r="${radius}" fill="${color}"/>
    </svg>`;
    const dataUri = `data:image/svg+xml;base64,${btoa(svg)}`;
    images.push({
      imageDataUri: dataUri,
      label: 'circle',
      filename: `circle_${String(i + 1).padStart(3, '0')}.svg`,
    });
  }

  // Generate squares (class 2)
  for (let i = 0; i < 10; i++) {
    const color = rng.choice(colors);
    const size = rng.between(25, 40);
    const offset = (64 - size) / 2;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <rect width="64" height="64" fill="#f5f5f5"/>
      <rect x="${offset}" y="${offset}" width="${size}" height="${size}" fill="${color}"/>
    </svg>`;
    const dataUri = `data:image/svg+xml;base64,${btoa(svg)}`;
    images.push({
      imageDataUri: dataUri,
      label: 'square',
      filename: `square_${String(i + 1).padStart(3, '0')}.svg`,
    });
  }

  // Shuffle images
  const shuffledImages = rng.shuffle(images);

  return {
    images: shuffledImages,
    labels: ['circle', 'square'],
  };
}

/**
 * Generate a color patterns dataset - images with dominant colors
 * Great for teaching how models learn to recognize color features
 */
export function generateColorPatterns(options?: GeneratorOptions): ImageGeneratedDataset {
  const rng = new SeededRandom(options?.seed);
  const images: ImageDatasetRow[] = [];

  // Color definitions with variations
  const colorClasses = [
    { name: 'red', baseColors: ['#FF0000', '#FF4444', '#CC0000', '#FF6666', '#EE0000', '#DD2222'] },
    { name: 'green', baseColors: ['#00FF00', '#44FF44', '#00CC00', '#66FF66', '#00EE00', '#22DD22'] },
    { name: 'blue', baseColors: ['#0000FF', '#4444FF', '#0000CC', '#6666FF', '#0000EE', '#2222DD'] },
  ];

  // Generate 12 images per color class (36 total)
  for (const colorClass of colorClasses) {
    for (let i = 0; i < 12; i++) {
      const mainColor = rng.choice(colorClass.baseColors);
      const patternType = rng.between(0, 3);
      
      let svg: string;
      
      switch (patternType) {
        case 0: // Solid with gradient
          svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
            <defs>
              <linearGradient id="grad${i}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:${mainColor};stop-opacity:1" />
                <stop offset="100%" style="stop-color:${mainColor};stop-opacity:0.6" />
              </linearGradient>
            </defs>
            <rect width="64" height="64" fill="url(#grad${i})"/>
          </svg>`;
          break;
        case 1: // Circles pattern
          const circleCount = rng.between(3, 6);
          let circles = '';
          for (let c = 0; c < circleCount; c++) {
            const cx = rng.between(10, 54);
            const cy = rng.between(10, 54);
            const r = rng.between(5, 15);
            circles += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${mainColor}" opacity="${rng.between(5, 10) / 10}"/>`;
          }
          svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
            <rect width="64" height="64" fill="#f5f5f5"/>
            ${circles}
          </svg>`;
          break;
        case 2: // Stripes
          const stripeWidth = rng.between(8, 16);
          let stripes = '';
          for (let s = 0; s < 64; s += stripeWidth * 2) {
            stripes += `<rect x="${s}" y="0" width="${stripeWidth}" height="64" fill="${mainColor}"/>`;
          }
          svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
            <rect width="64" height="64" fill="#f5f5f5"/>
            ${stripes}
          </svg>`;
          break;
        default: // Large centered shape
          svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
            <rect width="64" height="64" fill="#f5f5f5"/>
            <rect x="8" y="8" width="48" height="48" fill="${mainColor}" rx="4"/>
          </svg>`;
      }
      
      const dataUri = `data:image/svg+xml;base64,${btoa(svg)}`;
      images.push({
        imageDataUri: dataUri,
        label: colorClass.name,
        filename: `${colorClass.name}_${String(i + 1).padStart(3, '0')}.svg`,
      });
    }
  }

  const shuffledImages = rng.shuffle(images);
  return {
    images: shuffledImages,
    labels: colorClasses.map(c => c.name),
  };
}

/**
 * Generate a handwritten digits dataset (simplified MNIST-like)
 * Uses SVG paths to create digit-like shapes
 */
export function generateDigits(options?: GeneratorOptions): ImageGeneratedDataset {
  const rng = new SeededRandom(options?.seed);
  const images: ImageDatasetRow[] = [];

  // SVG paths for digits 0-9 (simplified representations)
  const digitPaths: Record<string, string[]> = {
    '0': [
      'M32 8 C16 8 12 20 12 32 C12 44 16 56 32 56 C48 56 52 44 52 32 C52 20 48 8 32 8 Z',
      'M32 10 Q14 10 14 32 Q14 54 32 54 Q50 54 50 32 Q50 10 32 10 Z',
    ],
    '1': [
      'M24 16 L32 8 L32 56 M24 56 L40 56',
      'M28 14 L34 8 L34 56 M26 56 L42 56',
    ],
    '2': [
      'M16 16 Q16 8 32 8 Q48 8 48 20 Q48 32 32 40 L16 56 L48 56',
      'M14 18 Q14 8 32 8 Q50 8 50 18 Q50 32 32 42 L14 56 L50 56',
    ],
    '3': [
      'M16 8 L48 8 L32 28 Q48 28 48 42 Q48 56 32 56 Q16 56 16 48',
      'M14 8 L50 8 L32 26 Q50 26 50 41 Q50 56 32 56 Q14 56 14 46',
    ],
    '4': [
      'M40 56 L40 8 L12 40 L52 40',
      'M42 56 L42 8 L10 42 L54 42',
    ],
    '5': [
      'M48 8 L16 8 L16 28 Q32 24 44 32 Q52 40 44 52 Q36 56 24 56',
      'M50 8 L14 8 L14 26 Q32 22 46 30 Q54 38 46 50 Q38 56 22 56',
    ],
    '6': [
      'M44 8 Q16 16 16 40 Q16 56 32 56 Q48 56 48 44 Q48 32 32 32 Q16 32 16 40',
      'M46 8 Q14 18 14 38 Q14 56 32 56 Q50 56 50 42 Q50 30 32 30 Q14 30 14 38',
    ],
    '7': [
      'M16 8 L48 8 L28 56',
      'M14 8 L50 8 L26 56',
    ],
    '8': [
      'M32 8 Q16 8 16 20 Q16 32 32 32 Q48 32 48 20 Q48 8 32 8 M32 32 Q16 32 16 44 Q16 56 32 56 Q48 56 48 44 Q48 32 32 32',
      'M32 8 Q14 8 14 18 Q14 30 32 30 Q50 30 50 18 Q50 8 32 8 M32 30 Q14 30 14 43 Q14 56 32 56 Q50 56 50 43 Q50 30 32 30',
    ],
    '9': [
      'M48 48 Q48 56 32 56 Q16 56 16 44 Q16 32 32 32 Q48 32 48 20 Q48 8 32 8 Q16 8 16 20',
      'M50 46 Q50 56 32 56 Q14 56 14 42 Q14 30 32 30 Q50 30 50 18 Q50 8 32 8 Q14 8 14 18',
    ],
  };

  const colors = ['#1a1a1a', '#333333', '#4a4a4a', '#2d2d2d', '#404040'];

  // Generate 4 images per digit (40 total)
  for (let digit = 0; digit <= 9; digit++) {
    const paths = digitPaths[digit.toString()];
    for (let i = 0; i < 4; i++) {
      const path = rng.choice(paths);
      const color = rng.choice(colors);
      const strokeWidth = rng.between(3, 5);
      
      // Add slight random offset for variation
      const offsetX = rng.between(-2, 2);
      const offsetY = rng.between(-2, 2);
      
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
        <rect width="64" height="64" fill="#f5f5f5"/>
        <g transform="translate(${offsetX}, ${offsetY})">
          <path d="${path}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
      </svg>`;
      
      const dataUri = `data:image/svg+xml;base64,${btoa(svg)}`;
      images.push({
        imageDataUri: dataUri,
        label: digit.toString(),
        filename: `digit_${digit}_${String(i + 1).padStart(3, '0')}.svg`,
      });
    }
  }

  const shuffledImages = rng.shuffle(images);
  return {
    images: shuffledImages,
    labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  };
}

/**
 * Generate an animals silhouettes dataset
 * Simple animal shapes for classification
 */
export function generateAnimalSilhouettes(options?: GeneratorOptions): ImageGeneratedDataset {
  const rng = new SeededRandom(options?.seed);
  const images: ImageDatasetRow[] = [];

  // Simple animal silhouette paths
  const animalPaths: Record<string, string[]> = {
    'cat': [
      // Cat sitting silhouette
      'M20 50 Q15 45 15 35 L15 25 Q15 20 20 18 L22 12 L26 18 L38 18 L42 12 L44 18 Q49 20 49 25 L49 35 Q49 45 44 50 Z M24 28 L24 32 M40 28 L40 32 M28 38 Q32 42 36 38',
      'M18 52 Q12 46 12 34 L12 24 Q12 18 18 16 L21 8 L26 16 L38 16 L43 8 L46 16 Q52 18 52 24 L52 34 Q52 46 46 52 Z',
    ],
    'dog': [
      // Dog silhouette
      'M12 45 L12 30 Q12 22 20 20 L20 12 Q22 8 28 10 L32 14 L40 14 Q48 14 50 22 L50 30 L55 35 L55 45 Q55 50 50 50 L45 50 L45 55 L35 55 L35 50 L25 50 L25 55 L15 55 L15 50 Q12 50 12 45 Z',
      'M10 46 L10 28 Q10 20 18 18 L18 10 Q20 6 26 8 L30 12 L42 12 Q50 12 52 20 L52 28 L58 34 L58 46 Q58 52 52 52 L46 52 L46 58 L36 58 L36 52 L24 52 L24 58 L14 58 L14 52 Q10 52 10 46 Z',
    ],
    'bird': [
      // Bird silhouette
      'M8 32 Q8 28 12 26 L20 26 Q24 20 32 20 Q44 20 50 28 L56 28 L54 32 L50 32 Q48 40 40 44 L32 44 Q24 44 20 40 L16 44 L12 40 Q8 36 8 32 Z M40 28 L42 28',
      'M6 34 Q6 28 12 26 L22 26 Q26 18 34 18 Q48 18 54 28 L60 28 L58 34 L52 34 Q50 44 40 48 L32 48 Q22 48 18 42 L14 48 L10 42 Q6 38 6 34 Z',
    ],
  };

  const colors = ['#2c3e50', '#34495e', '#1a252f', '#2d3436', '#353b48'];

  // Generate 12 images per animal (36 total)
  for (const [animal, paths] of Object.entries(animalPaths)) {
    for (let i = 0; i < 12; i++) {
      const path = rng.choice(paths);
      const color = rng.choice(colors);
      const scale = rng.between(90, 110) / 100;
      const offsetX = rng.between(-3, 3);
      const offsetY = rng.between(-3, 3);
      
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
        <rect width="64" height="64" fill="#f5f5f5"/>
        <g transform="translate(${32 + offsetX}, ${32 + offsetY}) scale(${scale}) translate(-32, -32)">
          <path d="${path}" fill="${color}"/>
        </g>
      </svg>`;
      
      const dataUri = `data:image/svg+xml;base64,${btoa(svg)}`;
      images.push({
        imageDataUri: dataUri,
        label: animal,
        filename: `${animal}_${String(i + 1).padStart(3, '0')}.svg`,
      });
    }
  }

  const shuffledImages = rng.shuffle(images);
  return {
    images: shuffledImages,
    labels: Object.keys(animalPaths),
  };
}

/**
 * Generate a fashion items dataset (simplified Fashion-MNIST-like)
 * Classifies clothing items: shirt, pants, shoe, bag
 */
export function generateFashionItems(options?: GeneratorOptions): ImageGeneratedDataset {
  const rng = new SeededRandom(options?.seed);
  const images: ImageDatasetRow[] = [];

  // Simple fashion item silhouette paths
  const fashionPaths: Record<string, string[]> = {
    'shirt': [
      // T-shirt shape
      'M16 16 L24 8 L40 8 L48 16 L48 20 L44 20 L44 56 L20 56 L20 20 L16 20 Z M28 8 L28 16 L36 16 L36 8',
      'M14 18 L22 8 L42 8 L50 18 L50 22 L46 22 L46 54 L18 54 L18 22 L14 22 Z',
    ],
    'pants': [
      // Pants/trousers shape
      'M18 8 L46 8 L46 20 L40 20 L40 56 L36 56 L32 28 L28 56 L24 56 L24 20 L18 20 Z',
      'M16 8 L48 8 L48 22 L42 22 L42 56 L38 56 L32 30 L26 56 L22 56 L22 22 L16 22 Z',
    ],
    'shoe': [
      // Shoe/sneaker shape
      'M8 40 L8 32 Q8 24 16 24 L48 24 Q56 24 56 32 L56 44 Q56 48 52 48 L12 48 Q8 48 8 44 Z M16 32 L20 32 M44 32 L48 32',
      'M6 42 L6 30 Q6 22 14 22 L50 22 Q58 22 58 30 L58 46 Q58 50 54 50 L10 50 Q6 50 6 46 Z',
    ],
    'bag': [
      // Handbag/tote shape
      'M16 20 Q16 12 24 12 L40 12 Q48 12 48 20 L48 52 Q48 56 44 56 L20 56 Q16 56 16 52 Z M24 12 L24 8 Q24 4 32 4 Q40 4 40 8 L40 12',
      'M14 22 Q14 12 22 12 L42 12 Q50 12 50 22 L50 50 Q50 56 44 56 L20 56 Q14 56 14 50 Z M22 12 L22 6 Q22 2 32 2 Q42 2 42 6 L42 12',
    ],
  };

  const colors = ['#3498db', '#e74c3c', '#2ecc71', '#9b59b6', '#f39c12', '#1abc9c', '#34495e', '#e91e63'];

  // Generate 10 images per item (40 total)
  for (const [item, paths] of Object.entries(fashionPaths)) {
    for (let i = 0; i < 10; i++) {
      const path = rng.choice(paths);
      const color = rng.choice(colors);
      const scale = rng.between(92, 108) / 100;
      const offsetX = rng.between(-2, 2);
      const offsetY = rng.between(-2, 2);
      
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
        <rect width="64" height="64" fill="#f5f5f5"/>
        <g transform="translate(${32 + offsetX}, ${32 + offsetY}) scale(${scale}) translate(-32, -32)">
          <path d="${path}" fill="${color}"/>
        </g>
      </svg>`;
      
      const dataUri = `data:image/svg+xml;base64,${btoa(svg)}`;
      images.push({
        imageDataUri: dataUri,
        label: item,
        filename: `${item}_${String(i + 1).padStart(3, '0')}.svg`,
      });
    }
  }

  const shuffledImages = rng.shuffle(images);
  return {
    images: shuffledImages,
    labels: Object.keys(fashionPaths),
  };
}

/**
 * Generate a vehicles dataset
 * Classifies vehicle types: car, truck, motorcycle, bicycle
 */
export function generateVehicles(options?: GeneratorOptions): ImageGeneratedDataset {
  const rng = new SeededRandom(options?.seed);
  const images: ImageDatasetRow[] = [];

  // Simple vehicle silhouette paths
  const vehiclePaths: Record<string, string[]> = {
    'car': [
      // Sedan car shape
      'M8 40 L8 36 L12 36 L16 28 L44 28 L52 36 L56 36 L56 40 L52 40 Q52 46 46 46 Q40 46 40 40 L24 40 Q24 46 18 46 Q12 46 12 40 Z',
      'M6 42 L6 38 L10 38 L14 28 L46 28 L54 38 L58 38 L58 42 L54 42 Q54 48 48 48 Q42 48 42 42 L22 42 Q22 48 16 48 Q10 48 10 42 Z',
    ],
    'truck': [
      // Pickup truck shape
      'M4 40 L4 32 L8 32 L8 24 L28 24 L28 32 L36 32 L44 28 L56 28 L56 40 L52 40 Q52 46 46 46 Q40 46 40 40 L20 40 Q20 46 14 46 Q8 46 8 40 Z',
      'M2 42 L2 30 L6 30 L6 22 L30 22 L30 30 L38 30 L46 26 L58 26 L58 42 L54 42 Q54 48 48 48 Q42 48 42 42 L18 42 Q18 48 12 48 Q6 48 6 42 Z',
    ],
    'motorcycle': [
      // Motorcycle shape
      'M12 44 Q12 38 18 38 L22 38 L26 32 L38 32 L42 28 L48 28 L52 32 L52 38 Q58 38 58 44 Q58 50 52 50 Q46 50 46 44 L22 44 Q22 50 16 50 Q10 50 12 44 Z M30 32 L30 38',
      'M10 46 Q10 40 16 40 L20 40 L24 34 L40 34 L44 30 L50 30 L54 34 L54 40 Q60 40 60 46 Q60 52 54 52 Q48 52 48 46 L20 46 Q20 52 14 52 Q8 52 10 46 Z',
    ],
    'bicycle': [
      // Bicycle shape
      'M16 44 Q16 38 22 38 L26 38 L32 28 L38 28 L44 38 L48 38 Q54 38 54 44 Q54 50 48 50 Q42 50 42 44 L28 44 Q28 50 22 50 Q16 50 16 44 Z M32 28 L32 38 M26 38 L38 38',
      'M14 46 Q14 40 20 40 L24 40 L30 28 L40 28 L46 40 L50 40 Q56 40 56 46 Q56 52 50 52 Q44 52 44 46 L26 46 Q26 52 20 52 Q14 52 14 46 Z',
    ],
  };

  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#e91e63'];

  // Generate 10 images per vehicle (40 total)
  for (const [vehicle, paths] of Object.entries(vehiclePaths)) {
    for (let i = 0; i < 10; i++) {
      const path = rng.choice(paths);
      const color = rng.choice(colors);
      const scale = rng.between(92, 108) / 100;
      const offsetX = rng.between(-2, 2);
      const offsetY = rng.between(-2, 2);
      
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
        <rect width="64" height="64" fill="#f5f5f5"/>
        <g transform="translate(${32 + offsetX}, ${32 + offsetY}) scale(${scale}) translate(-32, -32)">
          <path d="${path}" fill="${color}"/>
        </g>
      </svg>`;
      
      const dataUri = `data:image/svg+xml;base64,${btoa(svg)}`;
      images.push({
        imageDataUri: dataUri,
        label: vehicle,
        filename: `${vehicle}_${String(i + 1).padStart(3, '0')}.svg`,
      });
    }
  }

  const shuffledImages = rng.shuffle(images);
  return {
    images: shuffledImages,
    labels: Object.keys(vehiclePaths),
  };
}

/**
 * Generate a simple flowers dataset
 * Classifies flower types: rose, tulip, sunflower, daisy
 */
export function generateFlowers(options?: GeneratorOptions): ImageGeneratedDataset {
  const rng = new SeededRandom(options?.seed);
  const images: ImageDatasetRow[] = [];

  // Flower colors by type
  const flowerColors: Record<string, string[]> = {
    'rose': ['#e74c3c', '#c0392b', '#ff6b6b', '#ee5a5a', '#d63031'],
    'tulip': ['#9b59b6', '#8e44ad', '#e91e63', '#ff4081', '#f06292'],
    'sunflower': ['#f1c40f', '#f39c12', '#ffeb3b', '#ffc107', '#ffca28'],
    'daisy': ['#ecf0f1', '#bdc3c7', '#ffffff', '#f5f5f5', '#e0e0e0'],
  };

  // Generate 10 images per flower (40 total)
  for (const [flower, colors] of Object.entries(flowerColors)) {
    for (let i = 0; i < 10; i++) {
      const petalColor = rng.choice(colors);
      const centerColor = flower === 'sunflower' ? '#8b4513' : flower === 'daisy' ? '#f1c40f' : '#2c3e50';
      const stemColor = '#27ae60';
      const rotation = rng.between(0, 360);
      const scale = rng.between(90, 110) / 100;
      
      let petals = '';
      const petalCount = flower === 'sunflower' ? 16 : flower === 'daisy' ? 12 : 8;
      const petalLength = flower === 'sunflower' ? 18 : flower === 'tulip' ? 20 : 14;
      
      for (let p = 0; p < petalCount; p++) {
        const angle = (p * 360 / petalCount) + rng.between(-5, 5);
        if (flower === 'tulip') {
          // Tulip has cup-shaped petals
          petals += `<ellipse cx="32" cy="${32 - petalLength/2}" rx="6" ry="${petalLength}" fill="${petalColor}" transform="rotate(${angle}, 32, 32)"/>`;
        } else {
          // Other flowers have round petals
          petals += `<ellipse cx="32" cy="${32 - petalLength}" rx="5" ry="${petalLength/2}" fill="${petalColor}" transform="rotate(${angle}, 32, 32)"/>`;
        }
      }
      
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
        <rect width="64" height="64" fill="#f5f5f5"/>
        <g transform="translate(32, 32) scale(${scale}) rotate(${rotation}) translate(-32, -32)">
          <line x1="32" y1="40" x2="32" y2="60" stroke="${stemColor}" stroke-width="3"/>
          ${petals}
          <circle cx="32" cy="32" r="${flower === 'sunflower' ? 8 : 5}" fill="${centerColor}"/>
        </g>
      </svg>`;
      
      const dataUri = `data:image/svg+xml;base64,${btoa(svg)}`;
      images.push({
        imageDataUri: dataUri,
        label: flower,
        filename: `${flower}_${String(i + 1).padStart(3, '0')}.svg`,
      });
    }
  }

  const shuffledImages = rng.shuffle(images);
  return {
    images: shuffledImages,
    labels: Object.keys(flowerColors),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Unified Service Interface
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Supported model types for synthetic data generation
 */
const SUPPORTED_MODEL_TYPES: ModelType[] = [
  'text_classification',
  'classification',
  'regression',
  'image_classification',
];

/**
 * Check if a model type is supported for synthetic data generation
 */
export function isModelTypeSupported(modelType: ModelType): boolean {
  return SUPPORTED_MODEL_TYPES.includes(modelType);
}

/**
 * Get the appropriate generator function for a model type
 * @throws UnsupportedModelTypeError if model type is not supported
 */
export function getGeneratorForModelType(
  modelType: ModelType
): (options?: GeneratorOptions) => GeneratedDataset | ImageGeneratedDataset {
  switch (modelType) {
    case 'text_classification':
      return generateTextClassification;
    case 'classification':
      return generateClassification;
    case 'regression':
      return generateRegression;
    case 'image_classification':
      return generateImageClassification;
    default:
      throw new UnsupportedModelTypeError(modelType);
  }
}

/**
 * Generate a dataset for the specified model type
 * @throws UnsupportedModelTypeError if model type is not supported
 */
export function generateForModelType(
  modelType: ModelType,
  options?: GeneratorOptions
): GeneratedDataset | ImageGeneratedDataset {
  const generator = getGeneratorForModelType(modelType);
  return generator(options);
}

// ─────────────────────────────────────────────────────────────────────────────
// Export service object for convenience
// ─────────────────────────────────────────────────────────────────────────────

export const syntheticDatasetGeneratorService = {
  generateTextClassification,
  generateClassification,
  generateRegression,
  generateImageClassification,
  generateColorPatterns,
  generateDigits,
  generateAnimalSilhouettes,
  generateFashionItems,
  generateVehicles,
  generateFlowers,
  generateForModelType,
  getGeneratorForModelType,
  isModelTypeSupported,
  SeededRandom,
};

export default syntheticDatasetGeneratorService;
