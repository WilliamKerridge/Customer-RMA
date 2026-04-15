export function Footer() {
  return (
    <footer className="bg-navy mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Two-column address grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b border-white/10">
          {/* UK — Cambridge */}
          <div>
            <p className="font-heading font-semibold text-xs tracking-widest text-white uppercase mb-3">
              Cosworth Electronics Ltd
            </p>
            <address className="not-italic text-xs text-white/50 leading-6">
              Brookfield Technology Centre<br />
              Twentypence Road, Cottenham<br />
              Cambridge, CB24 8PS<br />
              United Kingdom
            </address>
          </div>

          {/* US — Indianapolis */}
          <div>
            <p className="font-heading font-semibold text-xs tracking-widest text-white uppercase mb-3">
              Cosworth Electronics LLC
            </p>
            <address className="not-italic text-xs text-white/50 leading-6">
              5355 W 86th St<br />
              Indianapolis, IN 46268<br />
              United States
            </address>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            COSWORTH® is a registered trade mark of Cosworth Group Holdings Limited
          </p>
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-xs text-white/40 hover:text-white/70 transition-colors duration-200"
            >
              Legal Policies
            </a>
            <a
              href="#"
              className="text-xs text-white/40 hover:text-white/70 transition-colors duration-200"
            >
              User Guides
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
