export default function CaseDetailLoading() {
  return (
    <>
      <div className="bg-gradient-to-br from-navy via-navy-mid to-[#004080] px-8 pt-9 pb-8">
        <div className="max-w-3xl mx-auto">
          <div className="h-7 w-40 bg-white/10 rounded animate-pulse mb-2" />
          <div className="flex gap-4 mt-1">
            <div className="h-4 w-28 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Stage tracker skeleton */}
        <div className="bg-white rounded-xl border border-grey-200 shadow-sm p-6">
          <div className="h-4 w-28 bg-grey-100 rounded animate-pulse mb-4" />
          <div className="flex items-center gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex-1 h-2 bg-grey-100 rounded-full animate-pulse" />
            ))}
          </div>
        </div>

        {/* Details card */}
        <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-grey-100">
            <div className="h-5 w-32 bg-grey-100 rounded animate-pulse" />
          </div>
          <div className="divide-y divide-grey-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-2 px-6 py-3.5">
                <div className="h-3 w-24 bg-grey-100 rounded animate-pulse" />
                <div className="h-4 w-36 bg-grey-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Updates */}
        <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-grey-100">
            <div className="h-5 w-24 bg-grey-100 rounded animate-pulse" />
          </div>
          <div className="divide-y divide-grey-100">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="px-6 py-4">
                <div className="h-3 w-28 bg-grey-100 rounded animate-pulse mb-2" />
                <div className="h-4 w-full bg-grey-100 rounded animate-pulse mb-1" />
                <div className="h-4 w-2/3 bg-grey-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
