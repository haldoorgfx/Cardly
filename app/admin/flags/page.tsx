export const dynamic = 'force-dynamic';

import { requireAdmin } from '@/lib/auth/guards';
import { getAllFlags } from '@/lib/flags';
import { FlagsAdminClient } from './FlagsAdminClient';

export default async function FlagsAdminPage() {
  await requireAdmin();
  const flags = await getAllFlags();
  return <FlagsAdminClient initialFlags={flags} />;
}
