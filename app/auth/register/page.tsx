'use client';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#232010] p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-[#f8f9fa] border border-[#dee2e6] rounded-xl p-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[#212529] mb-4">
              ברוכים הבאים ל-LEADERS
            </h1>
            <p className="text-[#6c757d] text-lg">
              פלטפורמת הניהול המקצועית ליוצרי תוכן ומותגים
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Creator Card */}
            <a
              href="/auth/register/creator"
              className="group block p-8 bg-[#232010] border-2 border-[#dee2e6] hover:border-[#f2cc0d] rounded-xl transition-all hover:scale-105"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#f2cc0d]/20 rounded-full flex items-center justify-center group-hover:bg-[#f2cc0d]/30 transition-colors">
                  <span className="material-symbols-outlined text-3xl text-[#f2cc0d]">
                    person
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-[#212529] mb-2">
                  משפיען
                </h2>
                <p className="text-[#6c757d]">
                  הצטרף לקמפיינים, צור תוכן והרווח כסף
                </p>
                <div className="mt-6 text-[#f2cc0d] font-bold group-hover:underline">
                  הירשם עכשיו →
                </div>
              </div>
            </a>

            {/* Brand Card */}
            <a
              href="/auth/register/brand"
              className="group block p-8 bg-[#232010] border-2 border-[#dee2e6] hover:border-[#f2cc0d] rounded-xl transition-all hover:scale-105"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#f2cc0d]/20 rounded-full flex items-center justify-center group-hover:bg-[#f2cc0d]/30 transition-colors">
                  <span className="material-symbols-outlined text-3xl text-[#f2cc0d]">
                    business
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-[#212529] mb-2">מותג</h2>
                <p className="text-[#6c757d]">
                  צור קמפיינים, מצא יוצרים ונהל תוכן
                </p>
                <div className="mt-6 text-[#f2cc0d] font-bold group-hover:underline">
                  הירשם עכשיו →
                </div>
              </div>
            </a>
          </div>

          <div className="mt-8 text-center">
            <p className="text-[#6c757d] text-sm">
              כבר יש לך חשבון?{" "}
              <a href="/auth/login" className="text-[#f2cc0d] hover:underline">
                התחבר
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
