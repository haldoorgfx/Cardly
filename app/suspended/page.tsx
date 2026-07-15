import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { signOut } from '@/app/(auth)/actions';

export const metadata = { title: 'Account Suspended' };

export default async function SuspendedPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Not logged in — go to login
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('suspended, suspended_reason, full_name')
    .eq('id', user.id)
    .single();

  // Not actually suspended — redirect to dashboard
  if (!profile?.suspended) redirect('/dashboard');

  const reason = profile.suspended_reason ?? 'Your account has been suspended by an administrator.';

  return (
    <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center p-6">
      <div className="bg-white border border-[#E5E0D4] rounded-2xl shadow-sm p-10 max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[#B8423C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-semibold text-[#0F1F18] font-title tracking-tight mb-2">
          Account Suspended
        </h1>
        <p className="text-[#6B7A72] text-sm leading-relaxed mb-6">
          {reason}
        </p>

        {/* Divider */}
        <div className="border-t border-[#E5E0D4] my-6" />

        <p className="text-xs text-[#6B7A72] mb-6">
          If you believe this is a mistake, please contact support with your account email:{' '}
          <span className=" text-[#0F1F18]">{user.email}</span>
        </p>

        <div className="flex flex-col gap-3">
          <a
            href="mailto:support@eventera.so"
            className="block w-full bg-[#1F4D3A] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#163828] transition-colors"
          >
            Contact Support
          </a>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full border border-[#E5E0D4] text-[#6B7A72] py-2.5 rounded-lg text-sm font-medium hover:bg-[#FAF6EE] transition-colors"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
