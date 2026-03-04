/**
 * Generates and persists an anonymous session ID in localStorage.
 * Used for wishlists and bundles without requiring user login.
 */
const SESSION_KEY = 'zr_session_id'

export function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}
