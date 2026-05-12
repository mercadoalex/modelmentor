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
  generateForModelType,
  getGeneratorForModelType,
  isModelTypeSupported,
  SeededRandom,
};

export default syntheticDatasetGeneratorService;
