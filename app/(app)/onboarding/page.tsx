import type { Metadata } from 'next';
import OnboardingClient from './OnboardingClient';

export const metadata: Metadata = { title: 'Get set up — Karta' };

export default function OnboardingPage() {
  return <OnboardingClient />;
}
