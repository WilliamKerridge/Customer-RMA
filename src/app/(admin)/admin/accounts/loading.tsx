export default function AccountsLoading() {
  return (
    <>
      <div className="bg-gradient-to-br from-navy via-navy-mid to-[#004080] px-8 pt-9 pb-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <div className="h-7 w-40 bg-white/10 rounded animate-pulse mb-2" />
            <div className="h-4 w-48 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="h-9 w-36 bg-white/10 rounded-lg animate-pulse" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-3 mb-6">
          <div className="h-9 w-64 bg-grey-100 rounded-lg animate-pulse" />
        </div>

        <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-grey-100">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4">
                <div className="h-4 w-40 bg-grey-100 rounded animate-pulse" />
                <div className="h-4 w-36 bg-grey-100 rounded animate-pulse flex-1" />
                <div className="h-5 w-20 bg-grey-100 rounded-full animate-pulse" />
                <div className="h-4 w-16 bg-grey-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
