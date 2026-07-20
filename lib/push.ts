import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * OS-level push (phone banners) via Firebase Cloud Messaging.
 *
 * FCM is the transport ONLY — device tokens live in the shared Supabase
 * `user_devices` table (the mobile app upserts its token there on sign-in), and
 * this runs server-side alongside every notification (see lib/notifications.ts
 * `notify`). Supabase stays the single source of truth.
 *
 * No-ops safely until `FCM_SERVICE_ACCOUNT` (service-account JSON) is set in the
 * server env. `FCM_PROJECT_ID` is optional (falls back to the SA's project_id).
 */

interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id?: string;
  token_uri?: string;
}

interface PushOpts {
  userId: string;
  title: string;
  body?: string;
  url?: string;
}

function loadServiceAccount(): ServiceAccount | null {
  const raw = process.env.FCM_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    const sa = JSON.parse(raw) as ServiceAccount;
    if (!sa.client_email || !sa.private_key) return null;
    return sa;
  } catch {
    return null;
  }
}

// Google OAuth token, cached until shortly before it expires.
let cachedToken: { token: string; exp: number } | null = null;

async function getAccessToken(sa: ServiceAccount): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp > now + 60) return cachedToken.token;

  const tokenUri = sa.token_uri ?? 'https://oauth2.googleapis.com/token';
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const header = b64({ alg: 'RS256', typ: 'JWT' });
  const claim = b64({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: tokenUri,
    iat: now,
    exp: now + 3600,
  });
  const unsigned = `${header}.${claim}`;
  const signature = crypto
    .createSign('RSA-SHA256')
    .update(unsigned)
    .sign(sa.private_key, 'base64url');
  const jwt = `${unsigned}.${signature}`;

  const res = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) return null;
  cachedToken = { token: json.access_token, exp: now + (json.expires_in ?? 3600) };
  return cachedToken.token;
}

export async function sendPushToUser(opts: PushOpts): Promise<void> {
  try {
    const sa = loadServiceAccount();
    if (!sa) return; // not configured yet — no-op

    const projectId = process.env.FCM_PROJECT_ID ?? sa.project_id;
    if (!projectId) return;

    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: devices } = await (admin as any)
      .from('user_devices')
      .select('fcm_token')
      .eq('user_id', opts.userId);
    if (!devices || devices.length === 0) return;

    const accessToken = await getAccessToken(sa);
    if (!accessToken) return;

    await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (devices as any[]).map((d) =>
        deliverToToken(d.fcm_token as string, opts, accessToken, projectId, admin),
      ),
    );
  } catch {
    // Push is best-effort — never throw into the notification pipeline.
  }
}

async function deliverToToken(
  token: string,
  opts: PushOpts,
  accessToken: string,
  projectId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
): Promise<void> {
  try {
    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title: opts.title, body: opts.body ?? '' },
            data: opts.url ? { url: opts.url } : {},
            android: { priority: 'HIGH' },
            apns: { headers: { 'apns-priority': '10' } },
          },
        }),
      },
    );
    // Prune ONLY genuinely dead tokens.
    //
    // FCM v1 returns 404 NOT_FOUND / UNREGISTERED for a token that no longer
    // exists — but it ALSO returns 400 INVALID_ARGUMENT for a malformed
    // MESSAGE (bad title/body/data). Pruning on a bare 400 meant a single
    // malformed notification deleted healthy tokens for every recipient it
    // touched, silently unsubscribing real devices from push.
    //
    // The delete is also scoped to this user, so we never remove a row that
    // another account has since claimed on a shared device.
    const pruneToken = async () => {
      await admin
        .from('user_devices')
        .delete()
        .eq('fcm_token', token)
        .eq('user_id', opts.userId);
    };

    if (res.status === 404) {
      await pruneToken();
    } else if (res.status === 400) {
      // Only prune if the error really is about the token, not the payload.
      const errBody = await res.json().catch(() => null);
      const code =
        errBody?.error?.status ??
        errBody?.error?.details?.[0]?.errorCode ??
        '';
      if (code === 'UNREGISTERED' || code === 'NOT_FOUND') {
        await pruneToken();
      }
    }
  } catch {
    // ignore a single failed device
  }
}
