const STORAGE_KEY = 'crushmeter.created-links.v1'

export function getSavedLinks() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export function saveCreatedLink(link) {
  const current = getSavedLinks().filter((item) => item.publicId !== link.publicId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify([link, ...current].slice(0, 20)))
}

export function removeSavedLink(publicId) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getSavedLinks().filter((item) => item.publicId !== publicId)))
}

export async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const input = document.createElement('textarea')
  input.value = text
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  input.remove()
}

export async function shareQuiz(url) {
  if (navigator.share) {
    await navigator.share({
      title: 'CrushMeter — a just-for-fun quiz',
      text: 'Try my playful CrushMeter quiz!',
      url,
    })
    return 'shared'
  }
  await copyText(url)
  return 'copied'
}

export function formatDate(value, options = {}) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: options.dateOnly ? undefined : 'short',
  }).format(new Date(value))
}
