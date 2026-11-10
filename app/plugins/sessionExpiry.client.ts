import { useAuth } from '~/stores/auth'

// Logs a guest out the moment their validity ends, even if they are idle on a
// page and make no API calls. Checked periodically (rather than one long
// setTimeout) so it still fires correctly after the laptop wakes from sleep.
export default defineNuxtPlugin(() => {
  const auth = useAuth()
  const CHECK_EVERY_MS = 15_000

  function check() {
    if (auth.isLoggedIn && auth.hasGuestExpired()) auth.logout('expired')
  }

  setInterval(check, CHECK_EVERY_MS)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check()
  })
})
