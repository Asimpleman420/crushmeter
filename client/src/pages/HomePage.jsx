import { useEffect, useRef, useState } from 'react'
import LinkSuccess from '../components/LinkSuccess.jsx'
import { ArrowIcon, CopyIcon, HeartIcon } from '../components/Icons.jsx'
import { api } from '../lib/api.js'
import { copyText, getSavedLinks, saveCreatedLink } from '../lib/links.js'

function latestActiveLink() {
  return getSavedLinks().find((item) => !item.expiresAt || new Date(item.expiresAt) > new Date()) || null
}

export default function HomePage() {
  const [displayName, setDisplayName] = useState('')
  const [createdQuiz, setCreatedQuiz] = useState(null)
  const [savedDashboard, setSavedDashboard] = useState(latestActiveLink)
  const [dashboardNotice, setDashboardNotice] = useState('')
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const successRef = useRef(null)

  useEffect(() => {
    document.title = 'CrushMeter — Make a playful crush quiz'
  }, [])

  async function handleCreate(event) {
    event.preventDefault()
    const name = displayName.trim()
    if (!name) {
      setError('Display name is required.')
      return
    }
    if (name.length > 50) {
      setError('Display name must be 50 characters or fewer.')
      return
    }

    setCreating(true)
    setError('')
    try {
      const quiz = await api.createQuiz(name)
      saveCreatedLink(quiz)
      setCreatedQuiz(quiz)
      setSavedDashboard(quiz)
      window.setTimeout(() => successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setCreating(false)
    }
  }

  async function copyDashboardLink() {
    try {
      await copyText(savedDashboard.managementUrl)
      setDashboardNotice('Dashboard link copied!')
      window.setTimeout(() => setDashboardNotice(''), 2400)
    } catch {
      setDashboardNotice('Could not copy. Please select the link manually.')
    }
  }

  return (
    <>
      <section className="hero site-width">
        <div className="hero-copy">
          <div className="pill"><HeartIcon filled size={15} /> A tiny quiz with a sweet surprise</div>
          <h1>How much does your <span>crush love you?</span></h1>
          <p className="hero-lead">Make a personal quiz link, send it to friends, and collect their playful results—no signup, no awkward account setup.</p>

          <form className="create-form" onSubmit={handleCreate} noValidate>
            <label htmlFor="creator-name">Your display name <span>(required)</span></label>
            <div className="create-row">
              <input id="creator-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength="1" maxLength="50" placeholder="e.g. Samira" autoComplete="name" required />
              <button className="btn btn-primary btn-large" disabled={creating}>
                {creating ? <><span className="button-spinner" /> Creating…</> : <>Create your own link <ArrowIcon /></>}
              </button>
            </div>
            <div className="form-foot"><span>Free · No registration · Expires in 30 days</span><span>{displayName.length}/50</span></div>
            {error && <p className="form-error" role="alert">{error}</p>}
          </form>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="hero-card card-back"><span>just</span><strong>for fun</strong></div>
          <div className="hero-card card-main">
            <span className="tiny-label">TODAY'S CRUSHMETER</span>
            <div className="big-heart"><HeartIcon filled size={86} /><span>88%</span></div>
            <strong>Sweet chemistry!</strong>
            <span className="tiny-copy">A playful result worth smiling about</span>
          </div>
          <span className="spark spark-one">✦</span><span className="spark spark-two">✦</span>
        </div>
      </section>

      {createdQuiz && <div className="site-width success-wrap" ref={successRef}><LinkSuccess quiz={createdQuiz} /></div>}

      {!createdQuiz && savedDashboard && (
        <section className="saved-dashboard-panel site-width" aria-labelledby="saved-dashboard-title">
          <div className="saved-dashboard-icon"><HeartIcon filled size={22} /></div>
          <div className="saved-dashboard-copy">
            <p className="eyebrow">Your private link</p>
            <h2 id="saved-dashboard-title">Save this for your dashboard and don’t share it.</h2>
            <div className="saved-dashboard-url" title={savedDashboard.managementUrl}>{savedDashboard.managementUrl}</div>
            <div className="toast-slot" aria-live="polite">{dashboardNotice}</div>
          </div>
          <div className="saved-dashboard-actions">
            <button className="btn btn-secondary" onClick={copyDashboardLink}><CopyIcon /> Copy link</button>
            <a className="btn btn-dark" href={savedDashboard.managementUrl}>Open dashboard</a>
          </div>
        </section>
      )}

      <section className="how-section site-width" aria-labelledby="how-title">
        <div className="section-heading">
          <p className="eyebrow">Simple by design</p>
          <h2 id="how-title">A little fun in three steps</h2>
        </div>
        <div className="steps-grid">
          <article><span>01</span><div className="step-icon">◇</div><h3>Create your link</h3><p>Choose a unique display name. Your public quiz and private dashboard appear instantly.</p></article>
          <article><span>02</span><div className="step-icon"><HeartIcon size={25} /></div><h3>Share with friends</h3><p>They enter two names and explicitly agree to share them with you before submitting.</p></article>
          <article><span>03</span><div className="step-icon">⌁</div><h3>See the smiles</h3><p>Open your private dashboard to see results, refresh responses, or delete anything.</p></article>
        </div>
      </section>

    </>
  )
}
