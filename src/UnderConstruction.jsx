
export default function UnderConstruction() {
    return (
      <main className="flex min-h-[calc(100vh-65px)] flex-col items-center justify-center bg-[#FAF5E9] px-6 text-center text-[#392525]">
  
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#392525]/10">
          <span className="text-5xl" role="img" aria-label="Construction">
            🚧
          </span>
        </div>
  
        <h1 className="mb-4 text-4xl font-bold">
          Under Construction
        </h1>
  
        <p className="mb-8 max-w-md text-lg text-[#392525]/70">
          We're working on this feature!
          Check back soon for updates.
        </p>
  
        <a
          href="/"
          className="rounded-xl bg-[#392525] px-8 py-3 font-semibold text-[#FAF5E9] transition hover:bg-[#513737]"
        >
          Back to Home
        </a>
  
      </main>
    )
  }
  