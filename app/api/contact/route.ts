import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';

const ContactSchema = z.object({
  name:    z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less').trim(),
  email:   z.string().min(1, 'Email is required').max(254).email('Please enter a valid email address'),
  message: z.string().min(1, 'Message is required').max(5000, 'Message must be 5,000 characters or less').trim(),
  topic:   z.string().max(100).trim().optional().default(''),
});

/** Escape every HTML-special character for safe embedding in email markup. */
function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = ContactSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { name, email, topic, message } = parsed.data;
  const safeName    = escHtml(name);
  const safeTopic   = escHtml(topic);
  const safeMessage = escHtml(message);

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from:    'Eventera Contact <noreply@karta.cre8so.com>',
      to:      ['hello@cre8so.com'],
      replyTo: email,
      subject: `[Contact] ${topic ? `${safeTopic} — ` : ''}${safeName}`,
      html: `
        <p><strong>From:</strong> ${safeName} &lt;${escHtml(email)}&gt;</p>
        <p><strong>Topic:</strong> ${safeTopic || 'Not specified'}</p>
        <hr/>
        <p style="white-space:pre-wrap">${safeMessage}</p>
      `,
    });

    await resend.emails.send({
      from:    'Eventera <noreply@karta.cre8so.com>',
      to:      [email],
      subject: 'We got your message',
      html: `
        <p>Hi ${safeName},</p>
        <p>Thanks for reaching out — we got your message and will reply within one business day.</p>
        <p>If it's urgent, just reply to this email and add "urgent" to the subject line.</p>
        <br/>
        <p>— The Eventera team</p>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contact]', err);
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}
