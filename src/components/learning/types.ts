/**
 * Shared Types for Interactive Learning Components
 *
 * Defines the common interfaces and types used across all learning
 * component variants (Quiz, Matching, Fill in the Blanks, Flash Cards, Sorting).
 */

// ─────────────────────────────────────────────────────────────────────────────
// Component Type
// ─────────────────────────────────────────────────────────────────────────────

/** Types of interactive learning components */
export type LearningComponentType =
  | 'quiz'
  | 'matching'
  | 'fill_blanks'
  | 'flash_cards'
  | 'sorting';

// ─────────────────────────────────────────────────────────────────────────────
// Content Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface MatchingPair {
  id: string;
  concept: string;
  definition: string;
}

export interface FillBlanksSentence {
  id: string;
  /** Template with blanks marked as {{blank_id}} */
  template: string;
  /** Map of blank_id to correct word */
  blanks: Record<string, string>;
}

export interface SortingItem {
  id: string;
  concept: string;
  correctCategoryId: string;
}

export interface SortingCategory {
  id: string;
  label: string;
}

export interface FlashCardStatement {
  id: string;
  statement: string;
  isTrue: boolean;
  explanation: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component Content Types
// ─────────────────────────────────────────────────────────────────────────────

export interface MatchingContent {
  pairs: MatchingPair[];
}

export interface FillBlanksContent {
  sentences: FillBlanksSentence[];
  /** Extra words in the word bank that are not correct answers */
  distractors: string[];
}

export interface FlashCardContent {
  statements: FlashCardStatement[];
}

export interface SortingContent {
  categories: SortingCategory[];
  items: SortingItem[];
}

export interface QuizContent {
  questions: {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    hint?: string;
  }[];
  passingScore: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Content Map
// ─────────────────────────────────────────────────────────────────────────────

/** Maps each component type to its content interface */
export interface ComponentContentMap {
  quiz: QuizContent;
  matching: MatchingContent;
  fill_blanks: FillBlanksContent;
  flash_cards: FlashCardContent;
  sorting: SortingContent;
}

// ─────────────────────────────────────────────────────────────────────────────
// Result and Props
// ─────────────────────────────────────────────────────────────────────────────

/** Result reported by any learning component upon completion */
export interface ComponentResult {
  componentType: LearningComponentType;
  /** Number of correct answers */
  score: number;
  /** Total possible correct answers */
  total: number;
  /** Time spent on the activity in milliseconds */
  timeSpentMs: number;
}

/** Common props passed to all learning components */
export interface LearningComponentProps {
  /** Content data specific to this component type */
  content: ComponentContentMap[LearningComponentType];
  /** Called when the learner completes the activity */
  onComplete: (result: ComponentResult) => void;
}
