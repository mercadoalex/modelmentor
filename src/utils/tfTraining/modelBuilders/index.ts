// src/utils/tfTraining/modelBuilders/index.ts
// Builder registry that selects the correct builder by modelType

import type { ModelBuilderOptions } from '../types';
import { buildClassificationModel } from './classification';
import { buildRegressionModel } from './regression';
import { buildTextClassificationModel } from './textClassification';
import { buildImageClassificationModel } from './imageClassification';

export { buildClassificationModel } from './classification';
export { buildRegressionModel } from './regression';
export { buildTextClassificationModel } from './textClassification';
export { buildImageClassificationModel } from './imageClassification';

export type ModelType = 'classification' | 'regression' | 'text_classification' | 'image_classification';

/**
 * Registry that maps model types to their builder functions.
 * For image classification, the builder is async (returns a Promise).
 */
export const modelBuilderRegistry: Record<
  ModelType,
  (tf: any, opts: ModelBuilderOptions) => any | Promise<any>
> = {
  classification: buildClassificationModel,
  regression: buildRegressionModel,
  text_classification: buildTextClassificationModel,
  image_classification: buildImageClassificationModel,
};

/**
 * Selects and invokes the appropriate model builder for the given model type.
 */
export async function buildModel(
  tf: any,
  modelType: ModelType,
  opts: ModelBuilderOptions
): Promise<any> {
  const builder = modelBuilderRegistry[modelType];
  if (!builder) {
    throw new Error(`Unknown model type: ${modelType}`);
  }
  return builder(tf, opts);
}
