import { redirect } from 'next/navigation';

interface Props { params: { slug: string } }

export default function SpeakersPage({ params }: Props) {
  redirect(`/e/${params.slug}?tab=speakers`);
}
