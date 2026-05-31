import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, email, topic, message } = body;
  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // Send notification to us
    await resend.emails.send({
      from:    'Karta Contact <noreply@karta.cre8so.com>',
      to:      ['hello@cre8so.com'],
      replyTo: email,
      subject: `[Contact] ${topic ? `${topic} — ` : ''}${name}`,
      html: `
        <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
        <p><strong>Topic:</strong> ${topic || 'Not specified'}</p>
        <hr/>
        <p style="white-space:pre-wrap">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
      `,
    });

    // Send confirmation to the sender
    await resend.emails.send({
      from:    'Karta <noreply@karta.cre8so.com>',
      to:      [email],
      subject: 'We got your message',
      html: `
        <p>Hi ${name},</p>
        <p>Thanks for reaching out — we got your message and will reply within one business day.</p>
        <p>If it's urgent, just reply to this email and add "urgent" to the subject line.</p>
        <br/>
        <p>— The Karta team</p>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contact]', err);
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}
