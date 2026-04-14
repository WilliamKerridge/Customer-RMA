export default function DashboardLoading() {
  return (
    <>
      {/* Hero skeleton */}
      <div className="bg-gradient-to-br from-navy via-navy-mid to-[#004080] px-8 pt-9 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-7 w-48 bg-white/10 rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-white/10 rounded animate-pulse" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-grey-200 shadow-sm px-5 py-4">
              <div className="h-3 w-20 bg-grey-100 rounded animate-pulse mb-3" />
              <div className="h-8 w-12 bg-grey-100 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-grey-100">
            <div className="h-5 w-32 bg-grey-100 rounded animate-pulse" />
          </div>
          <div className="divide-y divide-grey-100">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4">
                <div className="h-4 w-32 bg-grey-100 rounded animate-pulse" />
                <div className="h-4 w-48 bg-grey-100 rounded animate-pulse flex-1" />
                <div className="h-5 w-24 bg-grey-100 rounded-full animate-pulse" />
                <div className="h-4 w-20 bg-grey-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
