/* eslint-disable @typescript-eslint/no-explicit-any */
// Stable public shapes for /api/v1 responses.

export function serializeRegistration(r: any) {
  return {
    id: r.id,
    event_id: r.event_id,
    attendee_name: r.attendee_name,
    attendee_email: r.attendee_email,
    attendee_phone: r.attendee_phone ?? null,
    status: r.status,
    payment_status: r.payment_status,
    ticket_type_id: r.ticket_type_id,
    ticket_type: r.ticket_types?.name ?? null,
    amount_paid: r.amount_paid ?? 0,
    currency: r.currency ?? null,
    checked_in_at: r.checked_in_at ?? null,
    custom_fields: r.custom_fields ?? {},
    qr_code_token: r.qr_code_token,
    created_at: r.created_at,
  };
}
