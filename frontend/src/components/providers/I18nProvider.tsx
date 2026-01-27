'use client';

import React, { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Only update if different from current language
    if (!isInitialized) {
      const savedLang = localStorage.getItem('language') || 'en';
      if (i18n.language !== savedLang) {
        i18n.changeLanguage(savedLang);
      }
      document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = savedLang;
      setIsInitialized(true);
    }
  }, [isInitialized]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
