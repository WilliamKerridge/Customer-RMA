export default function CaseListLoading() {
  return (
    <>
      <div className="bg-gradient-to-br from-navy via-navy-mid to-[#004080] px-8 pt-9 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="h-7 w-32 bg-white/10 rounded animate-pulse mb-2" />
          <div className="h-4 w-48 bg-white/10 rounded animate-pulse" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-grey-200 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="h-5 w-36 bg-grey-100 rounded animate-pulse" />
              <div className="h-5 w-28 bg-grey-100 rounded-full animate-pulse" />
            </div>
            <div className="h-4 w-48 bg-grey-100 rounded animate-pulse mb-2" />
            <div className="h-3 w-32 bg-grey-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </>
  )
}
