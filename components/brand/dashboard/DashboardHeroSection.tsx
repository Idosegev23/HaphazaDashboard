export function DashboardHeroSection() {
  return (
    <div className="bg-[#dbe4f5] rounded-2xl p-6 relative overflow-hidden flex items-end" style={{ height: 406 }}>
      {/* Background decorative circles */}
      <svg
        className="absolute top-0 right-0 w-full h-full opacity-10"
        viewBox="0 0 500 406"
        fill="none"
        preserveAspectRatio="xMaxYMid slice"
      >
        <circle cx="350" cy="200" r="120" stroke="#3b5998" strokeWidth="1.5" />
        <circle cx="350" cy="200" r="180" stroke="#3b5998" strokeWidth="1" />
      </svg>

      {/* Hero content area */}
      <div className="relative z-10 w-full">
        {/* Floating product cards */}
        <div className="flex gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 min-w-[160px]">
            <div className="w-12 h-12 bg-[#f4f5f7] rounded-lg flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#6b7281]">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-[#6b7281]">תכנים מוכנים</p>
              <p className="text-lg font-bold text-[#212529]">24</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 min-w-[160px]">
            <div className="w-12 h-12 bg-[#f4f5f7] rounded-lg flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#6b7281]">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-[#6b7281]">יוצרים פעילים</p>
              <p className="text-lg font-bold text-[#212529]">12</p>
            </div>
          </div>
        </div>

        {/* Large decorative image placeholder */}
        <div className="bg-white/30 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[#3b5998]">
                <path d="M23 6l-9.5 9.5-5-5L1 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17 6h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#212529]">ביצועי המותג</p>
              <p className="text-xs text-[#6b7281]">צפה בסטטיסטיקות מפורטות</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
