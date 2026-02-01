/**
 * Language Switcher Component
 * Allows users to change their preferred language
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config';
import { updateUserLanguage } from '@/lib/server/actions/users';

interface LanguageSwitcherProps {
  currentLocale: Locale;
  userId?: string;
  className?: string;
}

export function LanguageSwitcher({ 
  currentLocale, 
  userId,
  className = '' 
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLanguageChange(locale: Locale) {
    if (locale === currentLocale) {
      setIsOpen(false);
      return;
    }

    setLoading(true);
    
    try {
      // Save preference to user profile if logged in
      if (userId) {
        await updateUserLanguage(userId, locale);
      }
      
      // Store in cookie for non-logged-in users
      document.cookie = `preferred-locale=${locale};path=/;max-age=31536000`;
      
      // Refresh the page to apply new locale
      router.refresh();
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
        aria-label="Change language"
      >
        <span className="text-lg">{localeFlags[currentLocale]}</span>
        <span className="text-sm font-medium">{localeNames[currentLocale]}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border z-20">
            {locales.map((locale) => (
              <button
                key={locale}
                onClick={() => handleLanguageChange(locale)}
                disabled={loading}
                className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  locale === currentLocale ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                } ${locale === locales[0] ? 'rounded-t-md' : ''} ${
                  locale === locales[locales.length - 1] ? 'rounded-b-md' : ''
                }`}
              >
                <span className="text-lg">{localeFlags[locale]}</span>
                <span>{localeNames[locale]}</span>
                {locale === currentLocale && (
                  <svg className="w-4 h-4 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Compact language switcher for mobile/sidebar
 */
export function LanguageSwitcherCompact({ 
  currentLocale, 
  userId,
  className = '' 
}: LanguageSwitcherProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLanguageChange(locale: Locale) {
    if (locale === currentLocale) return;

    setLoading(true);
    
    try {
      if (userId) {
        await updateUserLanguage(userId, locale);
      }
      document.cookie = `preferred-locale=${locale};path=/;max-age=31536000`;
      router.refresh();
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`flex gap-1 ${className}`}>
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => handleLanguageChange(locale)}
          disabled={loading}
          className={`px-2 py-1 rounded text-sm transition-colors ${
            locale === currentLocale 
              ? 'bg-blue-100 text-blue-700' 
              : 'hover:bg-gray-100 text-gray-600'
          }`}
          title={localeNames[locale]}
        >
          {localeFlags[locale]}
        </button>
      ))}
    </div>
  );
}

export default LanguageSwitcher;
