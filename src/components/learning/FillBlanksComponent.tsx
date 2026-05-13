/**
 * Fill in the Blanks Component
 *
 * Renders sentences with inline blank slots and a word bank.
 * Uses click-to-select interaction: click a blank to select it, then click a word to place it.
 * More accessible and mobile-friendly than drag-and-drop.
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';
import { evaluateFillBlanks } from './evaluators';
import type { LearningComponentProps, FillBlanksContent, ComponentResult } from './types';
import { shuffleArray } from './MatchingComponent';

export default function FillBlanksComponent({ content, onComplete }: LearningComponentProps) {
  const fillContent = content as FillBlanksContent;
  const startTimeRef = useRef(Date.now());

  // Build the word bank: all correct answers + distractors, shuffled
  const wordBank = useMemo(() => {
    const correctWords: string[] = [];
    for (const sentence of fillContent.sentences) {
      for (const word of Object.values(sentence.blanks)) {
        correctWords.push(word);
      }
    }
    return shuffleArray([...correctWords, ...fillContent.distractors]);
  }, [fillContent]);

  // State
  const [selectedBlank, setSelectedBlank] = useState<string | null>(null);
  const [placements, setPlacements] = useState<Map<string, string>>(new Map());
  const [evaluated, setEvaluated] = useState(false);
  const [results, setResults] = useState<{ correct: string[]; incorrect: string[] }>({
    correct: [],
    incorrect: [],
  });
  const [announcement, setAnnouncement] = useState('');

  // Count total blanks
  const totalBlanks = useMemo(() => {
    let count = 0;
    for (const sentence of fillContent.sentences) {
      count += Object.keys(sentence.blanks).length;
    }
    return count;
  }, [fillContent.sentences]);

  // Track which words are used
  const usedWords = useMemo(() => {
    const used = new Map<string, number>();
    for (const word of placements.values()) {
      used.set(word, (used.get(word) || 0) + 1);
    }
    return used;
  }, [placements]);

  const isWordAvailable = (word: string) => {
    const totalInBank = wordBank.filter(w => w === word).length;
    const usedCount = usedWords.get(word) || 0;
    return usedCount < totalInBank;
  };

  const handleBlankClick = useCallback((blankId: string) => {
    if (evaluated) return;
    if (selectedBlank === blankId) {
      setSelectedBlank(null);
      setAnnouncement('Blank deselected');
    } else {
      setSelectedBlank(blankId);
      setAnnouncement('Blank selected. Click a word from the word bank to place it.');
    }
  }, [evaluated, selectedBlank]);

  const handleWordClick = useCallback((word: string) => {
    if (evaluated || !selectedBlank) return;

    const newPlacements = new Map(placements);
    newPlacements.set(selectedBlank, word);
    setPlacements(newPlacements);
    setAnnouncement(`Placed "${word}" in the blank.`);
    setSelectedBlank(null);
  }, [evaluated, selectedBlank, placements]);

  const handleRemovePlacement = useCallback((blankId: string) => {
    if (evaluated) return;
    const newPlacements = new Map(placements);
    newPlacements.delete(blankId);
    setPlacements(newPlacements);
    setAnnouncement('Word removed from blank.');
  }, [evaluated, placements]);

  const handleSubmit = useCallback(() => {
    const evalResults = evaluateFillBlanks(fillContent.sentences, placements);
    setResults(evalResults);
    setEvaluated(true);

    const correctCount = evalResults.correct.length;
    setAnnouncement(`Results: ${correctCount} out of ${totalBlanks} blanks correct.`);
  }, [fillContent.sentences, placements, totalBlanks]);

  const handleComplete = useCallback(() => {
    const result: ComponentResult = {
      componentType: 'fill_blanks',
      score: results.correct.length,
      total: totalBlanks,
      timeSpentMs: Date.now() - startTimeRef.current,
    };
    onComplete(result);
  }, [results, totalBlanks, onComplete]);

  // Parse template to render with blanks
  const renderSentence = (template: string, blanks: Record<string, string>, sentenceId: string) => {
    const parts = template.split(/(\{\{[^}]+\}\})/);
    return parts.map((part, idx) => {
      const blankMatch = part.match(/^\{\{(.+)\}\}$/);
      if (blankMatch) {
        const blankId = blankMatch[1];
        const placedWord = placements.get(blankId);
        const isSelected = selectedBlank === blankId;
        const isCorrectResult = evaluated && results.correct.includes(blankId);
        const isIncorrectResult = evaluated && results.incorrect.includes(blankId);
        const correctWord = blanks[blankId];

        return (
          <span key={`${sentenceId}-${idx}`} className="inline-block mx-1">
            <button
              onClick={() => placedWord && !evaluated ? handleRemovePlacement(blankId) : handleBlankClick(blankId)}
              disabled={evaluated}
              aria-label={placedWord ? `Blank filled with "${placedWord}". Click to change.` : 'Empty blank. Click to select.'}
              className={`inline-flex items-center min-w-[80px] px-2 py-0.5 rounded border-2 border-dashed text-sm transition-all ${
                isCorrectResult
                  ? 'border-green-500 bg-green-50 dark:bg-green-950/30 border-solid'
                  : isIncorrectResult
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/30 border-solid'
                    : isSelected
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                      : placedWord
                        ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30'
                        : 'border-muted-foreground/40 hover:border-primary/50'
              } ${evaluated ? 'cursor-default' : 'cursor-pointer'}`}
            >
              {placedWord || '\u00A0\u00A0\u00A0\u00A0'}
              {isCorrectResult && <CheckCircle2 className="h-3 w-3 text-green-600 ml-1" />}
              {isIncorrectResult && <XCircle className="h-3 w-3 text-red-600 ml-1" />}
            </button>
            {isIncorrectResult && (
              <span className="text-xs text-green-600 dark:text-green-400 ml-1">
                ({correctWord})
              </span>
            )}
          </span>
        );
      }
      return <span key={`${sentenceId}-${idx}`}>{part}</span>;
    });
  };

  const allFilled = placements.size === totalBlanks;

  return (
    <div className="space-y-4" role="region" aria-label="Fill in the blanks activity">
      {/* Instructions */}
      <div className="text-sm text-muted-foreground">
        {!evaluated
          ? 'Click a blank in the sentence, then click a word from the bank to fill it.'
          : `Results: ${results.correct.length}/${totalBlanks} correct`}
      </div>

      {/* Sentences with blanks */}
      <Card className="p-4 space-y-4">
        {fillContent.sentences.map((sentence) => (
          <p key={sentence.id} className="text-sm leading-relaxed">
            {renderSentence(sentence.template, sentence.blanks, sentence.id)}
          </p>
        ))}
      </Card>

      {/* Word bank */}
      {!evaluated && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Word Bank</h4>
          <div className="flex flex-wrap gap-2">
            {wordBank.map((word, idx) => {
              const available = isWordAvailable(word);
              return (
                <button
                  key={`${word}-${idx}`}
                  onClick={() => handleWordClick(word)}
                  disabled={!selectedBlank || !available}
                  className={`px-3 py-1.5 rounded-full border text-sm transition-all ${
                    !available
                      ? 'border-muted bg-muted/50 text-muted-foreground/50 line-through cursor-default'
                      : selectedBlank
                        ? 'border-primary/50 bg-primary/5 hover:bg-primary/10 cursor-pointer'
                        : 'border-border bg-background cursor-default opacity-70'
                  }`}
                >
                  {word}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ARIA live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        {!evaluated ? (
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!allFilled}
          >
            Submit Answers
          </Button>
        ) : (
          <Button size="sm" onClick={handleComplete}>
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}
