export default function ProductsLoading() {
  return (
    <>
      <div className="bg-gradient-to-br from-navy via-navy-mid to-[#004080] px-8 pt-9 pb-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <div className="h-7 w-44 bg-white/10 rounded animate-pulse mb-2" />
            <div className="h-4 w-52 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="h-9 w-32 bg-white/10 rounded-lg animate-pulse" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-5 px-6 py-3 bg-grey-50 border-b border-grey-200">
            {['Product', 'Category', 'Test Fee', 'Standard Repair', 'Major Repair'].map(h => (
              <div key={h} className="h-3 w-20 bg-grey-200 rounded animate-pulse" />
            ))}
          </div>
          <div className="divide-y divide-grey-100">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="grid grid-cols-5 px-6 py-4 items-center">
                <div className="h-4 w-36 bg-grey-100 rounded animate-pulse" />
                <div className="h-4 w-20 bg-grey-100 rounded animate-pulse" />
                <div className="h-4 w-16 bg-grey-100 rounded animate-pulse" />
                <div className="h-4 w-16 bg-grey-100 rounded animate-pulse" />
                <div className="h-4 w-16 bg-grey-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
