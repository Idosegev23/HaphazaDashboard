import type { Metadata } from 'next';
import { Manrope, Assistant } from 'next/font/google';
import './globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { StageShell } from '@/components/layout/StageShell';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const assistant = Assistant({
  subsets: ['latin', 'hebrew'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-assistant',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LEADERS - UGC Operations Platform',
  description: 'פלטפורמת ניהול מקצועית ליוצרות תוכן UGC ולמותגים',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === 'he' ? 'rtl' : 'ltr'}>
      <body className={`${manrope.variable} ${assistant.variable}`}>
        <NextIntlClientProvider messages={messages}>
          <StageShell>{children}</StageShell>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
