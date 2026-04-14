export default function ImportLoading() {
  return (
    <>
      <div className="bg-gradient-to-br from-navy via-navy-mid to-[#004080] px-8 pt-9 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="h-7 w-52 bg-white/10 rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-white/10 rounded animate-pulse" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-white rounded-xl border border-grey-200 shadow-sm p-8 flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-grey-100 rounded-full animate-pulse" />
          <div className="h-5 w-48 bg-grey-100 rounded animate-pulse" />
          <div className="h-4 w-72 bg-grey-100 rounded animate-pulse" />
          <div className="h-9 w-32 bg-grey-100 rounded-lg animate-pulse mt-2" />
        </div>

        <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-grey-100">
            <div className="h-5 w-24 bg-grey-100 rounded animate-pulse" />
          </div>
          <div className="divide-y divide-grey-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-6 py-3.5 flex items-center gap-4">
                <div className="h-3 w-28 bg-grey-100 rounded animate-pulse" />
                <div className="h-3 flex-1 bg-grey-100 rounded animate-pulse" />
                <div className="h-3 w-16 bg-grey-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
