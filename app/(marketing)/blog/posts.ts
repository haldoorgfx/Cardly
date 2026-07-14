/**
 * Shared blog content — single source of truth for the blog index and the
 * individual article pages (`/blog/[slug]`). Keeping the data here means the
 * listing, the category filter, and every article render from the same object,
 * so a link on the index can never point at a post that doesn't exist.
 *
 * Body model: each string in `body` is one block. A block that starts with
 * `## ` renders as a section heading; everything else renders as a paragraph.
 */

export interface BlogPost {
  slug: string;
  category: 'Product' | 'Design' | 'Campaigns' | 'Africa';
  date: string;
  title: string;
  excerpt: string;
  readTime: string;
  featured?: boolean;
  body: string[];
}

export const CATEGORIES = ['All', 'Product', 'Design', 'Campaigns', 'Africa'] as const;

export const POSTS: BlogPost[] = [
  {
    slug: 'attendee-share-cards-africa',
    category: 'Product',
    date: 'May 14, 2026',
    title: 'Why attendee share cards are the most underused campaign tool in Africa',
    excerpt:
      'Every major conference spends thousands on keynote speakers and venue branding. Then every attendee posts a personal photo with no context. We fixed that.',
    readTime: '6 min read',
    featured: true,
    body: [
      'Walk through any large conference in Lagos, Nairobi, or Addis and you will see the same thing: a room full of people who each have a phone, a personal network, and a reason to post. Then the event ends and almost none of that reach gets captured. Attendees share a blurry selfie with no event name, no hashtag, and no brand. The organizer spent months on a venue and a speaker lineup, and the single largest distribution channel in the room walked out the door unused.',
      '## The math nobody runs',
      'A 600-person event where each attendee has 400 followers is a potential audience of 240,000 people. That is larger than the reach of most paid campaigns the same organizer will run all year. The problem was never the audience. The problem was that turning 600 individual attendees into 600 on-brand posts required 600 individual design jobs, and nobody has that kind of design team.',
      'So organizers defaulted to the one asset they could make at scale: a single generic graphic, posted once, from the official account. It reaches the people who already follow you. It does nothing to reach the people your attendees know and you do not.',
      '## What a share card changes',
      'The Eventera Card flips the default. The moment someone registers, they get a personalized, branded card with their name, their role, and your event identity already on it. There is no Canva step, no designer queue, no manual export. The asset that used to take a design job now ships automatically with registration.',
      'Because the card is personal, people actually post it. It is not your logo — it is them, at your event. That is the difference between an ad and an announcement, and announcements from a friend convert far better than ads from a brand.',
      '## Start with the card, not the campaign',
      'If you run events, the highest-leverage change you can make this year is not a bigger ad budget. It is turning the people already in the room into the campaign. Give every attendee something worth sharing, and reach stops being something you buy and starts being something your event produces on its own.',
    ],
  },
  {
    slug: 'zone-system-on-brand',
    category: 'Design',
    date: 'May 8, 2026',
    title: 'The zone system: how Eventera cards stay on-brand at any scale',
    excerpt:
      "Behind every personalized card is a coordinate system. Here's how we built zones to give designers control without blocking attendees.",
    readTime: '5 min read',
    body: [
      'Personalization and brand control usually pull in opposite directions. Give attendees freedom and the design falls apart; lock everything down and the card feels generic. The zone system is how Eventera gives both sides what they need at the same time.',
      '## A card is a set of zones',
      'When a designer uploads a card design, they define editable zones — a name field, a photo slot, a role line — each with a fixed position, type scale, and color. Everything outside those zones is frozen. Attendees can only change what lives inside a zone, and only in ways the designer allowed.',
      'That means an attendee can drop in their photo and name and get a card that looks exactly as the designer intended, at any of the thousands of cards generated from a single template.',
      '## Why coordinates beat layers',
      'We chose an explicit coordinate model over a free-form layer editor on purpose. Coordinates are predictable: the same zone renders in the same place whether the name is short or long, whether the render happens on a phone or on our servers. Predictability is what keeps ten thousand cards on-brand instead of ten thousand cards that are almost right.',
      '## The payoff',
      'Designers set the rules once. Attendees personalize inside them. Nobody has to review individual cards, and the brand holds at any scale. That is the whole point of the system — control where it matters, freedom where it does not.',
    ],
  },
  {
    slug: '247k-cards-campaign-lessons',
    category: 'Campaigns',
    date: 'Apr 30, 2026',
    title: 'What makes an event card go wide — and what makes one sit in a download folder',
    excerpt:
      'Some cards spread across cities. Others get generated and never leave the download folder. Here is what we think separates the two — and how to design for it.',
    readTime: '6 min read',
    body: [
      'Some event cards spread across cities; others get generated and never leave the download folder. We think two factors do most of the work in separating the two — and both are things an organizer can design for from the start.',
      '## One: the card has to feel like the person, not the brand',
      'A card that leads with the attendee — their photo, their name, their role — is far more shareable than one that leads with the event logo. This is intuitive once you see it: people post things that say something about themselves. A card that is mostly your branding is an ad they are being asked to distribute for free. A card that is mostly them, with your brand as the frame, is a personal moment they want to share anyway.',
      '## Two: the share has to happen in the first hour',
      'We think the timing of the share matters as much as the design. The moment right after someone commits to an event is the moment they are most excited to tell people. A card delivered instantly, on the confirmation screen, catches that excitement; a card emailed days later misses it. Enthusiasm has a half-life, and most campaigns let it run out by waiting.',
      '## Three things worth doing',
      'The events we would expect to spread widest do three unglamorous things. They make the card personal. They deliver it the instant someone registers. And they give a one-tap path to WhatsApp and Instagram Stories, where their audiences actually share. None of that is a growth hack. It is just removing every gap between the moment of excitement and the act of sharing.',
      '## The takeaway',
      'You do not make a campaign go wide by pushing harder at the top. You make it go wide by removing friction at the exact moment people already want to act. Personal asset, instant delivery, one-tap share. Get those three right and reach compounds on its own.',
    ],
  },
  {
    slug: 'card-variants',
    category: 'Product',
    date: 'Apr 22, 2026',
    title: 'Introducing card variants: run multiple designs from one event link',
    excerpt:
      'VIP tiers. Sponsor packages. Language editions. Variants let you serve every audience segment from the same campaign without duplicating your setup.',
    readTime: '4 min read',
    body: [
      'Real events are not one audience. You have speakers, sponsors, VIPs, and general attendees — and each of them deserves a card that says something slightly different. Until now that meant duplicating your whole setup for every segment. Variants remove the duplication.',
      '## One event, many cards',
      'A variant is an alternate version of your card design attached to the same event. A speaker gets an "I\'m speaking at" card; a sponsor gets a "Proud sponsor" card; a general attendee gets an "I\'ll be there" card. Same brand, same event link, different message per segment — all managed from one place.',
      '## Why this matters',
      'Segment-specific cards convert better because they are truer. A sponsor is far more likely to post a card that names them as a sponsor than a generic attendee card. A speaker will post the card that announces their session. Variants let each group share the version that is actually about them.',
      '## Set it up once',
      'You define the variants at the design stage and assign them by ticket type or role. From then on, every registrant is routed to the right card automatically. No manual sorting, no separate events, no duplicated links.',
    ],
  },
  {
    slug: 'whatsapp-first-east-africa',
    category: 'Africa',
    date: 'Apr 12, 2026',
    title: 'Building for WhatsApp first: lessons from East African campaigns',
    excerpt:
      'The social graph in East Africa routes through WhatsApp. We rebuilt our share flow to treat WhatsApp as a first-class surface instead of an afterthought.',
    readTime: '7 min read',
    body: [
      'Most event software is built on an assumption that quietly breaks across much of Africa: that sharing happens on open social feeds. In East Africa, the social graph runs through WhatsApp. If your share flow treats WhatsApp as an afterthought, you have designed for the wrong network.',
      '## Status is the feed',
      'For a large share of attendees, WhatsApp Status is the primary place they broadcast to their network. It is where a card actually gets seen by the people who might register next. A share flow that optimizes for a Twitter card preview and buries the WhatsApp option is optimizing for the smaller audience.',
      '## What we changed',
      'We rebuilt the share sheet to put WhatsApp first, sized the card for Status rather than for a desktop timeline, and made the hand-off a single tap that carries the image and a pre-written caption straight into the app. The card arrives ready to post, not as a link someone has to open, screenshot, and re-upload.',
      '## Design for the network you have',
      'The broader lesson is not about one button. It is that distribution assumptions baked into tools built elsewhere do not automatically hold here. Build for how your audience actually shares — for many events across the region, that means WhatsApp first, and everything else second.',
    ],
  },
  {
    slug: 'design-systems-for-events',
    category: 'Design',
    date: 'Mar 28, 2026',
    title: 'Design systems for events: why organizers should think like brand managers',
    excerpt:
      "A conference is a brand activation. Most organizers manage it like a logistics operation. Here's the mindset shift that changes everything.",
    readTime: '6 min read',
    body: [
      'Most organizers treat an event as a logistics problem: a venue to book, a schedule to fill, a guest list to manage. All of that is real. But it misses the thing that actually determines whether the event echoes after it ends — the event is a brand activation, and it should be run like one.',
      '## The activation lasts longer than the day',
      'The event itself is one day. The impression it leaves — the posts, the cards, the photos, the way people describe it afterward — lasts far longer and reaches far more people. A brand manager would obsess over that afterlife. A logistics manager treats it as out of scope. The gap between those two mindsets is most of the reach an event leaves on the table.',
      '## Think in systems, not one-offs',
      'Brand managers do not design each asset from scratch; they define a system and let it produce consistent assets at scale. For an event that means a defined color palette, a type treatment, and a card template that every attendee inherits automatically. Set the system once and every touchpoint — the registration page, the card, the share — comes out on-brand without individual attention.',
      '## The shift',
      'Stop asking only "did the event run smoothly?" and start asking "what did the event produce that outlives the day?" Once you manage an event like an activation, the personalized card stops being a nice extra and becomes the core distribution asset it always should have been.',
    ],
  },
  {
    slug: '8-countries',
    category: 'Product',
    date: 'Mar 14, 2026',
    title: 'Eventera is built for Africa and the Gulf',
    excerpt:
      'Local currency, payment methods people actually use, and pages that load fast — here is what it means that Eventera is built for how events run across Africa and the Gulf.',
    readTime: '3 min read',
    body: [
      'Eventera is built for how events actually run across Africa and the Gulf, with local currency handling and regional storage so that events load fast and payments feel native no matter where your attendees are.',
      '## What building for a market means',
      'A well-supported market gets local currency display and checkout, payment methods that people in that market actually use, and storage in a nearby region so pages and cards load quickly. It is the difference between technically working and genuinely feeling built for a place.',
      '## Payments that fit the market',
      'Alongside card payments, we build for the local rails attendees expect — mobile money and regional processors included. Organizers can run free and paid registrations side by side on the same event, in the currency their audience thinks in.',
      '## More to come',
      'This is a step, not a finish line. We prioritize markets based on where organizers are already running events, so if your country needs better support, tell us — demand is how we decide what comes next.',
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export const FEATURED_POST: BlogPost = POSTS.find((p) => p.featured) ?? POSTS[0];
