import { Link, Outlet, useLocation } from 'react-router-dom'
import { HeartIcon } from './Icons.jsx'

export default function Layout() {
  const location = useLocation()
  const isPrivate = location.pathname.startsWith('/manage/')

  return (
    <div className="min-h-screen app-shell">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <header className="site-header">
        <div className="site-width nav-inner">
          <Link className="brand" to="/" aria-label="CrushMeter home">
            <span className="brand-mark"><HeartIcon filled size={18} /></span>
            <span>CrushMeter</span>
          </Link>
          <nav aria-label="Main navigation">
            <Link to="/">Create a quiz</Link>
            <Link to="/privacy">Privacy</Link>
          </nav>
        </div>
      </header>
      <main><Outlet /></main>
      <footer className="site-footer">
        <div className="site-width footer-inner">
          <span>Made for smiles, not science.</span>
          <Link to="/privacy">Privacy & retention</Link>
        </div>
      </footer>
      {isPrivate && <meta name="robots" content="noindex, nofollow, noarchive" />}
    </div>
  )
}
