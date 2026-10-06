import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import LinkSuccess from '../components/LinkSuccess.jsx'
import { ErrorState, LoadingState } from '../components/Status.jsx'
import { ArrowIcon, HeartIcon, ShareIcon } from '../components/Icons.jsx'
import { api } from '../lib/api.js'
import { saveCreatedLink, shareQuiz } from '../lib/links.js'

export default function QuizPage() {
  const { publicId } = useParams()
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [visitorName, setVisitorName] = useState('')
  const [crushName, setCrushName] = useState('')
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [result, setResult] = useState(null)
  const [createdQuiz, setCreatedQuiz] = useState(null)
  const [creatorName, setCreatorName] = useState('')
  const [creating, setCreating] = useState(false)
  const [shareNotice, setShareNotice] = useState('')

  const loadQuiz = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const value = await api.getQuiz(publicId)
      setQuiz(value)
      document.title = `${value.creatorDisplayName ? `${value.creatorDisplayName}’s` : 'A'} CrushMeter quiz`
    } catch (error) {
      setLoadError(error.message)
    } finally {
      setLoading(false)
    }
  }, [publicId])

  useEffect(() => {
    let active = true
    api.getQuiz(publicId)
      .then((value) => {
        if (!active) return
        setQuiz(value)
        document.title = `${value.creatorDisplayName ? `${value.creatorDisplayName}’s` : 'A'} CrushMeter quiz`
      })
      .catch((error) => { if (active) setLoadError(error.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [publicId])

  async function handleSubmit(event) {
    event.preventDefault()
    const yourName = visitorName.trim()
    const theirName = crushName.trim()
    if (!yourName || !theirName) return setFormError('Please enter both names.')
    if (yourName.length > 60 || theirName.length > 60) return setFormError('Each name must be 60 characters or fewer.')
    if (!consent) return setFormError('Please agree to share these names with the link’s creator.')

    setSubmitting(true)
    setFormError('')
    try {
      setResult(await api.submitQuiz(publicId, { visitorName: yourName, crushName: theirName, consent: true }))
    } catch (error) {
      setFormError(`${error.message} Your names were not saved by this attempt.`)
    } finally {
      setSubmitting(false)
    }
  }

  function tryAgain() {
    setResult(null)
    setConsent(false)
    setFormError('')
  }

  async function createOwnQuiz(event) {
    event.preventDefault()
    setCreating(true)
    setFormError('')
    try {
      const value = await api.createQuiz(creatorName.trim())
      saveCreatedLink(value)
      setCreatedQuiz(value)
    } catch (error) {
      setFormError(error.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleShare() {
    try {
      const action = await shareQuiz(window.location.href)
      setShareNotice(action === 'copied' ? 'Quiz link copied!' : 'Ready to share!')
    } catch (error) {
      if (error?.name !== 'AbortError') setShareNotice('Could not share. Copy the address from your browser.')
    }
  }

  if (loading) return <div className="page-center site-width"><LoadingState label="Opening this CrushMeter quiz…" /></div>
  if (loadError) return <div className="page-center site-width"><ErrorState title="This quiz is not available" message={loadError} onRetry={loadQuiz} /></div>

  return (
    <div className="quiz-page site-width">
      {!result ? (
        <section className="quiz-card">
          <div className="quiz-card-top">
            <span className="quiz-heart"><HeartIcon filled size={28} /></span>
            <p className="quiz-question">How much does your crush love you?</p>
          </div>
          <form className="quiz-form" onSubmit={handleSubmit} noValidate>
            <div className="field"><label htmlFor="visitor-name">Your name</label><input id="visitor-name" value={visitorName} onChange={(event) => setVisitorName(event.target.value)} maxLength="60" autoComplete="name" placeholder="Enter your name" /></div>
            <div className="heart-divider"><span /><HeartIcon filled size={17} /><span /></div>
            <div className="field"><label htmlFor="crush-name">Your crush’s name</label><input id="crush-name" value={crushName} onChange={(event) => setCrushName(event.target.value)} maxLength="60" autoComplete="off" placeholder="Enter their name" /></div>

            <label className="consent-row compact-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span className="custom-check" /><span>I understand these names and my result will be shared with the link’s creator.</span></label>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <button className="btn btn-primary btn-full btn-large" disabled={submitting}>{submitting ? <><span className="button-spinner" /> Saving your answer…</> : <>Reveal my result <HeartIcon filled size={18} /></>}</button>
          </form>
        </section>
      ) : (
        <>
          <section className="result-card" aria-live="polite">
            <div className="confetti" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
            <p className="eyebrow">Your playful match is</p>
            <div className="score-ring" style={{ '--score': `${result.score * 3.6}deg` }}>
              <div><HeartIcon filled size={35} /><strong>{result.score}<span>%</span></strong></div>
            </div>
            <h1>{result.message}</h1>
            <p className="name-pair"><strong>{visitorName.trim()}</strong><HeartIcon filled size={17} /><strong>{crushName.trim()}</strong></p>
            <p className="result-disclaimer">Entertainment only</p>
            <div className="sender-knows-notice" role="status">
              <span aria-hidden="true">😄</span>
              <p><strong>Ahaa! {quiz.creatorDisplayName || 'The sender'} knows who your crush is now.</strong>Your names and this result are now in their private dashboard.</p>
            </div>
            <div className="result-actions">
              <button className="btn btn-secondary" onClick={handleShare}><ShareIcon /> Share this quiz</button>
              <button className="text-link" onClick={tryAgain}>Try again</button>
            </div>
            <div className="toast-slot" aria-live="polite">{shareNotice}</div>
            {formError && <p className="form-error" role="alert">{formError}</p>}
          </section>
          {!createdQuiz && (
            <section className="your-turn-card" aria-labelledby="your-turn-title">
              <div className="your-turn-copy">
                <p className="eyebrow">Now it’s your turn</p>
                <h2 id="your-turn-title">Make a link and discover your friends’ crushes</h2>
                <p>You’ll get a public link to share and a private dashboard where every consented result appears.</p>
              </div>
              <form className="your-turn-form" onSubmit={createOwnQuiz}>
                <label htmlFor="result-creator-name">Your display name <span>(optional)</span></label>
                <input id="result-creator-name" value={creatorName} onChange={(event) => setCreatorName(event.target.value)} maxLength="50" placeholder="e.g. Rafi" autoComplete="name" />
                <button className="btn btn-primary btn-large btn-full" disabled={creating}>{creating ? <><span className="button-spinner" /> Creating…</> : <>Create my link <ArrowIcon /></>}</button>
                <small>No signup · Your dashboard link appears immediately</small>
              </form>
            </section>
          )}
          {createdQuiz && <LinkSuccess quiz={createdQuiz} compact />}
        </>
      )}
      <Link className="quiz-home-link" to="/"><ArrowIcon /> Make a different CrushMeter quiz</Link>
    </div>
  )
}
