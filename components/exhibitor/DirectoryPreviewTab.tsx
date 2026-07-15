import { Check } from 'lucide-react';

/* EX04 · Directory preview — a read-only render of the booth exactly as an
 * attendee sees it in the public event directory (mirrors
 * app/(public)/e/[slug]/sponsors/[boothId]). No editing here; every action is
 * inert so the exhibitor can proof their listing before publishing. */

interface Sponsor {
  company_name: string;
  tagline?: string | null;
  description?: string | null;
  cover_url?: string | null;
  logo_url?: string | null;
  booth_location?: string | null;
  booth_hours?: string | null;
  website_url?: string | null;
  meeting_url?: string | null;
  contact_email?: string | null;
  offerings?: string[] | null;
  tier?: string | null;
}

interface PreviewProduct {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_featured: boolean;
}

interface Props {
  sponsor: Sponsor;
  products: PreviewProduct[];
}

export function DirectoryPreviewTab({ sponsor, products }: Props) {
  const offerings: string[] = Array.isArray(sponsor.offerings) ? sponsor.offerings : [];
  const canMeet = Boolean(sponsor.meeting_url) || Boolean(sponsor.contact_email);

  return (
    <div className="grid gap-4">
      {/* Preview banner */}
      <div
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[12.5px]"
        style={{ background: '#E8EFEB', color: '#1F4D3A', border: '1px solid rgba(31,77,58,0.15)' }}
      >
        <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        This is a live preview of your public directory listing. It&apos;s read-only here.
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E0D4' }}>
        {/* Hero / cover */}
        <div
          className="relative overflow-hidden"
          style={{ height: 220, background: sponsor.cover_url ? 'transparent' : 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)' }}
        >
          {sponsor.cover_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sponsor.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(15,31,24,0.72) 100%)' }} />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            {sponsor.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sponsor.logo_url} alt={sponsor.company_name} className="h-8 object-contain mb-3 rounded" style={{ filter: 'brightness(0) invert(1)' }} />
            )}
            <h1 className="font-display font-semibold text-[24px] text-white tracking-[-0.02em]">{sponsor.company_name}</h1>
            {sponsor.tagline && <p className="text-[14px] mt-1" style={{ color: '#E8C57E' }}>{sponsor.tagline}</p>}
          </div>
        </div>

        <div className="p-5 sm:p-6 grid gap-8">
          {/* Category / offering chips */}
          {offerings.length > 0 && (
            <div>
              <div className=" text-[10px] tracking-[0.14em] uppercase mb-2.5" style={{ color: '#6B7A72' }}>What we&apos;re offering</div>
              <div className="flex flex-wrap gap-2">
                {offerings.map((item, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 text-[12.5px] font-medium px-3 py-1.5 rounded-full"
                    style={{ background: '#E8EFEB', color: '#1F4D3A', border: '1px solid rgba(31,77,58,0.15)' }}
                  >
                    <Check size={11} strokeWidth={2.4} />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* About */}
          {sponsor.description && (
            <div>
              <div className=" text-[10px] tracking-[0.14em] uppercase mb-2" style={{ color: '#6B7A72' }}>About</div>
              <p className="text-[14px] leading-relaxed" style={{ color: '#3A4A42' }}>{sponsor.description}</p>
            </div>
          )}

          {/* Products */}
          {products.length > 0 && (
            <div>
              <div className=" text-[10px] tracking-[0.14em] uppercase mb-3" style={{ color: '#6B7A72' }}>Products on show</div>
              <div className="grid sm:grid-cols-2 gap-3">
                {products.map((p) => (
                  <div key={p.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}>
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt="" className="rounded-lg object-cover shrink-0" style={{ width: 44, height: 44, border: '1px solid #E5E0D4' }} />
                    ) : (
                      <span className="rounded-lg grid place-items-center shrink-0" style={{ width: 44, height: 44, background: '#E8EFEB' }}>
                        <svg width={18} height={18} fill="none" stroke="#1F4D3A" strokeWidth={1.6} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75h4.5v4.5h-4.5zM3.75 15.75h4.5v4.5h-4.5zM15.75 3.75h4.5v4.5h-4.5zM15.75 15.75h4.5v4.5h-4.5z" />
                        </svg>
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13.5px] font-medium truncate" style={{ color: '#0F1F18' }}>{p.name}</span>
                        {p.is_featured && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(232,197,126,0.2)', color: '#C9A45E', border: '1px solid rgba(232,197,126,0.4)' }}>
                            Featured
                          </span>
                        )}
                      </div>
                      {p.description && <div className="text-[11.5px] mt-0.5 line-clamp-2" style={{ color: '#6B7A72' }}>{p.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Booth + request-meeting affordance (inert preview) */}
          <div className="rounded-xl p-4 grid gap-3" style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}>
            {(sponsor.booth_location || sponsor.booth_hours) && (
              <div>
                {sponsor.booth_location && (
                  <div className="text-[15px] font-medium" style={{ color: '#0F1F18' }}>{sponsor.booth_location}</div>
                )}
                {sponsor.booth_hours && (
                  <div className="text-[12.5px] mt-0.5" style={{ color: '#6B7A72' }}>Open: {sponsor.booth_hours}</div>
                )}
              </div>
            )}
            <button
              type="button"
              disabled
              aria-disabled
              className="w-full py-2.5 rounded-xl font-medium text-[14px] text-white cursor-default"
              style={{ background: '#1F4D3A', opacity: 0.85 }}
            >
              Request a meeting
            </button>
            <div className="text-[11.5px] text-center" style={{ color: '#9BA8A1' }}>
              {canMeet
                ? 'Attendees can request a meeting from your public listing.'
                : 'Add a meeting link or contact email so attendees can reach you.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
