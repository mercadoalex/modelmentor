/**
 * Matching Component
 *
 * Two-column layout where learners match concepts to definitions using
 * click-to-select interaction. Click a concept, then click a definition to pair them.
 * More accessible and mobile-friendly than drag-and-drop.
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Link2, Unlink } from 'lucide-react';
import { evaluateMatching } from './evaluators';
import type { LearningComponentProps, MatchingContent, ComponentResult } from './types';

/** Shuffles an array using Fisher-Yates algorithm */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function MatchingComponent({ content, onComplete }: LearningComponentProps) {
  const matchingContent = content as MatchingContent;
  const startTimeRef = useRef(Date.now());

  // Randomize column orders on mount
  const shuffledConcepts = useMemo(
    () => shuffleArray(matchingContent.pairs),
    [matchingContent.pairs]
  );
  const shuffledDefinitions = useMemo(
    () => shuffleArray(matchingContent.pairs),
    [matchingContent.pairs]
  );

  // State
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [connections, setConnections] = useState<Map<string, string>>(new Map());
  const [evaluated, setEvaluated] = useState(false);
  const [results, setResults] = useState<{ correct: string[]; incorrect: string[] }>({
    correct: [],
    incorrect: [],
  });
  const [announcement, setAnnouncement] = useState('');

  // Get which definition is connected to which concept
  const getConnectedDefinition = (conceptId: string) => connections.get(conceptId);
  const getConnectedConcept = (definitionId: string) => {
    for (const [cId, dId] of connections.entries()) {
      if (dId === definitionId) return cId;
    }
    return undefined;
  };

  const handleConceptClick = useCallback((conceptId: string) => {
    if (evaluated) return;
    if (selectedConcept === conceptId) {
      setSelectedConcept(null);
      setAnnouncement('Concept deselected');
    } else {
      setSelectedConcept(conceptId);
      const concept = matchingContent.pairs.find(p => p.id === conceptId);
      setAnnouncement(`Selected concept: ${concept?.concept}. Now click a definition to pair.`);
    }
  }, [evaluated, selectedConcept, matchingContent.pairs]);

  const handleDefinitionClick = useCallback((definitionId: string) => {
    if (evaluated) return;

    if (selectedConcept) {
      // Make a connection
      const newConnections = new Map(connections);

      // Remove any existing connection to this definition
      for (const [cId, dId] of newConnections.entries()) {
        if (dId === definitionId) {
          newConnections.delete(cId);
        }
      }

      // Set the new connection
      newConnections.set(selectedConcept, definitionId);
      setConnections(newConnections);

      const concept = matchingContent.pairs.find(p => p.id === selectedConcept);
      const definition = matchingContent.pairs.find(p => p.id === definitionId);
      setAnnouncement(`Paired "${concept?.concept}" with "${definition?.definition}"`);
      setSelectedConcept(null);
    }
  }, [evaluated, selectedConcept, connections, matchingContent.pairs]);

  const handleRemoveConnection = useCallback((conceptId: string) => {
    if (evaluated) return;
    const newConnections = new Map(connections);
    newConnections.delete(conceptId);
    setConnections(newConnections);
    setAnnouncement('Connection removed');
  }, [evaluated, connections]);

  const handleSubmit = useCallback(() => {
    const evalResults = evaluateMatching(matchingContent.pairs, connections);
    setResults(evalResults);
    setEvaluated(true);

    const correctCount = evalResults.correct.length;
    const total = matchingContent.pairs.length;
    setAnnouncement(`Results: ${correctCount} out of ${total} correct.`);
  }, [matchingContent.pairs, connections]);

  const handleComplete = useCallback(() => {
    const result: ComponentResult = {
      componentType: 'matching',
      score: results.correct.length,
      total: matchingContent.pairs.length,
      timeSpentMs: Date.now() - startTimeRef.current,
    };
    onComplete(result);
  }, [results, matchingContent.pairs.length, onComplete]);

  const allConnected = connections.size === matchingContent.pairs.length;

  return (
    <div className="space-y-4" role="region" aria-label="Matching activity">
      {/* Instructions */}
      <div className="text-sm text-muted-foreground">
        {!evaluated
          ? 'Click a concept on the left, then click its matching definition on the right.'
          : `Results: ${results.correct.length}/${matchingContent.pairs.length} correct`}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Concepts column */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Concepts</h4>
          {shuffledConcepts.map((pair) => {
            const isSelected = selectedConcept === pair.id;
            const isConnected = connections.has(pair.id);
            const isCorrectResult = evaluated && results.correct.includes(pair.id);
            const isIncorrectResult = evaluated && results.incorrect.includes(pair.id);

            return (
              <button
                key={pair.id}
                onClick={() => handleConceptClick(pair.id)}
                disabled={evaluated}
                aria-pressed={isSelected}
                className={`w-full p-3 rounded-lg border-2 text-left text-sm transition-all ${
                  isCorrectResult
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                    : isIncorrectResult
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                      : isSelected
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                        : isConnected
                          ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30'
                          : 'border-border hover:border-primary/50'
                } ${evaluated ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{pair.concept}</span>
                  {isConnected && !evaluated && (
                    <Link2 className="h-3 w-3 text-blue-500" />
                  )}
                  {isCorrectResult && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  {isIncorrectResult && <XCircle className="h-4 w-4 text-red-600" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Definitions column */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Definitions</h4>
          {shuffledDefinitions.map((pair) => {
            const connectedConcept = getConnectedConcept(pair.id);
            const isConnected = !!connectedConcept;
            const isCorrectResult = evaluated && results.correct.includes(pair.id);
            const isIncorrectResult = evaluated && results.incorrect.includes(pair.id);

            return (
              <button
                key={pair.id}
                onClick={() => handleDefinitionClick(pair.id)}
                disabled={evaluated || !selectedConcept}
                className={`w-full p-3 rounded-lg border-2 text-left text-sm transition-all ${
                  isCorrectResult
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                    : isIncorrectResult
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                      : isConnected
                        ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30'
                        : selectedConcept
                          ? 'border-border hover:border-primary/50 cursor-pointer'
                          : 'border-border opacity-70'
                } ${evaluated ? 'cursor-default' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span>{pair.definition}</span>
                  {isConnected && !evaluated && (
                    <Link2 className="h-3 w-3 text-blue-500" />
                  )}
                  {isCorrectResult && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  {isIncorrectResult && <XCircle className="h-4 w-4 text-red-600" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Connected pairs display */}
      {connections.size > 0 && !evaluated && (
        <Card className="p-3">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Your Pairs</h4>
          <div className="space-y-1">
            {Array.from(connections.entries()).map(([conceptId, definitionId]) => {
              const concept = matchingContent.pairs.find(p => p.id === conceptId);
              const definition = matchingContent.pairs.find(p => p.id === definitionId);
              return (
                <div key={conceptId} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/50">
                  <span>
                    <strong>{concept?.concept}</strong> → {definition?.definition}
                  </span>
                  <button
                    onClick={() => handleRemoveConnection(conceptId)}
                    className="text-muted-foreground hover:text-destructive p-0.5"
                    aria-label={`Remove pair: ${concept?.concept}`}
                  >
                    <Unlink className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Correct answers display after evaluation */}
      {evaluated && results.incorrect.length > 0 && (
        <Card className="p-3 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
          <h4 className="text-xs font-medium mb-2">Correct Answers:</h4>
          <div className="space-y-1">
            {results.incorrect.map((pairId) => {
              const pair = matchingContent.pairs.find(p => p.id === pairId);
              return (
                <div key={pairId} className="text-xs">
                  <strong>{pair?.concept}</strong> → {pair?.definition}
                </div>
              );
            })}
          </div>
        </Card>
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
            disabled={!allConnected}
          >
            Submit Matches
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
