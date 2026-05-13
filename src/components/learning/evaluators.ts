/**
 * Pure Evaluation Functions for Interactive Learning Components
 *
 * All functions are pure (no side effects) and deterministic.
 * They evaluate user answers against correct answers and return
 * structured results indicating which items are correct/incorrect.
 */

import type { MatchingPair, FillBlanksSentence, SortingItem } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Matching Evaluation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluates matching pairs by comparing user connections to correct pairs.
 *
 * @param correctPairs - The correct concept-definition pairs
 * @param userConnections - Map of conceptId to the definitionId the user connected
 * @returns Object with arrays of correct and incorrect pair IDs
 */
export function evaluateMatching(
  correctPairs: MatchingPair[],
  userConnections: Map<string, string>
): { correct: string[]; incorrect: string[] } {
  const correct: string[] = [];
  const incorrect: string[] = [];

  for (const pair of correctPairs) {
    // A pair is correct if the user connected the concept (pair.id) to the
    // matching definition (also identified by pair.id since they share IDs)
    if (userConnections.get(pair.id) === pair.id) {
      correct.push(pair.id);
    } else {
      incorrect.push(pair.id);
    }
  }

  return { correct, incorrect };
}

// ─────────────────────────────────────────────────────────────────────────────
// Fill in the Blanks Evaluation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluates fill-in-the-blanks answers with case-insensitive comparison.
 *
 * @param sentences - The sentences with their correct blank answers
 * @param userPlacements - Map of blankId to the word the user placed
 * @returns Object with arrays of correct and incorrect blank IDs
 */
export function evaluateFillBlanks(
  sentences: FillBlanksSentence[],
  userPlacements: Map<string, string>
): { correct: string[]; incorrect: string[] } {
  const correct: string[] = [];
  const incorrect: string[] = [];

  for (const sentence of sentences) {
    for (const [blankId, correctWord] of Object.entries(sentence.blanks)) {
      const userWord = userPlacements.get(blankId);
      if (userWord?.toLowerCase() === correctWord.toLowerCase()) {
        correct.push(blankId);
      } else {
        incorrect.push(blankId);
      }
    }
  }

  return { correct, incorrect };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sorting Evaluation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluates sorting by comparing user category placements to correct categories.
 *
 * @param items - The items with their correct category assignments
 * @param userPlacements - Map of itemId to the categoryId the user placed it in
 * @returns Object with arrays of correct and incorrect item IDs
 */
export function evaluateSorting(
  items: SortingItem[],
  userPlacements: Map<string, string>
): { correct: string[]; incorrect: string[] } {
  const correct: string[] = [];
  const incorrect: string[] = [];

  for (const item of items) {
    if (userPlacements.get(item.id) === item.correctCategoryId) {
      correct.push(item.id);
    } else {
      incorrect.push(item.id);
    }
  }

  return { correct, incorrect };
}

// ─────────────────────────────────────────────────────────────────────────────
// Single Answer Evaluation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluates a single answer for quiz or flash card components.
 *
 * @param userAnswer - The user's answer (option index for quiz, boolean for flash cards)
 * @param correctAnswer - The correct answer
 * @returns true if the user's answer matches the correct answer
 */
export function evaluateAnswer(
  userAnswer: number | boolean,
  correctAnswer: number | boolean
): boolean {
  return userAnswer === correctAnswer;
}
