import { redirect } from 'next/navigation';

interface Props { params: Promise<{ slug: string }> }

// The real, end-to-end checkout lives in the multi-step register flow
// (app/(public)/e/[slug]/register), which creates the registration, surfaces
// fees before pay, runs Stripe/Flutterwave/WaafiPay, and ends at the QR ticket +
// Eventera Card. This route used to render a standalone mock checkout that never
// POSTed — it now forwards to the real flow so there is a single source of truth.
export default async function CheckoutPage({ params }: Props) {
  const { slug } = await params;
  redirect(`/e/${slug}/register`);
}
