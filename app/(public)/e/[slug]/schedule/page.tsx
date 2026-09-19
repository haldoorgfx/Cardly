import { redirect } from 'next/navigation';

interface Props { params: Promise<{ slug: string }> }

export default async function SchedulePage(props: Props) {
  const params = await props.params;
  redirect(`/e/${params.slug}?tab=schedule`);
}
