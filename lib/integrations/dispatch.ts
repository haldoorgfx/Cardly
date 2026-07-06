import { listIntegrations, recordResult } from '@/lib/integrations';
import { sendToProvider, type RegistrationPayload } from '@/lib/integrations/providers';

/**
 * Fire all of an organizer's enabled integrations for a confirmed registration.
 *
 * Best-effort and fully non-blocking: every provider is isolated, failures are
 * recorded to last_error, and this never throws to the caller. Safe to call
 * (without awaiting) from any registration-confirmation code path.
 */
export async function onRegistrationConfirmed(
  ownerUserId: string,
  payload: RegistrationPayload,
): Promise<void> {
  try {
    const integrations = await listIntegrations(ownerUserId);
    const active = integrations.filter(i => i.enabled);
    if (active.length === 0) return;

    await Promise.allSettled(
      active.map(async i => {
        try {
          await sendToProvider(i.provider, i.config, payload);
          await recordResult(ownerUserId, i.provider, null);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Delivery failed';
          console.error(`[integrations] ${i.provider} failed for ${ownerUserId}:`, msg);
          await recordResult(ownerUserId, i.provider, msg).catch(() => {});
        }
      }),
    );
  } catch (err) {
    // Never let integration dispatch affect the registration flow.
    console.error('[integrations] dispatch error:', err);
  }
}
