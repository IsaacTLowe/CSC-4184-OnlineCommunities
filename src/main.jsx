import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import HomePage from './HomePage.jsx'
import LibraryPage from './LibraryPage.jsx'
import ContactPage from './ContactPage.jsx'
import Navbar from './components/Navbar.jsx'
import './index.css'

const pages = {
  '/library': LibraryPage,
  '/contact': ContactPage,
}

const Page = pages[location.pathname] ?? HomePage

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <Page />
    </div>
  </StrictMode>,
)
