import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CheckCircle2, X, Zap, GraduationCap, Building2 } from 'lucide-react';

const plans = [
  {
    id:          'free',
    name:        'Free',
    icon:        GraduationCap,
    description: 'Perfect for students getting started with ML',
    monthlyPrice: 0,
    yearlyPrice:  0,
    badge:        null,
    features: [
      { label: '3 active projects',             included: true  },
      { label: '10 training sessions/month',    included: true  },
      { label: '100 MB storage',                included: true  },
      { label: 'Basic ML models',               included: true  },
      { label: 'CSV exports',                   included: true  },
      { label: 'Community support',             included: true  },
      { label: 'PDF report exports',            included: false },
      { label: 'Kaggle dataset integration',    included: false },
      { label: 'Advanced visualizations',       included: false },
      { label: 'Collaboration tools',           included: false },
      { label: 'Model deployment',              included: false },
      { label: 'Priority support',              included: false },
    ],
    cta:      'Get Started Free',
    ctaStyle: 'outline' as const,
  },
  {
    id:           'pro',
    name:         'Pro',
    icon:         Zap,
    description:  'For serious students and individual teachers',
    monthlyPrice: 12,
    yearlyPrice:  99,
    badge:        'Most Popular',
    features: [
      { label: '50 active projects',            included: true },
      { label: '500 training sessions/month',   included: true },
      { label: '5 GB storage',                  included: true },
      { label: 'All ML model types',            included: true },
      { label: 'CSV & PDF exports',             included: true },
      { label: 'Priority support',              included: true },
      { label: 'PDF report exports',            included: true },
      { label: 'Kaggle dataset integration',    included: true },
      { label: 'Advanced visualizations',       included: true },
      { label: 'Collaboration tools',           included: true },
      { label: 'Model deployment',              included: true },
      { label: 'Custom branding',               included: true },
    ],
    cta:      'Start Pro Trial',
    ctaStyle: 'default' as const,
  },
  {
    id:           'enterprise',
    name:         'School',
    icon:         Building2,
    description:  'For schools and educational institutions',
    monthlyPrice: null,
    yearlyPrice:  399,
    badge:        'Best Value',
    features: [
      { label: 'Unlimited projects',            included: true },
      { label: 'Unlimited training sessions',   included: true },
      { label: '50 GB storage per school',      included: true },
      { label: 'All ML model types',            included: true },
      { label: 'All export formats',            included: true },
      { label: 'Dedicated support',             included: true },
      { label: 'Multi-teacher accounts',        included: true },
      { label: 'Class management',              included: true },
      { label: 'Admin dashboard',               included: true },
      { label: 'Advanced analytics',            included: true },
      { label: 'SSO/SAML authentication',       included: true },
      { label: 'Custom integrations',           included: true },
    ],
    cta:      'Contact Sales',
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
  const navigate    = useNavigate();
  const [yearly, setYearly] = useState(false);

  const handleCTA = (planId: string) => {
    if (planId === 'free')       return navigate('/signup');
    if (planId === 'enterprise') return window.open('mailto:sales@modelmentor.ai', '_blank');
    return navigate('/signup?plan=pro');
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

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${isPopular ? 'border-primary shadow-lg scale-105' : ''}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className={isPopular ? 'bg-primary text-primary-foreground' : ''}>
                      {plan.badge}
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
                    {price === null ? (
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
                  >
                    {plan.cta}
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