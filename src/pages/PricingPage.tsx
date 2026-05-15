import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CheckCircle2, X, Zap, GraduationCap, Building2, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';

const plans = [
  {
    id:          'free',
    name:        'Free',
    icon:        GraduationCap,
    description: 'Learn ML concepts with interactive simulations — no signup required',
    monthlyPrice: 0,
    yearlyPrice:  0,
    badge:        null,
    features: [
      { label: 'Smart training simulation',     included: true  },
      { label: 'Interactive learning activities', included: true  },
      { label: '3 active projects',             included: true  },
      { label: 'Guided tour with matched datasets', included: true  },
      { label: 'Data validation & engineering tools', included: true  },
      { label: 'CSV exports',                   included: true  },
      { label: 'Real TensorFlow.js training',   included: false },
      { label: 'Real model predictions',        included: false },
      { label: 'Cloud dataset storage',         included: false },
      { label: 'Model deployment',              included: false },
      { label: 'Kaggle dataset integration',    included: false },
      { label: 'Priority support',              included: false },
    ],
    cta:      'Get Started Free',
    ctaStyle: 'outline' as const,
  },
  {
    id:           'pro',
    name:         'Pro',
    icon:         Zap,
    description:  'Real model training in your browser — train, test, and predict',
    monthlyPrice: 12,
    yearlyPrice:  99,
    badge:        'Most Popular',
    features: [
      { label: 'Real TensorFlow.js training ✨', included: true },
      { label: 'Real predictions on new data',  included: true },
      { label: 'Model saved to browser (IndexedDB)', included: true },
      { label: '50 active projects',            included: true },
      { label: '500 training sessions/month',   included: true },
      { label: '5 GB cloud storage',            included: true },
      { label: 'All ML model types (4 architectures)', included: true },
      { label: 'CSV & PDF exports',             included: true },
      { label: 'Kaggle dataset integration',    included: true },
      { label: 'Advanced visualizations',       included: true },
      { label: 'Collaboration tools',           included: true },
      { label: 'Priority support',              included: true },
    ],
    cta:      'Start Pro Trial',
    ctaStyle: 'default' as const,
  },
  {
    id:           'enterprise',
    name:         'School',
    icon:         Building2,
    description:  'Per-student pricing for classrooms. Minimum 6 students.',
    monthlyPrice: 5,   // $5/student/month
    yearlyPrice:  48,   // $4/student/month billed yearly ($48/student/year)
    badge:        'Best Value',
    perStudent:   true,
    minStudents:  6,
    features: [
      { label: 'Server-side GPU training (coming soon)', included: true },
      { label: 'Unlimited projects & sessions', included: true },
      { label: '50 GB storage per school',      included: true },
      { label: 'Model deployment as API',       included: true },
      { label: 'Multi-teacher accounts',        included: true },
      { label: 'Class & group management',      included: true },
      { label: 'Student progress dashboard',    included: true },
      { label: 'Scheduled reports & analytics', included: true },
      { label: 'Assignment grading',            included: true },
      { label: 'SSO/SAML authentication',       included: true },
      { label: 'Dedicated support',             included: true },
      { label: 'Custom integrations',           included: true },
    ],
    cta:      'Start School Plan',
    ctaStyle: 'outline' as const,
  },
];

const faqs = [
  {
    q: 'Can I upgrade or downgrade anytime?',
    a: 'Yes, you can change your plan at any time. Upgrades take effect immediately, downgrades at the end of your billing period.',
  },
  {
    q: 'What happens when I reach my free tier limits?',
    a: "You'll see an upgrade prompt. Your existing data is never deleted — you just can't create new resources until you upgrade or the month resets.",
  },
  {
    q: 'Is there a free trial for Pro?',
    a: 'Yes! Pro comes with a 14-day free trial. No credit card required.',
  },
  {
    q: 'Do you offer discounts for non-profits or universities?',
    a: 'Yes, contact us at pricing@modelmentor.ai for educational discounts.',
  },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [yearly, setYearly] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [studentCount, setStudentCount] = useState(6);

  const { isAuthenticated } = useAuth();
  const subscription = useSubscription();

  // Handle checkout success/cancel redirects
  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout');
    if (checkoutStatus === 'success') {
      toast.success('Payment successful! Your plan has been upgraded.');
      setSearchParams({}, { replace: true });
    } else if (checkoutStatus === 'cancelled') {
      toast.info('Checkout was cancelled. No changes were made to your plan.');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleCTA = async (planId: string) => {
    if (!isAuthenticated) {
      return navigate('/signup');
    }

    if (planId === 'free') {
      // Already on free or navigating to signup
      return navigate('/dashboard');
    }

    if (planId === 'enterprise') {
      return window.open('mailto:sales@modelmentor.ai', '_blank');
    }

    // Initiate Stripe checkout for pro/enterprise
    const billingPeriod = yearly ? 'yearly' : 'monthly';
    const tier = planId as 'pro' | 'enterprise';

    setCheckoutLoading(planId);
    try {
      await subscription.initiateCheckout(tier, billingPeriod);
    } catch {
      // Error toast is handled by SubscriptionContext
    } finally {
      setCheckoutLoading(null);
    }
  };

  const getButtonLabel = (plan: typeof plans[number]) => {
    if (!isAuthenticated) {
      return 'Sign up to get started';
    }

    // If this is the user's current tier, show "Current Plan"
    if (plan.id === subscription.tier) {
      return 'Current Plan';
    }

    return plan.cta;
  };

  const isCurrentPlan = (planId: string) => {
    return isAuthenticated && planId === subscription.tier;
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-16">

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Simple, transparent pricing</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Start free. Upgrade when you're ready. No hidden fees.
          </p>

          {/* Trial status banner */}
          {isAuthenticated && subscription.isOnTrial && (
            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium">
              <Clock className="h-4 w-4" />
              <span>
                You're on a free trial — {subscription.trialDaysRemaining} day{subscription.trialDaysRemaining !== 1 ? 's' : ''} remaining
              </span>
            </div>
          )}

          {/* Usage summary for authenticated users */}
          {isAuthenticated && (
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground pt-1">
              <span>Current plan: <Badge variant="secondary" className="ml-1">{subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)}</Badge></span>
              <span>•</span>
              <span>{subscription.usage.training_sessions} training sessions used this month</span>
              <span>•</span>
              <span>{subscription.usage.storage_mb} MB storage used</span>
            </div>
          )}

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <Label htmlFor="billing-toggle" className="text-sm">Monthly</Label>
            <Switch
              id="billing-toggle"
              checked={yearly}
              onCheckedChange={setYearly}
            />
            <Label htmlFor="billing-toggle" className="text-sm">
              Yearly
              <Badge variant="secondary" className="ml-2 text-xs">Save 30%</Badge>
            </Label>
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const Icon  = plan.icon;
            const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
            const isPopular = plan.badge === 'Most Popular';
            const isCurrent = isCurrentPlan(plan.id);

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${isPopular ? 'border-primary shadow-lg scale-105' : ''} ${isCurrent ? 'ring-2 ring-primary' : ''}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className={isPopular ? 'bg-primary text-primary-foreground' : ''}>
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="outline" className="bg-background">
                      Your Plan
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <CardTitle>{plan.name}</CardTitle>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>

                  <div className="pt-2">
                    {plan.id === 'enterprise' ? (
                      <div className="space-y-2">
                        <div className="flex items-end gap-1">
                          <span className="text-3xl font-bold">
                            ${yearly ? (plan.yearlyPrice ?? 0) * studentCount : (plan.monthlyPrice ?? 0) * studentCount}
                          </span>
                          <span className="text-muted-foreground text-sm mb-1">
                            /{yearly ? 'year' : 'month'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ${yearly ? plan.yearlyPrice ?? 0 : plan.monthlyPrice ?? 0}/student/{yearly ? 'year' : 'month'} × {studentCount} students
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <Label htmlFor="student-count" className="text-xs whitespace-nowrap">Students:</Label>
                          <Input
                            id="student-count"
                            type="number"
                            min={6}
                            max={500}
                            value={studentCount}
                            onChange={(e) => setStudentCount(Math.max(6, parseInt(e.target.value) || 6))}
                            className="h-8 w-20 text-sm"
                          />
                          <span className="text-xs text-muted-foreground">(min 6)</span>
                        </div>
                      </div>
                    ) : price === null ? (
                      <div className="text-3xl font-bold">Custom</div>
                    ) : price === 0 ? (
                      <div className="text-3xl font-bold">Free</div>
                    ) : (
                      <div className="flex items-end gap-1">
                        <span className="text-3xl font-bold">${price}</span>
                        <span className="text-muted-foreground text-sm mb-1">
                          /{yearly ? 'year' : 'month'}
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col flex-1 gap-6">
                  <ul className="space-y-2 flex-1">
                    {plan.features.map((f) => (
                      <li key={f.label} className="flex items-center gap-2 text-sm">
                        {f.included
                          ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          : <X className="h-4 w-4 text-muted-foreground shrink-0" />
                        }
                        <span className={f.included ? '' : 'text-muted-foreground'}>{f.label}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.ctaStyle}
                    className="w-full"
                    onClick={() => handleCTA(plan.id)}
                    disabled={isCurrent || checkoutLoading !== null}
                  >
                    {checkoutLoading === plan.id ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Redirecting...
                      </span>
                    ) : (
                      getButtonLabel(plan)
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-2xl font-semibold text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <Card key={faq.q}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
