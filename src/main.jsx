
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import FrontPage from './FrontPage.jsx'
import HomePage from './HomePage.jsx'
import LibraryPage from './LibraryPage.jsx'
import ContactPage from './ContactPage.jsx'
import Navbar from './components/Navbar.jsx'
import './index.css'
import UnderConstruction from './UnderConstruction.jsx'

const pathname = window.location.pathname

function Page() {
  if (pathname === '/') return <FrontPage />
  if (pathname === '/library') return <LibraryPage />

  if (pathname === '/preferences') {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <UnderConstruction />
      </div>
    )
  }
  
  // Contact Us page
  if (pathname === '/contact') {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <ContactPage />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {pathname === '/recommendations' ? <HomePage /> : <App />}
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Page />
  </StrictMode>,
)
