import { redirect } from 'next/navigation';

interface Props { params: Promise<{ id: string }> }

export default async function BadgesPage({ params }: Props) {
  const { id } = await params;
  redirect(`/events/${id}/karta-card`);
}
