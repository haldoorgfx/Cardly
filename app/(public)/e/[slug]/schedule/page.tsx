import { redirect } from 'next/navigation';

interface Props { params: { slug: string } }

export default function SchedulePage({ params }: Props) {
  redirect(`/e/${params.slug}?tab=schedule`);
}
