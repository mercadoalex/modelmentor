import { useState } from 'react';
import { useContextualHelp } from '@/contexts/ContextualHelpContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Lightbulb, ChevronRight, ChevronLeft } from 'lucide-react';

export function ContextualHelp() {
  const { currentHelp, showHelp, closeHelp, dismissTip } = useContextualHelp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState<Set<string>>(new Set());

  if (!showHelp || currentHelp.length === 0) return null;

  const currentTip = currentHelp[currentIndex];
  const hasMultipleTips = currentHelp.length > 1;
  const isFirstTip = currentIndex === 0;
  const isLastTip = currentIndex === currentHelp.length - 1;

  const handleNext = () => {
    if (!isLastTip) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstTip) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleDismiss = () => {
    // Dismiss all tips that were marked "don't show again"
    dontShowAgain.forEach(tipId => {
      dismissTip(tipId, true);
    });
    closeHelp();
    setCurrentIndex(0);
    setDontShowAgain(new Set());
  };

  const handleDontShowAgain = () => {
    const newSet = new Set(dontShowAgain);
    if (newSet.has(currentTip.id)) {
      newSet.delete(currentTip.id);
    } else {
      newSet.add(currentTip.id);
    }
    setDontShowAgain(newSet);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'medium':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'low':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-md w-full pointer-events-none">
      <Card className="shadow-lg border-primary/20 pointer-events-auto">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Lightbulb className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-base text-balance">{currentTip.title}</CardTitle>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs capitalize ${getPriorityColor(currentTip.priority)}`}
                  >
                    {currentTip.priority}
                  </Badge>
                </div>
                {hasMultipleTips && (
                  <CardDescription className="text-xs">
                    Tip {currentIndex + 1} of {currentHelp.length}
                  </CardDescription>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0 shrink-0"
              aria-label="Close help"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-pretty">
            {currentTip.content}
          </p>

          {/* Don't show again checkbox */}
          <Alert className="border-muted bg-muted/30">
            <AlertDescription className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`dont-show-${currentTip.id}`}
                checked={dontShowAgain.has(currentTip.id)}
                onChange={handleDontShowAgain}
                className="h-4 w-4 rounded border-border"
              />
              <label 
                htmlFor={`dont-show-${currentTip.id}`}
                className="text-xs cursor-pointer"
              >
                Don't show this tip again
              </label>
            </AlertDescription>
          </Alert>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            {hasMultipleTips ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={isFirstTip}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex gap-1">
                  {currentHelp.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1.5 w-6 rounded-full transition-colors ${
                        index === currentIndex
                          ? 'bg-primary'
                          : index < currentIndex
                          ? 'bg-primary/50'
                          : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isLastTip ? handleDismiss : handleNext}
                >
                  {isLastTip ? 'Done' : 'Next'}
                  {!isLastTip && <ChevronRight className="h-4 w-4 ml-1" />}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDismiss}
                className="ml-auto"
              >
                Got it
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
