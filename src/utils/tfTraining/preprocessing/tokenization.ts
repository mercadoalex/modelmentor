// src/utils/tfTraining/preprocessing/tokenization.ts
// Text tokenization with vocabulary building and sequence padding

/**
 * Tokenizes text strings into padded integer sequences.
 * Builds a vocabulary from the training data, limited to maxVocab words.
 * All sequences are padded or truncated to maxLength.
 */
export function tokenizeTexts(
  tf: any,
  texts: string[],
  maxVocab: number = 1000,
  maxLength: number = 100
): { sequences: any; vocabulary: Map<string, number>; maxLength: number } {
  // Build word frequency map
  const wordFreq = new Map<string, number>();
  for (const text of texts) {
    const words = text.toLowerCase().split(/\s+/).filter((w) => w.length > 0);
    for (const word of words) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }
  }

  // Sort by frequency and take top maxVocab words
  const sortedWords = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxVocab);

  // Build vocabulary: word → index (1-indexed, 0 reserved for padding)
  const vocabulary = new Map<string, number>();
  sortedWords.forEach(([word], index) => {
    vocabulary.set(word, index + 1);
  });

  // Tokenize each text into a sequence of indices
  const sequences: number[][] = texts.map((text) => {
    const words = text.toLowerCase().split(/\s+/).filter((w) => w.length > 0);
    const indices = words.map((word) => vocabulary.get(word) || 0);

    // Pad or truncate to maxLength
    if (indices.length >= maxLength) {
      return indices.slice(0, maxLength);
    } else {
      return [...indices, ...new Array(maxLength - indices.length).fill(0)];
    }
  });

  const tensor = tf.tensor2d(sequences, [sequences.length, maxLength]);

  return { sequences: tensor, vocabulary, maxLength };
}
