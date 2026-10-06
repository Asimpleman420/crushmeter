import { HeartIcon } from './Icons.jsx'

export function LoadingState({ label = 'Loading…' }) {
  return <div className="state-card" role="status"><span className="loader"><HeartIcon filled size={22} /></span><p>{label}</p></div>
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="state-card error-state" role="alert">
      <span className="state-symbol">!</span>
      <h1>{title}</h1>
      <p>{message}</p>
      {onRetry && <button className="btn btn-primary" onClick={onRetry}>Try again</button>}
    </div>
  )
}
