import { redirect } from 'next/navigation';

interface Props { params: { slug: string } }

export default function PeoplePage({ params }: Props) {
  redirect(`/e/${params.slug}?tab=network`);
}
