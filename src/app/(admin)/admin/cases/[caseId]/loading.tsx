export default function CaseDetailLoading() {
  return (
    <>
      {/* Hero */}
      <div className="bg-gradient-to-br from-navy via-navy-mid to-[#004080] px-8 pt-9 pb-8">
        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <div>
            <div className="h-7 w-48 bg-white/10 rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-24 bg-white/10 rounded-lg animate-pulse" />
            <div className="h-8 w-24 bg-white/10 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — 2 wide */}
          <div className="lg:col-span-2 space-y-6">
            {/* Details card */}
            <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-grey-100">
                <div className="h-5 w-32 bg-grey-100 rounded animate-pulse" />
              </div>
              <div className="divide-y divide-grey-100">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-2 px-6 py-3.5">
                    <div className="h-3 w-24 bg-grey-100 rounded animate-pulse" />
                    <div className="h-4 w-36 bg-grey-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            {/* Updates card */}
            <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-grey-100">
                <div className="h-5 w-28 bg-grey-100 rounded animate-pulse" />
              </div>
              <div className="divide-y divide-grey-100">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="px-6 py-4">
                    <div className="h-3 w-32 bg-grey-100 rounded animate-pulse mb-2" />
                    <div className="h-4 w-full bg-grey-100 rounded animate-pulse mb-1" />
                    <div className="h-4 w-3/4 bg-grey-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-grey-100">
                  <div className="h-4 w-24 bg-grey-100 rounded animate-pulse" />
                </div>
                <div className="px-5 py-4 space-y-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-4 bg-grey-100 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
