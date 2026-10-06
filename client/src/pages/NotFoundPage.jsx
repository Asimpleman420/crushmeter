import { Link } from 'react-router-dom'
import { HeartIcon } from '../components/Icons.jsx'

export default function NotFoundPage() {
  return <div className="page-center site-width"><div className="state-card"><span className="not-found-heart"><HeartIcon size={44} /></span><p className="eyebrow">404 · Lost spark</p><h1>This page isn’t here.</h1><p>The link may be incomplete, or the page may have moved.</p><Link className="btn btn-primary" to="/">Go to CrushMeter</Link></div></div>
}
