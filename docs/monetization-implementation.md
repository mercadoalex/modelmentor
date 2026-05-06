# Future Implementation: Monetization Features

## Overview
This document outlines the technical features needed to implement the pricing strategy defined in `/PRICING_STRATEGY.md`.

## Implementation Priority

### Phase 1: Usage Tracking (Foundation)
**Priority**: High  
**Timeline**: Before any paid features launch

#### Features to Build
1. **Usage Tracking Service** (`/src/services/usageTrackingService.ts`)
   - Track project count per user
   - Track training sessions per user
   - Track storage usage per user
   - Track API calls (Kaggle, etc.)
   - Track report generations
   - Store usage data in Supabase

2. **Database Schema**
   ```sql
   -- User subscription table
   CREATE TABLE user_subscriptions (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id) NOT NULL,
     tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'enterprise')),
     status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
     started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     expires_at TIMESTAMPTZ,
     stripe_subscription_id TEXT,
     stripe_customer_id TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Usage tracking table
   CREATE TABLE usage_tracking (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id) NOT NULL,
     resource_type TEXT NOT NULL CHECK (resource_type IN ('project', 'training', 'storage', 'api_call', 'report')),
     amount NUMERIC NOT NULL DEFAULT 1,
     metadata JSONB,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Usage limits table
   CREATE TABLE usage_limits (
     tier TEXT PRIMARY KEY CHECK (tier IN ('free', 'pro', 'enterprise')),
     max_projects INTEGER,
     max_training_sessions INTEGER,
     max_storage_mb INTEGER,
     max_api_calls INTEGER,
     max_reports INTEGER,
     features JSONB
   );
   ```

3. **Usage Limit Enforcement**
   - Check limits before allowing actions
   - Show upgrade prompts when limits reached
   - Grace period handling
   - Usage reset logic (monthly/annual)

### Phase 2: Subscription Management
**Priority**: High  
**Timeline**: Months 4-6

#### Features to Build
1. **Pricing Page** (`/src/pages/PricingPage.tsx`)
   - Display subscription tiers
   - Feature comparison table
   - Call-to-action buttons
   - FAQ section
   - Testimonials

2. **Subscription Management** (`/src/pages/SubscriptionPage.tsx`)
   - Current plan display
   - Usage statistics
   - Upgrade/downgrade options
   - Cancel subscription
   - Billing history

3. **Stripe Integration** (`/src/services/stripeService.ts`)
   - Create checkout sessions
   - Handle webhooks
   - Manage subscriptions
   - Process refunds
   - Update subscription status

4. **Edge Functions**
   - `/supabase/functions/create-checkout-session/index.ts`
   - `/supabase/functions/stripe-webhook/index.ts`
   - `/supabase/functions/cancel-subscription/index.ts`

### Phase 3: Feature Gating
**Priority**: Medium  
**Timeline**: Months 4-6

#### Features to Build
1. **Feature Gate Component** (`/src/components/FeatureGate.tsx`)
   ```tsx
   interface FeatureGateProps {
     feature: string;
     requiredTier: 'free' | 'pro' | 'enterprise';
     children: React.ReactNode;
     fallback?: React.ReactNode;
   }
   ```

2. **Upgrade Prompt Component** (`/src/components/UpgradePrompt.tsx`)
   - Modal/dialog for upgrade prompts
   - Feature benefits list
   - Direct link to pricing page
   - Dismiss option

3. **Feature Access Hook** (`/src/hooks/useFeatureAccess.ts`)
   ```tsx
   const { hasAccess, tier, upgrade } = useFeatureAccess('pdf_export');
   ```

### Phase 4: Billing Dashboard
**Priority**: Medium  
**Timeline**: Months 6-9

#### Features to Build
1. **Billing Dashboard** (`/src/pages/BillingPage.tsx`)
   - Current plan overview
   - Usage charts (recharts)
   - Billing history table
   - Invoice downloads
   - Payment method management

2. **Usage Analytics** (`/src/components/UsageAnalytics.tsx`)
   - Project usage chart
   - Training sessions chart
   - Storage usage chart
   - API calls chart
   - Trend analysis

3. **Invoice Generation**
   - PDF invoice generation (using jsPDF)
   - Email invoice delivery
   - Invoice history storage

### Phase 5: Admin Tools
**Priority**: Low  
**Timeline**: Months 9-12

#### Features to Build
1. **Revenue Dashboard** (`/src/pages/admin/RevenueDashboard.tsx`)
   - MRR (Monthly Recurring Revenue)
   - User tier distribution
   - Churn rate
   - Conversion rate
   - LTV (Lifetime Value)

2. **User Management Enhancements**
   - Manually change user tiers
   - Grant trial extensions
   - Apply discounts
   - View user usage patterns

3. **Analytics Integration**
   - Google Analytics events
   - Mixpanel tracking
   - Custom event tracking

## Technical Implementation Details

### Stripe Integration Steps

1. **Install Stripe**
   ```bash
   pnpm add @stripe/stripe-js stripe
   ```

2. **Environment Variables**
   ```env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

3. **Stripe Service Example**
   ```typescript
   // /src/services/stripeService.ts
   import { loadStripe } from '@stripe/stripe-js';
   
   const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
   
   export async function createCheckoutSession(priceId: string) {
     const { data, error } = await supabase.functions.invoke('create-checkout-session', {
       body: { priceId }
     });
     
     if (error) throw error;
     
     const stripe = await stripePromise;
     await stripe?.redirectToCheckout({ sessionId: data.sessionId });
   }
   ```

4. **Webhook Handler Example**
   ```typescript
   // /supabase/functions/stripe-webhook/index.ts
   import Stripe from 'stripe';
   
   const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
   
   Deno.serve(async (req) => {
     const signature = req.headers.get('stripe-signature')!;
     const body = await req.text();
     
     const event = stripe.webhooks.constructEvent(
       body,
       signature,
       Deno.env.get('STRIPE_WEBHOOK_SECRET')!
     );
     
     switch (event.type) {
       case 'checkout.session.completed':
         // Update user subscription
         break;
       case 'customer.subscription.deleted':
         // Cancel user subscription
         break;
     }
     
     return new Response(JSON.stringify({ received: true }));
   });
   ```

### Feature Gating Example

```typescript
// /src/hooks/useFeatureAccess.ts
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';

const FEATURE_TIERS = {
  pdf_export: 'pro',
  kaggle_integration: 'pro',
  unlimited_projects: 'pro',
  email_reports: 'pro',
  api_access: 'enterprise',
  white_label: 'enterprise',
};

export function useFeatureAccess(feature: keyof typeof FEATURE_TIERS) {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  
  const requiredTier = FEATURE_TIERS[feature];
  const userTier = subscription?.tier || 'free';
  
  const tierHierarchy = { free: 0, pro: 1, enterprise: 2 };
  const hasAccess = tierHierarchy[userTier] >= tierHierarchy[requiredTier];
  
  return {
    hasAccess,
    tier: userTier,
    requiredTier,
    upgrade: () => navigate('/pricing'),
  };
}
```

### Usage Tracking Example

```typescript
// /src/services/usageTrackingService.ts
import { supabase } from '@/db/supabase';

export const usageTrackingService = {
  async trackUsage(
    userId: string,
    resourceType: 'project' | 'training' | 'storage' | 'api_call' | 'report',
    amount: number = 1,
    metadata?: Record<string, any>
  ) {
    const { error } = await supabase
      .from('usage_tracking')
      .insert({
        user_id: userId,
        resource_type: resourceType,
        amount,
        metadata,
      });
    
    if (error) console.error('Usage tracking error:', error);
  },
  
  async checkLimit(userId: string, resourceType: string): Promise<boolean> {
    // Get user's subscription tier
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('tier')
      .eq('user_id', userId)
      .single();
    
    const tier = subscription?.tier || 'free';
    
    // Get tier limits
    const { data: limits } = await supabase
      .from('usage_limits')
      .select('*')
      .eq('tier', tier)
      .single();
    
    // Get current usage (this month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const { data: usage } = await supabase
      .from('usage_tracking')
      .select('amount')
      .eq('user_id', userId)
      .eq('resource_type', resourceType)
      .gte('created_at', startOfMonth.toISOString());
    
    const currentUsage = usage?.reduce((sum, u) => sum + u.amount, 0) || 0;
    const limit = limits?.[`max_${resourceType}s`];
    
    return limit === null || currentUsage < limit;
  },
};
```

## UI Components Needed

### 1. Pricing Card Component
```tsx
// /src/components/PricingCard.tsx
interface PricingCardProps {
  tier: 'free' | 'pro' | 'enterprise';
  price: number;
  features: string[];
  popular?: boolean;
  onSelect: () => void;
}
```

### 2. Usage Meter Component
```tsx
// /src/components/UsageMeter.tsx
interface UsageMeterProps {
  label: string;
  current: number;
  limit: number | null;
  unit: string;
}
```

### 3. Upgrade Banner Component
```tsx
// /src/components/UpgradeBanner.tsx
interface UpgradeBannerProps {
  message: string;
  feature: string;
  onUpgrade: () => void;
  onDismiss: () => void;
}
```

## Testing Checklist

### Subscription Flow Testing
- [ ] User can view pricing page
- [ ] User can select a plan
- [ ] Stripe checkout works
- [ ] Subscription is created in database
- [ ] User tier is updated
- [ ] Features are unlocked
- [ ] Webhooks are processed correctly

### Usage Tracking Testing
- [ ] Usage is tracked correctly
- [ ] Limits are enforced
- [ ] Upgrade prompts appear
- [ ] Usage resets monthly
- [ ] Grace periods work

### Feature Gating Testing
- [ ] Free users see locked features
- [ ] Pro users access pro features
- [ ] Enterprise users access all features
- [ ] Upgrade prompts work
- [ ] Feature gates don't break UI

## Security Considerations

1. **Never expose Stripe secret keys** in client code
2. **Validate webhook signatures** to prevent fraud
3. **Use RLS policies** to protect subscription data
4. **Encrypt sensitive data** in database
5. **Rate limit** API endpoints to prevent abuse
6. **Audit log** all subscription changes
7. **PCI compliance** - never store card details

## Performance Considerations

1. **Cache subscription status** in client
2. **Batch usage tracking** to reduce DB writes
3. **Index** usage_tracking table by user_id and created_at
4. **Archive old usage data** after 12 months
5. **Use CDN** for pricing page assets

## Documentation Needed

1. **User Guide**: How to upgrade/downgrade
2. **Admin Guide**: How to manage subscriptions
3. **Developer Guide**: How to add new features with gating
4. **API Documentation**: Stripe integration endpoints
5. **Troubleshooting Guide**: Common issues and solutions

## Related Documents

- `/PRICING_STRATEGY.md` - Business strategy and pricing tiers
- `/docs/prd.md` - Product requirements document
- Future: `/docs/stripe-integration.md` - Detailed Stripe setup
- Future: `/docs/feature-gating-guide.md` - Developer guide

## Status

**Current Status**: Planning - Not Yet Implemented  
**Next Steps**: 
1. Review and approve pricing strategy
2. Set up Stripe account
3. Implement Phase 1 (Usage Tracking)
4. Test with pilot users
5. Launch Phase 2 (Subscriptions)

---

*Last Updated: 2026-04-28*
