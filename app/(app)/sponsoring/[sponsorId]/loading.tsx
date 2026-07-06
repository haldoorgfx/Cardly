import { Skel, CardListSkel } from '@/components/shared/Skeletons';

export default function Loading() {
  return (
    <div className="mx-auto max-w-[1200px] px-5 lg:px-8 py-7">
      <Skel className="h-40 w-full rounded-2xl mb-6" />
      <CardListSkel />
    </div>
  );
}
