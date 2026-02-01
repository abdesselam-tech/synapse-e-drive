import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  // Try to get locale from cookie first
  const cookieStore = await cookies();
  const preferredLocale = cookieStore.get('preferred-locale')?.value;
  
  // Validate locale
  const validLocales = ['fr', 'ar', 'en'] as const;
  const locale = validLocales.includes(preferredLocale as 'fr' | 'ar' | 'en')
    ? preferredLocale as 'fr' | 'ar' | 'en'
    : 'fr'; // Default to French

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
