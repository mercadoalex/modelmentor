import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { tutorialService } from '@/services/tutorialService';
import { getTutorial } from '@/data/tutorials';
import type { Tutorial } from '@/data/tutorials';

export function useOnboarding() {
  const { user } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);
  const [activeTour, setActiveTour] = useState<Tutorial | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const completed = await tutorialService.hasCompletedOnboarding(user.id);
      setHasCompletedOnboarding(completed);
      
      // Show welcome modal for first-time users
      if (!completed) {
        setShowWelcome(true);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startTour = async (tourId: string) => {
    if (!user) return;

    const tutorial = getTutorial(tourId);
    if (!tutorial) {
      console.error(`Tutorial ${tourId} not found`);
      return;
    }

    await tutorialService.startTutorial(user.id, tourId);
    setActiveTour(tutorial);
  };

  const completeTour = async () => {
    if (!user || !activeTour) return;

    await tutorialService.completeTutorial(user.id, activeTour.id);
    setActiveTour(null);

    // Mark onboarding as complete if this was the welcome tour
    if (activeTour.id === 'dashboard-tour') {
      await tutorialService.completeTutorial(user.id, 'welcome-onboarding');
      setHasCompletedOnboarding(true);
    }
  };

  const skipTour = async () => {
    if (!user || !activeTour) return;

    await tutorialService.skipTutorial(user.id, activeTour.id);
    setActiveTour(null);

    // Mark onboarding as skipped if this was the welcome tour
    if (activeTour.id === 'dashboard-tour') {
      await tutorialService.skipTutorial(user.id, 'welcome-onboarding');
      setHasCompletedOnboarding(true);
    }
  };

  const closeWelcome = async () => {
    setShowWelcome(false);
    
    // Mark as skipped if user closes without starting tour
    if (user && !hasCompletedOnboarding) {
      await tutorialService.skipTutorial(user.id, 'welcome-onboarding');
      setHasCompletedOnboarding(true);
    }
  };

  const startWelcomeTour = () => {
    setShowWelcome(false);
    startTour('dashboard-tour');
  };

  const resetOnboarding = async () => {
    if (!user) return;

    await tutorialService.resetTutorial(user.id, 'welcome-onboarding');
    await tutorialService.resetTutorial(user.id, 'dashboard-tour');
    setHasCompletedOnboarding(false);
    setShowWelcome(true);
  };

  return {
    showWelcome,
    activeTour,
    hasCompletedOnboarding,
    isLoading,
    startTour,
    completeTour,
    skipTour,
    closeWelcome,
    startWelcomeTour,
    resetOnboarding,
  };
}
