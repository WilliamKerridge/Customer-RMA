export default function AccountDetailLoading() {
  return (
    <>
      <div className="bg-gradient-to-br from-navy via-navy-mid to-[#004080] px-8 pt-9 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-7 w-48 bg-white/10 rounded animate-pulse mb-2" />
          <div className="h-4 w-56 bg-white/10 rounded animate-pulse" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-grey-100">
                <div className="h-5 w-36 bg-grey-100 rounded animate-pulse" />
              </div>
              <div className="divide-y divide-grey-100">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-2 px-6 py-3.5">
                    <div className="h-3 w-24 bg-grey-100 rounded animate-pulse" />
                    <div className="h-4 w-32 bg-grey-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-grey-100">
                <div className="h-5 w-28 bg-grey-100 rounded animate-pulse" />
              </div>
              <div className="divide-y divide-grey-100">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="px-6 py-4 flex items-center gap-4">
                    <div className="h-4 w-28 bg-grey-100 rounded animate-pulse" />
                    <div className="h-4 flex-1 bg-grey-100 rounded animate-pulse" />
                    <div className="h-5 w-24 bg-grey-100 rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-grey-100">
                <div className="h-4 w-24 bg-grey-100 rounded animate-pulse" />
              </div>
              <div className="px-5 py-4 space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-4 bg-grey-100 rounded animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
