'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronRight, ChevronLeft, ArrowRight, Ticket, ClipboardList, Users, Zap, BookOpen } from 'lucide-react';
import { EventPageEditor } from '@/components/events/EventPageEditor';
import { TicketTypesManager } from '@/components/events/TicketTypesManager';
import { RegistrationFormBuilder } from '@/components/events/RegistrationFormBuilder';
import SpeakersManager from '@/components/events/SpeakersManager';
import type { Database, Speaker } from '@/types/database';

type EventPageRow = Database['public']['Tables']['event_pages']['Row'];
type TicketRow = Database['public']['Tables']['ticket_types']['Row'];
type FieldRow = Database['public']['Tables']['registration_form_fields']['Row'];

interface Props {
  eventId: string;
  eventSlug: string;
  eventName: string;
  eventStatus: string;
  existingPage: EventPageRow | null;
  initialTickets: TicketRow[];
  initialFormFields: FieldRow[];
  initialSpeakers: Speaker[];
}

const STEPS = [
  { id: 1, label: 'Event details', short: 'Details',     icon: BookOpen },
  { id: 2, label: 'Tickets',       short: 'Tickets',     icon: Ticket },
  { id: 3, label: 'Registration',  short: 'Registration', icon: ClipboardList },
  { id: 4, label: 'Programme',     short: 'Programme',   icon: Users,  optional: true },
  { id: 5, label: 'Go live',       short: 'Go live',     icon: Zap },
];

export function SetupWizard({
  eventId, eventSlug, eventName, eventStatus,
  existingPage, initialTickets, initialFormFields, initialSpeakers,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();

  function advance() { setStep(s => Math.min(s + 1, STEPS.length)); }
  function goBack()  { setStep(s => Math.max(s - 1, 1)); }

  function handleGoLive() {
    startTransition(() => {
      router.push(`/events/${eventId}/publish`);
    });
  }

  function handleSaveDraft() {
    router.push(`/events/${eventId}`);
  }

  const currentStepMeta = STEPS[step - 1];
  const isDetailsStep = step === 1;
  const isPublishStep = step === 5;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAF6EE' }}>

      {/* ── Top header ─────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 bg-white border-b flex items-center justify-between px-5 h-14"
        style={{ borderColor: '#E5E0D4' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleSaveDraft}
            className="shrink-0 flex items-center gap-1.5 text-[13px] font-medium transition hover:text-[#1F4D3A]"
            style={{ color: '#6B7A72' }}
          >
            <ChevronLeft size={14} strokeWidth={2} />
            Exit
          </button>
          <span className="hidden sm:block text-[13px] font-medium truncate" style={{ color: '#0F1F18' }}>
            {eventName}
          </span>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-1 sm:gap-2">
          {STEPS.map((s, i) => {
            const done = s.id < step;
            const active = s.id === step;
            return (
              <div key={s.id} className="flex items-center">
                <button
                  onClick={() => { if (s.id < step) setStep(s.id); }}
                  disabled={s.id > step}
                  className="flex items-center gap-1.5 transition"
                  title={s.label}
                >
                  <div
                    className="flex items-center justify-center rounded-full transition-all"
                    style={{
                      width: 26, height: 26, flexShrink: 0,
                      background: done ? '#1F4D3A' : active ? '#1F4D3A' : '#E5E0D4',
                    }}
                  >
                    {done
                      ? <Check size={12} strokeWidth={3} color="white" />
                      : <span className="text-[11px] font-semibold" style={{ color: active ? 'white' : '#6B7A72' }}>{s.id}</span>
                    }
                  </div>
                  <span
                    className="text-[12px] font-medium hidden md:block"
                    style={{ color: done ? '#1F4D3A' : active ? '#0F1F18' : '#9BA8A1' }}
                  >
                    {s.short}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className="mx-1 sm:mx-2 h-px"
                    style={{ width: 16, background: done ? '#1F4D3A' : '#E5E0D4', flexShrink: 0 }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="w-16 shrink-0" /> {/* spacer to balance the exit button */}
      </header>

      {/* ── Step content ───────────────────────────────────────────────── */}
      <div className="flex-1">

        {/* Step 1: Event details — EventPageEditor handles its own sub-steps + bottom nav */}
        {step === 1 && (
          <EventPageEditor
            eventId={eventId}
            eventSlug={eventSlug}
            eventName={eventName}
            existing={existingPage}
            onComplete={advance}
          />
        )}

        {/* Step 2: Tickets */}
        {step === 2 && (
          <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-8 pb-28">
            <StepHeader
              step={step}
              total={STEPS.length}
              title="Tickets"
              description="Create free or paid ticket types. You can add multiple tiers."
            />
            <TicketTypesManager
              eventId={eventId}
              initialTickets={initialTickets}
              eventDates={{
                starts_at: existingPage?.starts_at ?? null,
                ends_at: existingPage?.ends_at ?? null,
                max_capacity: existingPage?.max_capacity ?? null,
              }}
            />
          </div>
        )}

        {/* Step 3: Registration form */}
        {step === 3 && (
          <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-8 pb-28">
            <StepHeader
              step={step}
              total={STEPS.length}
              title="Registration form"
              description="Collect extra info from attendees — dietary requirements, company, custom questions."
            />
            <RegistrationFormBuilder eventId={eventId} initialFields={initialFormFields} />
          </div>
        )}

        {/* Step 4: Programme (optional) */}
        {step === 4 && (
          <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-8 pb-28">
            <StepHeader
              step={step}
              total={STEPS.length}
              title="Programme &amp; speakers"
              description="Add speakers and sessions. You can skip this and come back later."
              optional
            />
            <SpeakersManager eventId={eventId} slug={eventSlug} initialSpeakers={initialSpeakers} />
          </div>
        )}

        {/* Step 5: Go live */}
        {step === 5 && (
          <div className="max-w-[600px] mx-auto px-4 sm:px-6 py-8 pb-28">
            <PublishStep
              eventSlug={eventSlug}
              eventStatus={eventStatus}
              hasTickets={initialTickets.length > 0}
              hasPage={!!existingPage}
              onGoLive={handleGoLive}
              onSaveDraft={handleSaveDraft}
              isPending={isPending}
            />
          </div>
        )}
      </div>

      {/* ── Bottom nav bar (steps 2-5 only — step 1 uses EventPageEditor's own nav) ── */}
      {!isDetailsStep && (
        <div
          className="fixed bottom-0 left-0 right-0 sm:left-[252px] flex items-center justify-between gap-4 px-5 sm:px-6 py-4"
          style={{ background: 'white', borderTop: '1px solid #E5E0D4', zIndex: 40 }}
        >
          <button
            onClick={goBack}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-medium border transition hover:border-[#1F4D3A] hover:text-[#1F4D3A]"
            style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}
          >
            <ChevronLeft size={14} strokeWidth={2} />
            Back
          </button>

          <div className="flex items-center gap-3">
            {currentStepMeta.optional && (
              <button
                onClick={advance}
                className="text-[13px] font-medium transition hover:text-[#1F4D3A]"
                style={{ color: '#6B7A72' }}
              >
                Skip for now
              </button>
            )}

            {!isPublishStep && (
              <button
                onClick={advance}
                className="inline-flex items-center gap-1.5 h-9 px-5 rounded-lg text-white text-[13px] font-semibold transition hover:opacity-90"
                style={{ background: '#1F4D3A' }}
              >
                Continue
                <ChevronRight size={14} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Shared sub-components ─────────────────────────────────────────────── */

function StepHeader({
  step, total, title, description, optional,
}: {
  step: number;
  total: number;
  title: string;
  description: string;
  optional?: boolean;
}) {
  return (
    <div className="mb-8">
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#6B7A72' }}>
        Step {step} of {total}{optional ? ' · Optional' : ''}
      </p>
      <h1
        className="font-display font-semibold text-[24px]"
        style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}
        dangerouslySetInnerHTML={{ __html: title }}
      />
      <p className="text-[14px] mt-1.5" style={{ color: '#6B7A72' }}>{description}</p>
    </div>
  );
}

function PublishStep({
  eventSlug, eventStatus,
  hasTickets, hasPage,
  onGoLive, onSaveDraft, isPending,
}: {
  eventSlug: string;
  eventStatus: string;
  hasTickets: boolean;
  hasPage: boolean;
  onGoLive: () => void;
  onSaveDraft: () => void;
  isPending: boolean;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const eventUrl = `${appUrl}/e/${eventSlug}`;
  const isAlreadyPublished = eventStatus === 'published';

  const checklist = [
    { label: 'Event page created', done: hasPage, required: true },
    { label: 'At least one ticket type', done: hasTickets, required: false, hint: 'Attendees need a ticket to register' },
  ];

  const requiredMissing = checklist.filter(c => c.required && !c.done);

  return (
    <div>
      <div className="mb-10">
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#6B7A72' }}>
          Step 5 of 5
        </p>
        <h1 className="font-display font-semibold text-[26px] sm:text-[30px] leading-tight mb-2" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
          {isAlreadyPublished ? 'Your event is live' : 'Ready to go live?'}
        </h1>
        <p className="text-[14px]" style={{ color: '#6B7A72' }}>
          {isAlreadyPublished
            ? 'Your event is already published. You can view it or return to the dashboard.'
            : 'Review the checklist below, then publish when ready. You can always save as a draft and come back.'}
        </p>
      </div>

      {/* Checklist */}
      <div className="space-y-3 mb-8">
        {checklist.map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-4 rounded-xl"
            style={{
              border: `1px solid ${item.done ? 'rgba(31,77,58,0.2)' : item.required ? 'rgba(184,66,60,0.2)' : '#E5E0D4'}`,
              background: item.done ? 'rgba(31,77,58,0.04)' : 'white',
            }}
          >
            <div
              className="shrink-0 rounded-full flex items-center justify-center mt-0.5"
              style={{
                width: 22, height: 22,
                background: item.done ? '#1F4D3A' : item.required ? 'rgba(184,66,60,0.1)' : '#F5F3EE',
                border: item.done ? 'none' : item.required ? '1.5px solid rgba(184,66,60,0.4)' : '1.5px solid #E5E0D4',
              }}
            >
              {item.done && <Check size={11} strokeWidth={3} color="white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium" style={{ color: item.done ? '#1F4D3A' : '#0F1F18' }}>
                {item.label}
              </p>
              {!item.done && item.hint && (
                <p className="text-[12px] mt-0.5" style={{ color: item.required ? '#B8423C' : '#6B7A72' }}>
                  {item.hint}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Event URL preview */}
      <div
        className="flex items-center gap-3 p-4 rounded-xl mb-8"
        style={{ background: 'white', border: '1px solid #E5E0D4' }}
      >
        <div
          className="shrink-0 h-9 w-9 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(31,77,58,0.08)' }}
        >
          <ArrowRight size={15} strokeWidth={2} color="#1F4D3A" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#6B7A72' }}>
            Your event URL
          </p>
          <p className="text-[13px] truncate" style={{ color: '#0F1F18' }}>
            {eventUrl}
          </p>
        </div>
      </div>

      {requiredMissing.length > 0 && (
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-xl mb-6"
          style={{ background: 'rgba(184,66,60,0.06)', border: '1px solid rgba(184,66,60,0.2)' }}
        >
          <p className="text-[13px]" style={{ color: '#B8423C' }}>
            Complete the required steps above before publishing.
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {!isAlreadyPublished && (
          <button
            onClick={onGoLive}
            disabled={isPending || requiredMissing.length > 0}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl text-white text-[14px] font-semibold transition hover:opacity-90 disabled:opacity-50"
            style={{ background: '#1F4D3A' }}
          >
            {isPending ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round" />
                </svg>
                Publishing…
              </>
            ) : (
              <>
                <Zap size={15} strokeWidth={2} />
                Publish event
              </>
            )}
          </button>
        )}

        <button
          onClick={onSaveDraft}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl text-[14px] font-medium border transition hover:border-[#1F4D3A] hover:text-[#1F4D3A]"
          style={{ borderColor: '#E5E0D4', color: '#3A4A42', background: 'white' }}
        >
          {isAlreadyPublished ? 'Go to event dashboard' : 'Save as draft'}
        </button>

        {isAlreadyPublished && (
          <a
            href={eventUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl text-white text-[14px] font-semibold transition hover:opacity-90"
            style={{ background: '#1F4D3A' }}
          >
            View event page
            <ArrowRight size={14} strokeWidth={2} />
          </a>
        )}
      </div>
    </div>
  );
}
