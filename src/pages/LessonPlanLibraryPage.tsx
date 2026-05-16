import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { FilterPanel } from '@/components/lesson-plans/FilterPanel';
import { LessonPlanCard } from '@/components/lesson-plans/LessonPlanCard';
import { BookOpen } from 'lucide-react';
import { getAllPlans } from '@/data/lessonPlans';
import { filterLessonPlans, type LessonPlanFilters } from '@/data/lessonPlans/filters';
import { toast } from 'sonner';

export default function LessonPlanLibraryPage() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<LessonPlanFilters>({});

  useEffect(() => {
    if (!user) {
      toast.error('Please sign in to access the Lesson Plan Library');
      navigate('/login');
      return;
    }

    if (profile && profile.role !== 'teacher' && profile.role !== 'admin' && profile.role !== 'super_admin') {
      toast.error('Access denied. Lesson Plans are only available to teachers and administrators.');
      navigate('/');
      return;
    }
  }, [user, profile, navigate]);

  const allPlans = getAllPlans();
  const filteredPlans = filterLessonPlans(allPlans, filters);

  if (!user || !profile) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold">{t('lessonPlans.ui.library')}</h1>
              <p className="text-muted-foreground">
                {t('lessonPlans.ui.filterBy')}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <FilterPanel filters={filters} onFilterChange={setFilters} />

        {/* Plan Grid */}
        {filteredPlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlans.map((plan) => (
              <LessonPlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('lessonPlans.ui.noResults')}</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
