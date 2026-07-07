/**
 * Toggle an event in the signed-in user's saved list.
 *
 * Calls the real `/api/account/saved` endpoint (POST to save, DELETE to unsave).
 * Returns a small status object so callers can drive optimistic UI and, when the
 * user is signed out (401), redirect them to login instead of silently no-op-ing.
 */
export async function toggleSavedEvent(
  eventPageId: string,
  save: boolean,
): Promise<{ ok: boolean; unauthorized: boolean }> {
  try {
    const res = save
      ? await fetch('/api/account/saved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event_page_id: eventPageId }),
        })
      : await fetch(`/api/account/saved?event_page_id=${encodeURIComponent(eventPageId)}`, {
          method: 'DELETE',
        });
    return { ok: res.ok, unauthorized: res.status === 401 };
  } catch {
    return { ok: false, unauthorized: false };
  }
}
