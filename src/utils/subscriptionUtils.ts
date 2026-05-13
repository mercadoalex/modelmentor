import { TIER_LIMITS, SubscriptionTier } from '@/types/subscription';

/**
 * Converts a username to an internal email format.
 * @example usernameToEmail('john_doe') => 'john_doe@modelmentor.internal'
 */
export function usernameToEmail(username: string): string {
  return `${username}@modelmentor.internal`;
}

/**
 * Extracts the username from an internal email (local part before @).
 * @example emailToUsername('john_doe@modelmentor.internal') => 'john_doe'
 */
export function emailToUsername(email: string): string {
  return email.split('@')[0];
}

/**
 * Validates a username against the pattern ^[a-zA-Z0-9_]+$ (non-empty, only letters, digits, underscores).
 */
export function validateUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]+$/.test(username);
}

/**
 * Constructs a user-scoped storage path like `{userId}/{resourceId}.{extension}`.
 * If no extension is provided, returns `{userId}/{resourceId}`.
 */
export function buildUserScopedPath(userId: string, resourceId: string, extension?: string): string {
  if (extension) {
    return `${userId}/${resourceId}.${extension}`;
  }
  return `${userId}/${resourceId}`;
}

/**
 * Checks if a file name has a valid format (csv, json, or zip extension, case-insensitive).
 */
export function validateFileFormat(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ext === 'csv' || ext === 'json' || ext === 'zip';
}

/**
 * Checks whether a requested resource amount is within the tier limit.
 * Returns whether the request is allowed and the remaining capacity.
 * A null limit means unlimited.
 */
export function checkTierLimit(
  tier: SubscriptionTier,
  resourceType: string,
  currentUsage: number,
  requestedAmount: number
): { allowed: boolean; remaining: number } {
  const limits = TIER_LIMITS[tier];
  const limitKey = resourceType as keyof typeof limits;
  const limit = limits[limitKey] as number | null;

  if (limit === null) {
    return { allowed: true, remaining: Infinity };
  }

  const remaining = limit - currentUsage;
  const allowed = currentUsage + requestedAmount <= limit;

  return { allowed, remaining: Math.max(0, remaining) };
}

/**
 * Calculates the number of trial days remaining from a trial end date.
 * Returns max(0, ceil((trialEndsAt - now) / 86400000)).
 */
export function calculateTrialDaysRemaining(trialEndsAt: string): number {
  const endTime = new Date(trialEndsAt).getTime();
  const now = Date.now();
  const diffMs = endTime - now;
  return Math.max(0, Math.ceil(diffMs / 86400000));
}

/**
 * Returns true if current usage is at or above 80% of the tier limit.
 * Returns false if the limit is null (unlimited).
 */
export function shouldShowWarning(currentUsage: number, tierLimit: number | null): boolean {
  if (tierLimit === null) {
    return false;
  }
  return currentUsage >= 0.8 * tierLimit;
}

/**
 * Returns true if the daily compute consumption has reached or exceeded the daily budget limit.
 */
export function isComputeBudgetExhausted(dailyConsumption: number, dailyBudgetLimit: number): boolean {
  return dailyConsumption >= dailyBudgetLimit;
}
