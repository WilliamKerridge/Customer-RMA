export default function Home() {
  return (
    <section
      className="relative flex items-center justify-center px-6 py-20 min-h-[calc(100vh-64px)] overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #003a63 0%, #002847 60%)' }}
    >
      {/* Radial accent glow */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(0,180,216,0.12) 0%, transparent 70%)',
        }}
      />
      <div className="relative max-w-4xl mx-auto text-center">
        <p className="text-brand-accent text-xs font-heading font-semibold uppercase tracking-widest mb-4">
          Cosworth Electronics
        </p>
        <h1 className="font-heading font-bold text-3xl text-white mb-4 [text-wrap:balance]">
          Product Returns &amp; Repair Portal
        </h1>
        <p className="text-white/60 text-sm max-w-xl mx-auto mb-8">
          Submit a return, track your repair, and manage your RMA cases online.
        </p>
        <a
          href="/submit"
          className="inline-flex items-center gap-2 bg-blue hover:bg-blue-light text-white font-semibold px-6 py-3 rounded-lg text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-navy-mid"
        >
          Submit a Return
        </a>
      </div>
    </section>
  )
}
