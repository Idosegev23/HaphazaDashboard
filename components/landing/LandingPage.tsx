'use client';

import Link from 'next/link';

const features = [
  {
    icon: '🎯',
    title: 'ניהול קמפיינים',
    desc: 'צרו וניהלו קמפיינים מקצה לקצה — בריפים, משימות, לוחות זמנים ואישורי תוכן במקום אחד',
  },
  {
    icon: '🎬',
    title: 'יצירת תוכן UGC',
    desc: 'חברו עם יוצרי תוכן מובילים, נהלו משימות ועקבו אחרי ההתקדמות בזמן אמת',
  },
  {
    icon: '💰',
    title: 'תשלומים ודוחות',
    desc: 'מערכת תשלומים מאובטחת ושקופה עם דוחות מפורטים לכל קמפיין',
  },
  {
    icon: '📊',
    title: 'אנליטיקס וביצועים',
    desc: 'דשבורדים חכמים עם נתוני ביצועים, דירוגים ותובנות לקבלת החלטות',
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#f8f9fa]" dir="rtl">
      {/* Header */}
      <header className="w-full px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="text-2xl font-bold text-[#f2cc0d] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            LEADERS
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="px-5 py-2.5 text-sm font-medium text-[#212529] bg-white border border-[#dee2e6] rounded-lg hover:bg-[#f8f9fa] transition-colors"
            >
              התחבר
            </Link>
            <Link
              href="/auth/register/creator"
              className="px-5 py-2.5 text-sm font-bold text-[#121212] bg-[#f2cc0d] rounded-lg hover:bg-[#dcb900] transition-colors"
            >
              הצטרף כמשפיען
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-16 pb-20 px-6 overflow-hidden">
        {/* Gold glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#f2cc0d]/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center">
          <h1
            className="text-5xl md:text-6xl font-bold text-[#212529] mb-6 leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            הפלטפורמה המקצועית
            <br />
            <span className="text-[#f2cc0d]">לניהול UGC</span>
          </h1>
          <p className="text-lg md:text-xl text-[#6c757d] mb-10 max-w-xl mx-auto leading-relaxed">
            LEADERS מחברת בין מותגים ליוצרי תוכן — ניהול קמפיינים, משימות, תשלומים ותוכן במקום אחד
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/auth/register/creator"
              className="px-8 py-3.5 text-base font-bold text-[#121212] bg-[#f2cc0d] rounded-xl hover:bg-[#dcb900] transition-colors shadow-[0_0_20px_rgba(242,204,13,0.25)]"
            >
              הצטרף כמשפיען
            </Link>
            <Link
              href="/auth/login"
              className="px-8 py-3.5 text-base font-medium text-[#212529] bg-white border border-[#dee2e6] rounded-xl hover:bg-[#f8f9fa] transition-colors"
            >
              התחבר לחשבון קיים
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-3xl font-bold text-[#212529] text-center mb-12"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            הכל במקום אחד
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="glass-panel rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl mb-3">{f.icon}</div>
                <h3 className="text-base font-bold text-[#212529] mb-2">{f.title}</h3>
                <p className="text-sm text-[#6c757d] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="glass-panel rounded-2xl p-10 text-center border-[#f2cc0d]/30">
            <h2
              className="text-2xl font-bold text-[#212529] mb-3"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              מוכנים להתחיל?
            </h2>
            <p className="text-[#6c757d] mb-8">
              הצטרפו ל-LEADERS והתחילו לעבוד עם מותגים מובילים
            </p>
            <Link
              href="/auth/register/creator"
              className="inline-block px-8 py-3.5 text-base font-bold text-[#121212] bg-[#f2cc0d] rounded-xl hover:bg-[#dcb900] transition-colors shadow-[0_0_20px_rgba(242,204,13,0.25)]"
            >
              הירשם בחינם
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[#dee2e6]">
        <div className="max-w-6xl mx-auto text-center">
          <span className="text-sm text-[#6c757d]">
            LEADERS &copy; {new Date().getFullYear()} — Powered by Stagwell
          </span>
        </div>
      </footer>
    </div>
  );
}
