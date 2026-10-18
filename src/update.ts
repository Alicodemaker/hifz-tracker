// Checking for a new version on demand. The app updates itself in the background too, but only shows the new
// version the next time it starts; this lets someone get it now.

export const appVersion = __APP_VERSION__

// "18 Oct, 09:03", in the phone's own time zone.
export const builtAt = new Date(__APP_BUILD__).toLocaleString(undefined, {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export type UpdateCheck = 'latest' | 'available' | 'offline'

// Asks the server which build is the newest. The one request the app makes to its own server, and only when asked.
export async function checkForUpdate(): Promise<UpdateCheck> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}version.json`, { cache: 'no-store' })
    if (!response.ok) return 'offline'
    const { build } = (await response.json()) as { build: string }
    return build === __APP_BUILD__ ? 'latest' : 'available'
  } catch {
    return 'offline'
  }
}

// Fetches the new version into the offline cache, then reloads into it. The service worker takes over as soon as it
// has installed (skipWaiting), so the reload follows its takeover; it goes ahead anyway if that never comes.
export async function installUpdate(): Promise<void> {
  const registration = await navigator.serviceWorker?.getRegistration()
  await registration?.update().catch(() => {})
  if (registration?.installing || registration?.waiting) {
    await new Promise((resolve) => {
      navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true })
      setTimeout(resolve, 15_000)
    })
  }
  location.reload()
}
