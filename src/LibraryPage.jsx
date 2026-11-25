import { useState } from 'react'
import SteamLibraryPage from './SteamLibraryPage.jsx'
import NintendoLibraryPage from './NintendoLibraryPage.jsx'
import PlatformSelector from './components/PlatformSelector.jsx'

export default function LibraryPage({ onImported } = {}) {
  const [platform, setPlatform] = useState('steam')
  return (
    <div className="gamefinder-home multi-library-page">
      <header className="home-shell multi-library-header">
        <h1 tabIndex={-1}>My Library</h1>
        <p>Manage the games you own on Steam, Nintendo Switch and Nintendo Switch 2.</p>
        <PlatformSelector value={platform} onChange={setPlatform} includeAll={false} label="Choose a library" />
      </header>
      <div hidden={platform !== 'steam'}><SteamLibraryPage onImported={onImported} /></div>
      <div hidden={platform === 'steam'}><NintendoLibraryPage platform={platform === 'switch2' ? 'switch2' : 'nintendo'} /></div>
    </div>
  )
}
