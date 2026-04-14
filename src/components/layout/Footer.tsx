export function Footer() {
  return (
    <footer className="bg-navy mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Three-column address grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-white/10">
          {/* UK — Northampton */}
          <div>
            <p className="font-heading font-semibold text-xs tracking-widest text-white uppercase mb-3">
              Cosworth Ltd
            </p>
            <address className="not-italic text-xs text-white/50 leading-6">
              Costin House<br />
              St James Mill Road<br />
              Northampton<br />
              NN5 5JJ, United Kingdom
            </address>
          </div>

          {/* UK — Cambridge */}
          <div>
            <p className="font-heading font-semibold text-xs tracking-widest text-white uppercase mb-3">
              Cosworth Electronics Ltd
            </p>
            <address className="not-italic text-xs text-white/50 leading-6">
              Whiting Way<br />
              Melbourn<br />
              Royston<br />
              SG8 6EN, United Kingdom
            </address>
          </div>

          {/* US — Indianapolis */}
          <div>
            <p className="font-heading font-semibold text-xs tracking-widest text-white uppercase mb-3">
              Cosworth Electronics LLC
            </p>
            <address className="not-italic text-xs text-white/50 leading-6">
              6850 Weaver Road<br />
              Suite 700<br />
              Indianapolis<br />
              IN 46268, United States
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
