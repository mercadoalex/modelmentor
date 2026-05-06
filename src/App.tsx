import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import { Toaster } from '@/components/ui/sonner';
import { OnboardingTutorial } from '@/components/onboarding/OnboardingTutorial';

import { routes } from './routes';

import { AuthProvider } from '@/contexts/AuthContext';
import { TutorialProvider } from '@/contexts/TutorialContext';
import { RouteGuard } from '@/components/common/RouteGuard';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <TutorialProvider>
          <RouteGuard>
            <IntersectObserver />
            <OnboardingTutorial />
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
        </TutorialProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
