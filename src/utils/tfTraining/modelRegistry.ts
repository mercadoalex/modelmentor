// src/utils/tfTraining/modelRegistry.ts
// IndexedDB persistence for trained models and metadata

import type { StoredModelMetadata, ModelRegistryEntry } from './types';

const MODEL_KEY_PREFIX = 'modelmentor-';
const META_KEY_PREFIX = 'modelmentor-meta-';

/**
 * Generates the IndexedDB storage key for a project's model.
 */
export function getModelStorageKey(projectId: string): string {
  return `${MODEL_KEY_PREFIX}${projectId}`;
}

/**
 * Generates the localStorage key for a project's model metadata.
 */
export function getMetadataStorageKey(projectId: string): string {
  return `${META_KEY_PREFIX}${projectId}`;
}

/**
 * Saves a trained model and its metadata.
 * Model weights are stored in IndexedDB via TF.js native save.
 * Metadata is stored in localStorage as JSON.
 */
export async function saveModel(entry: ModelRegistryEntry): Promise<void> {
  const { model, metadata } = entry;
  const modelKey = getModelStorageKey(metadata.projectId);

  try {
    // Save model to IndexedDB using TF.js native support
    await model.save(`indexeddb://${modelKey}`);
  } catch (error) {
    // IndexedDB might be unavailable (private browsing) or quota exceeded
    console.warn('Failed to save model to IndexedDB:', error);
    // Model remains in memory for current session
  }

  try {
    // Save metadata to localStorage
    localStorage.setItem(
      getMetadataStorageKey(metadata.projectId),
      JSON.stringify(metadata)
    );
  } catch (error) {
    console.warn('Failed to save model metadata to localStorage:', error);
  }
}

/**
 * Loads a trained model and its metadata for a given project.
 * Returns null if no model exists or if loading fails.
 */
export async function loadModel(projectId: string): Promise<ModelRegistryEntry | null> {
  const modelKey = getModelStorageKey(projectId);
  const metaKey = getMetadataStorageKey(projectId);

  try {
    // Load metadata from localStorage
    const metaJson = localStorage.getItem(metaKey);
    if (!metaJson) {
      return null;
    }
    const metadata: StoredModelMetadata = JSON.parse(metaJson);

    // Dynamically import tf to load the model
    const tf = await import('@tensorflow/tfjs');
    const model = await tf.loadLayersModel(`indexeddb://${modelKey}`);

    return { model, metadata };
  } catch (error) {
    console.warn('Failed to load model:', error);
    return null;
  }
}

/**
 * Checks if a trained model exists for the given project.
 */
export async function hasModel(projectId: string): Promise<boolean> {
  const metaKey = getMetadataStorageKey(projectId);
  try {
    const metaJson = localStorage.getItem(metaKey);
    return metaJson !== null;
  } catch {
    return false;
  }
}

/**
 * Deletes a stored model and its metadata for the given project.
 */
export async function deleteModel(projectId: string): Promise<void> {
  const modelKey = getModelStorageKey(projectId);
  const metaKey = getMetadataStorageKey(projectId);

  try {
    // Remove model from IndexedDB
    const tf = await import('@tensorflow/tfjs');
    await tf.io.removeModel(`indexeddb://${modelKey}`);
  } catch (error) {
    console.warn('Failed to delete model from IndexedDB:', error);
  }

  try {
    // Remove metadata from localStorage
    localStorage.removeItem(metaKey);
  } catch (error) {
    console.warn('Failed to delete model metadata:', error);
  }
}
