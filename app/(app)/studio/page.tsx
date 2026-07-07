import { redirect } from 'next/navigation';

// The standalone "/studio" surface was an early, non-functional design mockup
// (no event context, no persistence, no auto-save/undo/redo, brand-noncompliant).
// The real Card Studio is the canvas editor at /events/[id]/edit, reached by
// picking a template in the gallery. Route users to the working entry point.
export default function StudioPage() {
  redirect('/templates');
}
