import { useState } from 'react'
import gameController from './img/gamecontroller.svg'

const primaryButton =
  'inline-flex items-center justify-center rounded-xl bg-[#392525] px-7 py-4 text-base font-semibold text-[#FAF5E9] shadow-lg shadow-[#392525]/10 transition hover:bg-[#513737] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#392525]'

const secondaryButton =
  'inline-flex items-center justify-center rounded-xl border border-[#392525]/20 bg-[#FAF5E9] px-6 py-3 font-semibold text-[#392525] transition hover:bg-[#392525]/5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#392525]'

function ProfileIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <circle cx="32" cy="23" r="15" />
      <path d="M12 57c1-13 9-22 20-22s19 9 20 22" />
    </svg>
  )
}

function GameEmblem() {
  return (
    <div className="relative flex aspect-square w-[min(75vw,350px)] items-center justify-center rounded-full border-4 border-[#392525] bg-[#FAF5E9] shadow-xl shadow-[#392525]/10 sm:w-[min(36vw,380px)]">
      <div className="absolute inset-5 rounded-full border border-[#392525]/10" />
      <img
        src={gameController}
        alt="Game controller"
        className="relative block h-[75%] w-[75%] object-contain"
      />
    </div>
  )
}

export default function FrontPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <main className="flex min-h-screen flex-1 flex-col bg-[#FAF5E9] text-[#392525]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-6 pb-7 pt-7 sm:px-12 lg:px-16">
        <header className="relative z-10 flex items-start justify-between gap-6">
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="front-page-menu"
              aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
              className="inline-flex items-center gap-3 rounded-xl border border-[#392525]/20 bg-white/55 px-5 py-3 font-semibold text-[#392525] shadow-sm transition hover:border-[#392525]/40 hover:bg-[#392525]/5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#392525]"
            >
              <svg className="size-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                {menuOpen ? (
                  <path d="M5 5l14 14M19 5 5 19" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
              <span>{menuOpen ? 'Close' : 'Menu'}</span>
            </button>
            {menuOpen && (
              <nav id="front-page-menu" aria-label="Main navigation" className="absolute left-0 top-full mt-3 flex w-52 flex-col gap-2 rounded-2xl border border-[#392525]/10 bg-[#FAF5E9] p-3 shadow-xl shadow-[#392525]/10">
                <a href="/" className="rounded-lg px-4 py-2 font-semibold hover:bg-[#392525]/5">Home</a>
                <a href="/recommendations" className="rounded-lg px-4 py-2 font-semibold hover:bg-[#392525]/5">Discover Games</a>
                <a href="/library" className="rounded-lg px-4 py-2 font-semibold hover:bg-[#392525]/5">Game Library</a>
                <a href="/contact" className="rounded-lg px-4 py-2 font-semibold hover:bg-[#392525]/5">Contact Us</a>
              </nav>
            )}
          </div>

          <a href="/library" className="group flex max-w-56 flex-col items-center text-center font-semibold leading-snug" aria-label="Account login and import your game library">
            <span className="flex size-28 items-center justify-center rounded-3xl border-[3px] border-[#392525] bg-white/40 shadow-sm transition group-hover:bg-[#392525]/5 sm:size-32">
              <ProfileIcon className="size-24 sm:size-28" />
            </span>
            <span className="mt-3 text-lg">Account Login</span>
            <span className="text-sm sm:text-base">Import your Game Library!</span>
          </a>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center py-10 text-center sm:-mt-14" aria-labelledby="front-title">
          <GameEmblem />
          <h1 id="front-title" className="mt-7 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Find Your Next Favorite Game
          </h1>
          <p className="mt-4 max-w-xl text-base text-[#392525]/70 sm:text-lg">
            Discover games you'll love, tailored to the way you play.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a className={primaryButton} href="/recommendations">Explore Games</a>
            <a className={secondaryButton} href="/library">Import Your Library</a>
          </div>
        </section>

        <section className="mx-auto w-full max-w-4xl rounded-3xl border border-[#392525]/10 bg-white/55 px-6 py-8 text-center shadow-xl shadow-[#392525]/5 sm:px-12 sm:py-10" aria-labelledby="library-title">
          <h2 id="library-title" className="text-2xl font-bold tracking-tight sm:text-3xl">All Your Games. One Place.</h2>
          <p className="mx-auto mt-2 max-w-xl text-[#392525]/70">Connect your game library and find recommendations based on the games you enjoy.</p>
          <a href="/library" className={`${primaryButton} mt-6`}>Get Started</a>
        </section>

        <footer className="mt-8 flex flex-col items-center justify-between gap-6 py-3 sm:flex-row">
          <div className="flex flex-wrap justify-center gap-3 sm:gap-5">
            <a href="/" className={secondaryButton}>Home</a>
            <a href="/recommendations" className={secondaryButton}>Discover</a>
          </div>

          <a href="/contact" className="group flex flex-col items-center gap-1 text-center">
            <span className="flex size-16 items-center justify-center rounded-full border-[3px] border-[#392525] text-4xl font-semibold transition group-hover:bg-[#392525]/5" aria-hidden="true">?</span>
            <span className="font-medium">Contact Us</span>
          </a>

          <div className="flex flex-wrap justify-center gap-3 sm:gap-5">
            <a href="/library" className={secondaryButton}>Library</a>
            <a href="/recommendations" className={secondaryButton}>Preferences</a>
          </div>
        </footer>
      </div>
    </main>
  )
}
