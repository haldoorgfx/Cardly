import { redirect } from 'next/navigation';

interface Props { params: { slug: string } }

export default function SponsorsPage({ params }: Props) {
  redirect(`/e/${params.slug}?tab=sponsors`);
}
