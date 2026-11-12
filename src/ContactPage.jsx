import { useState } from 'react'

const field =
  'w-full rounded-xl border border-[#392525]/20 bg-white px-4 py-3 text-[#392525] placeholder:text-[#392525]/40 shadow-sm transition focus:border-[#392525] focus:ring-4 focus:ring-[#392525]/15 focus:outline-none'

const button =
  'inline-flex items-center justify-center rounded-xl bg-[#392525] px-6 py-3 font-semibold text-[#FAF5E9] shadow-sm transition hover:bg-[#392525]/90 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#392525]'

export default function ContactPage() {
  const [sent, setSent] = useState(false)

  return (
    <div className="flex flex-1 flex-col bg-[#FAF5E9] text-[#392525]">
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-[#392525]/10 bg-white/80 p-8 shadow-xl shadow-[#392525]/5 backdrop-blur sm:p-10">
          {sent ? <Confirmation /> : <ContactForm onSent={() => setSent(true)} />}
        </div>
      </main>
    </div>
  )
}

function ContactForm({ onSent }) {
  function handleSubmit(event) {
    event.preventDefault()
    onSent()
  }

  return (
    <>
      <h1 className="text-center text-3xl font-bold tracking-tight">Fill the Form</h1>
      <p className="mt-2 text-center text-[#392525]/70">We'd love to hear your feedback.</p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#392525]/80" htmlFor="name">Name</label>
          <input className={field} id="name" name="name" placeholder="Jane Doe" autoComplete="name" required />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#392525]/80" htmlFor="email">Email</label>
          <input className={field} id="email" name="email" type="email" placeholder="jane@example.com" autoComplete="email" required />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#392525]/70" htmlFor="feedback">Feedback</label>
          <textarea className={`${field} min-h-32 resize-y`} id="feedback" name="feedback" placeholder="Write your feedback here..." required />
        </div>

        <button className={`${button} w-full`} type="submit">Submit</button>
      </form>
    </>
  )
}

function Confirmation() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-[#392525]/10 text-[#392525]" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5 10 17l9-10" />
        </svg>
      </div>
      {/* Move focus here so screen readers announce the result after the form disappears */}
      <h1 className="mt-6 text-2xl font-bold tracking-tight outline-none" tabIndex={-1} ref={(el) => el?.focus()}>
        Your feedback has been sent.
      </h1>
      <p className="mt-2 text-[#392525]/70">Thanks for reaching out.</p>
      <a className={`${button} mt-8`} href="/">Return Home</a>
    </div>
  )
}
