export default function Loading() {
  return (
    <div className="p-6 max-w-[1400px]">
      <div className="mb-6">
        <div className="h-7 w-28 bg-grey-100 rounded-md animate-pulse mb-1.5" />
        <div className="h-4 w-44 bg-grey-100 rounded-md animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-grey-200 shadow-sm pt-3 pb-4 px-5">
            <div className="h-3 w-24 bg-grey-100 rounded animate-pulse mb-2" />
            <div className="h-8 w-12 bg-grey-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-grey-100">
          <div className="h-5 w-36 bg-grey-100 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-grey-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-5 py-4 space-y-2.5">
              <div className="h-4 w-full bg-grey-100 rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-grey-50 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
