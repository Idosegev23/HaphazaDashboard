import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  // Use static imports to avoid dynamic import issues
  const messages = locale === 'he' 
    ? (await import('../messages/he.json')).default
    : (await import('../messages/en.json')).default;

  return {
    locale,
    messages,
  };
});
