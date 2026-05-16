import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

const planConfigs = [
  {
    id:          'free',
    icon:        GraduationCap,
    monthlyPrice: 0,
    yearlyPrice:  0,
    badge:        null,
    includedCount: 6,
    ctaStyle: 'outline' as const,
  },
  {
    id:           'pro',
    icon:         Zap,
    monthlyPrice: 12,
    yearlyPrice:  99,
    includedCount: 12,
    ctaStyle: 'default' as const,
  },
  {
    id:           'enterprise',
    icon:         Building2,
    monthlyPrice: 6,
    yearlyPrice:  50,
    perStudent:   true,
    minStudents:  6,
    includedCount: 12,
    ctaStyle: 'outline' as const,
  },
];

export default function PricingPage() {
  const { t } = useTranslation();
  const { formatCurrency } = useLocaleFormat();
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
      toast.success(t('pages.pricing.checkoutSuccess'));
      setSearchParams({}, { replace: true });
    } else if (checkoutStatus === 'cancelled') {
      toast.info(t('pages.pricing.checkoutCancelled'));
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, t]);

  const handleCTA = async (planId: string) => {
    if (!isAuthenticated) {
      return navigate('/signup');
    }

    if (planId === 'free') {
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

  const getButtonLabel = (planId: string, cta: string) => {
    if (!isAuthenticated) {
      return t('pages.pricing.signUpToStart');
    }

    if (planId === subscription.tier) {
      return t('pages.pricing.currentPlanButton');
    }

    return cta;
  };

  const isCurrentPlan = (planId: string) => {
    return isAuthenticated && planId === subscription.tier;
  };

  const faqItems = t('pages.pricing.faq.items', { returnObjects: true }) as Array<{ question: string; answer: string }>;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-16">

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">{t('pages.pricing.title')}</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {t('pages.pricing.subtitle')}
          </p>

          {/* Trial status banner */}
          {isAuthenticated && subscription.isOnTrial && (
            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium">
              <Clock className="h-4 w-4" />
              <span>
                {t('pages.pricing.trialBanner', {
                  days: subscription.trialDaysRemaining,
                  daysWord: subscription.trialDaysRemaining !== 1 ? t('pages.pricing.daysWord') : t('pages.pricing.dayWord')
                })}
              </span>
            </div>
          )}

          {/* Usage summary for authenticated users */}
          {isAuthenticated && (
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground pt-1">
              <span>{t('pages.pricing.currentPlan')} <Badge variant="secondary" className="ml-1">{subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)}</Badge></span>
              <span>•</span>
              <span>{t('pages.pricing.trainingSessionsUsed', { count: subscription.usage.training_sessions })}</span>
              <span>•</span>
              <span>{t('pages.pricing.storageUsed', { amount: subscription.usage.storage_mb })}</span>
            </div>
          )}

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <Label htmlFor="billing-toggle" className="text-sm">{t('pages.pricing.billingToggle.monthly')}</Label>
            <Switch
              id="billing-toggle"
              checked={yearly}
              onCheckedChange={setYearly}
            />
            <Label htmlFor="billing-toggle" className="text-sm">
              {t('pages.pricing.billingToggle.yearly')}
              <Badge variant="secondary" className="ml-2 text-xs">{t('pages.pricing.billingToggle.savePercent')}</Badge>
            </Label>
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-8">
          {planConfigs.map((plan) => {
            const Icon  = plan.icon;
            const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
            const planKey = plan.id === 'enterprise' ? 'school' : plan.id;
            const planName = t(`pages.pricing.plans.${planKey}.name`);
            const planDescription = t(`pages.pricing.plans.${planKey}.description`);
            const planCta = t(`pages.pricing.plans.${planKey}.cta`);
            const planBadge = plan.id === 'pro' ? t('pages.pricing.plans.pro.badge') : plan.id === 'enterprise' ? t('pages.pricing.plans.school.badge') : null;
            const planFeatures = t(`pages.pricing.plans.${planKey}.features`, { returnObjects: true }) as string[];
            const isPopular = plan.id === 'pro';
            const isCurrent = isCurrentPlan(plan.id);

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${isPopular ? 'border-primary shadow-lg scale-105' : ''} ${isCurrent ? 'ring-2 ring-primary' : ''}`}
              >
                {planBadge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className={isPopular ? 'bg-primary text-primary-foreground' : ''}>
                      {planBadge}
                    </Badge>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="outline" className="bg-background">
                      {t('pages.pricing.yourPlan')}
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <CardTitle>{planName}</CardTitle>
                  </div>
                  <CardDescription>{planDescription}</CardDescription>

                  <div className="pt-2">
                    {plan.id === 'enterprise' ? (
                      <div className="space-y-2">
                        <div className="flex items-end gap-1">
                          <span className="text-3xl font-bold">
                            {formatCurrency(yearly ? (plan.yearlyPrice ?? 0) * studentCount : (plan.monthlyPrice ?? 0) * studentCount)}
                          </span>
                          <span className="text-muted-foreground text-sm mb-1">
                            {t('pages.pricing.perPeriod', { period: yearly ? t('pages.pricing.year') : t('pages.pricing.month') })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t('pages.pricing.plans.school.perStudentPrice', {
                            price: yearly ? plan.yearlyPrice ?? 0 : plan.monthlyPrice ?? 0,
                            period: yearly ? t('pages.pricing.year') : t('pages.pricing.month'),
                            count: studentCount
                          })}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <Label htmlFor="student-count" className="text-xs whitespace-nowrap">{t('pages.pricing.plans.school.studentsLabel')}</Label>
                          <Input
                            id="student-count"
                            type="number"
                            min={6}
                            max={500}
                            value={studentCount}
                            onChange={(e) => setStudentCount(Math.max(6, parseInt(e.target.value) || 6))}
                            className="h-8 w-20 text-sm"
                          />
                          <span className="text-xs text-muted-foreground">{t('pages.pricing.plans.school.minStudents')}</span>
                        </div>
                      </div>
                    ) : price === null ? (
                      <div className="text-3xl font-bold">{t('pages.pricing.custom')}</div>
                    ) : price === 0 ? (
                      <div className="text-3xl font-bold">{t('pages.pricing.free')}</div>
                    ) : (
                      <div className="flex items-end gap-1">
                        <span className="text-3xl font-bold">{formatCurrency(price)}</span>
                        <span className="text-muted-foreground text-sm mb-1">
                          {t('pages.pricing.perPeriod', { period: yearly ? t('pages.pricing.year') : t('pages.pricing.month') })}
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col flex-1 gap-6">
                  <ul className="space-y-2 flex-1">
                    {planFeatures.map((feature, index) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        {index < plan.includedCount && plan.id !== 'enterprise'
                          ? (plan.id === 'free' && index >= 6
                            ? <X className="h-4 w-4 text-muted-foreground shrink-0" />
                            : <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />)
                          : <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        }
                        <span className={plan.id === 'free' && index >= 6 ? 'text-muted-foreground' : ''}>{feature}</span>
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
                        {t('common.messages.redirecting')}
                      </span>
                    ) : (
                      getButtonLabel(plan.id, planCta)
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-2xl font-semibold text-center">{t('pages.pricing.faq.title')}</h2>
          <div className="space-y-4">
            {faqItems.map((faq) => (
              <Card key={faq.question}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
