const link = 'rounded-xl px-3 py-2 text-sm font-medium text-[#392525]/70 transition hover:bg-[#392525]/5 hover:text-[#392525]'

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-20 border-b border-[#392525]/10 bg-[#FAF5E9]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a className="flex items-center gap-2 text-lg font-bold tracking-tight text-[#392525]" href="/" aria-label="Home">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#392525] text-[#FAF5E9]">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="7" width="20" height="11" rx="5" />
              <path d="M7 11v3M5.5 12.5h3M16 12h.01M18 14h.01" />
            </svg>
          </span>
          GameFinder
        </a>
        <div className="flex items-center gap-1">
          <a className={link} href="/library">Library</a>
          <a className={link} href="/contact">Contact Us</a>
        </div>
      </div>
    </nav>
  )
}
