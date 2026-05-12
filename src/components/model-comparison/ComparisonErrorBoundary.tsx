/**
 * ComparisonErrorBoundary - Error boundary wrapper for comparison components
 * 
 * This component:
 * - Catches errors in child components
 * - Displays fallback UI with error message and retry option
 * - Prevents component failures from crashing the entire dashboard
 * - Logs errors for debugging
 * 
 * Validates: Requirements 13.4
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ComparisonErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Name of the component being wrapped (for error messages) */
  componentName: string;
  /** Optional callback to retry the failed operation */
  onRetry?: () => void;
  /** Optional custom fallback UI */
  fallback?: ReactNode;
}

interface ComparisonErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Boundary Component
// ─────────────────────────────────────────────────────────────────────────────

export class ComparisonErrorBoundary extends Component<
  ComparisonErrorBoundaryProps,
  ComparisonErrorBoundaryState
> {
  constructor(props: ComparisonErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(error: Error): Partial<ComparisonErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error information for debugging
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Log error to console for debugging
    console.error(
      `[ComparisonErrorBoundary] Error in ${this.props.componentName}:`,
      error,
      errorInfo
    );
    
    // In production, you might want to log to an error monitoring service
    // e.g., Sentry, LogRocket, etc.
  }

  /**
   * Reset error state and retry
   */
  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    // Call the onRetry callback if provided
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  /**
   * Render fallback UI when an error occurs
   */
  renderFallback(): ReactNode {
    const { componentName, fallback, onRetry } = this.props;
    const { error } = this.state;

    // Use custom fallback if provided
    if (fallback) {
      return fallback;
    }

    // Default fallback UI
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center border border-red-200 rounded-lg bg-red-50">
        <div className="rounded-full bg-red-100 p-3 mb-4">
          <AlertCircle className="h-6 w-6 text-red-500" />
        </div>
        
        <h3 className="text-lg font-semibold text-red-700 mb-2">
          {componentName} Error
        </h3>
        
        <p className="text-sm text-red-600 mb-4 max-w-md">
          An error occurred while rendering this component. 
          {error?.message && (
            <span className="block mt-1 text-xs text-red-500">
              {error.message}
            </span>
          )}
        </p>
        
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleRetry}
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    );
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.renderFallback();
    }

    return this.props.children;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Higher-Order Component Wrapper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * HOC to wrap a component with an error boundary
 * 
 * @param WrappedComponent - The component to wrap
 * @param componentName - Name for error messages
 * @returns Wrapped component with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
): React.FC<P & { onRetry?: () => void }> {
  const WithErrorBoundary: React.FC<P & { onRetry?: () => void }> = (props) => {
    const { onRetry, ...restProps } = props;
    
    return (
      <ComparisonErrorBoundary componentName={componentName} onRetry={onRetry}>
        <WrappedComponent {...(restProps as P)} />
      </ComparisonErrorBoundary>
    );
  };

  WithErrorBoundary.displayName = `WithErrorBoundary(${componentName})`;
  
  return WithErrorBoundary;
}

export default ComparisonErrorBoundary;
