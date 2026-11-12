import { useState } from 'react'

const field =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-500 shadow-sm transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 focus:outline-none'

const button =
  'inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'

export default function ContactPage() {
  const [sent, setSent] = useState(false)

  return (
    <div className="flex flex-1 flex-col bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100 text-slate-900">
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-xl shadow-indigo-900/5 backdrop-blur sm:p-10">
          {sent ? <Confirmation /> : <ContactForm onSent={() => setSent(true)} />}
        </div>
      </main>
      <Footer />
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
      <p className="mt-2 text-center text-slate-600">We'd love to hear your feedback.</p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="name">Name</label>
          <input className={field} id="name" name="name" placeholder="Jane Doe" autoComplete="name" required />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="email">Email</label>
          <input className={field} id="email" name="email" type="email" placeholder="jane@example.com" autoComplete="email" required />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="feedback">Feedback</label>
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
      <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5 10 17l9-10" />
        </svg>
      </div>
      {/* Move focus here so screen readers announce the result after the form disappears */}
      <h1 className="mt-6 text-2xl font-bold tracking-tight outline-none" tabIndex={-1} ref={(el) => el?.focus()}>
        Your feedback has been sent.
      </h1>
      <p className="mt-2 text-slate-600">Thanks for reaching out.</p>
      <a className={`${button} mt-8`} href="/">Return Home</a>
    </div>
  )
}

function Footer() {
  return (
    <footer className="flex justify-center border-t border-slate-200 py-4">
      <a
        className="rounded-xl p-2 text-slate-600 transition hover:bg-white hover:text-indigo-600 focus-visible:outline-3 focus-visible:outline-indigo-600"
        href="/"
        aria-label="Home"
      >
        <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 11 12 4l8 7M6 9.5V20h12V9.5M10 20v-5h4v5" />
        </svg>
      </a>
    </footer>
  )
}
