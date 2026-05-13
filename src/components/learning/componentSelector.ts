/**
 * Component Selector
 *
 * Selects a random learning component type from those that have content available.
 * Uses uniform random distribution across available types.
 * Falls back to 'quiz' if no interactive content is available.
 */

import type { LearningComponentType } from './types';
import type { InteractiveContent } from '@/utils/learningMomentContent';

/**
 * Selects a random learning component type from those that have content available.
 * Uses uniform random distribution. Falls back to 'quiz' if no content available.
 *
 * @param availableContent - The interactive content from the learning moment
 * @param hasQuiz - Whether the parent LearningMomentContent has quiz questions (1+). Defaults to true.
 */
export function selectComponent(availableContent: InteractiveContent, hasQuiz: boolean = true): LearningComponentType {
  const available = getAvailableTypes(availableContent, hasQuiz);

  if (available.length === 0) {
    return 'quiz'; // Ultimate fallback
  }

  const index = Math.floor(Math.random() * available.length);
  return available[index];
}

/**
 * Returns component types that have valid content defined,
 * checking minimum content thresholds for each type.
 *
 * Thresholds:
 * - quiz: 1+ questions (checked via hasQuiz parameter from parent LearningMomentContent)
 * - matching: 3+ pairs
 * - fillBlanks: 2+ sentences
 * - flashCards: 3+ statements
 * - sorting: 4+ items
 */
export function getAvailableTypes(content: InteractiveContent, hasQuiz: boolean = true): LearningComponentType[] {
  const types: LearningComponentType[] = [];

  if (hasQuiz) {
    types.push('quiz');
  }
  if (content.matching && content.matching.pairs.length >= 3) {
    types.push('matching');
  }
  if (content.fillBlanks && content.fillBlanks.sentences.length >= 2) {
    types.push('fill_blanks');
  }
  if (content.flashCards && content.flashCards.statements.length >= 3) {
    types.push('flash_cards');
  }
  if (content.sorting && content.sorting.items.length >= 4) {
    types.push('sorting');
  }

  return types;
}
