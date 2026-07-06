// Attendee app — mock data. One featured event (full experience) + a discover feed
// spanning every event type the platform supports.

const A_GRAD = {
  forest: "linear-gradient(150deg,#0D1F17 0%,#1F4D3A 60%,#2A6A50 110%)",
  gold:   "linear-gradient(145deg,#1F4D3A 0%,#2A6A50 45%,#C9A45E 125%)",
  plum:   "linear-gradient(150deg,#241733 0%,#3a2a55 70%,#5a4a7a 120%)",
  clay:   "linear-gradient(150deg,#2b160c 0%,#5a3320 70%,#9a6038 120%)",
  ocean:  "linear-gradient(150deg,#0b1a26 0%,#1e3a55 70%,#3a6a90 120%)",
  rose:   "linear-gradient(150deg,#2b0f1a 0%,#5a2036 70%,#a04a68 120%)",
};

// Accent themes for personalized cards
const CARD_ACCENTS = [
  { id: "forest", label: "Forest", grad: "linear-gradient(155deg,#0D1F17,#1F4D3A 70%,#163828)", ring: "#E8C57E" },
  { id: "plum", label: "Plum", grad: "linear-gradient(155deg,#14101f,#3a2a55 75%,#241733)", ring: "#C9A45E" },
  { id: "clay", label: "Clay", grad: "linear-gradient(155deg,#1f120c,#5a3320 75%,#2b160c)", ring: "#E8C57E" },
  { id: "ocean", label: "Ocean", grad: "linear-gradient(155deg,#0c1420,#1e3a55 75%,#0b1a26)", ring: "#E8C57E" },
];

// The featured event the attendee is registering for / attending
const FEATURED = {
  id: "afritech", name: "AfriTech Summit 2026", org: "Sahel Ventures",
  tagline: "Africa's largest gathering of builders, founders and investors.",
  dates: "12–14 March 2026", short: "12 Mar", venue: "Djibouti City", country: "Djibouti",
  grad: A_GRAD.forest, category: "Tech Conference", attendees: 1284, going: 1284,
  about: "Three days of keynotes, deep-dive workshops and the connections that move the continent's technology forward. Join 1,200+ founders, engineers and investors from 40 countries.",
  stats: [["3", "days"], ["60+", "speakers"], ["1,200+", "attendees"], ["40", "countries"]],
  tickets: [
    { id: "ga", name: "General admission", desc: "All keynotes & tracks, 3 days", price: 25, cur: "$" },
    { id: "vip", name: "VIP package", desc: "Front row, speaker dinner, lounge access", price: 80, cur: "$", popular: true },
    { id: "student", name: "Student", desc: "Valid student ID required at door", price: 0, cur: "$" },
    { id: "virtual", name: "Virtual pass", desc: "Stream all main-stage sessions online", price: 10, cur: "$" },
  ],
};

// Discover feed — every event type
const DISCOVER = [
  { id: "afritech", name: "AfriTech Summit 2026", cat: "Tech", when: "12 Mar", city: "Djibouti City", price: "From $25", grad: A_GRAD.forest, going: 1284, featured: true },
  { id: "climate", name: "Pan-African Climate Forum", cat: "NGO", when: "22 Apr", city: "Nairobi", price: "Free", grad: A_GRAD.forest, going: 640 },
  { id: "rhythms", name: "Sahara Rhythms Festival", cat: "Music", when: "30 May", city: "Marrakesh", price: "From $40", grad: A_GRAD.plum, going: 5200 },
  { id: "halal", name: "Global Halal Summit", cat: "Religious", when: "18 Jul", city: "Istanbul", price: "From $15", grad: A_GRAD.gold, going: 880 },
  { id: "marathon", name: "Lagos City Marathon", cat: "Sports", when: "09 Feb", city: "Lagos", price: "From $30", grad: A_GRAD.clay, going: 12000 },
  { id: "founders", name: "Founders Gala Dinner", cat: "Corporate", when: "14 May", city: "Accra", price: "From $120", grad: A_GRAD.ocean, going: 320 },
  { id: "grad", name: "UoN · Class of 2026", cat: "Education", when: "Dec 2026", city: "Nairobi", price: "Invite", grad: A_GRAD.forest, going: 612 },
  { id: "art", name: "Dakar Art Biennale", cat: "Arts", when: "03 Jun", city: "Dakar", price: "From $12", grad: A_GRAD.rose, going: 2100 },
];

const CATEGORIES = ["All", "Tech", "Music", "NGO", "Sports", "Corporate", "Religious", "Education", "Arts"];

// Sessions (agenda) for the featured event
const A_SESSIONS = [
  { id: "s1", time: "09:30", len: "45m", day: 1, title: "Opening keynote: The next decade of African tech", track: "Main Stage", room: "Auditorium A", speaker: "Iyin Aboyeji", tone: "forest", saved: true, tag: "Keynote" },
  { id: "s2", time: "10:30", len: "60m", day: 1, title: "Scaling fintech across borders", track: "Main Stage", room: "Auditorium A", speaker: "Panel · 4 speakers", tone: "forest", tag: "Panel" },
  { id: "s3", time: "10:30", len: "90m", day: 1, title: "Workshop: Ship payments in a weekend", track: "Builders", room: "Lab 1", speaker: "Kwame Mensah", tone: "sage", saved: true, tag: "Workshop" },
  { id: "s4", time: "12:00", len: "45m", day: 1, title: "LP panel: Funding the next wave", track: "Investor Lounge", room: "Suite 3", speaker: "Panel · 3 speakers", tone: "gold", tag: "Panel" },
  { id: "s5", time: "14:00", len: "45m", day: 1, title: "Fireside: Building Paystack", track: "Main Stage", room: "Auditorium A", speaker: "Shola Akinlade", tone: "forest", saved: true, tag: "Fireside" },
  { id: "s6", time: "15:00", len: "120m", day: 1, title: "Demo Day: 12 startups pitch live", track: "Builders", room: "Lab 1", speaker: "Hosted", tone: "sage", tag: "Showcase" },
  { id: "s7", time: "17:30", len: "90m", day: 1, title: "Founder networking & rooftop reception", track: "Social", room: "Rooftop", speaker: "All attendees", tone: "gold", tag: "Social" },
];

const A_SPEAKERS = [
  { id: "sp1", n: "Shola Akinlade", role: "CEO & Co-founder", org: "Paystack", g: "linear-gradient(135deg,#1F4D3A,#2A6A50)", featured: true, sessions: 1 },
  { id: "sp2", n: "Iyinoluwa Aboyeji", role: "General Partner", org: "Future Africa", g: "linear-gradient(135deg,#163828,#3E7E5E)", featured: true, sessions: 2 },
  { id: "sp3", n: "Odunayo Eweniyi", role: "Co-founder", org: "PiggyVest", g: "linear-gradient(135deg,#2A6A50,#C9A45E)", sessions: 1 },
  { id: "sp4", n: "Kwame Mensah", role: "Product Engineer", org: "Paystack", g: "linear-gradient(135deg,#C9A45E,#1F4D3A)", sessions: 1 },
  { id: "sp5", n: "Fatou Diop", role: "Head of Growth", org: "Wave", g: "linear-gradient(135deg,#3E7E5E,#C9A45E)", sessions: 2 },
  { id: "sp6", n: "Liya Tesfaye", role: "VP Engineering", org: "Safaricom", g: "linear-gradient(135deg,#1F4D3A,#163828)", sessions: 1 },
];

// People (networking)
const A_PEOPLE = [
  { id: "p1", n: "Amara Okeke", role: "Investor", org: "TLcom Capital", g: "linear-gradient(135deg,#3E7E5E,#C9A45E)", match: 94, shared: "Both interested in fintech & AI", goals: ["Investing", "Hiring"] },
  { id: "p2", n: "David Mwangi", role: "Founder", org: "Twiga Foods", g: "linear-gradient(135deg,#1F4D3A,#2A6A50)", match: 89, shared: "Both founders scaling logistics", goals: ["Fundraising"] },
  { id: "p3", n: "Zainab Bello", role: "Product Lead", org: "Flutterwave", g: "linear-gradient(135deg,#2A6A50,#1F4D3A)", match: 82, shared: "Both in payments", goals: ["Networking"] },
  { id: "p4", n: "Thabo Nkosi", role: "Engineer", org: "Yoco", g: "linear-gradient(135deg,#163828,#3E7E5E)", match: 78, shared: "Both attending the Builders track", goals: ["Learning", "Hiring"] },
  { id: "p5", n: "Nadia Hassan", role: "Designer", org: "Andela", g: "linear-gradient(135deg,#C9A45E,#2A6A50)", match: 71, shared: "Both in the design community", goals: ["Networking"] },
];

const A_SPONSORS = [
  { id: "sp_pay", n: "Paystack", tier: "Platinum", desc: "Payments infrastructure for Africa", booth: "A1" },
  { id: "sp_mtn", n: "MTN", tier: "Platinum", desc: "Connecting 280M people", booth: "A2" },
  { id: "sp_flw", n: "Flutterwave", tier: "Gold", desc: "Endless possibilities for every business", booth: "B1" },
  { id: "sp_aws", n: "AWS", tier: "Gold", desc: "Cloud for builders", booth: "B2" },
  { id: "sp_wave", n: "Wave", tier: "Silver", desc: "Mobile money, reimagined", booth: "C1" },
  { id: "sp_kuda", n: "Kuda", tier: "Silver", desc: "The bank of the free", booth: "C2" },
];

// The attendee's own profile
const ME = {
  name: "Amina Osman", role: "Founder, Sahel Pay", city: "Djibouti City",
  initials: "AO", ticketNo: "198", tier: "VIP", g: "linear-gradient(135deg,#C9A45E,#1F4D3A)",
  points: 480, rank: 7,
};

// Leaderboard (gamification)
const A_LEADERBOARD = [
  { n: "Fatou Diop", pts: 1240, g: "linear-gradient(135deg,#3E7E5E,#C9A45E)" },
  { n: "Kwame Mensah", pts: 1180, g: "linear-gradient(135deg,#1F4D3A,#2A6A50)" },
  { n: "Amara Okeke", pts: 1090, g: "linear-gradient(135deg,#3E7E5E,#C9A45E)" },
  { n: "David Mwangi", pts: 960, g: "linear-gradient(135deg,#163828,#3E7E5E)" },
  { n: "Zainab Bello", pts: 880, g: "linear-gradient(135deg,#2A6A50,#1F4D3A)" },
  { n: "Thabo Nkosi", pts: 720, g: "linear-gradient(135deg,#163828,#3E7E5E)" },
  { n: "Amina Osman (you)", pts: 480, g: "linear-gradient(135deg,#C9A45E,#1F4D3A)", me: true },
];

// My past events / card collection
const MY_EVENTS = [
  { id: "afritech", name: "AfriTech Summit 2026", when: "12 Mar 2026", status: "upcoming", grad: A_GRAD.forest, tier: "VIP" },
  { id: "lagos25", name: "Lagos Startup Week", when: "Nov 2025", status: "attended", grad: A_GRAD.ocean, tier: "General" },
  { id: "design25", name: "Africa Design Week", when: "Sep 2025", status: "attended", grad: A_GRAD.rose, tier: "Speaker" },
  { id: "fin25", name: "Fintech Mixer Q2", when: "Jun 2025", status: "attended", grad: A_GRAD.gold, tier: "General" },
];

Object.assign(window, {
  A_GRAD, CARD_ACCENTS, FEATURED, DISCOVER, CATEGORIES,
  A_SESSIONS, A_SPEAKERS, A_PEOPLE, A_SPONSORS, ME, A_LEADERBOARD, MY_EVENTS,
});
