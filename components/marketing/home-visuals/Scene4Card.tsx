'use client';

import { Ecard, Shot } from './primitives';

/** Scene 4 — The Eventera Card, three cards fanned (signature moment). */
export function Scene4Card() {
  return (
    <Shot width={820} height={500}>
      <div style={{ position: 'relative', width: 820, height: 480, margin: '20px auto 0' }}>
        <div style={{ position: 'absolute', left: 80, top: 60, width: 270, height: 420, transform: 'rotate(-9deg)', filter: 'blur(.4px)', boxShadow: '0 40px 70px -40px rgba(15,31,24,.55)', borderRadius: 16 }}>
          <Ecard initials="KM" faded />
        </div>
        <div style={{ position: 'absolute', right: 80, top: 56, width: 270, height: 420, transform: 'rotate(9deg)', filter: 'blur(.4px)', boxShadow: '0 40px 70px -40px rgba(15,31,24,.55)', borderRadius: 16 }}>
          <Ecard initials="ZA" faded />
        </div>
        <div style={{ position: 'absolute', left: '50%', top: 20, transform: 'translateX(-50%)', width: 270, height: 420, boxShadow: '0 46px 80px -34px rgba(15,31,24,.6)', borderRadius: 16, zIndex: 3 }}>
          <Ecard name="Amara Yusuf" role="Policy Lead · African Union" initials="AY" withBtn />
        </div>
      </div>
    </Shot>
  );
}
