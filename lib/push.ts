import { createAdminClient } from '@/lib/supabase/server';

/**
 * OS-level push (phone / browser banners).
 *
 * Firebase Cloud Messaging is the *transport only* — device tokens live in the
 * shared Supabase `devices` table, and this runs server-side alongside every
 * notification (see lib/notifications.ts `notify`). Supabase stays the single
 * source of truth; FCM just carries the banner to the device OS.
 *
 * STATUS: safe no-op until Firebase is provisioned. Two blockers only the
 * project owner can clear:
 *   1. A Firebase project + `FCM_SERVICE_ACCOUNT` (service-account JSON) and
 *      `FCM_PROJECT_ID` in the server env.
 *   2. The mobile client registering its FCM token into `devices` (needs
 *      google-services.json / an APNs key added to the Flutter app).
 *
 * This function already fans out to every one of the user's devices and is
 * wired into `notify()`, so once `deliverToToken` is implemented push lights up
 * with no changes to any caller.
 */
export async function sendPushToUser(opts: {
  userId: string;
  title: string;
  body?: string;
  url?: string;
}): Promise<void> {
  try {
    // Not configured yet → no-op. (No Firebase project / no tokens exist.)
    if (!process.env.FCM_SERVICE_ACCOUNT) return;

    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: devices } = await (admin as any)
      .from('devices')
      .select('token, platform')
      .eq('user_id', opts.userId);

    if (!devices || devices.length === 0) return;

    await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (devices as any[]).map((d) => deliverToToken(d.token as string, opts)),
    );
  } catch {
    // Best-effort — push must never throw into the notification pipeline.
  }
}

/**
 * TODO(push): implement the FCM HTTP v1 send once Firebase is provisioned.
 * Mint an OAuth access token from FCM_SERVICE_ACCOUNT (JWT signed with the
 * service-account key via node:crypto), then POST to
 * `https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`
 * with `{ message: { token, notification: { title, body }, data: { url } } }`.
 * Prune tokens that come back UNREGISTERED. Left unimplemented deliberately so
 * it's built and tested together with the mobile client (whole loop at once).
 */
async function deliverToToken(
  token: string,
  opts: { title: string; body?: string; url?: string },
): Promise<void> {
  void token;
  void opts;
}
