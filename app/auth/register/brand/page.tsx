'use client';

import Link from 'next/link';

export default function BrandRegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-[#f8f9fa] p-4" dir="rtl">
      <div className="glass-panel w-full max-w-md p-8 rounded-xl text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-[#f2cc0d]/20 rounded-full flex items-center justify-center">
          <span className="text-3xl">🏢</span>
        </div>
        <h1 className="text-2xl font-bold text-[#212529] mb-3">
          הרשמה למותגים בהזמנה בלבד
        </h1>
        <p className="text-[#6c757d] mb-8 leading-relaxed">
          חשבונות מותג נוצרים על ידי הנהלת LEADERS.
          <br />
          לפרטים נוספים, צרו איתנו קשר.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/auth/login"
            className="w-full inline-block px-6 py-3 text-sm font-bold text-[#121212] bg-[#f2cc0d] rounded-lg hover:bg-[#dcb900] transition-colors"
          >
            התחבר לחשבון קיים
          </Link>
          <Link
            href="/auth/register/creator"
            className="w-full inline-block px-6 py-3 text-sm font-medium text-[#6c757d] bg-white border border-[#dee2e6] rounded-lg hover:bg-[#f8f9fa] transition-colors"
          >
            הירשם כמשפיען
          </Link>
        </div>
      </div>
    </div>
  );
}
