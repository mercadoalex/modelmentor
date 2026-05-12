/**
 * Retry utility with exponential backoff
 * 
 * This module provides:
 * - withRetry function for wrapping async operations with retry logic
 * - Exponential backoff with configurable parameters
 * - Maximum 3 retries by default
 * 
 * Validates: Requirements 13.2, 13.5
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Configuration options for retry behavior
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries: number;
  /** Base delay in milliseconds before first retry (default: 1000) */
  baseDelayMs: number;
  /** Maximum delay in milliseconds between retries (default: 10000) */
  maxDelayMs: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier: number;
  /** Optional function to determine if an error is retryable */
  isRetryable?: (error: unknown) => boolean;
  /** Optional callback called before each retry attempt */
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
}

/**
 * Result of a retry operation
 */
export interface RetryResult<T> {
  /** The successful result data, or null if all retries failed */
  data: T | null;
  /** The last error encountered, or null if successful */
  error: Error | null;
  /** Number of attempts made (1 = success on first try) */
  attempts: number;
  /** Whether the operation ultimately succeeded */
  success: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Default Configuration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sleep for a specified duration
 * 
 * @param ms - Duration in milliseconds
 * @returns Promise that resolves after the delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay for a given retry attempt using exponential backoff
 * 
 * @param attempt - The current attempt number (0-indexed)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
  // Exponential backoff: baseDelay * (multiplier ^ attempt)
  const exponentialDelay = config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt);
  
  // Add jitter (±10%) to prevent thundering herd
  const jitter = exponentialDelay * 0.1 * (Math.random() * 2 - 1);
  
  // Clamp to maxDelayMs
  return Math.min(exponentialDelay + jitter, config.maxDelayMs);
}

/**
 * Default function to determine if an error is retryable
 * 
 * @param error - The error to check
 * @returns true if the error is retryable
 */
export function defaultIsRetryable(error: unknown): boolean {
  // Don't retry if error is null/undefined
  if (!error) return false;
  
  // Check for network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  
  // Check for specific error codes that are retryable
  if (error && typeof error === 'object' && 'code' in error) {
    const errorCode = (error as { code: string }).code;
    
    // Network-related errors are retryable
    if (errorCode === 'NETWORK_ERROR') return true;
    
    // Server errors (5xx) are typically retryable
    if (errorCode.startsWith('5')) return true;
    
    // Rate limiting errors are retryable
    if (errorCode === '429' || errorCode === 'RATE_LIMITED') return true;
    
    // Don't retry client errors (4xx except 429)
    if (errorCode.startsWith('4') && errorCode !== '429') return false;
  }
  
  // Check for HTTP status codes
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    
    // Retry server errors and rate limiting
    if (status >= 500 || status === 429) return true;
    
    // Don't retry client errors
    if (status >= 400 && status < 500) return false;
  }
  
  // Default to retryable for unknown errors
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Retry Function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Execute an async operation with retry logic and exponential backoff
 * 
 * @param operation - The async operation to execute
 * @param config - Optional retry configuration (uses defaults if not provided)
 * @returns Promise resolving to the operation result
 * @throws The last error if all retries fail
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const result = await withRetry(() => fetchData());
 * 
 * // With custom config
 * const result = await withRetry(
 *   () => fetchData(),
 *   { maxRetries: 5, baseDelayMs: 500 }
 * );
 * 
 * // With retry callback
 * const result = await withRetry(
 *   () => fetchData(),
 *   {
 *     ...DEFAULT_RETRY_CONFIG,
 *     onRetry: (attempt, error, delay) => {
 *       console.log(`Retry ${attempt} after ${delay}ms due to:`, error);
 *     }
 *   }
 * );
 * ```
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const fullConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const isRetryable = fullConfig.isRetryable ?? defaultIsRetryable;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      // Execute the operation
      const result = await operation();
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if we've exhausted retries
      if (attempt >= fullConfig.maxRetries) {
        break;
      }
      
      // Check if the error is retryable
      if (!isRetryable(error)) {
        break;
      }
      
      // Calculate delay for this retry
      const delayMs = calculateBackoffDelay(attempt, fullConfig);
      
      // Call onRetry callback if provided
      if (fullConfig.onRetry) {
        fullConfig.onRetry(attempt + 1, error, delayMs);
      }
      
      // Wait before retrying
      await sleep(delayMs);
    }
  }
  
  // All retries exhausted, throw the last error
  throw lastError;
}

/**
 * Execute an async operation with retry logic, returning a result object instead of throwing
 * 
 * @param operation - The async operation to execute
 * @param config - Optional retry configuration
 * @returns Promise resolving to a RetryResult object
 * 
 * @example
 * ```typescript
 * const result = await withRetryResult(() => fetchData());
 * if (result.success) {
 *   console.log('Data:', result.data);
 * } else {
 *   console.error('Failed after', result.attempts, 'attempts:', result.error);
 * }
 * ```
 */
export async function withRetryResult<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const fullConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const isRetryable = fullConfig.isRetryable ?? defaultIsRetryable;
  
  let lastError: Error | null = null;
  let attempts = 0;
  
  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    attempts = attempt + 1;
    
    try {
      const result = await operation();
      return {
        data: result,
        error: null,
        attempts,
        success: true,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if we've exhausted retries
      if (attempt >= fullConfig.maxRetries) {
        break;
      }
      
      // Check if the error is retryable
      if (!isRetryable(error)) {
        break;
      }
      
      // Calculate delay for this retry
      const delayMs = calculateBackoffDelay(attempt, fullConfig);
      
      // Call onRetry callback if provided
      if (fullConfig.onRetry) {
        fullConfig.onRetry(attempt + 1, error, delayMs);
      }
      
      // Wait before retrying
      await sleep(delayMs);
    }
  }
  
  return {
    data: null,
    error: lastError,
    attempts,
    success: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Specialized Retry Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a retry wrapper with pre-configured options
 * 
 * @param config - Retry configuration to use
 * @returns A function that wraps operations with the configured retry logic
 * 
 * @example
 * ```typescript
 * const retryWithLogging = createRetryWrapper({
 *   maxRetries: 5,
 *   onRetry: (attempt, error) => console.log(`Retry ${attempt}:`, error)
 * });
 * 
 * const result = await retryWithLogging(() => fetchData());
 * ```
 */
export function createRetryWrapper(config: Partial<RetryConfig>) {
  return <T>(operation: () => Promise<T>): Promise<T> => {
    return withRetry(operation, config);
  };
}

/**
 * Retry wrapper specifically for network operations
 * Uses more aggressive retry settings for transient network failures
 */
export const withNetworkRetry = createRetryWrapper({
  maxRetries: 3,
  baseDelayMs: 500,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  isRetryable: (error) => {
    // Only retry network-related errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true;
    }
    if (error && typeof error === 'object' && 'code' in error) {
      const code = (error as { code: string }).code;
      return code === 'NETWORK_ERROR' || code === 'ECONNRESET' || code === 'ETIMEDOUT';
    }
    return false;
  },
});
