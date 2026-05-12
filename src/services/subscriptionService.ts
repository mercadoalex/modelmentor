import { supabase } from '@/lib/supabase';
import type { UserSubscription, SubscriptionTier } from '@/types/subscription';
import { calculateTrialDaysRemaining } from '@/utils/subscriptionUtils';

export const subscriptionService = {
  /**
   * Fetches the current subscription for a user, including trial status.
   */
  async getSubscription(userId: string): Promise<UserSubscription | null> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('getSubscription error:', error);
      return null;
    }
    return data;
  },

  /**
   * Returns the effective tier for a user, accounting for trial status.
   * If the user is on an active trial that hasn't expired, returns the trial tier.
   * Otherwise returns the subscription tier or 'free' as default.
   */
  async getTier(userId: string): Promise<SubscriptionTier> {
    const subscription = await this.getSubscription(userId);
    if (!subscription) return 'free';

    // If on trial, check if trial is still active
    if (subscription.status === 'trial' && subscription.trial_ends_at) {
      const daysRemaining = calculateTrialDaysRemaining(subscription.trial_ends_at);
      if (daysRemaining > 0) {
        return subscription.tier;
      }
      // Trial expired — effective tier is free
      return 'free';
    }

    // If subscription is cancelled or expired, return free
    if (subscription.status === 'cancelled' || subscription.status === 'expired') {
      return 'free';
    }

    return subscription.tier;
  },

  /**
   * Checks the trial status for a user.
   * Returns whether the user is on an active trial and how many days remain.
   */
  async getTrialStatus(userId: string): Promise<{ isOnTrial: boolean; daysRemaining: number }> {
    const subscription = await this.getSubscription(userId);

    if (!subscription || !subscription.trial_ends_at) {
      return { isOnTrial: false, daysRemaining: 0 };
    }

    if (subscription.status !== 'trial') {
      return { isOnTrial: false, daysRemaining: 0 };
    }

    const daysRemaining = calculateTrialDaysRemaining(subscription.trial_ends_at);
    return {
      isOnTrial: daysRemaining > 0,
      daysRemaining,
    };
  },

  /**
   * Creates a Stripe checkout session by calling the create-checkout edge function.
   * Returns the checkout URL and session ID for redirecting the user.
   */
  async createCheckoutSession(
    tier: 'pro' | 'enterprise',
    billingPeriod: 'monthly' | 'yearly',
    successUrl: string,
    cancelUrl: string
  ): Promise<{ checkoutUrl: string; sessionId: string }> {
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: {
        tier,
        billing_period: billingPeriod,
        success_url: successUrl,
        cancel_url: cancelUrl,
      },
    });

    if (error) {
      throw new Error(`Failed to create checkout session: ${error.message}`);
    }

    return {
      checkoutUrl: data.checkout_url,
      sessionId: data.session_id,
    };
  },

  /**
   * Updates the subscription record after a tier change (e.g., from Stripe webhook).
   */
  async handleSubscriptionChange(
    userId: string,
    newTier: SubscriptionTier,
    stripeData: {
      stripe_customer_id?: string;
      stripe_subscription_id?: string;
      current_period_start?: string;
      current_period_end?: string;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        tier: newTier,
        status: 'active',
        stripe_customer_id: stripeData.stripe_customer_id,
        stripe_subscription_id: stripeData.stripe_subscription_id,
        current_period_start: stripeData.current_period_start,
        current_period_end: stripeData.current_period_end,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to update subscription: ${error.message}`);
    }
  },

  /**
   * Cancels a user's subscription by marking it as cancelled and setting tier to free.
   */
  async cancelSubscription(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'cancelled',
        tier: 'free',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  },

  /**
   * Starts a 14-day free trial for a user by setting trial_ends_at.
   */
  async startTrial(userId: string): Promise<void> {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'trial',
        tier: 'pro',
        trial_ends_at: trialEndsAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to start trial: ${error.message}`);
    }
  },
};
