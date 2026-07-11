import type { Metadata } from 'next';
import { ApiDocs } from '@/components/marketing/ApiDocs';

export const metadata: Metadata = {
  title: 'API Reference — Eventera',
  description: 'Integrate Eventera with your own systems. Read events and registrations, check attendees in, and generate Eventera Cards over a simple REST API.',
};

export default function DevelopersPage() {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://eventera.so').replace(/\/$/, '');
  const baseUrl = `${appUrl}/api/v1`;
  return <ApiDocs baseUrl={baseUrl} appUrl={appUrl} />;
}
