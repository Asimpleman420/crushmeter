import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CopyIcon, HeartIcon, RefreshIcon, ShareIcon, TrashIcon } from '../components/Icons.jsx'
import { ErrorState, LoadingState } from '../components/Status.jsx'
import { api } from '../lib/api.js'
import { copyText, formatDate, removeSavedLink, shareQuiz } from '../lib/links.js'

export default function DashboardPage() {
  const { managementToken } = useParams()
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState(null)
  const [submissions, setSubmissions] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const [deletingQuiz, setDeletingQuiz] = useState(false)

  const publicUrl = quiz ? new URL(`/q/${quiz.publicId}`, window.location.origin).href : ''

  const load = useCallback(async (targetPage, quiet = false) => {
    quiet ? setRefreshing(true) : setLoading(true)
    setError('')
    try {
      const [quizData, responseData] = await Promise.all([
        api.getManagedQuiz(managementToken),
        api.getSubmissions(managementToken, targetPage),
      ])
      setQuiz(quizData)
      setSubmissions(responseData)
      setPage(targetPage)
      document.title = 'Private dashboard — CrushMeter'
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [managementToken])

  useEffect(() => {
    let active = true
    Promise.all([api.getManagedQuiz(managementToken), api.getSubmissions(managementToken, 1)])
      .then(([quizData, responseData]) => {
        if (!active) return
        setQuiz(quizData)
        setSubmissions(responseData)
        setPage(1)
        document.title = 'Private dashboard — CrushMeter'
      })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [managementToken])

  async function deleteResponse(id) {
    setDeletingId(id)
    setNotice('')
    try {
      await api.deleteSubmission(managementToken, id)
      const nextPage = submissions.items.length === 1 && page > 1 ? page - 1 : page
      await load(nextPage, true)
      setNotice('Response deleted.')
    } catch (requestError) {
      setNotice(requestError.message)
    } finally {
      setDeletingId('')
    }
  }

  async function deleteQuiz() {
    setDeletingQuiz(true)
    try {
      await api.deleteQuiz(managementToken)
      removeSavedLink(quiz.publicId)
      navigate('/', { replace: true, state: { deleted: true } })
    } catch (requestError) {
      setNotice(requestError.message)
      setDeletingQuiz(false)
      setShowDelete(false)
    }
  }

  async function runShare() {
    try {
      const action = await shareQuiz(publicUrl)
      setNotice(action === 'copied' ? 'Public quiz link copied!' : 'Ready to share!')
    } catch (requestError) {
      if (requestError?.name !== 'AbortError') setNotice('Could not share that link.')
    }
  }

  async function runCopy() {
    try { await copyText(publicUrl); setNotice('Public quiz link copied!') } catch { setNotice('Could not copy. Select the link manually.') }
  }

  if (loading) return <div className="page-center site-width"><LoadingState label="Opening your private dashboard…" /></div>
  if (error && !quiz) return <div className="page-center site-width"><ErrorState title="Dashboard unavailable" message={error} onRetry={() => load(1)} /></div>

  return (
    <div className="dashboard-page site-width">
      <div className="private-warning"><span>🔒</span><p><strong>This is your private dashboard.</strong> Anyone with this dashboard link can see submissions. Keep it private.</p></div>

      <section className="dashboard-header">
        <div><p className="eyebrow">Private results</p><h1>{quiz.creatorDisplayName ? `${quiz.creatorDisplayName}’s quiz` : 'Your CrushMeter quiz'}</h1><p>Created {formatDate(quiz.createdAt)} · Expires {formatDate(quiz.expiresAt, { dateOnly: true })}</p></div>
        <button className="btn btn-secondary" onClick={() => load(page, true)} disabled={refreshing}><RefreshIcon /> {refreshing ? 'Refreshing…' : 'Refresh'}</button>
      </section>

      <section className="dashboard-stats">
        <div className="stat-card"><span>Total responses</span><strong>{quiz.submissionCount}</strong><small>All playful matches</small></div>
        <div className="share-card"><div><span>Public quiz link</span><a className="share-url" href={publicUrl} target="_blank" rel="noopener noreferrer">{publicUrl}</a></div><div className="button-row"><button className="btn btn-secondary btn-small" onClick={runCopy}><CopyIcon /> Copy</button><button className="btn btn-primary btn-small" onClick={runShare}><ShareIcon /> Share</button></div></div>
      </section>

      <section className="responses-section" aria-labelledby="responses-title">
        <div className="responses-title"><div><p className="eyebrow">Latest first</p><h2 id="responses-title">Responses</h2></div><span>{submissions.total} total</span></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {submissions.items.length === 0 ? (
          <div className="empty-state"><span><HeartIcon size={32} /></span><h3>No responses yet. Share your quiz link with friends!</h3><p>New responses will appear here after friends agree and submit the two names.</p><button className="btn btn-primary" onClick={runShare}><ShareIcon /> Share quiz</button></div>
        ) : (
          <>
            <div className="response-table-wrap">
              <table className="response-table"><thead><tr><th>Visitor</th><th>Crush</th><th>Score</th><th>Submitted</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
                {submissions.items.map((item) => <tr key={item.id}><td>{item.visitorName}</td><td>{item.crushName}</td><td><span className="score-badge"><HeartIcon filled size={13} />{item.score}%</span></td><td>{formatDate(item.createdAt)}</td><td><button className="icon-button danger" aria-label={`Delete response from ${item.visitorName}`} disabled={deletingId === item.id} onClick={() => deleteResponse(item.id)}><TrashIcon /></button></td></tr>)}
              </tbody></table>
            </div>
            <div className="response-cards">
              {submissions.items.map((item) => <article className="response-card" key={item.id}><div className="response-pair"><div><span>Visitor</span><strong>{item.visitorName}</strong></div><HeartIcon filled size={17} /><div><span>Crush</span><strong>{item.crushName}</strong></div></div><div className="response-meta"><span className="score-badge"><HeartIcon filled size={13} />{item.score}%</span><time>{formatDate(item.createdAt)}</time><button className="icon-button danger" aria-label={`Delete response from ${item.visitorName}`} disabled={deletingId === item.id} onClick={() => deleteResponse(item.id)}><TrashIcon /></button></div></article>)}
            </div>
            {submissions.totalPages > 1 && <nav className="pagination" aria-label="Response pages"><button className="btn btn-secondary btn-small" disabled={page <= 1 || refreshing} onClick={() => load(page - 1, true)}>Previous</button><span>Page {page} of {submissions.totalPages}</span><button className="btn btn-secondary btn-small" disabled={page >= submissions.totalPages || refreshing} onClick={() => load(page + 1, true)}>Next</button></nav>}
          </>
        )}
      </section>

      <div className="toast-slot dashboard-toast" aria-live="polite">{notice}</div>
      <section className="danger-zone"><div><h2>Delete this quiz</h2><p>Permanently removes the quiz and every response. This cannot be undone.</p></div><button className="btn btn-danger" onClick={() => setShowDelete(true)}><TrashIcon /> Delete quiz</button></section>
      <Link className="text-link back-home" to="/">← Back to CrushMeter home</Link>

      {showDelete && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setShowDelete(false)}><div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title"><span className="modal-icon"><TrashIcon /></span><h2 id="delete-title">Delete this quiz forever?</h2><p>All submitted names and results will be permanently deleted. Your public and dashboard links will stop working.</p><div className="button-row"><button className="btn btn-secondary" onClick={() => setShowDelete(false)} disabled={deletingQuiz}>Cancel</button><button className="btn btn-danger" onClick={deleteQuiz} disabled={deletingQuiz}>{deletingQuiz ? 'Deleting…' : 'Yes, delete everything'}</button></div></div></div>}
    </div>
  )
}
