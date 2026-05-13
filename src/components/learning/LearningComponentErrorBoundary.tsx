/**
 * Learning Component Error Boundary
 *
 * Catches render errors from any learning component and falls back
 * to the QuizComponent with fallback content. Displays an informational
 * message about the fallback.
 */

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import QuizComponent from './QuizComponent';
import type { LearningComponentProps, QuizContent } from './types';

interface ErrorBoundaryProps {
  /** Fallback quiz content to render if the component fails */
  fallbackContent: QuizContent;
  /** Called when the learner completes the fallback activity */
  onComplete: LearningComponentProps['onComplete'];
  /** Children to render (the actual learning component) */
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class LearningComponentErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Learning component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="space-y-4">
          <Alert className="border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/30">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription>
              <p className="text-sm">
                The selected activity couldn't load. Here's a quiz instead!
              </p>
            </AlertDescription>
          </Alert>
          <QuizComponent
            content={this.props.fallbackContent}
            onComplete={this.props.onComplete}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
