import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface TutorialContextType {
  showTutorial: boolean;
  openTutorial: () => void;
  closeTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [showTutorial, setShowTutorial] = useState(() => {
    return !localStorage.getItem('modelmentor_tutorial_completed');
  });

  const openTutorial = useCallback(() => {
    setShowTutorial(true);
  }, []);

  const closeTutorial = useCallback(() => {
    localStorage.setItem('modelmentor_tutorial_completed', 'true');
    setShowTutorial(false);
  }, []);

  return (
    <TutorialContext.Provider value={{ showTutorial, openTutorial, closeTutorial }}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}
