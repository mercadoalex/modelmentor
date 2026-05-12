/**
 * Bundled Images for Image Classification
 *
 * Contains base64-encoded images for image classification datasets.
 * These images are embedded directly in the application bundle for offline availability.
 *
 * Features:
 * - No network calls required
 * - Each image is under 50KB
 * - Simple geometric shapes for educational purposes
 * - At least 10 images per class
 */

export interface BundledImage {
  /** Base64 data URI, e.g., 'data:image/svg+xml;base64,...' */
  dataUri: string;
  /** Class label for this image */
  label: string;
  /** Suggested filename */
  filename: string;
  /** Approximate size in bytes */
  sizeBytes: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG Shape Generators
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a circle SVG with given parameters
 */
function generateCircleSVG(
  color: string,
  radius: number,
  bgColor = '#f5f5f5'
): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <rect width="64" height="64" fill="${bgColor}"/>
    <circle cx="32" cy="32" r="${radius}" fill="${color}" stroke="${adjustColor(color, -30)}" stroke-width="2"/>
  </svg>`;
}

/**
 * Generate a square SVG with given parameters
 */
function generateSquareSVG(
  color: string,
  size: number,
  bgColor = '#f5f5f5'
): string {
  const offset = (64 - size) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <rect width="64" height="64" fill="${bgColor}"/>
    <rect x="${offset}" y="${offset}" width="${size}" height="${size}" fill="${color}" stroke="${adjustColor(color, -30)}" stroke-width="2"/>
  </svg>`;
}

/**
 * Generate a triangle SVG with given parameters
 */
function generateTriangleSVG(
  color: string,
  size: number,
  bgColor = '#f5f5f5'
): string {
  const halfSize = size / 2;
  const height = size * 0.866; // equilateral triangle height
  const topY = 32 - height / 2;
  const bottomY = 32 + height / 2;
  const leftX = 32 - halfSize;
  const rightX = 32 + halfSize;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <rect width="64" height="64" fill="${bgColor}"/>
    <polygon points="32,${topY} ${leftX},${bottomY} ${rightX},${bottomY}" fill="${color}" stroke="${adjustColor(color, -30)}" stroke-width="2"/>
  </svg>`;
}

/**
 * Adjust color brightness
 */
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Convert SVG string to base64 data URI
 */
function svgToDataUri(svg: string): string {
  // Use encodeURIComponent for better compatibility
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Color Palettes
// ─────────────────────────────────────────────────────────────────────────────

const CIRCLE_COLORS = [
  '#FF6B6B', // coral red
  '#E74C3C', // red
  '#C0392B', // dark red
  '#FF8E72', // salmon
  '#FF5252', // bright red
  '#D32F2F', // material red
  '#F44336', // red 500
  '#EF5350', // red 400
  '#E57373', // red 300
  '#FF7043', // deep orange
  '#FF5722', // orange
  '#FF8A65', // deep orange 300
];

const SQUARE_COLORS = [
  '#4ECDC4', // teal
  '#1ABC9C', // turquoise
  '#16A085', // green sea
  '#2ECC71', // emerald
  '#27AE60', // nephritis
  '#00BCD4', // cyan
  '#009688', // teal 500
  '#26A69A', // teal 400
  '#4DB6AC', // teal 300
  '#00ACC1', // cyan 600
  '#26C6DA', // cyan 400
  '#4DD0E1', // cyan 300
];

const TRIANGLE_COLORS = [
  '#9B59B6', // amethyst
  '#8E44AD', // wisteria
  '#673AB7', // deep purple
  '#7E57C2', // deep purple 400
  '#9575CD', // deep purple 300
  '#AB47BC', // purple 400
  '#BA68C8', // purple 300
  '#CE93D8', // purple 200
  '#7C4DFF', // deep purple A200
  '#651FFF', // deep purple A400
  '#6200EA', // deep purple A700
  '#AA00FF', // purple A700
];

// ─────────────────────────────────────────────────────────────────────────────
// Generate Bundled Images
// ─────────────────────────────────────────────────────────────────────────────

function generateShapesDataset(): BundledImage[] {
  const images: BundledImage[] = [];

  // Generate 12 circles with varying sizes and colors
  for (let i = 0; i < 12; i++) {
    const color = CIRCLE_COLORS[i % CIRCLE_COLORS.length];
    const radius = 18 + (i % 4) * 3; // 18, 21, 24, 27
    const svg = generateCircleSVG(color, radius);
    const dataUri = svgToDataUri(svg);

    images.push({
      dataUri,
      label: 'circle',
      filename: `circle_${String(i + 1).padStart(3, '0')}.svg`,
      sizeBytes: dataUri.length,
    });
  }

  // Generate 12 squares with varying sizes and colors
  for (let i = 0; i < 12; i++) {
    const color = SQUARE_COLORS[i % SQUARE_COLORS.length];
    const size = 30 + (i % 4) * 4; // 30, 34, 38, 42
    const svg = generateSquareSVG(color, size);
    const dataUri = svgToDataUri(svg);

    images.push({
      dataUri,
      label: 'square',
      filename: `square_${String(i + 1).padStart(3, '0')}.svg`,
      sizeBytes: dataUri.length,
    });
  }

  // Generate 12 triangles with varying sizes and colors
  for (let i = 0; i < 12; i++) {
    const color = TRIANGLE_COLORS[i % TRIANGLE_COLORS.length];
    const size = 32 + (i % 4) * 4; // 32, 36, 40, 44
    const svg = generateTriangleSVG(color, size);
    const dataUri = svgToDataUri(svg);

    images.push({
      dataUri,
      label: 'triangle',
      filename: `triangle_${String(i + 1).padStart(3, '0')}.svg`,
      sizeBytes: dataUri.length,
    });
  }

  return images;
}

// ─────────────────────────────────────────────────────────────────────────────
// Export Bundled Images
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pre-generated bundled images organized by dataset name
 */
export const BUNDLED_IMAGES: Record<string, BundledImage[]> = {
  shapes: generateShapesDataset(),
};

/**
 * Get all unique labels from a bundled image dataset
 */
export function getLabelsFromDataset(datasetName: string): string[] {
  const images = BUNDLED_IMAGES[datasetName];
  if (!images) return [];

  const labels = new Set<string>();
  for (const img of images) {
    labels.add(img.label);
  }
  return Array.from(labels);
}

/**
 * Get images filtered by label
 */
export function getImagesByLabel(datasetName: string, label: string): BundledImage[] {
  const images = BUNDLED_IMAGES[datasetName];
  if (!images) return [];

  return images.filter(img => img.label === label);
}

/**
 * Get dataset statistics
 */
export function getDatasetStats(datasetName: string): {
  totalImages: number;
  labels: string[];
  imagesPerLabel: Record<string, number>;
  totalSizeBytes: number;
  averageSizeBytes: number;
} {
  const images = BUNDLED_IMAGES[datasetName];
  if (!images) {
    return {
      totalImages: 0,
      labels: [],
      imagesPerLabel: {},
      totalSizeBytes: 0,
      averageSizeBytes: 0,
    };
  }

  const imagesPerLabel: Record<string, number> = {};
  let totalSizeBytes = 0;

  for (const img of images) {
    imagesPerLabel[img.label] = (imagesPerLabel[img.label] || 0) + 1;
    totalSizeBytes += img.sizeBytes;
  }

  return {
    totalImages: images.length,
    labels: Object.keys(imagesPerLabel),
    imagesPerLabel,
    totalSizeBytes,
    averageSizeBytes: Math.round(totalSizeBytes / images.length),
  };
}

export default BUNDLED_IMAGES;
