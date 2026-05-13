/**
 * Component Registry
 *
 * Maps each learning component type to its lazy-loaded implementation.
 * Uses React.lazy for code-splitting so components are only loaded when needed.
 */

import { lazy } from 'react';
import type { LearningComponentType, LearningComponentProps } from './types';

const QuizComponent = lazy(() => import('./QuizComponent'));
const MatchingComponent = lazy(() => import('./MatchingComponent'));
const FillBlanksComponent = lazy(() => import('./FillBlanksComponent'));
const FlashCardComponent = lazy(() => import('./FlashCardComponent'));
const SortingComponent = lazy(() => import('./SortingComponent'));

const COMPONENT_MAP: Record<LearningComponentType, React.ComponentType<LearningComponentProps>> = {
  quiz: QuizComponent,
  matching: MatchingComponent,
  fill_blanks: FillBlanksComponent,
  flash_cards: FlashCardComponent,
  sorting: SortingComponent,
};

/**
 * Returns the lazy-loaded component for the given learning component type.
 */
export function getComponentForType(type: LearningComponentType): React.ComponentType<LearningComponentProps> {
  return COMPONENT_MAP[type];
}
