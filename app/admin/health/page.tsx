import { requireAdmin } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';

export const metadata = { title: 'System Health — Eventera Admin' };
export const dynamic = 'force-dynamic';

// Small helpers — kept local so this page has no external dependencies.
function EnvRow({ label, present, hint }: { label: string; present: boolean; hint?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#E5E0D4] last:border-0">
      <div>
        <span className="text-[13.5px] text-[#0F1F18] font-medium">{label}</span>
        {hint && <span className="ml-2 text-[11.5px] text-[#6B7A72]">{hint}</span>}
      </div>
      <span
        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
        style={{
          color: present ? '#2D7A4F' : '#B8423C',
          background: present ? '#E8EFEB' : '#F7E7E5',
        }}
      >
        {present ? 'Set' : 'Missing'}
      </span>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
      <div className="text-[10px] tracking-[0.18em] uppercase text-[#6B7A72] mb-1.5">{label}</div>
      <div className="font-display font-semibold text-[28px] text-[#0F1F18] tracking-tight">{value}</div>
    </div>
  );
}

async function safeCount(fn: () => PromiseLike<{ count: number | null }>): Promise<number> {
  try {
    const { count } = await fn();
    return count ?? 0;
  } catch {
    return 0;
  }
}

export default async function AdminHealthPage() {
  await requireAdmin();

  const admin = createAdminClient();

  // Platform counts (each guarded so a missing table never breaks the page).
  const [users, events, published, registrations, paid] = await Promise.all([
    safeCount(() => admin.from('profiles').select('id', { count: 'exact', head: true })),
    safeCount(() => admin.from('events').select('id', { count: 'exact', head: true })),
    safeCount(() => admin.from('events').select('id', { count: 'exact', head: true }).eq('status', 'published')),
    safeCount(() => admin.from('registrations').select('id', { count: 'exact', head: true })),
    safeCount(() => admin.from('registrations').select('id', { count: 'exact', head: true }).eq('payment_status', 'paid')),
  ]);

  // Environment / integration wiring (presence only — never values).
  const env = {
    supabaseUrl:            !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey:        !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    appUrl:                 !!process.env.NEXT_PUBLIC_APP_URL,
    resend:                 !!process.env.RESEND_API_KEY,
    sentry:                 !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
    stripe:                 !!process.env.STRIPE_SECRET_KEY,
    waafipay:               !!process.env.WAAFIPAY_API_KEY,
    flutterwave:            !!process.env.FLUTTERWAVE_SECRET_KEY,
    googleMaps:             !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    upstash:                !!process.env.UPSTASH_REDIS_REST_URL,
  };

  const coreOk = env.supabaseUrl && env.supabaseAnonKey && env.supabaseServiceRoleKey && env.appUrl;
  const waafiSandbox = !!process.env.WAAFIPAY_SANDBOX;

  return (
    <div className="p-6 lg:p-10 max-w-[880px]">
      <div className="mb-8">
        <div className="text-[10px] tracking-[0.22em] uppercase text-[#6B7A72] mb-2">Admin · System Health</div>
        <h1 className="font-display font-semibold text-[26px] sm:text-[30px] text-[#0F1F18] tracking-tight">
          System health
        </h1>
        <p className="mt-1.5 text-[14px] text-[#6B7A72]">
          Live platform stats and production configuration — read directly from this deployment.
        </p>
      </div>

      {/* Overall status banner */}
      <div
        className="rounded-2xl p-4 mb-8 flex items-center gap-3"
        style={{ background: coreOk ? '#E8EFEB' : '#F7E7E5', border: `1px solid ${coreOk ? '#CFE0D6' : '#EBC9C5'}` }}
      >
        <span className="text-[13.5px] font-semibold" style={{ color: coreOk ? '#1F4D3A' : '#B8423C' }}>
          {coreOk ? 'Core services configured' : 'Core services INCOMPLETE — the app cannot run correctly'}
        </span>
      </div>

      {/* Platform stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
        <StatCard label="Users" value={users.toLocaleString()} />
        <StatCard label="Events" value={events.toLocaleString()} />
        <StatCard label="Published" value={published.toLocaleString()} />
        <StatCard label="Registrations" value={registrations.toLocaleString()} />
        <StatCard label="Paid registrations" value={paid.toLocaleString()} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core */}
        <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
          <h2 className="font-display font-semibold text-[16px] text-[#0F1F18] mb-2">Core (required)</h2>
          <EnvRow label="Supabase URL" present={env.supabaseUrl} />
          <EnvRow label="Supabase anon key" present={env.supabaseAnonKey} />
          <EnvRow label="Supabase service-role key" present={env.supabaseServiceRoleKey} />
          <EnvRow label="App URL" present={env.appUrl} />
        </div>

        {/* Integrations */}
        <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
          <h2 className="font-display font-semibold text-[16px] text-[#0F1F18] mb-2">Integrations</h2>
          <EnvRow label="Resend (email)" present={env.resend} />
          <EnvRow label="Sentry (errors)" present={env.sentry} />
          <EnvRow label="WaafiPay" present={env.waafipay} hint={waafiSandbox ? 'SANDBOX mode' : undefined} />
          <EnvRow label="Stripe" present={env.stripe} />
          <EnvRow label="Flutterwave" present={env.flutterwave} />
          <EnvRow label="Google Maps" present={env.googleMaps} />
          <EnvRow label="Upstash (rate limit)" present={env.upstash} />
        </div>
      </div>

      {waafiSandbox && (
        <p className="mt-6 text-[12.5px]" style={{ color: '#C97A2D' }}>
          ⚠️ WaafiPay is in SANDBOX mode — real payments will not be captured. Remove <code>WAAFIPAY_SANDBOX</code> for live payments.
        </p>
      )}
    </div>
  );
}
