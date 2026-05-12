import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import { Toaster } from '@/components/ui/sonner';
import { OnboardingTutorial } from '@/components/onboarding/OnboardingTutorial';
import { ContextualHelp } from '@/components/ContextualHelp';

import { routes } from './routes';

import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { TrainingProvider } from '@/contexts/TrainingContext';
import { TutorialProvider } from '@/contexts/TutorialContext';
import { ContextualHelpProvider } from '@/contexts/ContextualHelpContext';
import { RouteGuard } from '@/components/common/RouteGuard';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <SubscriptionProvider>
          <TrainingProvider>
            <TutorialProvider>
              <ContextualHelpProvider>
                <RouteGuard>
                  <IntersectObserver />
                  <OnboardingTutorial />
                  <ContextualHelp />
                  <Routes>
                    {routes.map((route, index) => (
                      <Route
                        key={index}
                        path={route.path}
                        element={route.element}
                      />
                    ))}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                  <Toaster />
                </RouteGuard>
              </ContextualHelpProvider>
            </TutorialProvider>
          </TrainingProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
