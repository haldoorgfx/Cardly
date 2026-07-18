import { redirect } from 'next/navigation';

// The event-level integrations catalog was a placeholder (15 of 18 items were
// hardcoded "coming soon", and it wrongly marked Slack/Zapier/Mailchimp/HubSpot
// "coming soon" while those same integrations are fully working at the account
// level). Integrations are configured once per account, so this route now
// forwards to the real, working page. IntegrationsView.tsx is kept on disk.
export default function EventIntegrationsRedirect() {
  redirect('/settings/integrations');
}
