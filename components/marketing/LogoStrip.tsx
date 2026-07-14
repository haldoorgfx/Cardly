import { LayoutGrid, PartyPopper, HeartHandshake, Briefcase, Sun, Globe } from 'lucide-react';
import s from './LogoStrip.module.css';

/* Honest "built for" band — event TYPES Eventera serves (all true), not invented
   customer logos. Swap to a real "trusted by" logo row once there are genuine,
   permissioned customers. Calm, monochrome, two-color on hover. */

const TYPES = [
  { name: 'Conferences', icon: LayoutGrid },
  { name: 'Festivals', icon: PartyPopper },
  { name: 'NGOs & nonprofits', icon: HeartHandshake },
  { name: 'Corporate events', icon: Briefcase },
  { name: 'Religious gatherings', icon: Sun },
  { name: 'African summits', icon: Globe },
];

export default function LogoStrip() {
  return (
    <section className={s.section} aria-label="Event types Eventera is built for">
      <div className={s.wrap}>
        <p className={s.kicker}>Built for every kind of event</p>
        <ul className={s.row}>
          {TYPES.map(({ name, icon: Icon }) => (
            <li key={name} className={s.logo}>
              <span className={s.mark}><Icon size={22} strokeWidth={1.7} /></span>
              <span className={s.word}>{name}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
