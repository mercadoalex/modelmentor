import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

interface LocaleFormatters {
  formatCurrency: (amount: number, currency?: string) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
}

export function useLocaleFormat(): LocaleFormatters {
  const { i18n } = useTranslation();
  const locale = i18n.language.startsWith('es') ? 'es-ES' : 'en-US';

  return useMemo(() => ({
    formatCurrency: (amount: number, currency = 'USD') => {
      if (Number.isNaN(amount)) return '—';
      return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
    },

    formatNumber: (value: number, options?: Intl.NumberFormatOptions) => {
      if (Number.isNaN(value)) return '—';
      return new Intl.NumberFormat(locale, options).format(value);
    },

    formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (Number.isNaN(d.getTime())) {
        return locale.startsWith('es') ? 'Fecha inválida' : 'Invalid date';
      }
      return new Intl.DateTimeFormat(locale, options ?? { dateStyle: 'long' }).format(d);
    },
  }), [locale]);
}
