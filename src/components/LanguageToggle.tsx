import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language.startsWith('es') ? 'es' : 'en';

  const toggle = () => {
    const next = currentLang === 'en' ? 'es' : 'en';
    i18n.changeLanguage(next);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      aria-label={currentLang === 'en' ? 'Switch to Spanish' : 'Cambiar a inglés'}
      className="text-sm font-medium"
    >
      <Globe className="h-4 w-4 mr-1" />
      {currentLang.toUpperCase()}
    </Button>
  );
}
