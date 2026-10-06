import { useState } from 'react'
import { CopyIcon, ShareIcon } from './Icons.jsx'
import { copyText, formatDate, shareQuiz } from '../lib/links.js'

export default function LinkSuccess({ quiz, compact = false }) {
  const [notice, setNotice] = useState('')

  async function act(action, success) {
    try {
      await action()
      setNotice(success)
      window.setTimeout(() => setNotice(''), 2400)
    } catch (error) {
      if (error?.name !== 'AbortError') setNotice('That did not work. Please copy the link manually.')
    }
  }

  return (
    <section className={`success-panel ${compact ? 'success-panel-compact' : ''}`} aria-labelledby={`links-${quiz.publicId}`}>
      <div className="success-heading">
        <span className="success-check" aria-hidden="true">✓</span>
        <div>
          <p className="eyebrow">Your quiz is ready</p>
          <h2 id={`links-${quiz.publicId}`}>Two links, two different jobs</h2>
          <p>Share your quiz link with friends. Keep your dashboard link private.</p>
        </div>
      </div>

      <div className="link-grid">
        <div className="link-card public-link-card">
          <div><span className="number-badge">1</span><span className="link-label">Public quiz link</span></div>
          <p>Send this one to friends.</p>
          <div className="link-value" title={quiz.publicUrl}>{quiz.publicUrl}</div>
          <div className="button-row">
            <button className="btn btn-secondary" onClick={() => act(() => copyText(quiz.publicUrl), 'Quiz link copied!')}><CopyIcon /> Copy link</button>
            <button className="btn btn-primary" onClick={() => act(() => shareQuiz(quiz.publicUrl), 'Quiz link ready to share!')}><ShareIcon /> Share</button>
          </div>
        </div>

        <div className="link-card private-link-card">
          <div><span className="number-badge">2</span><span className="link-label">Private dashboard link</span></div>
          <p>Only you should open this one.</p>
          <div className="link-value private-value" title={quiz.managementUrl}>{quiz.managementUrl}</div>
          <div className="button-row">
            <button className="btn btn-secondary" onClick={() => act(() => copyText(quiz.managementUrl), 'Dashboard link copied!')}><CopyIcon /> Copy dashboard</button>
            <a className="btn btn-dark" href={quiz.managementUrl}>Open dashboard</a>
          </div>
        </div>
      </div>

      <p className="device-note"><strong>Saved on this device</strong> · No account is attached, so these links cannot be recovered on another device or after browser data is cleared. Expires {formatDate(quiz.expiresAt, { dateOnly: true })}.</p>
      <div className="toast-slot" aria-live="polite">{notice}</div>
    </section>
  )
}
