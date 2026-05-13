/**
 * Sorting Component
 *
 * Displays category buckets at top and items below.
 * Uses click-to-select interaction: click an item, then click a category to place it.
 * More accessible and mobile-friendly than drag-and-drop.
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, ArrowUp } from 'lucide-react';
import { evaluateSorting } from './evaluators';
import type { LearningComponentProps, SortingContent, ComponentResult } from './types';
import { shuffleArray } from './MatchingComponent';

export default function SortingComponent({ content, onComplete }: LearningComponentProps) {
  const sortingContent = content as SortingContent;
  const startTimeRef = useRef(Date.now());

  // Randomize item order on mount
  const shuffledItems = useMemo(
    () => shuffleArray(sortingContent.items),
    [sortingContent.items]
  );

  // State
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [placements, setPlacements] = useState<Map<string, string>>(new Map());
  const [evaluated, setEvaluated] = useState(false);
  const [results, setResults] = useState<{ correct: string[]; incorrect: string[] }>({
    correct: [],
    incorrect: [],
  });
  const [announcement, setAnnouncement] = useState('');

  // Get items placed in a specific category
  const getItemsInCategory = (categoryId: string) => {
    const items: string[] = [];
    for (const [itemId, catId] of placements.entries()) {
      if (catId === categoryId) items.push(itemId);
    }
    return items;
  };

  // Get unplaced items
  const unplacedItems = useMemo(
    () => shuffledItems.filter(item => !placements.has(item.id)),
    [shuffledItems, placements]
  );

  const handleItemClick = useCallback((itemId: string) => {
    if (evaluated) return;
    if (selectedItem === itemId) {
      setSelectedItem(null);
      setAnnouncement('Item deselected');
    } else {
      setSelectedItem(itemId);
      const item = sortingContent.items.find(i => i.id === itemId);
      setAnnouncement(`Selected "${item?.concept}". Now click a category to place it.`);
    }
  }, [evaluated, selectedItem, sortingContent.items]);

  const handleCategoryClick = useCallback((categoryId: string) => {
    if (evaluated || !selectedItem) return;

    const newPlacements = new Map(placements);
    newPlacements.set(selectedItem, categoryId);
    setPlacements(newPlacements);

    const item = sortingContent.items.find(i => i.id === selectedItem);
    const category = sortingContent.categories.find(c => c.id === categoryId);
    setAnnouncement(`Placed "${item?.concept}" in "${category?.label}"`);
    setSelectedItem(null);
  }, [evaluated, selectedItem, placements, sortingContent.items, sortingContent.categories]);

  const handleRemovePlacement = useCallback((itemId: string) => {
    if (evaluated) return;
    const newPlacements = new Map(placements);
    newPlacements.delete(itemId);
    setPlacements(newPlacements);
    setAnnouncement('Item removed from category.');
    setSelectedItem(null);
  }, [evaluated, placements]);

  const handleSubmit = useCallback(() => {
    const evalResults = evaluateSorting(sortingContent.items, placements);
    setResults(evalResults);
    setEvaluated(true);

    const correctCount = evalResults.correct.length;
    const total = sortingContent.items.length;
    setAnnouncement(`Results: ${correctCount} out of ${total} items correctly sorted.`);
  }, [sortingContent.items, placements]);

  const handleComplete = useCallback(() => {
    const result: ComponentResult = {
      componentType: 'sorting',
      score: results.correct.length,
      total: sortingContent.items.length,
      timeSpentMs: Date.now() - startTimeRef.current,
    };
    onComplete(result);
  }, [results, sortingContent.items.length, onComplete]);

  const allPlaced = placements.size === sortingContent.items.length;

  return (
    <div className="space-y-4" role="region" aria-label="Sorting activity">
      {/* Instructions */}
      <div className="text-sm text-muted-foreground">
        {!evaluated
          ? 'Click an item below, then click a category to sort it into.'
          : `Results: ${results.correct.length}/${sortingContent.items.length} correctly sorted`}
      </div>

      {/* Category buckets */}
      <div className={`grid gap-3 ${sortingContent.categories.length === 2 ? 'grid-cols-2' : `grid-cols-${Math.min(sortingContent.categories.length, 3)}`}`}>
        {sortingContent.categories.map((category) => {
          const itemsInCat = getItemsInCategory(category.id);
          const hasSelectedItem = !!selectedItem;

          return (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              disabled={evaluated || !hasSelectedItem}
              className={`p-3 rounded-lg border-2 text-left transition-all min-h-[100px] ${
                hasSelectedItem && !evaluated
                  ? 'border-primary/50 hover:border-primary hover:bg-primary/5 cursor-pointer'
                  : 'border-border cursor-default'
              } ${evaluated ? 'cursor-default' : ''}`}
            >
              <h4 className="text-sm font-semibold mb-2 text-center">{category.label}</h4>
              <div className="space-y-1">
                {itemsInCat.map((itemId) => {
                  const item = sortingContent.items.find(i => i.id === itemId);
                  const isCorrectResult = evaluated && results.correct.includes(itemId);
                  const isIncorrectResult = evaluated && results.incorrect.includes(itemId);

                  return (
                    <div
                      key={itemId}
                      className={`flex items-center justify-between text-xs p-1.5 rounded ${
                        isCorrectResult
                          ? 'bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-200'
                          : isIncorrectResult
                            ? 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-200'
                            : 'bg-muted/50'
                      }`}
                    >
                      <span>{item?.concept}</span>
                      <div className="flex items-center gap-1">
                        {isCorrectResult && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                        {isIncorrectResult && (
                          <>
                            <XCircle className="h-3 w-3 text-red-600" />
                          </>
                        )}
                        {!evaluated && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePlacement(itemId);
                            }}
                            className="text-muted-foreground hover:text-destructive p-0.5"
                            aria-label={`Remove ${item?.concept} from ${category.label}`}
                          >
                            <XCircle className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {itemsInCat.length === 0 && !evaluated && (
                  <div className="text-xs text-muted-foreground/50 text-center py-2">
                    {hasSelectedItem ? 'Click to place here' : 'Empty'}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Show correct categories for incorrect items */}
      {evaluated && results.incorrect.length > 0 && (
        <Card className="p-3 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
          <h4 className="text-xs font-medium mb-2">Correct Placements:</h4>
          <div className="space-y-1">
            {results.incorrect.map((itemId) => {
              const item = sortingContent.items.find(i => i.id === itemId);
              const correctCategory = sortingContent.categories.find(
                c => c.id === item?.correctCategoryId
              );
              return (
                <div key={itemId} className="text-xs">
                  <strong>{item?.concept}</strong> → {correctCategory?.label}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Unplaced items */}
      {unplacedItems.length > 0 && !evaluated && (
        <div>
          <div className="flex items-center gap-1 mb-2">
            <ArrowUp className="h-3 w-3 text-muted-foreground" />
            <h4 className="text-xs font-medium text-muted-foreground">
              Items to sort ({unplacedItems.length} remaining)
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {unplacedItems.map((item) => {
              const isSelected = selectedItem === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  aria-pressed={isSelected}
                  className={`px-3 py-1.5 rounded-lg border-2 text-sm transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  } cursor-pointer`}
                >
                  {item.concept}
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
            disabled={!allPlaced}
          >
            Submit Sorting
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
