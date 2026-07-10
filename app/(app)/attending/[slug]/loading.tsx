import { Skel, CardListSkel } from '@/components/shared/Skeletons';

export default function Loading() {
  return (
    <div>
      <div className="flex gap-2 mb-6">
        {[0, 1, 2, 3].map(i => <Skel key={i} className="h-8 w-24 rounded-full" />)}
      </div>
      <CardListSkel />
    </div>
  );
}
