import { useEffect } from 'react'
import { HeartIcon } from '../components/Icons.jsx'

export default function PrivacyPage() {
  useEffect(() => { document.title = 'Privacy — CrushMeter' }, [])
  return (
    <div className="content-page site-width">
      <div className="content-hero"><span><HeartIcon size={25} /></span><p className="eyebrow">Plain-language privacy</p><h1>Your names deserve care.</h1><p>CrushMeter collects only what it needs to make and manage a just-for-fun quiz.</p></div>
      <div className="content-card">
        <section><h2>What we collect</h2><p>When a quiz is created, we store an optional creator display name, random quiz identifiers, and creation and expiry times. When someone submits a quiz, we store the visitor name, crush name, playful score, consent record, and submission time.</p><p>We do not use third-party analytics or tracking, and the application does not save visitor IP addresses, location, or device fingerprints as application data.</p></section>
        <section><h2>Who can see submitted names</h2><p>The person who created a quiz can see its submitted names and scores through the private dashboard link. The disclosure and unchecked consent box appear before submission. Public quiz pages never expose responses.</p><p>Anyone who obtains the private dashboard link can access those submissions, so creators should keep it private.</p></section>
        <section><h2>How long data stays</h2><p>Quizzes and their responses expire 30 days after the quiz was created. Expired data is blocked immediately by the application and removed automatically by MongoDB’s background expiry process.</p></section>
        <section><h2>Deleting data</h2><p>A creator can delete any individual response from the private dashboard. They can also delete the entire quiz and all of its responses using the “Delete quiz” control.</p></section>
        <section><h2>Links saved on your device</h2><p>After creating a quiz, its public and private links are stored in this browser’s local storage for convenience. They are device-specific, are not synced to an account, and cannot be recovered if browser data is cleared. You can clear them by removing this site’s browser data.</p></section>
        <section><h2>Entertainment only</h2><p>Scores are deterministic, playful numbers based on normalized names and the quiz identifier. They are not scientific and cannot measure anyone’s feelings.</p></section>
      </div>
    </div>
  )
}
