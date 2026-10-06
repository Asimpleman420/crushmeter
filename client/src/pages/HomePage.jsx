import { useEffect, useRef, useState } from 'react'
import LinkSuccess from '../components/LinkSuccess.jsx'
import { ArrowIcon, HeartIcon } from '../components/Icons.jsx'
import { api } from '../lib/api.js'
import { formatDate, getSavedLinks, saveCreatedLink } from '../lib/links.js'

export default function HomePage() {
  const [displayName, setDisplayName] = useState('')
  const [createdQuiz, setCreatedQuiz] = useState(null)
  const [savedLinks, setSavedLinks] = useState(() => getSavedLinks())
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
      setSavedLinks(getSavedLinks())
      window.setTimeout(() => successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setCreating(false)
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

      {savedLinks.length > 0 && (
        <section className="saved-section site-width" aria-labelledby="saved-title">
          <div className="section-heading inline-heading">
            <div><p className="eyebrow">Browser storage</p><h2 id="saved-title">My links on this device</h2></div>
            <p>Available only in this browser. There is no account-based recovery.</p>
          </div>
          <div className="saved-list">
            {savedLinks.map((item) => (
              <article className="saved-card" key={item.publicId}>
                <div className="saved-icon"><HeartIcon filled size={20} /></div>
                <div className="saved-info"><strong>{item.creatorDisplayName ? `${item.creatorDisplayName}’s quiz` : 'My CrushMeter quiz'}</strong><span>Created {formatDate(item.createdAt)}</span></div>
                <div className="saved-actions"><a className="text-link" href={item.publicUrl}>Open quiz</a><a className="btn btn-secondary btn-small" href={item.managementUrl}>Dashboard</a></div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="fun-note site-width">
        <HeartIcon size={22} />
        <div><strong>A gentle reminder</strong><p>Every percentage is generated for entertainment. CrushMeter cannot measure anybody’s real feelings.</p></div>
      </section>
    </>
  )
}
